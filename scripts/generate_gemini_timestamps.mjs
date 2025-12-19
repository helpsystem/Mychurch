/**
 * Gemini-based Timestamp Generator for Bible Chapters
 * Uses Google Gemini API for audio transcription with word-level timestamps
 * Based on proven implementation from Project/audio-text-sync-&-highlight.v2
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'bible_data', 'audio');
const TEXT_DIR = path.join(PROJECT_ROOT, 'bible_data', 'text');
const TIMESTAMPS_DIR = path.join(PROJECT_ROOT, 'bible_data', 'timestamps');
const PROGRESS_FILE = path.join(PROJECT_ROOT, 'gemini_progress.json');

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

// Get API key from environment
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in environment variables!');
    console.log('Please set it in .env file or run:');
    console.log('  $env:GEMINI_API_KEY="your-api-key-here"');
    process.exit(1);
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Convert file to base64 for Gemini API
 */
async function fileToGenerativePart(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = 'audio/mpeg';

    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    };
}

/**
 * Load chapter text data
 */
async function loadChapterText(translation, book, chapter) {
    const textFile = path.join(TEXT_DIR, translation, book, `${chapter}.json`);

    try {
        const content = await fs.readFile(textFile, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`  ❌ Text file not found: ${textFile}`);
        return null;
    }
}

/**
 * Transcribe audio with Gemini and get word-level timestamps
 */
async function transcribeWithGemini(audioPath) {
    console.log(`  🎤 Transcribing: ${path.basename(audioPath)}`);

    try {
        const audioPart = await fileToGenerativePart(audioPath);

        const prompt = `Transcribe this Persian Bible chapter audio. 
Important:
1. The audio starts with an intro like "کتاب پیدایش فصل اول" - keep this as first line
2. Then verses follow
3. Group words into verse-level lines
4. Provide PRECISE word-level timestamps

Output format: lines array with content and words (word, start_time, end_time)`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    audioPart,
                    { text: prompt }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lines: {
                            type: Type.ARRAY,
                            description: "Array of lines (intro, verses)",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    content: {
                                        type: Type.STRING,
                                        description: "Full text of this line"
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

        console.log(`  ✅ Got ${data.lines.length} lines with timestamps`);
        return data;

    } catch (error) {
        console.error(`  ❌ Transcription error: ${error.message}`);
        throw error;
    }
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching verses
 */
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate similarity percentage (0-1)
 */
function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - levenshtein(s1, s2)) / longer.length;
}

/**
 * Clean text for comparison (remove punctuation, only Arabic/Persian letters)
 */
function normalizeText(text) {
    if (!text) return "";
    return text.replace(/[،؛:!?.()«»\s]/g, '').trim();
}

/**
 * Match Gemini output to verse structure using Fuzzy Matching
 */
function matchToVerses(geminiData, textData) {
    // 1. Identify Intro
    // Often intro is first line or mentions "Fasl/Ketab"
    let intro = geminiData.lines[0];

    // Check if Gemini output lines actually have content
    const geminiLines = geminiData.lines.filter(l => l.content && l.content.trim().length > 0);

    // We start searching from index 0 or 1 depending on intro.
    let searchStartIndex = 0;

    // Heuristic: If first line contains "Fasl" (فصل) or "Ketab" (کتاب), accept as intro and skip it for verse matching
    if (geminiLines.length > 0) {
        const firstLineContent = geminiLines[0].content;
        if (firstLineContent.includes("فصل") || firstLineContent.includes("کتاب")) {
            intro = geminiLines[0];
            searchStartIndex = 1;
        } else {
            // First line might be verse 1 if intro was skipped by model
            intro = { content: "Intro (Generated)", words: [] };
        }
    }

    const verses = [];

    for (let i = 0; i < textData.verses.length; i++) {
        const verseNum = textData.verses[i].verse;
        // Clean text for better matching
        const verseTextClean = normalizeText(textData.verses[i].text);

        let bestMatchIndex = -1;
        let bestSimilarity = 0;

        // Search in a window to find best match
        // Because Gemini might insert extra headers (like "Death of Saul"), we search ahead
        const searchWindow = 6;
        const endIndex = Math.min(geminiLines.length, searchStartIndex + searchWindow);

        for (let j = searchStartIndex; j < endIndex; j++) {
            const geminiLineContent = normalizeText(geminiLines[j].content);

            // Skip very short lines in audio that might be noise or tiny headers
            if (geminiLineContent.length < 3) continue;

            const similarity = getSimilarity(verseTextClean, geminiLineContent);

            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatchIndex = j;
            }
        }

        // Threshold: 0.3 is lenient but good for noisy transcripts
        if (bestSimilarity > 0.25 && bestMatchIndex !== -1) {
            const matchedLine = geminiLines[bestMatchIndex];

            verses.push({
                verse: verseNum,
                text: textData.verses[i].text,
                start: matchedLine.words[0]?.start_time || 0,
                end: matchedLine.words[matchedLine.words.length - 1]?.end_time || 0,
                words: matchedLine.words
            });

            // Advance search index to AFTER this match
            // This ensures we preserve order and don't reuse lines
            searchStartIndex = bestMatchIndex + 1;
        } else {
            console.log(`    ⚠️ Low match for V${verseNum} (Best: ${(bestSimilarity * 100).toFixed(0)}%) - Text: "${verseTextClean.substring(0, 15)}..."`);
        }
    }

    return { intro, verses };
}

