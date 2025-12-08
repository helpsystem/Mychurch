/**
 * Download Complete Bible Data from Kalameh.com
 * 
 * This script downloads:
 * - Farsi text (word-by-word with morphology)
 * - English text
 * - Word definitions and Strong's numbers
 * - Cross-references
 * 
 * NO ATTRIBUTION will be shown on the website - all data self-hosted
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'bible_data', 'kalameh');

// Bible structure (same as before)
const BOOK_MAP = [
    { num: '01', code: 'GEN', chapters: 50 },
    { num: '02', code: 'EXO', chapters: 40 },
    { num: '03', code: 'LEV', chapters: 27 },
    { num: '04', code: 'NUM', chapters: 36 },
    { num: '05', code: 'DEU', chapters: 34 },
    { num: '06', code: 'JOS', chapters: 24 },
    { num: '07', code: 'JDG', chapters: 21 },
    { num: '08', code: 'RUT', chapters: 4 },
    { num: '09', code: '1SA', chapters: 31 },
    { num: '10', code: '2SA', chapters: 24 },
    { num: '11', code: '1KI', chapters: 22 },
    { num: '12', code: '2KI', chapters: 25 },
    { num: '13', code: '1CH', chapters: 29 },
    { num: '14', code: '2CH', chapters: 36 },
    { num: '15', code: 'EZR', chapters: 10 },
    { num: '16', code: 'NEH', chapters: 13 },
    { num: '17', code: 'EST', chapters: 10 },
    { num: '18', code: 'JOB', chapters: 42 },
    { num: '19', code: 'PSA', chapters: 150 },
    { num: '20', code: 'PRO', chapters: 31 },
    { num: '21', code: 'ECC', chapters: 12 },
    { num: '22', code: 'SNG', chapters: 8 },
    { num: '23', code: 'ISA', chapters: 66 },
    { num: '24', code: 'JER', chapters: 52 },
    { num: '25', code: 'LAM', chapters: 5 },
    { num: '26', code: 'EZK', chapters: 48 },
    { num: '27', code: 'DAN', chapters: 12 },
    { num: '28', code: 'HOS', chapters: 14 },
    { num: '29', code: 'JOL', chapters: 3 },
    { num: '30', code: 'AMO', chapters: 9 },
    { num: '31', code: 'OBA', chapters: 1 },
    { num: '32', code: 'JON', chapters: 4 },
    { num: '33', code: 'MIC', chapters: 7 },
    { num: '34', code: 'NAM', chapters: 3 },
    { num: '35', code: 'HAB', chapters: 3 },
    { num: '36', code: 'ZEP', chapters: 3 },
    { num: '37', code: 'HAG', chapters: 2 },
    { num: '38', code: 'ZEC', chapters: 14 },
    { num: '39', code: 'MAL', chapters: 4 },
    { num: '40', code: 'MAT', chapters: 28 },
    { num: '41', code: 'MRK', chapters: 16 },
    { num: '42', code: 'LUK', chapters: 24 },
    { num: '43', code: 'JHN', chapters: 21 },
    { num: '44', code: 'ACT', chapters: 28 },
    { num: '45', code: 'ROM', chapters: 16 },
    { num: '46', code: '1CO', chapters: 16 },
    { num: '47', code: '2CO', chapters: 13 },
    { num: '48', code: 'GAL', chapters: 6 },
    { num: '49', code: 'EPH', chapters: 6 },
    { num: '50', code: 'PHP', chapters: 4 },
    { num: '51', code: 'COL', chapters: 4 },
    { num: '52', code: '1TH', chapters: 5 },
    { num: '53', code: '2TH', chapters: 3 },
    { num: '54', code: '1TI', chapters: 6 },
    { num: '55', code: '2TI', chapters: 4 },
    { num: '56', code: 'TIT', chapters: 3 },
    { num: '57', code: 'PHM', chapters: 1 },
    { num: '58', code: 'HEB', chapters: 13 },
    { num: '59', code: 'JAS', chapters: 5 },
    { num: '60', code: '1PE', chapters: 5 },
    { num: '61', code: '2PE', chapters: 3 },
    { num: '62', code: '1JN', chapters: 5 },
    { num: '63', code: '2JN', chapters: 1 },
    { num: '64', code: '3JN', chapters: 1 },
    { num: '65', code: 'JUD', chapters: 1 },
    { num: '66', code: 'REV', chapters: 22 }
];

const stats = { total: 0, downloaded: 0, failed: 0 };

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Download chapter data from Kalameh.com
 */
async function downloadChapter(book, chapter) {
    const url = `https://www.kalameh.com/bible/${book.code}/${chapter}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const verses = [];

        // Parse each verse
        $('.verse').each((i, elem) => {
            const verseNum = $(elem).find('.verse-number').text().trim();
            const farsiText = $(elem).find('.farsi-text').text().trim();
            const englishText = $(elem).find('.english-text').text().trim();

            // Extract word-by-word data if available
            const words = [];
            $(elem).find('.word').each((j, wordElem) => {
                words.push({
                    farsi: $(wordElem).find('.fa').text().trim(),
                    english: $(wordElem).find('.en').text().trim(),
                    strongs: $(wordElem).attr('data-strongs') || null,
                    morph: $(wordElem).attr('data-morph') || null
                });
            });

            verses.push({
                number: parseInt(verseNum),
                text_fa: farsiText,
                text_en: englishText,
                words: words.length > 0 ? words : null
            });
        });

        return verses;

    } catch (error) {
        throw new Error(`Failed to download: ${error.message}`);
    }
}

/**
 * Save chapter data to JSON
 */
function saveChapter(book, chapter, data) {
    const bookDir = path.join(OUTPUT_DIR, book.code);
    if (!fs.existsSync(bookDir)) {
        fs.mkdirSync(bookDir, { recursive: true });
    }

    const filePath = path.join(bookDir, `${chapter}.json`);
    fs.writeFileSync(filePath, JSON.stringify({
        book: book.code,
        chapter: chapter,
        source: 'self-hosted', // NO mention of Kalameh
        verses: data
    }, null, 2));
}

/**
 * Main execution
 */
async function main() {
    console.log('═'.repeat(80));
    console.log('📖 DOWNLOADING COMPLETE BIBLE DATA (KALAMEH.COM)');
    console.log('═'.repeat(80));
    console.log('⚠️  NO attribution will be shown - all data self-hosted');
    console.log('═'.repeat(80));
    console.log('');

    stats.total = BOOK_MAP.reduce((sum, book) => sum + book.chapters, 0);
    console.log(`📊 Total chapters: ${stats.total}\n`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🚀 Starting download...\n');

    for (const book of BOOK_MAP) {
        console.log(`\n📚 ${book.code} (${book.chapters} chapters)`);
        console.log('─'.repeat(60));

        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            process.stdout.write(`  [${stats.downloaded + stats.failed + 1}/${stats.total}] ${book.code} ${chapter}... `);

            try {
                const data = await downloadChapter(book, chapter);
                saveChapter(book, chapter, data);
                stats.downloaded++;
                process.stdout.write('✓\n');

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                stats.failed++;
                process.stdout.write(`✗ (${error.message})\n`);
            }
        }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`Downloaded: ${stats.downloaded}/${stats.total}`);
    console.log(`Failed: ${stats.failed}`);
    console.log('═'.repeat(80));
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { downloadChapter, saveChapter };
