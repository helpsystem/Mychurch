import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import https from 'https';
import http from 'http';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const BASE_URL = 'http://audio1.wordfree.net/bibles/app/audio';
const LANGUAGE_CODE = '20'; // Farsi
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'audio', 'bible', 'farsi');
const TEMP_DIR = path.join(process.cwd(), 'temp_downloads');

// Book mapping (Standard Protestant Canon)
const BOOKS = [
    { id: 1, name: 'Genesis', chapters: 50 },
    { id: 2, name: 'Exodus', chapters: 40 },
    { id: 3, name: 'Leviticus', chapters: 27 },
    { id: 4, name: 'Numbers', chapters: 36 },
    { id: 5, name: 'Deuteronomy', chapters: 34 },
    { id: 6, name: 'Joshua', chapters: 24 },
    { id: 7, name: 'Judges', chapters: 21 },
    { id: 8, name: 'Ruth', chapters: 4 },
    { id: 9, name: '1 Samuel', chapters: 31 },
    { id: 10, name: '2 Samuel', chapters: 24 },
    { id: 11, name: '1 Kings', chapters: 22 },
    { id: 12, name: '2 Kings', chapters: 25 },
    { id: 13, name: '1 Chronicles', chapters: 29 },
    { id: 14, name: '2 Chronicles', chapters: 36 },
    { id: 15, name: 'Ezra', chapters: 10 },
    { id: 16, name: 'Nehemiah', chapters: 13 },
    { id: 17, name: 'Esther', chapters: 10 },
    { id: 18, name: 'Job', chapters: 42 },
    { id: 19, name: 'Psalms', chapters: 150 },
    { id: 20, name: 'Proverbs', chapters: 31 },
    { id: 21, name: 'Ecclesiastes', chapters: 12 },
    { id: 22, name: 'Song of Solomon', chapters: 8 },
    { id: 23, name: 'Isaiah', chapters: 66 },
    { id: 24, name: 'Jeremiah', chapters: 52 },
    { id: 25, name: 'Lamentations', chapters: 5 },
    { id: 26, name: 'Ezekiel', chapters: 48 },
    { id: 27, name: 'Daniel', chapters: 12 },
    { id: 28, name: 'Hosea', chapters: 14 },
    { id: 29, name: 'Joel', chapters: 3 },
    { id: 30, name: 'Amos', chapters: 9 },
    { id: 31, name: 'Obadiah', chapters: 1 },
    { id: 32, name: 'Jonah', chapters: 4 },
    { id: 33, name: 'Micah', chapters: 7 },
    { id: 34, name: 'Nahum', chapters: 3 },
    { id: 35, name: 'Habakkuk', chapters: 3 },
    { id: 36, name: 'Zephaniah', chapters: 3 },
    { id: 37, name: 'Haggai', chapters: 2 },
    { id: 38, name: 'Zechariah', chapters: 14 },
    { id: 39, name: 'Malachi', chapters: 4 },
    { id: 40, name: 'Matthew', chapters: 28 },
    { id: 41, name: 'Mark', chapters: 16 },
    { id: 42, name: 'Luke', chapters: 24 },
    { id: 43, name: 'John', chapters: 21 },
    { id: 44, name: 'Acts', chapters: 28 },
    { id: 45, name: 'Romans', chapters: 16 },
    { id: 46, name: '1 Corinthians', chapters: 16 },
    { id: 47, name: '2 Corinthians', chapters: 13 },
    { id: 48, name: 'Galatians', chapters: 6 },
    { id: 49, name: 'Ephesians', chapters: 6 },
    { id: 50, name: 'Philippians', chapters: 4 },
    { id: 51, name: 'Colossians', chapters: 4 },
    { id: 52, name: '1 Thessalonians', chapters: 5 },
    { id: 53, name: '2 Thessalonians', chapters: 3 },
    { id: 54, name: '1 Timothy', chapters: 6 },
    { id: 55, name: '2 Timothy', chapters: 4 },
    { id: 56, name: 'Titus', chapters: 3 },
    { id: 57, name: 'Philemon', chapters: 1 },
    { id: 58, name: 'Hebrews', chapters: 13 },
    { id: 59, name: 'James', chapters: 5 },
    { id: 60, name: '1 Peter', chapters: 5 },
    { id: 61, name: '2 Peter', chapters: 3 },
    { id: 62, name: '1 John', chapters: 5 },
    { id: 63, name: '2 John', chapters: 1 },
    { id: 64, name: '3 John', chapters: 1 },
    { id: 65, name: 'Jude', chapters: 1 },
    { id: 66, name: 'Revelation', chapters: 22 }
];

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {

        const request = (currentUrl) => {
            // console.log(`Attempting: ${currentUrl}`);
            const lib = currentUrl.startsWith('https') ? https : http;
            const file = fs.createWriteStream(dest);

            lib.get(currentUrl, (response) => {
                // Handle Redirects
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307 || response.statusCode === 308) {
                    const newUrl = response.headers.location;
                    if (!newUrl) {
                        reject(new Error(`Redirect status ${response.statusCode} but no location header`));
                        return;
                    }
                    // console.log(`  Redirecting to: ${newUrl}`);
                    file.close();
                    fs.unlink(dest, () => { }); // cleanup partial file
                    request(newUrl);
                    return;
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(dest, () => { });
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => { });
                reject(err);
            });
        };

        request(url);
    });
}

async function unzipFile(zipPath, extractPath) {
    const command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`;
    try {
        await execAsync(command);
    } catch (error) {
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
        throw error;
    }
}

async function processBook(book) {
    const url = `${BASE_URL}/${LANGUAGE_CODE}_${book.id}.zip`;
    const zipPath = path.join(TEMP_DIR, `${book.id}.zip`);
    const extractPath = path.join(TEMP_DIR, `extracted_${book.id}`);

    console.log(`Processing Book ${book.id} (${book.name})...`);

    try {
        // 1. Download
        // Force wait to be polite
        await new Promise(r => setTimeout(r, 1000));

        if (!fs.existsSync(zipPath)) {
            console.log(`  Downloading...`);
            await downloadFile(url, zipPath);
        } else {
            console.log(`  File already exists, skipping download.`);
        }

        // 2. Extract
        console.log(`  Extracting...`);
        await ensureDir(extractPath);
        await unzipFile(zipPath, extractPath);

        // 3. Move files to structured directory
        const possibleSubdir = path.join(extractPath, String(book.id));
        let sourceDir = extractPath;

        if (fs.existsSync(possibleSubdir) && fs.lstatSync(possibleSubdir).isDirectory()) {
            sourceDir = possibleSubdir;
        }

        const targetBookDir = path.join(OUTPUT_DIR, String(book.id));
        await ensureDir(targetBookDir);

        const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mp3'));
        console.log(`  Found ${files.length} audio files. Moving...`);

        for (const file of files) {
            const src = path.join(sourceDir, file);
            const dest = path.join(targetBookDir, file);
            if (!fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
            }
        }

        console.log(`  ✅ Book ${book.id} completed.`);

    } catch (err) {
        console.error(`  ❌ Error processing Book ${book.id}:`, err.message);
    }
}

async function main() {
    console.log('Starting Bulk Bible Audio Download...');

    await ensureDir(OUTPUT_DIR);
    await ensureDir(TEMP_DIR);

    for (const book of BOOKS) {
        await processBook(book);
    }

    console.log('All downloads completed!');
}

main();
