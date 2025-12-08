/**
 * Batch Bible Timestamp Generator
 * Test: Process first 3 chapters of Genesis
 * Full: Process all 1,192 chapters across 66 books
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

// ==================== CONFIGURATION ====================

const PROJECT_ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'bible_data', 'audio', 'TPV');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'bible_data', 'timestamps', 'TPV');

// Bible Books Structure (66 books, 1,189 chapters total)
const BOOKS = {
    'GEN': { chapters: 50, name: 'Genesis' },
    'EXO': { chapters: 40, name: 'Exodus' },
    'LEV': { chapters: 27, name: 'Leviticus' },
    'NUM': { chapters: 36, name: 'Numbers' },
    'DEU': { chapters: 34, name: 'Deuteronomy' },
    'JOS': { chapters: 24, name: 'Joshua' },
    'JDG': { chapters: 21, name: 'Judges' },
    'RUT': { chapters: 4, name: 'Ruth' },
    '1SA': { chapters: 31, name: '1 Samuel' },
    '2SA': { chapters: 24, name: '2 Samuel' },
    '1KI': { chapters: 22, name: '1 Kings' },
    '2KI': { chapters: 25, name: '2 Kings' },
    '1CH': { chapters: 29, name: '1 Chronicles' },
    '2CH': { chapters: 36, name: '2 Chronicles' },
    'EZR': { chapters: 10, name: 'Ezra' },
    'NEH': { chapters: 13, name: 'Nehemiah' },
    'EST': { chapters: 10, name: 'Esther' },
    'JOB': { chapters: 42, name: 'Job' },
    'PSA': { chapters: 150, name: 'Psalms' },
    'PRO': { chapters: 31, name: 'Proverbs' },
    'ECC': { chapters: 12, name: 'Ecclesiastes' },
    'SNG': { chapters: 8, name: 'Song of Solomon' },
    'ISA': { chapters: 66, name: 'Isaiah' },
    'JER': { chapters: 52, name: 'Jeremiah' },
    'LAM': { chapters: 5, name: 'Lamentations' },
    'EZK': { chapters: 48, name: 'Ezekiel' },
    'DAN': { chapters: 12, name: 'Daniel' },
    'HOS': { chapters: 14, name: 'Hosea' },
    'JOL': { chapters: 3, name: 'Joel' },
    'AMO': { chapters: 9, name: 'Amos' },
    'OBA': { chapters: 1, name: 'Obadiah' },
    'JON': { chapters: 4, name: 'Jonah' },
    'MIC': { chapters: 7, name: 'Micah' },
    'NAM': { chapters: 3, name: 'Nahum' },
    'HAB': { chapters: 3, name: 'Habakkuk' },
    'ZEP': { chapters: 3, name: 'Zephaniah' },
    'HAG': { chapters: 2, name: 'Haggai' },
    'ZEC': { chapters: 14, name: 'Zechariah' },
    'MAL': { chapters: 4, name: 'Malachi' },
    'MAT': { chapters: 28, name: 'Matthew' },
    'MRK': { chapters: 16, name: 'Mark' },
    'LUK': { chapters: 24, name: 'Luke' },
    'JHN': { chapters: 21, name: 'John' },
    'ACT': { chapters: 28, name: 'Acts' },
    'ROM': { chapters: 16, name: 'Romans' },
    '1CO': { chapters: 16, name: '1 Corinthians' },
    '2CO': { chapters: 13, name: '2 Corinthians' },
    'GAL': { chapters: 6, name: 'Galatians' },
    'EPH': { chapters: 6, name: 'Ephesians' },
    'PHP': { chapters: 4, name: 'Philippians' },
    'COL': { chapters: 4, name: 'Colossians' },
    '1TH': { chapters: 5, name: '1 Thessalonians' },
    '2TH': { chapters: 3, name: '2 Thessalonians' },
    '1TI': { chapters: 6, name: '1 Timothy' },
    '2TI': { chapters: 4, name: '2 Timothy' },
    'TIT': { chapters: 3, name: 'Titus' },
    'PHM': { chapters: 1, name: 'Philemon' },
    'HEB': { chapters: 13, name: 'Hebrews' },
    'JAS': { chapters: 5, name: 'James' },
    '1PE': { chapters: 5, name: '1 Peter' },
    '2PE': { chapters: 3, name: '2 Peter' },
    '1JN': { chapters: 5, name: '1 John' },
    '2JN': { chapters: 1, name: '2 John' },
    '3JN': { chapters: 1, name: '3 John' },
    'JUD': { chapters: 1, name: 'Jude' },
    'REV': { chapters: 22, name: 'Revelation' }
};

// ==================== MODE SELECTION ====================

// TEST MODE: Only first 3 Genesis chapters
const TEST_MODE = false;
const TEST_BOOK = 'GEN';
const TEST_CHAPTERS = 3;

// ==================== API KEY MANAGEMENT ====================

// Multiple API keys for quota rotation (8 keys configured)
const API_KEYS = [
    process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY || process.env.API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
].filter(Boolean); // Remove undefined/null keys

let currentKeyIndex = 0;
let keyUsageCount = new Array(API_KEYS.length).fill(0);

function getCurrentApiKey() {
    if (API_KEYS.length === 0) {
        throw new Error('No GEMINI_API_KEY found in environment. Add GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.');
    }
    return API_KEYS[currentKeyIndex];
}

function rotateToNextKey() {
    const oldIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`  🔄 Rotating API key: ${oldIndex + 1} → ${currentKeyIndex + 1}`);
    return currentKeyIndex !== oldIndex; // Return false if we've cycled through all keys
}

// ==================== HELPER FUNCTIONS ====================

function fileToBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
}

async function transcribeAudio(audioFile, retryCount = 0) {
    const apiKey = getCurrentApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const base64Audio = fileToBase64(audioFile);

    const promptText = `
Transcribe this Bible reading or Speech.
Analyze the structure carefully:
1. If you detect a Book Title (e.g., 'The Book of Genesis', 'کتاب پیدایش'), create a line with type 'book_title'.
2. If you detect a Chapter Title (e.g., 'Chapter One', 'پیدایش فصل یکم'), create a line with type 'chapter_title'.
3. For Verses, create a line with type 'verse'. IMPORTANT: Extract the verse number (e.g., '1', '12') and put it in the 'label' field.
4. For general text, use type 'text'.
Group words into these structural lines with precise timestamps for every word.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: 'audio/mpeg'
                        }
                    },
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
                            description: "Array of structured lines.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: {
                                        type: Type.STRING,
                                        enum: ['book_title', 'chapter_title', 'verse', 'text', 'lyric'],
                                        description: "The structural type of this line."
                                    },
                                    label: {
                                        type: Type.STRING,
                                        description: "The verse number (e.g. '1', '2') if this is a verse."
                                    },
                                    content: { type: Type.STRING, description: "The full text content of this line." },
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
                                required: ['content', 'words', 'type']
                            }
                        }
                    },
                    required: ['lines']
                }
            }
        });

        keyUsageCount[currentKeyIndex]++;
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return data;

    } catch (error) {
        // Check if it's a quota error
        const isQuotaError = error.message?.includes('429') ||
            error.message?.includes('quota') ||
            error.message?.includes('RESOURCE_EXHAUSTED');

        if (isQuotaError && retryCount < API_KEYS.length) {
            console.log(`  ⚠️  API Key ${currentKeyIndex + 1} quota exceeded`);
            const rotated = rotateToNextKey();

            if (!rotated && retryCount >= API_KEYS.length - 1) {
                throw new Error('All API keys have exceeded their quota. Please wait 24 hours or add more keys.');
            }

            // Retry with next key
            console.log(`  🔁 Retrying with API Key ${currentKeyIndex + 1}...`);
            return await transcribeAudio(audioFile, retryCount + 1);
        }

        throw error;
    }
}

// ==================== MAIN PROCESSING ====================

async function processChapter(book, bookName, chapter) {
    const audioFile = path.join(AUDIO_DIR, book, `${chapter}.mp3`);
    const outputDir = path.join(OUTPUT_DIR, book);
    const outputFile = path.join(outputDir, `${chapter}.json`);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Skip if already exists
    if (fs.existsSync(outputFile)) {
        console.log(`  ⏭️  ${book} ${chapter} - Already exists, skipping`);
        return { status: 'skipped', book, chapter };
    }

    // Check if audio file exists
    if (!fs.existsSync(audioFile)) {
        console.log(`  ❌ ${book} ${chapter} - Audio file not found`);
        return { status: 'missing', book, chapter };
    }

    const startTime = Date.now();

    try {
        console.log(`  🎤 ${book} ${chapter} - Transcribing...`);
        const transcriptionData = await transcribeAudio(audioFile);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

        // Build output
        const timestampData = {
            translation: 'TPV',
            book: book,
            chapter: chapter,
            bookName: bookName,
            lines: transcriptionData.lines,
            fullTranscript: transcriptionData.lines.map(l => l.content).join('\n'),
            metadata: {
                generated_at: new Date().toISOString(),
                api: 'gemini-2.5-flash',
                processing_time_seconds: parseFloat(elapsedTime),
                total_lines: transcriptionData.lines.length
            }
        };

        // Save to file
        fs.writeFileSync(outputFile, JSON.stringify(timestampData, null, 2), 'utf-8');

        console.log(`  ✅ ${book} ${chapter} - Saved (${elapsedTime}s, ${transcriptionData.lines.length} lines)`);
        return { status: 'success', book, chapter, time: elapsedTime, lines: transcriptionData.lines.length };

    } catch (err) {
        console.error(`  ❌ ${book} ${chapter} - Error: ${err.message}`);
        return { status: 'error', book, chapter, error: err.message };
    }
}

async function runBatch() {
    console.log('\n' + '='.repeat(70));
    console.log('📖 BIBLE TIMESTAMP BATCH GENERATOR');
    console.log('='.repeat(70));

    if (TEST_MODE) {
        console.log(`\n🧪 TEST MODE: Processing ${TEST_BOOK} chapters 1-${TEST_CHAPTERS}`);
    } else {
        const totalChapters = Object.values(BOOKS).reduce((sum, book) => sum + book.chapters, 0);
        console.log(`\n🚀 FULL MODE: Processing ${Object.keys(BOOKS).length} books, ${totalChapters} chapters`);
    }
    console.log('='.repeat(70) + '\n');

    const results = [];
    const overallStart = Date.now();

    if (TEST_MODE) {
        // Process only test chapters
        for (let ch = 1; ch <= TEST_CHAPTERS; ch++) {
            const result = await processChapter(TEST_BOOK, BOOKS[TEST_BOOK].name, ch);
            results.push(result);

            // Rate limiting: 5 second delay between requests
            if (ch < TEST_CHAPTERS) {
                console.log(`  ⏳ Waiting 5 seconds (rate limit)...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    } else {
        // Process all books and chapters
        for (const [bookCode, bookInfo] of Object.entries(BOOKS)) {
            console.log(`\n📕 ${bookInfo.name} (${bookCode})`);

            for (let ch = 1; ch <= bookInfo.chapters; ch++) {
                const result = await processChapter(bookCode, bookInfo.name, ch);
                results.push(result);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    const overallTime = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 BATCH SUMMARY');
    console.log('='.repeat(70));

    const success = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const missing = results.filter(r => r.status === 'missing').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log(`✅ Success: ${success}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`🚫 Missing: ${missing}`);
    console.log(`⏱️  Total Time: ${overallTime} minutes`);

    if (success > 0) {
        const avgTime = results.filter(r => r.status === 'success')
            .reduce((sum, r) => sum + parseFloat(r.time), 0) / success;
        console.log(`⌛ Avg Time/Chapter: ${avgTime.toFixed(1)}s`);
    }

    console.log('='.repeat(70) + '\n');

    // Save summary
    const summaryFile = path.join(OUTPUT_DIR, `_batch_summary_${Date.now()}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify({
        mode: TEST_MODE ? 'TEST' : 'FULL',
        timestamp: new Date().toISOString(),
        results,
        summary: { success, skipped, errors, missing },
        totalTime: overallTime
    }, null, 2));

    console.log(`📄 Summary saved: ${summaryFile}\n`);
}

// ==================== RUN ====================

if (require.main === module) {
    runBatch()
        .then(() => {
            console.log('✅ Batch processing complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ FATAL ERROR:', err);
            process.exit(1);
        });
}

module.exports = { processChapter, runBatch };
