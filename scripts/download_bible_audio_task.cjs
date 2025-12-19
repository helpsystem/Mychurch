
/**
 * Download Bible Audio for User Task
 * Targets: Mojdeh (TPV - 181) and English (ESV - 59)
 * Note: Qadim (Old) audio ID is unknown, skipping for now.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../bible_data/audio');
const BASE_URL = 'https://www.bible.com';

// Target Translations
// Using TPV (181) for Mojdeh
// Using ESV (59) for English (common high quality) or NIV (111)
const TRANSLATIONS = [
    { code: 'MOJDEH', id: 181, name: 'Mojdeh (TPV)' }, // TPV = 181
    { code: 'ENGLISH', id: 59, name: 'English (ESV)' }  // ESV = 59
];

// Books to download (starting with GEN 1 for test)
const BOOKS = {
    'GEN': { chapters: 50, name_fa: 'پیدایش' }
    // Add more if successful
};

/**
 * Extract audio URL from Bible.com
 */
async function extractAudioUrl(browser, translationId, book, chapter) {
    // URL format: https://www.bible.com/bible/181/GEN.1.TPV - Wait, usually /audio-bible/
    // Audio page: https://www.bible.com/fa/audio-bible/181/GEN.1.TPV
    // But simplified: https://www.bible.com/audio-bible/181/GEN.1
    const url = `${BASE_URL}/audio-bible/${translationId}/${book}.${chapter}`;
    console.log(`🔍 Navigating to: ${url}`);

    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for potential redirect or load
        await new Promise(r => setTimeout(r, 2000));

        // Method: explicit Check for audio tag src
        const audioUrl = await page.evaluate(() => {
            const audio = document.querySelector('audio');
            if (audio && audio.src) return audio.src;

            const source = document.querySelector('audio source');
            if (source && source.src) return source.src;

            // JSON data in script?
            return null;
        });

        if (audioUrl) {
            console.log(`✓ Found URL: ${audioUrl}`);
            return audioUrl;
        }

        console.log('⚠ No direct audio tag found. Inspecting network might be needed (skipped for speed in this test script).');
        return null;

    } catch (err) {
        console.error(`✗ Error on ${url}: ${err.message}`);
        return null;
    } finally {
        await page.close();
    }
}

async function downloadAudio(url, outputPath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`✗ Download fail: ${err.message}`);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Audio Download Task...');

    // Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const trans of TRANSLATIONS) {
        console.log(`\nProcessing ${trans.name} (${trans.code})...`);
        const transDir = path.join(OUTPUT_DIR, trans.code);
        if (!fs.existsSync(transDir)) fs.mkdirSync(transDir, { recursive: true });

        for (const [book, info] of Object.entries(BOOKS)) {
            const bookDir = path.join(transDir, book);
            if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

            // Test first 1 chapter for now to verify
            for (let ch = 1; ch <= 1; ch++) {
                const targetFile = path.join(bookDir, `${ch}.mp3`);
                if (fs.existsSync(targetFile)) {
                    console.log(`  Skip ${book} ${ch} (Exists)`);
                    continue;
                }

                const url = await extractAudioUrl(browser, trans.id, book, ch);
                if (url) {
                    process.stdout.write(`  Downloading ${book} ${ch}... `);
                    await downloadAudio(url, targetFile);
                    console.log('Done.');
                } else {
                    console.log(`  Failed to get URL for ${book} ${ch}`);
                }

                await new Promise(r => setTimeout(r, 1000)); // Be nice
            }
        }
    }

    await browser.close();
    console.log('\nTask Complete.');
}

main().catch(console.error);
