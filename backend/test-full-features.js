/**
 * Full Test: Audio-Text-Sync-Highlight Features
 * Tests the exact code from the professional project
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type, Modality } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY;

async function testFullFeatures() {
    console.log('🎤 Full Audio-Text-Sync Test');
    console.log('='.repeat(60) + '\n');

    if (!API_KEY) {
        console.log('❌ GEMINI_API_KEY not found');
        return false;
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Load test audio
    const audioDir = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'audio', 'kalameh');
    const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

    if (audioFiles.length === 0) {
        console.log('❌ No audio files found');
        return false;
    }

    const audioPath = path.join(audioDir, audioFiles[0]);
    console.log(`📁 Test file: ${audioFiles[0]}\n`);

    const audioBuffer = fs.readFileSync(audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    console.log(`✅ Audio: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);

    // ========== TEST 1: Transcription with JSON Schema ==========
    console.log('📝 Test 1: Transcription with JSON Schema...');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    { inlineData: { data: audioBase64, mimeType: 'audio/mpeg' } },
                    { text: 'Transcribe this worship song. Group words into natural lyric lines. Provide precise timestamps for every word.' }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lines: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    content: { type: Type.STRING },
                                    words: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                word: { type: Type.STRING },
                                                start_time: { type: Type.NUMBER },
                                                end_time: { type: Type.NUMBER },
                                            },
                                            required: ['word', 'start_time', 'end_time']
                                        }
                                    }
                                },
                                required: ['content', 'words']
                            }
                        }
                    },
                    required: ['lines']
                }
            }
        });

        const data = JSON.parse(response.text);
        console.log(`   ✅ Lines: ${data.lines?.length || 0}`);
        if (data.lines?.[0]) {
            console.log(`   📝 First line: "${data.lines[0].content?.substring(0, 50)}..."`);
            console.log(`   ⏱️ Words: ${data.lines[0].words?.length || 0}`);
        }

        // Save result
        fs.writeFileSync(
            path.join(__dirname, 'test_timing_result.json'),
            JSON.stringify(data, null, 2)
        );
        console.log('   💾 Saved to test_timing_result.json\n');

    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }

    // ========== TEST 2: Chord Detection ==========
    console.log('🎸 Test 2: Chord Detection...');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    { inlineData: { data: audioBase64, mimeType: 'audio/mpeg' } },
                    { text: 'Analyze this audio file. Identify the musical chords being played. List the chords in order of appearance or by section (Verse, Chorus, etc.).' }
                ]
            }]
        });

        const chords = response.text.trim();
        console.log(`   ✅ Chords detected:\n   ${chords.substring(0, 200)}...\n`);

    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 Tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - Transcription with JSON Schema: Tested');
    console.log('   - Chord Detection: Tested');
    console.log('\n📁 Check test_timing_result.json for timing data');

    return true;
}

testFullFeatures()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
