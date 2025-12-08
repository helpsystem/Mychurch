/**
 * Download and Upload ALL Farsi Bible Audio from WordProject to HiDrive
 * 
 * Source: https://audio1.wordfree.net/bibles/app/audio/20/{book}/{chapter}.mp3
 * Destination: HiDrive at /bible/audio/fa/{USFM_CODE}/{chapter}.mp3
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

// HiDrive Configuration
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;
const HIDRIVE_BASE_PATH = '/users/adminchurch/mychurch/bible/audio/fa';

// Temporary download directory
const TEMP_DIR = path.join(__dirname, '..', 'temp_audio_downloads');

// Bible Books Mapping (WordProject Number -> USFM Code)
const BOOK_MAP = [
    { num: '01', code: 'GEN', chapters: 50, testament: 'OT' },
    { num: '02', code: 'EXO', chapters: 40, testament: 'OT' },
    { num: '03', code: 'LEV', chapters: 27, testament: 'OT' },
    { num: '04', code: 'NUM', chapters: 36, testament: 'OT' },
    { num: '05', code: 'DEU', chapters: 34, testament: 'OT' },
    { num: '06', code: 'JOS', chapters: 24, testament: 'OT' },
    { num: '07', code: 'JDG', chapters: 21, testament: 'OT' },
    { num: '08', code: 'RUT', chapters: 4, testament: 'OT' },
    { num: '09', code: '1SA', chapters: 31, testament: 'OT' },
    { num: '10', code: '2SA', chapters: 24, testament: 'OT' },
    { num: '11', code: '1KI', chapters: 22, testament: 'OT' },
    { num: '12', code: '2KI', chapters: 25, testament: 'OT' },
    { num: '13', code: '1CH', chapters: 29, testament: 'OT' },
    { num: '14', code: '2CH', chapters: 36, testament: 'OT' },
    { num: '15', code: 'EZR', chapters: 10, testament: 'OT' },
    { num: '16', code: 'NEH', chapters: 13, testament: 'OT' },
    { num: '17', code: 'EST', chapters: 10, testament: 'OT' },
    { num: '18', code: 'JOB', chapters: 42, testament: 'OT' },
    { num: '19', code: 'PSA', chapters: 150, testament: 'OT' },
    { num: '20', code: 'PRO', chapters: 31, testament: 'OT' },
    { num: '21', code: 'ECC', chapters: 12, testament: 'OT' },
    { num: '22', code: 'SNG', chapters: 8, testament: 'OT' },
    { num: '23', code: 'ISA', chapters: 66, testament: 'OT' },
    { num: '24', code: 'JER', chapters: 52, testament: 'OT' },
    { num: '25', code: 'LAM', chapters: 5, testament: 'OT' },
    { num: '26', code: 'EZK', chapters: 48, testament: 'OT' },
    { num: '27', code: 'DAN', chapters: 12, testament: 'OT' },
    { num: '28', code: 'HOS', chapters: 14, testament: 'OT' },
    { num: '29', code: 'JOL', chapters: 3, testament: 'OT' },
    { num: '30', code: 'AMO', chapters: 9, testament: 'OT' },
    { num: '31', code: 'OBA', chapters: 1, testament: 'OT' },
    { num: '32', code: 'JON', chapters: 4, testament: 'OT' },
    { num: '33', code: 'MIC', chapters: 7, testament: 'OT' },
    { num: '34', code: 'NAM', chapters: 3, testament: 'OT' },
    { num: '35', code: 'HAB', chapters: 3, testament: 'OT' },
    { num: '36', code: 'ZEP', chapters: 3, testament: 'OT' },
    { num: '37', code: 'HAG', chapters: 2, testament: 'OT' },
    { num: '38', code: 'ZEC', chapters: 14, testament: 'OT' },
    { num: '39', code: 'MAL', chapters: 4, testament: 'OT' },
    { num: '40', code: 'MAT', chapters: 28, testament: 'NT' },
    { num: '41', code: 'MRK', chapters: 16, testament: 'NT' },
    { num: '42', code: 'LUK', chapters: 24, testament: 'NT' },
    { num: '43', code: 'JHN', chapters: 21, testament: 'NT' },
    { num: '44', code: 'ACT', chapters: 28, testament: 'NT' },
    { num: '45', code: 'ROM', chapters: 16, testament: 'NT' },
    { num: '46', code: '1CO', chapters: 16, testament: 'NT' },
    { num: '47', code: '2CO', chapters: 13, testament: 'NT' },
    { num: '48', code: 'GAL', chapters: 6, testament: 'NT' },
    { num: '49', code: 'EPH', chapters: 6, testament: 'NT' },
    { num: '50', code: 'PHP', chapters: 4, testament: 'NT' },
    { num: '51', code: 'COL', chapters: 4, testament: 'NT' },
    { num: '52', code: '1TH', chapters: 5, testament: 'NT' },
    { num: '53', code: '2TH', chapters: 3, testament: 'NT' },
    { num: '54', code: '1TI', chapters: 6, testament: 'NT' },
    { num: '55', code: '2TI', chapters: 4, testament: 'NT' },
    { num: '56', code: 'TIT', chapters: 3, testament: 'NT' },
    { num: '57', code: 'PHM', chapters: 1, testament: 'NT' },
    { num: '58', code: 'HEB', chapters: 13, testament: 'NT' },
    { num: '59', code: 'JAS', chapters: 5, testament: 'NT' },
    { num: '60', code: '1PE', chapters: 5, testament: 'NT' },
    { num: '61', code: '2PE', chapters: 3, testament: 'NT' },
    { num: '62', code: '1JN', chapters: 5, testament: 'NT' },
    { num: '63', code: '2JN', chapters: 1, testament: 'NT' },
    { num: '64', code: '3JN', chapters: 1, testament: 'NT' },
    { num: '65', code: 'JUD', chapters: 1, testament: 'NT' },
    { num: '66', code: 'REV', chapters: 22, testament: 'NT' }
];

// Statistics
const stats = {
    total: 0,
    downloaded: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0
};

// Create temp directory
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Download a single MP3 file from WordProject using axios (handles redirects automatically)
 */
