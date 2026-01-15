/**
 * Single Song Test: Full Timing Generation
 * Creates real word-level timing for one song
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

async function generateSingleSongTiming() {
    console.log('🎵 Single Song Timing Test\n');
    console.log('='.repeat(60) + '\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not found');
        return null;
    }

    try {
        // 1. Load worship songs
        const songsPath = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'worship_songs.json');
        const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

        // Find song with local audio and lyrics
        const audioDir = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'audio', 'kalameh');
        const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

        // Find matching song
        let testSong = null;
        let audioPath = null;

        for (const song of songs) {
            if (song.audioUrl && song.audioUrl.includes('kalameh') && song.lyrics) {
                const fileName = path.basename(song.audioUrl);
                const fullPath = path.join(audioDir, fileName);
                if (fs.existsSync(fullPath)) {
                    testSong = song;
                    audioPath = fullPath;
                    break;
                }
            }
        }

        if (!testSong) {
            // Just use first audio file with sample lyrics
            audioPath = path.join(audioDir, audioFiles[0]);
            testSong = {
                id: 1,
                title: audioFiles[0].replace('.mp3', ''),
                lyrics: 'تو را می‌پرستم\nای خداوند\nتو نور جهانی'
            };
        }

        console.log('📄 Song Details:');
        console.log(`   ID: ${testSong.id}`);
        console.log(`   Title: ${testSong.title}`);
        console.log(`   Audio: ${path.basename(audioPath)}`);
        console.log(`   Lyrics preview: ${(testSong.lyrics || '').substring(0, 80)}...\n`);

        // 2. Read audio
        const audioBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioBuffer.toString('base64');
        console.log(`✅ Audio: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

        // 3. Clean lyrics
        let cleanLyrics = (testSong.lyrics || '')
            .replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')  // Remove chords
            .replace(/\b(Chorus|Verse|Bridge|V\d)\b/gi, '')    // Remove markers
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanLyrics || cleanLyrics.length < 10) {
            cleanLyrics = 'تو را می‌پرستم ای خداوند تو نور جهانی';
        }

        console.log('📝 Cleaned Lyrics:');
        console.log(cleanLyrics.substring(0, 200) + '...\n');

        // 4. Call Gemini
        console.log('🤖 Calling Gemini 2.5 Flash...');
        console.log('⏳ This will take 30-90 seconds...\n');

        const ai = new GoogleGenAI({ apiKey });
        const startTime = Date.now();

        const prompt = `Listen to this Persian worship song and generate precise word-level timestamps.

Match the audio to these lyrics:
${cleanLyrics}

Return JSON with this structure:
{
  "lines": [
    {
      "line": "full line text",
      "start": 0.0,
      "end": 5.5,
      "words": [
        {"word": "تو", "start": 0.0, "end": 0.5},
        {"word": "را", "start": 0.6, "end": 1.0}
      ]
    }
  ],
  "total_duration": 180
}

Be precise with timing to 0.01 seconds.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'audio/mpeg', data: audioBase64 } },
                        { text: prompt }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const resultText = response.text;

        console.log('='.repeat(60));
        console.log('\n✅ SUCCESS!\n');
        console.log(`⏱️  Processing time: ${duration} seconds\n`);

        // Parse result
        let timingData;
        try {
            timingData = JSON.parse(resultText);
        } catch (e) {
            console.log('📝 Raw response (not valid JSON):');
            console.log(resultText.substring(0, 500));
            return null;
        }

        // 5. Display results
        console.log('📊 Timing Results:\n');
        console.log(`   Total lines: ${timingData.lines?.length || 0}`);
        console.log(`   Total duration: ${timingData.total_duration || 'N/A'} seconds`);

        if (timingData.lines && timingData.lines.length > 0) {
            console.log('\n📝 First 3 lines:\n');
            timingData.lines.slice(0, 3).forEach((line, i) => {
                console.log(`   Line ${i + 1}: "${line.line}"`);
                console.log(`           Time: ${line.start}s - ${line.end}s`);
                console.log(`           Words: ${line.words?.length || 0}`);
                if (line.words && line.words.length > 0) {
                    const wordSample = line.words.slice(0, 3).map(w =>
                        `"${w.word}" (${w.start}-${w.end}s)`
                    ).join(', ');
                    console.log(`           Sample: ${wordSample}`);
                }
                console.log('');
            });
        }

        // 6. Save to file
        const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'timings');
        const outputPath = path.join(outputDir, `song_${testSong.id}_timing_NEW.json`);

        const fileContent = {
            songId: testSong.id,
            title: testSong.title,
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-flash',
            processingTime: duration + 's',
            ...timingData
        };

        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8');
        console.log(`💾 Saved to: ${outputPath}`);

        return fileContent;

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        return null;
    }
}

generateSingleSongTiming()
    .then(result => {
        console.log('\n' + '='.repeat(60));
        if (result) {
            console.log('🎉 Test completed successfully!');
            console.log('📁 Check the NEW timing file to verify quality.');
        } else {
            console.log('❌ Test failed');
        }
        process.exit(result ? 0 : 1);
    });
