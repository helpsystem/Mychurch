/**
 * COMPLETE BIBLE DOWNLOAD & UPLOAD PIPELINE
 * Downloads text + audio from Bible.com and uploads to HiDrive + Database
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../bible_data');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const TEXT_DIR = path.join(OUTPUT_DIR, 'text');
const BASE_URL = 'https://www.bible.com';

// HiDrive credentials (set via environment or direct)
const HIDRIVE_USER = 'adminchurch';
const HIDRIVE_PASS = process.env.HIDRIVE_PASSWORD || 'YOUR_PASSWORD';

// Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Translations
const TRANSLATIONS = [
    { code: 'TPV', id: 181, name: 'مژده برای عصر جدید', table: 'bible_verses_tpv' },
    { code: 'NMV', id: 118, name: 'هزاره نو', table: 'bible_verses_nmv' },
    { code: 'MOJDEH', id: 3737, name: 'مژده 2023', table: 'bible_verses_mojdeh' }
];

// PRODUCTION MODE: ALL 66 Books with full chapter counts
/* TEST MODE (uncomment for testing):
const BOOKS = {
    'GEN': { chapters: 3, name_fa: 'پیدایش', name_en: 'Genesis', order: 1 },
    'MAT': { chapters: 2, name_fa: 'متی', name_en: 'Matthew', order: 40 }
};
*/

