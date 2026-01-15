/**
 * Direct Test: Gemini 2.5 Flash with Local File
 * Reads audio directly from filesystem
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');

async function testDirect() {
    console.log('🧪 Direct Gemini 2.5 Flash Test\n');
    console.log('='.repeat(50) + '\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not found');
        return false;
    }

    console.log('✅ API Key found:', apiKey.substring(0, 20) + '...\n');

    try {
        // 1. Load a local audio file
        const audioDir = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'audio', 'kalameh');

        if (!fs.existsSync(audioDir)) {
            console.log(`❌ Audio directory not found: ${audioDir}`);
            return false;
        }

        const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
        console.log(`📂 Found ${audioFiles.length} audio files`);

        if (audioFiles.length === 0) {
            console.log('❌ No MP3 files found');
            return false;
        }

        // Pick first audio file
        const testFile = audioFiles[0];
        const audioPath = path.join(audioDir, testFile);
        console.log(`📁 Test file: ${testFile}\n`);

        // 2. Read audio as base64
        console.log('📥 Reading audio file...');
        const audioBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioBuffer.toString('base64');
        console.log(`✅ Audio loaded: ${(audioBuffer.length / 1024).toFixed(0)} KB\n`);

        // 3. Initialize Gemini
        console.log('🤖 Initializing Gemini 2.5 Flash...');
        const ai = new GoogleGenAI({ apiKey });

        // 4. Generate timing with simple prompt (to test connection)
        const testLyrics = `سلام ای خداوند
تو را می‌پرستم
هللویاه`;

        console.log('📤 Sending to Gemini API...');
        console.log('⏳ Please wait (30-60 seconds)...\n');

        const startTime = Date.now();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'audio/mpeg', data: audioBase64 } },
                        { text: `Listen to this audio and transcribe what you hear. Return simple JSON with format: {"transcription": "text here", "duration_seconds": 123}` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const resultText = response.text;

        console.log('='.repeat(50));
        console.log('\n✅ SUCCESS!\n');
        console.log(`⏱️  Time: ${duration}s`);
        console.log(`📝 Response:\n${resultText.substring(0, 500)}`);

        return true;

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('API key')) {
            console.log('\n💡 API Key issue - check Google Cloud Console');
        } else if (error.message.includes('quota')) {
            console.log('\n💡 Quota issue - check your billing');
        } else if (error.message.includes('model')) {
            console.log('\n💡 Model issue - gemini-2.5-flash might need different access');
        }

        return false;
    }
}

testDirect()
    .then(success => {
        console.log('\n' + '='.repeat(50));
        console.log(success ? '🎉 Test PASSED!' : '❌ Test FAILED');
        process.exit(success ? 0 : 1);
    });
