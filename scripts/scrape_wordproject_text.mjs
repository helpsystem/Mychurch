import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';

// Configuration
const BASE_URL = 'https://www.wordproject.org/bibles';
// 20 is Farsi code for audio, but for text:
// Farsi: /fa/[book_index]/[chapter].htm  (book_index: 01-66)
// English (KJV): /kj/[book_index]/[chapter].htm
// Note: Book index is 2 digits padded string '01', '02', ..., '66'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'text', 'bible');

// Standard Book List with Chapter Counts
const BOOKS = [
    { id: 1, code: '01', name: 'Genesis', chapters: 50 },
    { id: 2, code: '02', name: 'Exodus', chapters: 40 },
    { id: 3, code: '03', name: 'Leviticus', chapters: 27 },
    { id: 4, code: '04', name: 'Numbers', chapters: 36 },
    { id: 5, code: '05', name: 'Deuteronomy', chapters: 34 },
    { id: 6, code: '06', name: 'Joshua', chapters: 24 },
    { id: 7, code: '07', name: 'Judges', chapters: 21 },
    { id: 8, code: '08', name: 'Ruth', chapters: 4 },
    { id: 9, code: '09', name: '1 Samuel', chapters: 31 },
    { id: 10, code: '10', name: '2 Samuel', chapters: 24 },
    { id: 11, code: '11', name: '1 Kings', chapters: 22 },
    { id: 12, code: '12', name: '2 Kings', chapters: 25 },
    { id: 13, code: '13', name: '1 Chronicles', chapters: 29 },
    { id: 14, code: '14', name: '2 Chronicles', chapters: 36 },
    { id: 15, code: '15', name: 'Ezra', chapters: 10 },
    { id: 16, code: '16', name: 'Nehemiah', chapters: 13 },
    { id: 17, code: '17', name: 'Esther', chapters: 10 },
    { id: 18, code: '18', name: 'Job', chapters: 42 },
    { id: 19, code: '19', name: 'Psalms', chapters: 150 },
    { id: 20, code: '20', name: 'Proverbs', chapters: 31 },
    { id: 21, code: '21', name: 'Ecclesiastes', chapters: 12 },
    { id: 22, code: '22', name: 'Song of Solomon', chapters: 8 },
    { id: 23, code: '23', name: 'Isaiah', chapters: 66 },
    { id: 24, code: '24', name: 'Jeremiah', chapters: 52 },
    { id: 25, code: '25', name: 'Lamentations', chapters: 5 },
    { id: 26, code: '26', name: 'Ezekiel', chapters: 48 },
    { id: 27, code: '27', name: 'Daniel', chapters: 12 },
    { id: 28, code: '28', name: 'Hosea', chapters: 14 },
    { id: 29, code: '29', name: 'Joel', chapters: 3 },
    { id: 30, code: '30', name: 'Amos', chapters: 9 },
    { id: 31, code: '31', name: 'Obadiah', chapters: 1 },
    { id: 32, code: '32', name: 'Jonah', chapters: 4 },
    { id: 33, code: '33', name: 'Micah', chapters: 7 },
    { id: 34, code: '34', name: 'Nahum', chapters: 3 },
    { id: 35, code: '35', name: 'Habakkuk', chapters: 3 },
    { id: 36, code: '36', name: 'Zephaniah', chapters: 3 },
    { id: 37, code: '37', name: 'Haggai', chapters: 2 },
    { id: 38, code: '38', name: 'Zechariah', chapters: 14 },
    { id: 39, code: '39', name: 'Malachi', chapters: 4 },
    { id: 40, code: '40', name: 'Matthew', chapters: 28 },
    { id: 41, code: '41', name: 'Mark', chapters: 16 },
    { id: 42, code: '42', name: 'Luke', chapters: 24 },
    { id: 43, code: '43', name: 'John', chapters: 21 },
    { id: 44, code: '44', name: 'Acts', chapters: 28 },
    { id: 45, code: '45', name: 'Romans', chapters: 16 },
    { id: 46, code: '46', name: '1 Corinthians', chapters: 16 },
    { id: 47, code: '47', name: '2 Corinthians', chapters: 13 },
    { id: 48, code: '48', name: 'Galatians', chapters: 6 },
    { id: 49, code: '49', name: 'Ephesians', chapters: 6 },
    { id: 50, code: '50', name: 'Philippians', chapters: 4 },
    { id: 51, code: '51', name: 'Colossians', chapters: 4 },
    { id: 52, code: '52', name: '1 Thessalonians', chapters: 5 },
    { id: 53, code: '53', name: '2 Thessalonians', chapters: 3 },
    { id: 54, code: '54', name: '1 Timothy', chapters: 6 },
    { id: 55, code: '55', name: '2 Timothy', chapters: 4 },
    { id: 56, code: '56', name: 'Titus', chapters: 3 },
    { id: 57, code: '57', name: 'Philemon', chapters: 1 },
    { id: 58, code: '58', name: 'Hebrews', chapters: 13 },
    { id: 59, code: '59', name: 'James', chapters: 5 },
    { id: 60, code: '60', name: '1 Peter', chapters: 5 },
    { id: 61, code: '61', name: '2 Peter', chapters: 3 },
    { id: 62, code: '62', name: '1 John', chapters: 5 },
    { id: 63, code: '63', name: '2 John', chapters: 1 },
    { id: 64, code: '64', name: '3 John', chapters: 1 },
    { id: 65, code: '65', name: 'Jude', chapters: 1 },
    { id: 66, code: '66', name: 'Revelation', chapters: 22 }
];

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Simple regex parser for WordProject HTML
// Pattern usually: <span class="verse" id="1">1 </span> Verse text...
// Or sometimes just: <p>... <span class="verse"...
function parseVerses(html) {
    const verses = {};
    const verseRegex = /<span class="verse" id="(\d+)">\s*\d+\s*<\/span>([^<]+)/g;
    let match;

    while ((match = verseRegex.exec(html)) !== null) {
        const verseNum = parseInt(match[1]);
        const verseText = match[2].trim();
        if (verseText) {
            verses[verseNum] = verseText;
        }
    }
    return verses;
}