const BOOKS = {
    // Old Testament
    'GEN': { chapters: 50, name_fa: 'پیدایش', name_en: 'Genesis', order: 1 },
    'EXO': { chapters: 40, name_fa: 'خروج', name_en: 'Exodus', order: 2 },
    'LEV': { chapters: 27, name_fa: 'لاویان', name_en: 'Leviticus', order: 3 },
    'NUM': { chapters: 36, name_fa: 'اعداد', name_en: 'Numbers', order: 4 },
    'DEU': { chapters: 34, name_fa: 'تثنیه', name_en: 'Deuteronomy', order: 5 },
    'JOS': { chapters: 24, name_fa: 'یوشع', name_en: 'Joshua', order: 6 },
    'JDG': { chapters: 21, name_fa: 'داوران', name_en: 'Judges', order: 7 },
    'RUT': { chapters: 4, name_fa: 'روت', name_en: 'Ruth', order: 8 },
    '1SA': { chapters: 31, name_fa: 'اول سموئیل', name_en: '1 Samuel', order: 9 },
    '2SA': { chapters: 24, name_fa: 'دوم سموئیل', name_en: '2 Samuel', order: 10 },
    '1KI': { chapters: 22, name_fa: 'اول پادشاهان', name_en: '1 Kings', order: 11 },
    '2KI': { chapters: 25, name_fa: 'دوم پادشاهان', name_en: '2 Kings', order: 12 },
    '1CH': { chapters: 29, name_fa: 'اول تواریخ', name_en: '1 Chronicles', order: 13 },
    '2CH': { chapters: 36, name_fa: 'دوم تواریخ', name_en: '2 Chronicles', order: 14 },
    'EZR': { chapters: 10, name_fa: 'عزرا', name_en: 'Ezra', order: 15 },
    'NEH': { chapters: 13, name_fa: 'نحمیا', name_en: 'Nehemiah', order: 16 },
    'EST': { chapters: 10, name_fa: 'استر', name_en: 'Esther', order: 17 },
    'JOB': { chapters: 42, name_fa: 'ایوب', name_en: 'Job', order: 18 },
    'PSA': { chapters: 150, name_fa: 'مزامیر', name_en: 'Psalms', order: 19 },
    'PRO': { chapters: 31, name_fa: 'امثال', name_en: 'Proverbs', order: 20 },
    'ECC': { chapters: 12, name_fa: 'جامعه', name_en: 'Ecclesiastes', order: 21 },
    'SNG': { chapters: 8, name_fa: 'غزل غزلها', name_en: 'Song of Solomon', order: 22 },
    'ISA': { chapters: 66, name_fa: 'اشعیا', name_en: 'Isaiah', order: 23 },
    'JER': { chapters: 52, name_fa: 'ارمیا', name_en: 'Jeremiah', order: 24 },
    'LAM': { chapters: 5, name_fa: 'مراثی', name_en: 'Lamentations', order: 25 },
    'EZK': { chapters: 48, name_fa: 'حزقیال', name_en: 'Ezekiel', order: 26 },
    'DAN': { chapters: 12, name_fa: 'دانیال', name_en: 'Daniel', order: 27 },
    'HOS': { chapters: 14, name_fa: 'هوشع', name_en: 'Hosea', order: 28 },
    'JOL': { chapters: 3, name_fa: 'یوئیل', name_en: 'Joel', order: 29 },
    'AMO': { chapters: 9, name_fa: 'عاموس', name_en: 'Amos', order: 30 },
    'OBA': { chapters: 1, name_fa: 'عوبدیا', name_en: 'Obadiah', order: 31 },
    'JON': { chapters: 4, name_fa: 'یونس', name_en: 'Jonah', order: 32 },
    'MIC': { chapters: 7, name_fa: 'میخا', name_en: 'Micah', order: 33 },
    'NAM': { chapters: 3, name_fa: 'ناحوم', name_en: 'Nahum', order: 34 },
    'HAB': { chapters: 3, name_fa: 'حبقوق', name_en: 'Habakkuk', order: 35 },
    'ZEP': { chapters: 3, name_fa: 'صفنیا', name_en: 'Zephaniah', order: 36 },
    'HAG': { chapters: 2, name_fa: 'حجی', name_en: 'Haggai', order: 37 },
    'ZEC': { chapters: 14, name_fa: 'زکریا', name_en: 'Zechariah', order: 38 },
    'MAL': { chapters: 4, name_fa: 'ملاکی', name_en: 'Malachi', order: 39 },
    // New Testament
    'MAT': { chapters: 28, name_fa: 'متی', name_en: 'Matthew', order: 40 },
    'MRK': { chapters: 16, name_fa: 'مرقس', name_en: 'Mark', order: 41 },
    'LUK': { chapters: 24, name_fa: 'لوقا', name_en: 'Luke', order: 42 },
    'JHN': { chapters: 21, name_fa: 'یوحنا', name_en: 'John', order: 43 },
    'ACT': { chapters: 28, name_fa: 'اعمال رسولان', name_en: 'Acts', order: 44 },
    'ROM': { chapters: 16, name_fa: 'رومیان', name_en: 'Romans', order: 45 },
    '1CO': { chapters: 16, name_fa: 'اول قرنتیان', name_en: '1 Corinthians', order: 46 },
    '2CO': { chapters: 13, name_fa: 'دوم قرنتیان', name_en: '2 Corinthians', order: 47 },
    'GAL': { chapters: 6, name_fa: 'غلاطیان', name_en: 'Galatians', order: 48 },
    'EPH': { chapters: 6, name_fa: 'افسسیان', name_en: 'Ephesians', order: 49 },
    'PHP': { chapters: 4, name_fa: 'فیلیپیان', name_en: 'Philippians', order: 50 },
    'COL': { chapters: 4, name_fa: 'کولسیان', name_en: 'Colossians', order: 51 },
    '1TH': { chapters: 5, name_fa: 'اول تسالونیکیان', name_en: '1 Thessalonians', order: 52 },
    '2TH': { chapters: 3, name_fa: 'دوم تسالونیکیان', name_en: '2 Thessalonians', order: 53 },
    '1TI': { chapters: 6, name_fa: 'اول تیموتائوس', name_en: '1 Timothy', order: 54 },
    '2TI': { chapters: 4, name_fa: 'دوم تیموتائوس', name_en: '2 Timothy', order: 55 },
    'TIT': { chapters: 3, name_fa: 'تیطس', name_en: 'Titus', order: 56 },
    'PHM': { chapters: 1, name_fa: 'فلیمون', name_en: 'Philemon', order: 57 },
    'HEB': { chapters: 13, name_fa: 'عبرانیان', name_en: 'Hebrews', order: 58 },
    'JAS': { chapters: 5, name_fa: 'یعقوب', name_en: 'James', order: 59 },
    '1PE': { chapters: 5, name_fa: 'اول پطرس', name_en: '1 Peter', order: 60 },
    '2PE': { chapters: 3, name_fa: 'دوم پطرس', name_en: '2 Peter', order: 61 },
    '1JN': { chapters: 5, name_fa: 'اول یوحنا', name_en: '1 John', order: 62 },
    '2JN': { chapters: 1, name_fa: 'دوم یوحنا', name_en: '2 John', order: 63 },
    '3JN': { chapters: 1, name_fa: 'سوم یوحنا', name_en: '3 John', order: 64 },
    'JUD': { chapters: 1, name_fa: 'یهودا', name_en: 'Jude', order: 65 },
    'REV': { chapters: 22, name_fa: 'مکاشفه', name_en: 'Revelation', order: 66 }
};

