/**
 * Test Gemini-based Timestamp Generation for Genesis Chapter 1
 * Adapts the audio-text-sync logic for Bible audio files
 */

const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Paths
const PROJECT_ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'bible_data', 'audio');
const TEXT_DIR = path.join(PROJECT_ROOT, 'bible_data', 'text');
const TIMESTAMPS_DIR = path.join(PROJECT_ROOT, 'bible_data', 'timestamps');

// Test parameters
const TRANSLATION = 'TPV';
const BOOK = 'GEN';
const CHAPTER = 1;

// Load environment
require('dotenv').config();

/**
 * Load chapter text from JSON
 */
function loadChapterText(translation, book, chapter) {
    const textFile = path.join(TEXT_DIR, translation, book, `${chapter}.json`);

    if (!fs.existsSync(textFile)) {
        console.error(`❌ Text file not found: ${textFile}`);
        return null;
    }

    const data = JSON.parse(fs.readFileSync(textFile, 'utf-8'));
    return data;
}

/**
 * Convert file to Gemini part format
 */
async function fileToGenerativePart(filePath) {
    const data = fs.readFileSync(filePath);
    const base64Data = data.toString('base64');

    return {
        inlineData: {
            data: base64Data,
            mimeType: 'audio/mpeg'
        }
    };
}

/**
 * Transcribe audio using Gemini API with word-level timestamps
 */
async function transcribeAudioWithGemini(audioFile) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in environment");
        }

        console.log('  🎤 Transcribing audio with Gemini...');
        const ai = new GoogleGenAI({ apiKey });
        const audioPart = await fileToGenerativePart(audioFile);

        const promptText = `Transcribe this Persian Bible chapter audio. 
Group words into natural sentences that match the verse structure in the audio.
Each sentence should be a complete thought or verse.
Provide PRECISE word-level timestamps (start_time and end_time in seconds) for EVERY single word.
The audio likely has an intro announcing the chapter name - include that as the first line if present.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    audioPart,
                    { text: promptText }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lines: {
                            type: Type.ARRAY,
                            description: "Array of verses/sentences from the audio",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    content: {
                                        type: Type.STRING,
                                        description: "The full text of this verse/sentence"
                                    },
                                    words: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                word: { type: Type.STRING },
                                                start_time: { type: Type.NUMBER },
                                                end_time: { type: Type.NUMBER }
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

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);

        return data;
    } catch (err) {
        console.error('❌ Transcription error:', err.message);
        throw err;
    }
}

/**
 * Match Gemini transcription to known verse text
 */
function matchToVerses(transcriptionData, textData) {
    const lines = transcriptionData.lines;
    const verses = textData.verses;

    console.log(`  📊 Matching ${lines.length} transcribed segments to ${verses.length} verses...`);

    // Detect intro (usually first line)
    let intro = null;
    let startIndex = 0;

    if (lines.length > 0) {
        const firstLine = lines[0];
        const firstText = firstLine.content.trim();

        // Check if it's an intro
        if (firstText.includes('پیدایش') || firstText.includes('فصل') || firstText.includes('باب')) {
            intro = {
                text: firstText,
                start: firstLine.words[0]?.start_time || 0,
                end: firstLine.words[firstLine.words.length - 1]?.end_time || 0,
                words: firstLine.words
            };
            startIndex = 1;
        }
    }

    // Match remaining lines to verses
    const verseTimings = [];
    const remainingLines = lines.slice(startIndex);

    for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];

        if (i < remainingLines.length) {
            const line = remainingLines[i];

            verseTimings.push({
                verse: verse.verse,
                text: line.content,  // Use transcribed text from Gemini (exact match with audio)
                start: line.words[0]?.start_time || 0,
                end: line.words[line.words.length - 1]?.end_time || 0,
                words: line.words
            });
        }
    }

    return {
        intro,
        verses: verseTimings
    };
}

/**
 * Main test function
 */
async function testGenesis1() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 GEMINI TIMESTAMP TEST - GENESIS 1');
    console.log('='.repeat(60));

    // Check audio file
    const audioFile = path.join(AUDIO_DIR, TRANSLATION, BOOK, `${CHAPTER}.mp3`);
    if (!fs.existsSync(audioFile)) {
        console.error(`❌ Audio file not found: ${audioFile}`);
        return false;
    }

    const stats = fs.statSync(audioFile);
    console.log(`✅ Audio file found: ${audioFile}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);

    // Load text
    const textData = loadChapterText(TRANSLATION, BOOK, CHAPTER);
    if (!textData) {
        return false;
    }

    console.log(`✅ Text file loaded: ${textData.verses.length} verses`);

    // Transcribe with Gemini
    console.log('\n⏳ Calling Gemini API (this may take 1-2 minutes)...');
    const startTime = Date.now();

    const transcription = await transcribeAudioWithGemini(audioFile);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Transcription complete in ${elapsedTime} seconds`);
    console.log(`   Detected ${transcription.lines.length} segments`);

    // Match to verses
    console.log('\n⏳ Matching transcription to verses...');
    const timestamps = matchToVerses(transcription, textData);

    // Save output
    const outputDir = path.join(TIMESTAMPS_DIR, TRANSLATION, BOOK);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${CHAPTER}.json`);

    const timestampData = {
        translation: TRANSLATION,
        book: BOOK,
        chapter: CHAPTER,
        intro: timestamps.intro,
        verses: timestamps.verses,
        metadata: {
            generated_at: new Date().toISOString(),
            api: 'gemini-2.0-flash-exp',
            processing_time_seconds: parseFloat(elapsedTime),
            total_verses: timestamps.verses.length
        }
    };

    fs.writeFileSync(outputFile, JSON.stringify(timestampData, null, 2), 'utf-8');
    console.log(`✅ Timestamps saved: ${outputFile}`);

    // Show sample output
    console.log('\n' + '='.repeat(60));
    console.log('📊 SAMPLE OUTPUT');
    console.log('='.repeat(60));

    if (timestamps.intro) {
        console.log(`\n🎬 Intro: ${timestamps.intro.text}`);
        console.log(`   Time: ${timestamps.intro.start.toFixed(2)}s - ${timestamps.intro.end.toFixed(2)}s`);
        console.log(`   Words: ${timestamps.intro.words.length}`);
    }

    console.log(`\n📖 First 3 Verses:`);
    for (let i = 0; i < Math.min(3, timestamps.verses.length); i++) {
        const v = timestamps.verses[i];
        console.log(`\n   Verse ${v.verse}: ${v.text.substring(0, 50)}...`);
        console.log(`   Time: ${v.start.toFixed(2)}s - ${v.end.toFixed(2)}s`);
        console.log(`   Words: ${v.words.length}`);
        if (v.words.length > 0) {
            const sampleWords = v.words.slice(0, 3).map(w =>
                `${w.word} (${w.start_time.toFixed(2)}s)`
            ).join(', ');
            console.log(`   Sample: ${sampleWords}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nOutput file: ${outputFile}`);
    console.log(`Total verses with timestamps: ${timestamps.verses.length}/${textData.verses.length}`);

    return true;
}

// Run test
if (require.main === module) {
    testGenesis1()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('\n❌ ERROR:', err);
            process.exit(1);
        });
}

module.exports = { testGenesis1 };
