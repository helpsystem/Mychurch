/**
 * Download Bible Content from Bible.com Using Web Scraping
 * Respectful scraping with rate limiting
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../bible_data');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const TEXT_DIR = path.join(OUTPUT_DIR, 'text');
const BASE_URL = 'https://www.bible.com';

// Translations with audio support
const TRANSLATIONS = [
    { code: 'TPV', id: 181, name: 'مژده برای عصر جدید', hasAudio: true },
    { code: 'NMV', id: 118, name: 'هزاره نو', hasAudio: true },
    { code: 'PCB', id: 1619, name: 'ترجمه معاصر', hasAudio: true }
];

// All 66 Books
const BOOKS = {
    'GEN': { chapters: 50, name_fa: 'پیدایش' },
    'EXO': { chapters: 40, name_fa: 'خروج' },
    'MAT': { chapters: 28, name_fa: 'متی' },
    'REV': { chapters: 22, name_fa: 'مکاشفه' }
    // ... (truncated for brevity, full list available)
};

// Initialize
function initDirs() {
    [OUTPUT_DIR, AUDIO_DIR, TEXT_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

/**
 * Fetch and parse Bible chapter from web page
 */
async function fetchChapterFromWeb(translationId, book, chapter) {
    try {
        const url = `${BASE_URL}/fa/bible/${translationId}/${book}.${chapter}`;
        console.log(`📄 Fetching: ${url}`);

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'fa,en-US;q=0.9'
            },
            timeout: 30000
        });

        const $ = cheerio.load(html);
        const verses = [];

        // Extract verses from HTML
        $('span[data-usfm^="' + book + '.' + chapter + '"]').each((i, elem) => {
            const $verse = $(elem);
            const usfm = $verse.attr('data-usfm');
            const verseNum = usfm.split('.').pop();

            // Get text content
            const $content = $verse.find('.ChapterContent_content__RrUqA');
            const text = $content.text().trim();

            if (text) {
                verses.push({
                    verse: parseInt(verseNum),
                    text: text,
                    usfm: usfm
                });
            }
        });

        // Extract audio URL from page
        let audioUrl = null;
        $('a[href*="audio-bible"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes(translationId)) {
                audioUrl = BASE_URL + href;
            }
        });

        return { verses, audioUrl, success: true };
    } catch (error) {
        console.error(`✗ Failed to fetch: ${error.message}`);
        return { verses: [], audioUrl: null, success: false };
    }
}

/**
 * Download audio from Bible.com audio player page
 */
async function downloadAudioFromPage(audioPageUrl, outputPath) {
    try {
        console.log(`🎵 Checking audio page: ${audioPageUrl}`);

        const { data: html } = await axios.get(audioPageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(html);

        // Extract actual audio file URL from page
        let directAudioUrl = null;

        // Method 1: Check for audio element
        $('audio source').each((i, elem) => {
            directAudioUrl = $(elem).attr('src');
        });

        // Method 2: Check meta tags
        if (!directAudioUrl) {
            $('meta[property="og:audio"]').each((i, elem) => {
                directAudioUrl = $(elem).attr('content');
            });
        }

        if (directAudioUrl) {
            console.log(`📥 Downloading from: ${directAudioUrl.substring(0, 80)}...`);

            const response = await axios({
                method: 'GET',
                url: directAudioUrl,
                responseType: 'stream',
                timeout: 120000
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`✓ Downloaded: ${path.basename(outputPath)}`);
                    resolve(true);
                });
                writer.on('error', reject);
            });
        } else {
            console.log('✗ Could not find audio URL in page');
            return false;
        }
    } catch (error) {
        console.error(`✗ Audio download failed: ${error.message}`);
        return false;
    }
}

/**
 * Main download function
 */
async function downloadBible() {
    console.log('📚 Bible.com Content Downloader (Web Scraping Method)');
    console.log('=====================================================\n');

    initDirs();

    const stats = { textSuccess: 0, textFailed: 0, audioSuccess: 0, audioFailed: 0 };

    // Download only first book as test
    const testBooks = ['GEN'];

    for (const translation of TRANSLATIONS.slice(0, 1)) { // Only TPV for testing
        console.log(`\n🔽 Translation: ${translation.name} (${translation.code})\n`);

        for (const bookCode of testBooks) {
            const book = BOOKS[bookCode];
            if (!book) continue;

            console.log(`📖 ${book.name_fa} (${bookCode})`);

            // Test with first 3 chapters only
            for (let chapter = 1; chapter <= Math.min(3, book.chapters); chapter++) {
                // Fetch text
                const result = await fetchChapterFromWeb(translation.id, bookCode, chapter);

                if (result.success && result.verses.length > 0) {
                    // Save text
                    const textDir = path.join(TEXT_DIR, translation.code, bookCode);
                    if (!fs.existsSync(textDir)) fs.mkdirSync(textDir, { recursive: true });

                    const textFile = path.join(textDir, `${chapter}.json`);
                    fs.writeFileSync(textFile, JSON.stringify({
                        translation: translation.code,
                        book: bookCode,
                        chapter: chapter,
                        verses: result.verses
                    }, null, 2));

                    stats.textSuccess++;
                    console.log(`✓ Saved text: ${translation.code}/${bookCode}/${chapter}`);
                } else {
                    stats.textFailed++;
                }

                // Download audio if available
                if (translation.hasAudio && result.audioUrl) {
                    const audioDir = path.join(AUDIO_DIR, translation.code, bookCode);
                    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

                    const audioFile = path.join(audioDir, `${chapter}.mp3`);
                    const success = await downloadAudioFromPage(result.audioUrl, audioFile);

                    if (success) {
                        stats.audioSuccess++;
                    } else {
                        stats.audioFailed++;
                    }
                }

                // Rate limiting - be respectful to Bible.com
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    console.log('\n📊 Final Statistics:');
    console.log(`   Text: ${stats.textSuccess} ✓ / ${stats.textFailed} ✗`);
    console.log(`   Audio: ${stats.audioSuccess} ✓ / ${stats.audioFailed} ✗`);
    console.log(`\n📁 Data saved to: ${OUTPUT_DIR}`);
}

// Run
if (require.main === module) {
    downloadBible().catch(console.error);
}

module.exports = { downloadBible };
