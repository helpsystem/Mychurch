const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Books to scrape
const BOOKS = [
    { iso: 'LEV', chapters: 27 },
    { iso: 'NUM', chapters: 36 },
    { iso: 'DEU', chapters: 34 }
];

const BASE_URL = 'https://www.bible.com/bible/181'; // TPV (Mojdeh)
const OUTPUT_DIR = 'bible_data/scraped_raw';

// Selectors based on provided HTML
const VERSE_SELECTOR = 'span.ChapterContent_verse__57FIw';
const CONTENT_SELECTOR = 'span.ChapterContent_content__RrUqA';

async function scrapeBook(browser, book) {
    console.log(`\n📘 Scraping ${book.iso}...`);
    const bookDir = path.join(OUTPUT_DIR, book.iso);
    if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const filePath = path.join(bookDir, `${chapter}.json`);
        if (fs.existsSync(filePath)) {
            console.log(`  Skipping ${book.iso} ${chapter} (already exists)`);
            continue;
        }

        const url = `${BASE_URL}/${book.iso}.${chapter}.TPV`;
        console.log(`  Processing ${book.iso} ${chapter}...`);

        let page;
        try {
            page = await browser.newPage();
            // Set User Agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Wait for verses to appear
            try {
                await page.waitForSelector(VERSE_SELECTOR, { timeout: 10000 });
            } catch (e) {
                console.log(`    ⚠️ No verses found for ${book.iso} ${chapter} (Time out)`);
                await page.close();
                continue;
            }

            const verses = await page.evaluate((sel, contentSel) => {
                const verseElements = document.querySelectorAll(sel);
                const data = [];

                verseElements.forEach(v => {
                    const usfm = v.getAttribute('data-usfm'); // e.g. LEV.1.1
                    if (!usfm) return;

                    const parts = usfm.split('.');
                    const verseNum = parseInt(parts[2]);

                    // Get text content excluding label numbers
                    const contentSpans = v.querySelectorAll(contentSel);
                    let text = '';
                    contentSpans.forEach(span => text += span.innerText + ' ');

                    text = text.trim();
                    if (text) {
                        data.push({
                            verse: verseNum,
                            text: text,
                            usfm: usfm
                        });
                    }
                });
                return data;
            }, VERSE_SELECTOR, CONTENT_SELECTOR);

            if (verses.length > 0) {
                fs.writeFileSync(filePath, JSON.stringify({
                    book: book.iso,
                    chapter: chapter,
                    verses: verses
                }, null, 2));
                console.log(`    ✅ Saved ${verses.length} verses`);
            } else {
                console.log(`    ❌ No verses extracted`);
            }

            await page.close();

            // Random delay to be polite
            const delay = Math.floor(Math.random() * 2000) + 1000;
            await new Promise(r => setTimeout(r, delay));

        } catch (err) {
            console.error(`    ❌ Error processing ${book.iso} ${chapter}:`, err.message);
            if (page) await page.close().catch(() => { });
        }
    }
}

async function run() {
    console.log('🚀 Starting Scraper for Missing Mojdeh Books...');

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const book of BOOKS) {
            await scrapeBook(browser, book);
        }
    } finally {
        await browser.close();
    }

    console.log('\n✨ Scraping Complete!');
}

run();