async function downloadAudio(bookNum, chapter, tempPath) {
    // Remove leading zeros from bookNum (e.g., '01' -> '1')
    const bookNumInt = parseInt(bookNum, 10);
    const url = `http://audio1.wordfree.net/bibles/app/audio/20/${bookNumInt}/${chapter}.mp3`;

    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        maxRedirects: 5,
        timeout: 30000
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

/**
 * Upload file to HiDrive via WebDAV
 */
async function uploadToHiDrive(localPath, remoteBookCode, chapter) {
    const fileBuffer = fs.readFileSync(localPath);
    const remoteUrl = `${HIDRIVE_WEBDAV_URL}${HIDRIVE_BASE_PATH}/${remoteBookCode}/${chapter}.mp3`;

    try {
        // Create directory if needed
        const dirUrl = `${HIDRIVE_WEBDAV_URL}${HIDRIVE_BASE_PATH}/${remoteBookCode}`;
        try {
            await axios({
                method: 'MKCOL',
                url: dirUrl,
                auth: {
                    username: HIDRIVE_USER,
                    password: HIDRIVE_PASSWORD
                }
            });
        } catch (err) {
            // Directory may already exist, ignore 405/409 errors
            if (err.response?.status !== 405 && err.response?.status !== 409) {
                throw err;
            }
        }

        // Upload file
        await axios.put(remoteUrl, fileBuffer, {
            auth: {
                username: HIDRIVE_USER,
                password: HIDRIVE_PASSWORD
            },
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': fileBuffer.length
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return true;
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

/**
 * Process a single chapter
 */
async function processChapter(book, chapter) {
    const tempFile = path.join(TEMP_DIR, `${book.code}_${chapter}.mp3`);
    const label = `${book.code} ${chapter}`;

    try {
        // Download
        process.stdout.write(`[${stats.downloaded + stats.failed + stats.skipped + 1}/${stats.total}] ${label} - Downloading... `);
        await downloadAudio(book.num, chapter, tempFile);
        stats.downloaded++;
        process.stdout.write('✓ ');

        // Upload
        process.stdout.write('Uploading... ');
        await uploadToHiDrive(tempFile, book.code, chapter);
        stats.uploaded++;
        process.stdout.write('✓\n');

        // Cleanup
        fs.unlinkSync(tempFile);

    } catch (error) {
        stats.failed++;
        process.stdout.write(`✗ (${error.message})\n`);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('═'.repeat(80));
    console.log('📖 FARSI BIBLE AUDIO - DOWNLOAD & UPLOAD TO HIDRIVE');
    console.log('═'.repeat(80));
    console.log(`Source: WordProject.org`);
    console.log(`Destination: HiDrive ${HIDRIVE_BASE_PATH}`);
    console.log('═'.repeat(80));
    console.log('');

    // Calculate total chapters
    stats.total = BOOK_MAP.reduce((sum, book) => sum + book.chapters, 0);
    console.log(`📊 Total chapters to process: ${stats.total}\n`);

    // Ask for confirmation
    console.log('⚠️  This will download ~1,189 MP3 files and upload them to HiDrive.');
    console.log('   Estimated time: 1-3 hours depending on connection speed.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🚀 Starting download and upload...\n');

    const startTime = Date.now();

    // Process each book
    for (const book of BOOK_MAP) {
        console.log(`\n📚 ${book.code} (${book.chapters} chapters)`);
        console.log('─'.repeat(60));

        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            await processChapter(book, chapter);

            // Progress summary every 50 chapters
            if ((stats.downloaded + stats.failed + stats.skipped) % 50 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                const percent = ((stats.downloaded + stats.failed + stats.skipped) / stats.total * 100).toFixed(1);
                console.log(`\n⏱️  Progress: ${percent}% | Time: ${elapsed}min | Success: ${stats.uploaded} | Failed: ${stats.failed}\n`);
            }
        }
    }

    // Final summary
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '═'.repeat(80));
    console.log('✅ COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`Total Chapters: ${stats.total}`);
    console.log(`Downloaded: ${stats.downloaded}`);
    console.log(`Uploaded: ${stats.uploaded}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Time: ${totalTime} minutes`);
    console.log('═'.repeat(80));

    // Cleanup temp directory
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmdirSync(TEMP_DIR, { recursive: true });
    }
}

// Run
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { downloadAudio, uploadToHiDrive };