// Initialize directories
function initDirs() {
    [OUTPUT_DIR, AUDIO_DIR, TEXT_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

/**
 * Extract audio URL using Puppeteer
 */
async function extractAudioUrl(browser, translationId, book, chapter) {
    const url = `${BASE_URL}/fa/audio-bible/${translationId}/${book}.${chapter}`;
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        let audioUrl = null;
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');

        client.on('Network.responseReceived', async (params) => {
            const response = params.response;
            const url = response.url;

            if (url.includes('.mp3') && url.includes('audio-bible-cdn.youversionapi.com')) {
                audioUrl = url;
            }
        });

        // Trigger playback
        try {
            await page.evaluate(() => {
                const audio = document.querySelector('audio');
                if (audio) audio.play().catch(() => { });
            });
            await new Promise(resolve => setTimeout(resolve, 4000));
        } catch (e) { }

        // Fallback: extract from DOM
        if (!audioUrl) {
            audioUrl = await page.evaluate(() => {
                const audio = document.querySelector('audio');
                return audio?.src || null;
            });
        }

        await page.close();
        return audioUrl;
    } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        await page.close();
        return null;
    }
}

/**
 * Download audio file
 */
async function downloadAudio(url, outputPath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(true));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`✗ Download failed: ${error.message}`);
        return false;
    }
}

/**
 * Fetch chapter text from Bible.com
 */
async function fetchChapterText(translationId, book, chapter) {
    try {
        const cheerio = require('cheerio');
        const url = `${BASE_URL}/fa/bible/${translationId}/${book}.${chapter}`;

        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 30000
        });

        const $ = cheerio.load(html);
        const verses = [];

        $(`span[data-usfm^="${book}.${chapter}"]`).each((i, elem) => {
            const $verse = $(elem);
            const usfm = $verse.attr('data-usfm');
            const verseNum = usfm.split('.').pop();

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

        return verses;
    } catch (error) {
        console.error(`✗ Text fetch failed: ${error.message}`);
        return [];
    }
}

/**
 * Upload to HiDrive
 */
async function uploadToHiDrive(localPath, remotePath) {
    try {
        const command = `curl -X PUT -T "${localPath}" "https://webdav.hidrive.strato.com/users/${HIDRIVE_USER}/mychurch/bible/${remotePath}" -u ${HIDRIVE_USER}:${HIDRIVE_PASS}`;
        await execAsync(command);
        return true;
    } catch (error) {
        console.error(`✗ HiDrive upload failed: ${error.message}`);
        return false;
    }
}

/**
 * Import to Supabase
 */
