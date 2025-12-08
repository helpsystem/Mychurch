import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required Supabase environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SOURCE_DIR = path.join(process.cwd(), 'Project', 'fa_new', 'fa_new');
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 500; // Number of verses per RPC call

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

async function importBible() {
    console.log(`🚀 Starting Optimized Persian Bible Import`);
    console.log(`Source: ${SOURCE_DIR}`);
    if (DRY_RUN) console.log('--- DRY RUN MODE ---');

    const books = await fs.readdir(SOURCE_DIR);
    books.sort();

    let totalVersesQueued = 0;
    let totalVersesUpdated = 0;
    let batchQueue = [];

    for (const bookDir of books) {
        if (!BOOK_MAPPING[bookDir]) continue;

        const bookCode = BOOK_MAPPING[bookDir];
        // Database uses 3-letter codes (GEN, EXO, etc.) directly in bible_chapters

        const bookPath = path.join(SOURCE_DIR, bookDir);
        const stat = await fs.stat(bookPath);
        if (!stat.isDirectory()) continue;

        const chapters = await fs.readdir(bookPath);
        chapters.sort((a, b) => parseInt(a) - parseInt(b));

        console.log(`📖 Processing ${bookCode} (${chapters.length} chapters)`);

        // Pre-fetch all chapters for this book using book_iso
        const { data: dbChapters, error: chapError } = await supabase
            .from('bible_chapters')
            .select('id, chapter_number')
            .eq('book_iso', bookCode);

        if (chapError) {
            console.error(`❌ Error fetching chapters for ${bookCode}:`, chapError);
            continue;
        }

        const chapterIdMap = {};
        dbChapters?.forEach(c => chapterIdMap[c.chapter_number] = c.id);

        for (const chapterFile of chapters) {
            if (!chapterFile.endsWith('.htm')) continue;
            const chapterNum = parseInt(chapterFile.replace('.htm', ''), 10);
            const chapterId = chapterIdMap[chapterNum];

            if (!chapterId) {
                console.warn(`⚠️ Chapter not found in DB: ${bookCode} ${chapterNum}`);
                continue;
            }

            const htmlContent = await fs.readFile(path.join(bookPath, chapterFile), 'utf-8');
            const $ = cheerio.load(htmlContent);

            $('.verse').each((i, el) => {
                const verseNum = parseInt($(el).attr('id') || $(el).text().trim(), 10);
                let verseText = '';
                let nextNode = el.nextSibling;

                while (nextNode) {
                    if (nextNode.type === 'tag' && (nextNode.name === 'br' || $(nextNode).hasClass('verse'))) break;
                    if (nextNode.type === 'text') verseText += nextNode.data;
                    else if (nextNode.type === 'tag') verseText += $(nextNode).text();
                    nextNode = nextNode.nextSibling;
                }

                verseText = verseText.replace(/&nbsp;/g, ' ').trim().replace(/^[\s\u00A0]+/, '');

                if (verseNum && verseText) {
                    batchQueue.push({
                        chapter_id: chapterId,
                        verse_number: verseNum,
                        text_fa: verseText
                    });
                    totalVersesQueued++;
                }
            });

            // Process batch if full
            if (batchQueue.length >= BATCH_SIZE) {
                const count = await processBatch(batchQueue);
                totalVersesUpdated += count;
                batchQueue = [];
            }
        }
    }

    // Process remaining verses
    if (batchQueue.length > 0) {
        const count = await processBatch(batchQueue);
        totalVersesUpdated += count;
    }

    console.log('--------------------------------------------------');
    console.log(`✅ Import Complete.`);
    console.log(`Total Verses Found: ${totalVersesQueued}`);
    console.log(`Total Verses Updated: ${totalVersesUpdated}`);
}

async function processBatch(batch) {
    if (DRY_RUN) {
        console.log(`[DRY RUN] Would update batch of ${batch.length} verses.`);
        return 0;
    }

    const { data, error } = await supabase.rpc('import_persian_verses_batch', { verses_data: batch });

    if (error) {
        console.error('❌ Batch Error:', error);
        return 0;
    } else {
        // data is an array of results because the function returns TABLE
        // We expect one row per call usually unless we structured it differently.
        // The function returns TABLE(updated_count, errors)
        const result = data[0]; // First row
        if (result) {
            // console.log(`   Batch: Updated ${result.updated_count}, Errors: ${result.errors.length}`);
            process.stdout.write('.'); // Progress indicator
            return result.updated_count || 0;
        }
        return 0;
    }
}

importBible().catch(console.error);
