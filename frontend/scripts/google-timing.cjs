/* eslint-disable no-console */
/**
 * Google Cloud Speech-to-Text Timing Generator
 * 
 * Usage: node scripts/google-timing.cjs <SONG_ID>
 * Example: node scripts/google-timing.cjs 335
 * 
 * Requirements:
 * 1. Google Cloud Service Account Key (JSON) placed in 'frontend/service-account.json'
 * 2. Audio file in 'public/worship/audio/song_{id}.mp3'
 * 3. Dependencies: npm install @google-cloud/speech
 */

const fs = require('fs');
const path = require('path');
const speech = require('@google-cloud/speech');

// Configuration
const REQUIRED_ARGS = ['SONG_ID'];
const PATHS = {
    serviceAccount: path.join(__dirname, '../service-account.json'),
    audioBase: path.join(__dirname, '../public/worship/audio'),
    outputBase: path.join(__dirname, '../public/worship/data/timings')
};

async function main() {
    const songId = process.argv[2];

    if (!songId) {
        console.error('❌ Error: Missing Song ID');
        console.log(`Usage: node scripts/google-timing.cjs <SONG_ID>`);
        process.exit(1);
    }

    // 1. Check Credentials
    if (!fs.existsSync(PATHS.serviceAccount)) {
        console.error('❌ Error: Service Account Key not found!');
        console.error(`Expected at: ${PATHS.serviceAccount}`);
        console.error('Please download your key from Google Cloud Console and save it as service-account.json');
        process.exit(1);
    }

    // 2. Check Audio File
    const audioPath = path.join(PATHS.audioBase, `song_${songId}.mp3`);
    if (!fs.existsSync(audioPath)) {
        console.error(`❌ Error: Audio file not found for song ${songId}`);
        console.error(`Expected at: ${audioPath}`);
        process.exit(1);
    }

    console.log(`🎤 Processing Song ${songId}...`);
    console.log(`   Audio: ${audioPath}`);

    try {
        // 3. Initialize Client
        const client = new speech.SpeechClient({
            keyFilename: PATHS.serviceAccount
        });

        // 4. Read File
        const file = fs.readFileSync(audioPath);
        const audioBytes = file.toString('base64');

        const audio = {
            content: audioBytes,
        };

        const config = {
            encoding: 'MP3',
            sampleRateHertz: 44100, // Adjust if needed
            languageCode: 'fa-IR',  // Persian
            enableWordTimeOffsets: true,
            enableAutomaticPunctuation: true,
            model: 'latest_long', // Optimized model
        };

        const request = {
            audio: audio,
            config: config,
        };

        console.log('🚀 Sending request to Google Cloud...');

        // Detects speech in the audio file
        const [operation] = await client.longRunningRecognize(request);

        console.log('⏳ Waiting for operation to complete...');
        const [response] = await operation.promise();

        // 5. Transform Result
        const words = [];
        const lines = []; // Basic line estimation

        response.results.forEach(result => {
            const alt = result.alternatives[0];

            // Basic line grouping (by transcript segments)
            const transcript = alt.transcript;
            let lineStart = null;
            let lineEnd = null;
            const lineWords = [];

            alt.words.forEach(wordInfo => {
                const startSec = parseInt(wordInfo.startTime.seconds || 0) + (wordInfo.startTime.nanos || 0) / 1e9;
                const endSec = parseInt(wordInfo.endTime.seconds || 0) + (wordInfo.endTime.nanos || 0) / 1e9;

                const wordObj = {
                    word: wordInfo.word,
                    start: startSec,
                    end: endSec
                };

                words.push(wordObj);
                lineWords.push(wordObj);

                if (lineStart === null) lineStart = startSec;
                lineEnd = endSec;
            });

            if (lineWords.length > 0) {
                lines.push({
                    line: transcript,
                    start: lineStart,
                    end: lineEnd,
                    words: lineWords
                });
            }
        });

        // 6. Save Output
        const outputData = {
            metadata: {
                generatedBy: 'Google Cloud Speech-to-Text',
                date: new Date().toISOString(),
                songId: songId,
                wordCount: words.length
            },
            words: words,
            lines: lines
        };

        // Ensure directory exists
        if (!fs.existsSync(PATHS.outputBase)) {
            fs.mkdirSync(PATHS.outputBase, { recursive: true });
        }

        const outputPath = path.join(PATHS.outputBase, `song_${songId}_timing_auto.json`);
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

        console.log(`✅ Success! Timing generated:`);
        console.log(`   Words found: ${words.length}`);
        console.log(`   Saved to: ${outputPath}`);

    } catch (err) {
        console.error('❌ API Error:', err);
        process.exit(1);
    }
}

main();