async function importToDatabase(translation, bookCode, chapter, verses, audioUrl) {
    if (!supabase) return false;

    try {
        const book = BOOKS[bookCode];
        const records = verses.map(v => ({
            book_code: bookCode,
            book_name_fa: book.name_fa,
            book_name_en: book.name_en,
            chapter: chapter,
            verse: v.verse,
            text_fa: v.text,
            translation: translation.code,
            audio_url: audioUrl,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from(translation.table)
            .upsert(records, { onConflict: 'book_code,chapter,verse' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`✗ DB import failed: ${error.message}`);
        return false;
    }
}

/**
 * Main Pipeline
 */
async function main() {
    console.log('🚀 COMPLETE BIBLE DOWNLOAD PIPELINE');
    console.log('====================================\n');

    initDirs();

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const stats = {
        textSuccess: 0, textFailed: 0,
        audioSuccess: 0, audioFailed: 0,
        uploadSuccess: 0, uploadFailed: 0,
        dbSuccess: 0, dbFailed: 0
    };

    try {
        // Process first translation only (TPV) - can add more later
        const translation = TRANSLATIONS[0];
        console.log(`\n📖 Translation: ${translation.name}\n`);

        for (const [bookCode, bookInfo] of Object.entries(BOOKS)) {
            console.log(`\n📚 ${bookInfo.name_fa} (${bookCode}) - ${bookInfo.chapters} chapters`);

            for (let chapter = 1; chapter <= bookInfo.chapters; chapter++) {
                console.log(`  Chapter ${chapter}/${bookInfo.chapters}...`);

                // 1. Fetch Text
                const verses = await fetchChapterText(translation.id, bookCode, chapter);
                if (verses.length > 0) {
                    const textDir = path.join(TEXT_DIR, translation.code, bookCode);
                    if (!fs.existsSync(textDir)) fs.mkdirSync(textDir, { recursive: true });

                    fs.writeFileSync(
                        path.join(textDir, `${chapter}.json`),
                        JSON.stringify({ translation: translation.code, book: bookCode, chapter, verses }, null, 2)
                    );
                    stats.textSuccess++;
                } else {
                    stats.textFailed++;
                }

                // 2. Download Audio
                let audioUrl = await extractAudioUrl(browser, translation.id, bookCode, chapter);
                let audioPath = null;

                if (audioUrl) {
                    const audioDir = path.join(AUDIO_DIR, translation.code, bookCode);
                    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

                    audioPath = path.join(audioDir, `${chapter}.mp3`);
                    const success = await downloadAudio(audioUrl, audioPath);

                    if (success) {
                        stats.audioSuccess++;

                        // 3. Upload to HiDrive
                        const remotePath = `audio/fa/${translation.code}/${bookCode}/${chapter}.mp3`;
                        const uploaded = await uploadToHiDrive(audioPath, remotePath);
                        if (uploaded) stats.uploadSuccess++;
                        else stats.uploadFailed++;

                        // Update audioUrl to HiDrive URL
                        audioUrl = `https://webdav.hidrive.strato.com/users/${HIDRIVE_USER}/mychurch/bible/${remotePath}`;
                    } else {
                        stats.audioFailed++;
                    }
                }

                // 4. Import to Database
                if (verses.length > 0) {
                    const imported = await importToDatabase(translation, bookCode, chapter, verses, audioUrl);
                    if (imported) stats.dbSuccess++;
                    else stats.dbFailed++;
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    } finally {
        await browser.close();
    }

    console.log('\n📊 FINAL STATISTICS:');
    console.log(`   Text: ${stats.textSuccess} ✓ / ${stats.textFailed} ✗`);
    console.log(`   Audio: ${stats.audioSuccess} ✓ / ${stats.audioFailed} ✗`);
    console.log(`   Upload: ${stats.uploadSuccess} ✓ / ${stats.uploadFailed} ✗`);
    console.log(`   Database: ${stats.dbSuccess} ✓ / ${stats.dbFailed} ✗`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
