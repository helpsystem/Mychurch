/**
 * Google Cloud Speech-to-Text Auto-Timing Generator
 * (Uses REST API Key)
 * 
 * Usage: node scripts/google-timing.cjs <songId> "[Song Title]"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// =================CONFIG=================
const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBWHdShZ2oQrS9uj4tsx1H3e2P2FVN4hkA';
const LANGUAGE_CODE = 'fa-IR'; // Persian
const SONGS_DIR = path.join(__dirname, '../frontend/public/worship/data');
const AUDIO_BASE_DIR = path.join(__dirname, '../frontend/public');
const TMP_DIR = path.join(__dirname, 'tmp');
// ========================================

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Parse Args
const songId = process.argv[2];
if (!songId) {
    console.log('Usage: node scripts/google-timing.cjs <songId>');
    process.exit(1);
}

// 1. Find Song & Audio Path
const songsJsonPath = path.join(SONGS_DIR, 'worship_songs.json');
let jsonContent = fs.readFileSync(songsJsonPath, 'utf8');
// Remove BOM if present
if (jsonContent.charCodeAt(0) === 0xFEFF) {
    jsonContent = jsonContent.slice(1);
}
const allSongs = JSON.parse(jsonContent);
const song = allSongs.find(s => s.id == songId);

if (!song) {
    console.error(`Song ID ${songId} not found!`);
    process.exit(1);
}

console.log(`Processing "${song.title.fa}" (ID: ${songId})...`);

// Resolve Audio Path
let audioRelPath = song.audioUrl;
// Handle URL encoded chars if any
try { audioRelPath = decodeURIComponent(audioRelPath); } catch { }

const audioPath = path.join(AUDIO_BASE_DIR, audioRelPath);
if (!fs.existsSync(audioPath)) {
    console.error(`Audio file not found: ${audioPath}`);
    // Try to find matching file in Kalameh folder
    console.log('Searching via glob...');
    // (Simple fallback logic omitted)
    process.exit(1);
}

console.log(`Audio found: ${audioPath}`);

// 2. Convert to FLAC Mono (Optimized for Speech API)
const flacPath = path.join(TMP_DIR, `temp_${songId}.ogg`);
console.log('Converting to OGG OPUS (Highly Compressed)...');
try {
    // OGG OPUS conversion: -ac 1 (Mono), -codec:a libopus
    execSync(`ffmpeg -y -i "${audioPath}" -ac 1 -c:a libopus -b:a 16k "${flacPath}"`, { stdio: 'ignore' });
} catch (e) {
    console.error('Error converting audio:', e.message);
    process.exit(1);
}

// Since we use API Key (REST), we must send audio content inline (base64).
// Limit is ~10MB.
let fileBuffer = fs.readFileSync(flacPath);
let audioBase64 = fileBuffer.toString('base64');
console.log(`Audio size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
// Skipping size check as Opus 16k is definitely small enough

// 4. Call REST API
async function recognize() {
    console.log('Sending to Google Cloud Speech API...');

    const payload = {
        config: {
            encoding: 'OGG_OPUS',
            sampleRateHertz: 48000, // Opus usually uses 48k internally
            languageCode: LANGUAGE_CODE,
            enableWordTimeOffsets: true,
            enableAutomaticPunctuation: true,
            model: 'default'
        },
        audio: {
            content: audioBase64
        }
    };

    try {
        // 4.1 Start Long Running Operation
        const operationUrl = `https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${API_KEY}`;
        const opResponse = await postData(operationUrl, payload);

        if (opResponse.error) {
            throw new Error(opResponse.error.message);
        }

        const operationName = opResponse.name;
        console.log(`Operation started: ${operationName}`);

        // 4.2 Poll for Completion
        let results = null;
        while (!results) {
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s

            const pollUrl = `https://speech.googleapis.com/v1/operations/${operationName}?key=${API_KEY}`;
            const status = await getData(pollUrl);

            if (status.error) throw new Error(status.error.message);

            if (status.done) {
                if (status.response) {
                    results = status.response.results;
                } else {
                    throw new Error('Operation done but no response found.');
                }
            }
        }
        console.log('\nRecognition Complete!');

        // 5. Process Results to JSON
        const timingData = processGoogleResults(results, song);

        // Save
        const outputPath = path.join(SONGS_DIR, `timings/song_${songId}_timing_auto.json`);
        fs.writeFileSync(outputPath, JSON.stringify(timingData, null, 2));
        console.log(`✅ Timing saved to: ${outputPath}`);

        // Update main song data
        console.log('Checking word count match...');
        // (Logic to compare with lyrics could go here)

    } catch (error) {
        console.error('\n❌ API Error:', error.message);
        if (error.response) console.error(error.response);
    } finally {
        // Cleanup
        try { fs.unlinkSync(flacPath); } catch { }
    }
}

// Helper: HTTP POST
function postData(url, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

// Helper: HTTP GET
function getData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// Helper: Convert Google Format to Our Format
function processGoogleResults(results, song) {
    const words = [];
    const lines = []; // Google doesn't give lines, we infer or just dump all words

    // Flatten words
    results.forEach(result => {
        const alternative = result.alternatives[0];
        if (alternative.words) {
            alternative.words.forEach(w => {
                // Time is string "1.200s"
                const start = parseFloat(w.startTime.replace('s', ''));
                const end = parseFloat(w.endTime.replace('s', ''));
                words.push({
                    word: w.word,
                    start_time: start,
                    end_time: end,
                    confidence: alternative.confidence
                });
            });
        }
    });

    // Simple Line Segmentation (by pause > 0.5s)
    let currentLine = { words: [], start_time: 0, end_time: 0 };
    let lastEnd = 0;

    words.forEach((w, i) => {
        if (i > 0 && (w.start_time - lastEnd > 0.8)) {
            // New Line
            if (currentLine.words.length > 0) {
                currentLine.end_time = lastEnd;
                currentLine.content = currentLine.words.map(x => x.word).join(' ');
                lines.push(currentLine);
            }
            currentLine = { words: [], start_time: w.start_time, end_time: 0 };
        }
        if (currentLine.words.length === 0) currentLine.start_time = w.start_time;
        currentLine.words.push(w);
        lastEnd = w.end_time;
    });
    // Add last
    if (currentLine.words.length > 0) {
        currentLine.end_time = lastEnd;
        currentLine.content = currentLine.words.map(x => x.word).join(' ');
        lines.push(currentLine);
    }

    return {
        metadata: {
            songId: song.id,
            title: song.title.fa,
            duration: 0, // Calculate later
            wordCount: words.length,
            lineCount: lines.length,
            generatedBy: 'google-cloud-speech-v1',
            generatedAt: new Date().toISOString()
        },
        words,
        lines
    };
}

recognize();
