import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envServerPath = path.join(__dirname, '..', '.env.server');
const envLocalPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envServerPath)) {
    console.log('Loading environment from .env.server');
    dotenv.config({ path: envServerPath });
} else {
    console.log('Loading environment from .env');
    dotenv.config({ path: envLocalPath });
}

// Support multiple variable names for compatibility
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required Supabase environment variables not found.');
    console.error('Checked: SUPABASE_URL, VITE_SUPABASE_URL');
    console.error('Checked: SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SOURCE_DIR = path.join(process.cwd(), 'Project', 'fa_new', 'fa_new');
const DRY_RUN = process.env.DRY_RUN === 'true';

// Map folder names (01-66) to Book codes
const BOOK_MAPPING = {
    '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
    '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
    '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
    '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
    '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
    '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
    '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
    '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL',
    '40': 'MAT', '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT',
    '45': 'ROM', '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH',
    '50': 'PHP', '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI',
    '55': '2TI', '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS',
    '60': '1PE', '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN',
    '65': 'JUD', '66': 'REV'
};

// Map Book codes to 2-digit codes used in the database (01-66)
const BOOK_CODE_TO_DB_CODE = {
    'GEN': '01', 'EXO': '02', 'LEV': '03', 'NUM': '04', 'DEU': '05',
    'JOS': '06', 'JDG': '07', 'RUT': '08', '1SA': '09', '2SA': '10',
    '1KI': '11', '2KI': '12', '1CH': '13', '2CH': '14', 'EZR': '15',
    'NEH': '16', 'EST': '17', 'JOB': '18', 'PSA': '19', 'PRO': '20',
    'ECC': '21', 'SNG': '22', 'ISA': '23', 'JER': '24', 'LAM': '25',
    'EZK': '26', 'DAN': '27', 'HOS': '28', 'JOL': '29', 'AMO': '30',
    'OBA': '31', 'JON': '32', 'MIC': '33', 'NAM': '34', 'HAB': '35',
    'ZEP': '36', 'HAG': '37', 'ZEC': '38', 'MAL': '39',
    'MAT': '40', 'MRK': '41', 'LUK': '42', 'JHN': '43', 'ACT': '44',
    'ROM': '45', '1CO': '46', '2CO': '47', 'GAL': '48', 'EPH': '49',
    'PHP': '50', 'COL': '51', '1TH': '52', '2TH': '53', '1TI': '54',
    '2TI': '55', 'TIT': '56', 'PHM': '57', 'HEB': '58', 'JAS': '59',
    '1PE': '60', '2PE': '61', '1JN': '62', '2JN': '63', '3JN': '64',
    'JUD': '65', 'REV': '66'
};

async function importBible() {
    console.log(`Starting Persian Bible import`);
    console.log(`Source Directory: ${SOURCE_DIR}`);
    if (DRY_RUN) console.log('--- DRY RUN MODE: No data will be inserted ---');

    const books = await fs.readdir(SOURCE_DIR);
    let totalVersesProcessed = 0;
    let totalErrors = 0;
    let totalUpdated = 0;

    // Sort books to process in order
    books.sort();

    for (const bookDir of books) {
        if (!BOOK_MAPPING[bookDir]) continue;

        const bookCode = BOOK_MAPPING[bookDir];
        const dbBookCode = BOOK_CODE_TO_DB_CODE[bookCode];
        const bookPath = path.join(SOURCE_DIR, bookDir);

        // Check if this is a directory
        const stat = await fs.stat(bookPath);
        if (!stat.isDirectory()) continue;

        // Get book_id from database
        const { data: bookData, error: bookError } = await supabase
            .from('bible_books')
            .select('id')
            .eq('code', dbBookCode)
            .single();

        if (bookError || !bookData) {
            console.error(`Error: Book ${bookCode} (${dbBookCode}) not found in database:`, bookError);
            totalErrors++;
            continue;
        }

        const bookId = bookData.id;
        const chapters = await fs.readdir(bookPath);

        // Sort chapters numerically
        chapters.sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });

        console.log(`Processing Book: ${bookCode} (${bookDir}) - ${chapters.length} chapters`);

        for (const chapterFile of chapters) {
            if (!chapterFile.endsWith('.htm')) continue;

            const chapterNum = parseInt(chapterFile.replace('.htm', ''), 10);

            // Get chapter_id from database
            const { data: chapterData, error: chapterError } = await supabase
                .from('bible_chapters')
                .select('id')
                .eq('book_id', bookId)
                .eq('chapter_number', chapterNum)
                .single();

            if (chapterError || !chapterData) {
                console.error(`Error: Chapter ${bookCode} ${chapterNum} not found:`, chapterError);
                totalErrors++;
                continue;
            }

            const chapterId = chapterData.id;
            const filePath = path.join(bookPath, chapterFile);
            const htmlContent = await fs.readFile(filePath, 'utf-8');
            const $ = cheerio.load(htmlContent);

            const versesToUpdate = [];

            // Parsing Logic based on structure:
            // <span class="verse" id="1">1 </span>&nbsp;Verse Text...
            $('.verse').each((i, el) => {
                const verseNum = parseInt($(el).attr('id') || $(el).text().trim(), 10);

                // Get text: The text is in the next sibling node(s)
                let verseText = '';
                let nextNode = el.nextSibling;

                while (nextNode) {
                    if (nextNode.type === 'tag' && (nextNode.name === 'br' || $(nextNode).hasClass('verse'))) {
                        break;
                    }
                    if (nextNode.type === 'text') {
                        verseText += nextNode.data;
                    } else if (nextNode.type === 'tag') {
                        // Include text from tags like <i> or <b>
                        verseText += $(nextNode).text();
                    }
                    nextNode = nextNode.nextSibling;
                }

                // Clean up text
                verseText = verseText.replace(/&nbsp;/g, ' ').trim();
                verseText = verseText.replace(/^[\s\u00A0]+/, '');

                if (verseNum && verseText) {
                    versesToUpdate.push({
                        chapter_id: chapterId,
                        verse_number: verseNum,
                        text_fa: verseText
                    });
                }
            });

            if (versesToUpdate.length > 0) {
                if (!DRY_RUN) {
                    // Update verses one by one to set text_fa for existing verses
                    for (const verse of versesToUpdate) {
                        const { error } = await supabase
                            .from('bible_verses')
                            .update({ text_fa: verse.text_fa })
                            .eq('chapter_id', verse.chapter_id)
                            .eq('verse_number', verse.verse_number);

                        if (error) {
                            console.error(`Error updating ${bookCode} ${chapterNum}:${verse.verse_number}:`, error);
                            totalErrors++;
                        } else {
                            totalUpdated++;
                        }
                    }
                } else {
                    // In Dry Run, just print the first verse of the chapter
                    console.log(`[DRY RUN] Would update ${versesToUpdate.length} verses for ${bookCode} ${chapterNum}`);
                    console.log(`   Sample: ${bookCode} ${chapterNum}:1 -> ${versesToUpdate[0].text_fa.substring(0, 50)}...`);
                }
                totalVersesProcessed += versesToUpdate.length;
            } else {
                console.warn(`Warning: No verses found for ${bookCode} ${chapterNum}`);
            }
        }
    }

    console.log('--------------------------------------------------');
    console.log(`Import Complete.`);
    console.log(`Total Verses Processed: ${totalVersesProcessed}`);
    console.log(`Total Verses Updated: ${totalUpdated}`);
    console.log(`Total Errors: ${totalErrors}`);
}

importBible().catch(console.error);
