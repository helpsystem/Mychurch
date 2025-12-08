
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
// Priority: .env.server (production) > .env (local)
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
const TRANSLATION_ID = 'fa_new';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Map folder names (01-66) to Book IDs
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

async function importBible() {
    console.log(`Starting import for translation: ${TRANSLATION_ID}`);
    console.log(`Source Directory: ${SOURCE_DIR}`);
    if (DRY_RUN) console.log('--- DRY RUN MODE: No data will be inserted ---');

    const books = await fs.readdir(SOURCE_DIR);
    let totalVersesProcessed = 0;
    let totalErrors = 0;

    // Sort books to process in order
    books.sort();

    for (const bookDir of books) {
        if (!BOOK_MAPPING[bookDir]) continue;

        const bookAbbr = BOOK_MAPPING[bookDir];
        const bookPath = path.join(SOURCE_DIR, bookDir);
        const chapters = await fs.readdir(bookPath);

        // Sort chapters numerically
        chapters.sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });

        console.log(`Processing Book: ${bookAbbr} (${bookDir}) - ${chapters.length} chapters`);

        // Get book ID from database
        const { data: bookData, error: bookError } = await supabase
            .from('bible_books')
            .select('id')
            .eq('abbreviation', bookAbbr)
            .single();

        if (bookError || !bookData) {
            console.error(`Error: Book ${bookAbbr} not found in database:`, bookError);
            totalErrors++;
            continue;
        }

        const dbBookId = bookData.id;

        for (const chapterFile of chapters) {
            if (!chapterFile.endsWith('.htm')) continue;

            const chapterNum = parseInt(chapterFile.replace('.htm', ''), 10);
            const filePath = path.join(bookPath, chapterFile);
            const htmlContent = await fs.readFile(filePath, 'utf-8');
            const $ = cheerio.load(htmlContent);

            // Get chapter ID from database
            const { data: chapterData, error: chapterError } = await supabase
                .from('bible_chapters')
                .select('id')
                .eq('book_id', dbBookId)
                .eq('chapter_number', chapterNum)
                .single();

            if (chapterError || !chapterData) {
                console.error(`Error: Chapter ${bookAbbr} ${chapterNum} not found in database:`, chapterError);
                totalErrors++;
                continue;
            }

            const dbChapterId = chapterData.id;

            const versesToInsert = [];

            // Parsing Logic based on structure:
            // <span class="verse" id="1">1 </span>&nbsp;Verse Text...
            $('.verse').each((i, el) => {
                const verseNum = parseInt($(el).attr('id') || $(el).text().trim(), 10);

                // Get text: The text is in the next sibling node(s)
                // We need to traverse siblings until we hit a <br> or another .verse or end of block
                let verseText = '';
                let nextNode = el.nextSibling;

                while (nextNode) {
                    if (nextNode.type === 'tag' && (nextNode.name === 'br' || $(nextNode).hasClass('verse'))) {
                        break;
                    }
                    if (nextNode.type === 'text') {
                        verseText += nextNode.data;
                    } else if (nextNode.type === 'tag') {
                        // If there are other tags like <i> or <b> inside the verse, include their text
                        verseText += $(nextNode).text();
                    }
                    nextNode = nextNode.nextSibling;
                }

                // Clean up text
                verseText = verseText.replace(/&nbsp;/g, ' ').trim();

                // Remove leading non-breaking spaces or common artifacts if any
                verseText = verseText.replace(/^[\s\u00A0]+/, '');

                if (verseNum && verseText) {
                    versesToInsert.push({
                        chapter_id: dbChapterId,
                        verse_number: verseNum,
                        text_fa: verseText
                    });
                }
            });

            if (versesToInsert.length > 0) {
                if (!DRY_RUN) {
                    const { error } = await supabase
                        .from('bible_verses')
                        .upsert(versesToInsert, { onConflict: 'chapter_id,verse_number' });

                    if (error) {
                        console.error(`Error inserting ${bookAbbr} ${chapterNum}:`, error);
                        totalErrors++;
                    } else {
                        console.log(`✅ Inserted ${versesToInsert.length} verses for ${bookAbbr} ${chapterNum}`);
                    }
                } else {
                    // In Dry Run, just print the first verse of the chapter
                    console.log(`[DRY RUN] Would insert ${versesToInsert.length} verses for ${bookAbbr} ${chapterNum}`);
                    console.log(`   Sample: ${bookAbbr} ${chapterNum}:1 -> ${versesToInsert[0].text_fa.substring(0, 50)}...`);
                }
                totalVersesProcessed += versesToInsert.length;
            } else {
                console.warn(`Warning: No verses found for ${bookAbbr} ${chapterNum}`);
            }
        }
    }

    console.log('--------------------------------------------------');
    console.log(`Import Complete.`);
    console.log(`Total Verses Processed: ${totalVersesProcessed}`);
    console.log(`Total Errors: ${totalErrors}`);
}

importBible().catch(console.error);
