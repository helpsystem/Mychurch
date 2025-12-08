import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envServerPath = path.join(__dirname, '..', '.env.server');
if (fs.existsSync(envServerPath)) {
    dotenv.config({ path: envServerPath });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SOURCE_DIR = path.join(process.cwd(), 'Project', 'fa_new', 'fa_new');

async function findMissingVerses() {
    console.log('🔍 پیدا کردن verses گم‌شده...\n');

    // Test with one book (Genesis)
    const bookDir = '01';
    const bookCode = 'GEN';
    const bookPath = path.join(SOURCE_DIR, bookDir);

    // Get first chapter
    const chapterFile = '1.htm';
    const chapterNum = 1;

    console.log(`📖 تست با ${bookCode} Chapter ${chapterNum}\n`);

    // Get chapter ID from DB
    const { data: dbChapters } = await supabase
        .from('bible_chapters')
        .select('id, chapter_number, language')
        .eq('book_iso', bookCode)
        .eq('chapter_number', chapterNum);

    console.log(`Chapters یافت شده در DB:`);
    console.log(dbChapters);

    const farsiChapter = dbChapters?.find(c => c.language === 'farsi');

    if (!farsiChapter) {
        console.log('\n❌ Farsi chapter پیدا نشد!');
        return;
    }

    console.log(`\n✅ Farsi chapter ID: ${farsiChapter.id}`);

    // Read verses from file
    const htmlContent = await fs.readFile(path.join(bookPath, chapterFile), 'utf-8');
    const $ = cheerio.load(htmlContent);

    const fileVerses = [];
    $('.verse').each((i, el) => {
        const verseNum = parseInt($(el).attr('id') || $(el).text().trim(), 10);
        if (verseNum) {
            fileVerses.push(verseNum);
        }
    });

    console.log(`\n📄 Verses در فایل: ${fileVerses.length} verses`);
    console.log(`   شماره‌ها: ${fileVerses.slice(0, 10).join(', ')}...`);

    // Get verses from DB
    const { data: dbVerses } = await supabase
        .from('bible_verses')
        .select('verse_number')
        .eq('chapter_id', farsiChapter.id)
        .order('verse_number');

    const dbVerseNumbers = dbVerses?.map(v => v.verse_number) || [];

    console.log(`\n📝 Verses در DB: ${dbVerseNumbers.length} verses`);
    console.log(`   شماره‌ها: ${dbVerseNumbers.slice(0, 10).join(', ')}...`);

    // Find missing
    const missingInDb = fileVerses.filter(v => !dbVerseNumbers.includes(v));
    const extraInDb = dbVerseNumbers.filter(v => !fileVerses.includes(v));

    console.log(`\n❌ Verses در فایل که در DB نیستن: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
        console.log(`   ${missingInDb.join(', ')}`);
    }

    console.log(`\n➕ Verses در DB که در فایل نیستن: ${extraInDb.length}`);
    if (extraInDb.length > 0) {
        console.log(`   ${extraInDb.slice(0, 20).join(', ')}${extraInDb.length > 20 ? '...' : ''}`);
    }

    // Sample verse comparison
    console.log(`\n📋 مقایسه یک verse نمونه:`);
    const sampleVerseNum = fileVerses[0];

    const { data: sampleVerse } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('chapter_id', farsiChapter.id)
        .eq('verse_number', sampleVerseNum)
        .single();

    console.log(`\nVerse ${sampleVerseNum} در DB:`);
    console.log(sampleVerse);
}

findMissingVerses();