/**
 * Generate timestamps for a single chapter
 */
async function generateTimestamps(translation, book, chapter) {
    try {
        // Check audio file
        const audioFile = path.join(AUDIO_DIR, translation, book, `${chapter}.mp3`);

        try {
            await fs.access(audioFile);
        } catch {
            console.log(`  ❌ Audio file not found: ${audioFile}`);
            return false;
        }

        // Load text
        const textData = await loadChapterText(translation, book, chapter);
        if (!textData) {
            return false;
        }

        // Transcribe with Gemini
        const geminiData = await transcribeWithGemini(audioFile);

        // Match to verses
        const timestamps = matchToVerses(geminiData, textData);

        // Save timestamps
        const outputDir = path.join(TIMESTAMPS_DIR, translation, book);
        await fs.mkdir(outputDir, { recursive: true });

        const outputFile = path.join(outputDir, `${chapter}.json`);

        const timestampData = {
            translation: translation,
            book: book,
            chapter: chapter,
            intro: timestamps.intro,
            verses: timestamps.verses,
            generated_at: new Date().toISOString(),
            generator: 'gemini-2.5-flash-fuzzy'
        };

        await fs.writeFile(
            outputFile,
            JSON.stringify(timestampData, null, 2),
            'utf-8'
        );

        console.log(`  ✅ Saved: ${outputFile} (${timestamps.verses.length}/${textData.verses.length} verses matched)`);
        return true;

    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Save progress to file
 */
async function saveProgress(current, total, success, failed, elapsed, remaining) {
    const progress = {
        current,
        total,
        percentage: Math.round((current / total) * 100 * 10) / 10,
        success,
        failed,
        elapsed_hours: Math.round(elapsed / 3600 * 100) / 100,
        remaining_hours: Math.round(remaining / 3600 * 100) / 100,
        timestamp: new Date().toISOString()
    };

    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Process all chapters
 */
async function processAllChapters() {
    console.log('='.repeat(60));
    console.log('🚀 Gemini Timestamp Generator');
    console.log('='.repeat(60));
    console.log(`Model: gemini-2.5-flash`);
    console.log(`Language: Persian (fa)`);
    console.log('');

    // Find all audio files
    const audioFiles = [];

    try {
        const translations = await fs.readdir(AUDIO_DIR);

        for (const translation of translations) {
            const translationPath = path.join(AUDIO_DIR, translation);
            const stat = await fs.stat(translationPath);

            if (!stat.isDirectory()) continue;

            const books = await fs.readdir(translationPath);

            for (const book of books) {
                const bookPath = path.join(translationPath, book);
                const bookStat = await fs.stat(bookPath);

                if (!bookStat.isDirectory()) continue;

                const files = await fs.readdir(bookPath);

                for (const file of files) {
                    if (file.endsWith('.mp3')) {
                        const chapter = parseInt(path.basename(file, '.mp3'));
                        audioFiles.push({ translation, book, chapter });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error finding audio files: ${error.message}`);
        process.exit(1);
    }

    const total = audioFiles.length;
    console.log(`📊 Found ${total} chapters to process\n`);

    const stats = { success: 0, failed: 0 };
    const startTime = Date.now();

    for (let i = 0; i < audioFiles.length; i++) {
        const { translation, book, chapter } = audioFiles[i];
        const current = i + 1;
        const progress = (current / total) * 100;

        console.log('\n' + '='.repeat(60));
        console.log(`[${progress.toFixed(1)}%] Processing ${current}/${total}: ${translation}/${book}/${chapter}`);
        console.log('='.repeat(60));

        const success = await generateTimestamps(translation, book, chapter);

        if (success) {
            stats.success++;
            console.log(`  ✅ SUCCESS! (${stats.success} successful so far)`);
        } else {
            stats.failed++;
            console.log(`  ❌ FAILED (${stats.failed} failed so far)`);
        }

        // Progress update every 10 chapters
        if (current % 10 === 0 || current === 1) {
            const elapsed = (Date.now() - startTime) / 1000;
            const avgTime = elapsed / current;
            const remaining = (total - current) * avgTime;

            console.log('\n' + '*'.repeat(60));
            console.log(`PROGRESS UPDATE: ${current}/${total} (${progress.toFixed(1)}%)`);
            console.log(`  Elapsed: ${(elapsed / 3600).toFixed(2)}h`);
            console.log(`  Remaining: ${(remaining / 3600).toFixed(2)}h`);
            console.log(`  Success Rate: ${stats.success}/${current} (${(100 * stats.success / current).toFixed(1)}%)`);
            console.log(`  Failed: ${stats.failed}`);
            console.log('*'.repeat(60) + '\n');

            await saveProgress(current, total, stats.success, stats.failed, elapsed, remaining);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final stats
    const elapsed = (Date.now() - startTime) / 1000;
    console.log('\n' + '='.repeat(60));
    console.log('FINAL STATISTICS:');
    console.log(`   Total: ${total}`);
    console.log(`   Success: ${stats.success} ✅`);
    console.log(`   Failed: ${stats.failed} ❌`);
    console.log(`   Time: ${(elapsed / 3600).toFixed(2)} hours`);
    console.log('='.repeat(60));
}

// Run
processAllChapters().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