async function scrapeBook(book, lang) {
    const langPath = lang === 'fa' ? 'fa' : 'kj'; // fa or kj (KJV)
    const bookDir = path.join(OUTPUT_DIR, lang, book.code);
    await ensureDir(bookDir);

    console.log(`Scraping [${lang.toUpperCase()}] Book: ${book.name} (${book.chapters} chapters)`);

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const url = `${BASE_URL}/${langPath}/${book.code}/${chapter}.htm`;
        const dest = path.join(bookDir, `${chapter}.json`);

        try {
            if (fs.existsSync(dest)) {
                // Skip if exists to allow resuming
                // console.log(`  Skipping Ch ${chapter} (Exists)`);
                continue;
            }

            // console.log(`  Fetching Ch ${chapter}: ${url}`);
            const html = await fetch(url);
            const verses = parseVerses(html);

            const data = {
                book: book.name,
                chapter: chapter,
                language: lang,
                verses: verses
            };

            fs.writeFileSync(dest, JSON.stringify(data, null, 2));

            // Be polite to the server
            await new Promise(r => setTimeout(r, 100));

        } catch (err) {
            console.error(`  ❌ Error fetching ${url}:`, err.message);
        }
    }
    console.log(`  ✅ Done ${book.name}`);
}

async function main() {
    console.log('Starting Bible Text Scraper...');

    // 1. Scrape Farsi
    console.log('\n--- Processing FARSI ---');
    await ensureDir(path.join(OUTPUT_DIR, 'fa'));
    for (const book of BOOKS) {
        await scrapeBook(book, 'fa');
    }

    // 2. Scrape English (KJV)
    console.log('\n--- Processing ENGLISH (KJV) ---');
    await ensureDir(path.join(OUTPUT_DIR, 'en')); // Using 'en' for consistency in our app, internal mapping 'kj'
    for (const book of BOOKS) {
        await scrapeBook(book, 'en');
    }

    console.log('\nAll text scraping completed!');
}

main();
