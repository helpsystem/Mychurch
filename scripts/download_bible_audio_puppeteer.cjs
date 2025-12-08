/**
 * Download Bible Audio from Bible.com using Puppeteer
 * This script renders the JavaScript audio player to extract actual MP3 URLs
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../bible_data/audio');
const BASE_URL = 'https://www.bible.com';

// Translations with audio
const TRANSLATIONS = [
    { code: 'TPV', id: 181, name: 'مژده برای عصر جدید' },
    { code: 'NMV', id: 118, name: 'هزاره نو' },
    { code: 'PCB', id: 1619, name: 'ترجمه معاصر' }
];

// Test with Genesis
const TEST_BOOKS = {
    'GEN': { chapters: 3, name_fa: 'پیدایش' } // Test first 3 chapters
};

/**
 * Extract audio URL from Bible.com audio page using Puppeteer
 */
async function extractAudioUrl(browser, translationId, book, chapter) {
    const url = `${BASE_URL}/fa/audio-bible/${translationId}/${book}.${chapter}`;
    console.log(`🔍 Navigating to: ${url}`);

    const page = await browser.newPage();

    try {
        // Set timeout and wait for network to be idle
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for audio player to load (use Promise instead of deprecated waitForTimeout)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Method 1: Intercept network requests for MP3 files
        let audioUrl = null;
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');

        // Listen for audio file requests 
        client.on('Network.responseReceived', async (params) => {
            const response = params.response;
            const url = response.url;

            // Filter ONLY actual MP3 files from YouVersion CDN
            if (url.includes('.mp3') &&
                url.includes('audio-bible-cdn.youversionapi.com')) {
                console.log(`📡 Found audio URL: ${url.substring(0, 100)}...`);
                audioUrl = url;
            }
        });

        // NOW trigger audio playback to capture URL
        try {
            // Click play button if exists
            const playButton = await page.$('button[aria-label*="Play"], button[data-testid="play"], button.play-button');
            if (playButton) {
                console.log(' Clicking play button...');
                await playButton.click();
                // Wait longer for audio to load
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.log('⚠️  Play button not found, trying auto-play...');
                // Try to trigger auto-play via JavaScript
                await page.evaluate(() => {
                    const audio = document.querySelector('audio');
                    if (audio) {
                        audio.play().catch(() => { });
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {
            console.log(`⚠️  Could not trigger playback: ${e.message}`);
        }

        // Method 2: Extract from DOM
        if (!audioUrl) {
            audioUrl = await page.evaluate(() => {
                // Check for audio element
                const audioEl = document.querySelector('audio');
                if (audioEl && audioEl.src) {
                    return audioEl.src;
                }

                // Check for source element
                const sourceEl = document.querySelector('audio source');
                if (sourceEl && sourceEl.src) {
                    return sourceEl.src;
                }

                // Check data attributes
                const dataUrl = document.querySelector('[data-audio-url], [data-src*=".mp3"]');
                if (dataUrl) {
                    return dataUrl.getAttribute('data-audio-url') || dataUrl.getAttribute('data-src');
                }

                return null;
            });
        }

        // Method 3: Check page source for CDN URLs
        if (!audioUrl) {
            const content = await page.content();
            const cdnMatch = content.match(/https:\/\/[^"']*\.mp3/);
            if (cdnMatch) {
                audioUrl = cdnMatch[0];
            }
        }

        await page.close();
        return audioUrl;

    } catch (error) {
        console.error(`✗ Error extracting audio URL: ${error.message}`);
        await page.close();
        return null;
    }
}

/**
 * Download audio file from URL
 */
async function downloadAudio(url, outputPath) {
    try {
        console.log(`📥 Downloading: ${path.basename(outputPath)}`);

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(outputPath);
                console.log(`✓ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                resolve(true);
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`✗ Download failed: ${error.message}`);
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Bible.com Audio Downloader with Puppeteer');
    console.log('==============================================\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Launch browser
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
        headless: true, // Set to false to see what's happening
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const stats = { success: 0, failed: 0 };

    try {
        // Test with TPV only
        const translation = TRANSLATIONS[0];
        console.log(`\n📖 Processing: ${translation.name} (${translation.code})\n`);

        for (const [bookCode, bookInfo] of Object.entries(TEST_BOOKS)) {
            console.log(`📚 Book: ${bookInfo.name_fa} (${bookCode})`);

            for (let chapter = 1; chapter <= bookInfo.chapters; chapter++) {
                // Extract audio URL
                const audioUrl = await extractAudioUrl(browser, translation.id, bookCode, chapter);

                if (audioUrl) {
                    // Create output directory
                    const outputDir = path.join(OUTPUT_DIR, translation.code, bookCode);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    const outputFile = path.join(outputDir, `${chapter}.mp3`);

                    // Download audio
                    const success = await downloadAudio(audioUrl, outputFile);

                    if (success) {
                        stats.success++;

                        // Save URL for reference
                        const urlFile = path.join(outputDir, `${chapter}.url.txt`);
                        fs.writeFileSync(urlFile, audioUrl);
                    } else {
                        stats.failed++;
                    }
                } else {
                    console.log(`✗ Could not extract audio URL for ${bookCode} ${chapter}`);
                    stats.failed++;
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    } finally {
        await browser.close();
    }

    console.log('\n📊 Final Statistics:');
    console.log(`   Success: ${stats.success} ✓`);
    console.log(`   Failed: ${stats.failed} ✗`);
    console.log(`\n📁 Audio saved to: ${OUTPUT_DIR}`);
}

// Run
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main, extractAudioUrl, downloadAudio };
