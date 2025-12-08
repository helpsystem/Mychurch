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

async function analyzeGaps() {
    console.log('🔍 تحلیل شکاف‌های Import\n');
    console.log('='.repeat(70));

    const books = await fs.readdir(SOURCE_DIR);
    books.sort();

    let totalFileVerses = 0;
    let totalDbChapters = 0;
    let missingChapters = [];
    let summary = [];

    for (const bookDir of books) {
        if (!BOOK_MAPPING[bookDir]) continue;

        const bookCode = BOOK_MAPPING[bookDir];
        const bookPath = path.join(SOURCE_DIR, bookDir);
        const stat = await fs.stat(bookPath);
        if (!stat.isDirectory()) continue;

        const chapters = await fs.readdir(bookPath);
        const htmChapters = chapters.filter(f => f.endsWith('.htm'));

        // Count verses in files
        let fileVerseCount = 0;
        for (const chapterFile of htmChapters) {
            const htmlContent = await fs.readFile(path.join(bookPath, chapterFile), 'utf-8');
            const $ = cheerio.load(htmlContent);
            fileVerseCount += $('.verse').length;
        }

        // Get DB chapters
        const { data: dbChapters } = await supabase
            .from('bible_chapters')
            .select('id, chapter_number, language')
            .eq('book_iso', bookCode);

        const dbChapterCount = dbChapters?.length || 0;
        const farsiChapters = dbChapters?.filter(c => c.language === 'farsi') || [];

        totalFileVerses += fileVerseCount;
        totalDbChapters += dbChapterCount;

        const status = htmChapters.length === farsiChapters.length ? '✅' : '⚠️';

        summary.push({
            book: bookCode,
            fileChapters: htmChapters.length,
            dbChapters: dbChapterCount,
            farsiChapters: farsiChapters.length,
            fileVerses: fileVerseCount,
            status
        });

        if (htmChapters.length !== farsiChapters.length) {
            missingChapters.push({
                book: bookCode,
                expected: htmChapters.length,
                found: farsiChapters.length,
                missing: htmChapters.length - farsiChapters.length
            });
        }
    }

    // Print summary
    console.log('\n📊 خلاصه کتاب‌ها:\n');
    console.log('کتاب | Chapters در فایل | Chapters در DB | Farsi Chapters | آیات فایل | وضعیت');
    console.log('-'.repeat(70));

    for (const s of summary) {
        console.log(`${s.book.padEnd(5)} | ${String(s.fileChapters).padStart(17)} | ${String(s.dbChapters).padStart(15)} | ${String(s.farsiChapters).padStart(14)} | ${String(s.fileVerses).padStart(11)} | ${s.status}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📈 آمار کلی:`);
    console.log(`   - تعداد کل آیات در فایل‌ها: ${totalFileVerses.toLocaleString()}`);
    console.log(`   - تعداد کل chapters در DB: ${totalDbChapters.toLocaleString()}`);

    if (missingChapters.length > 0) {
        console.log(`\n⚠️  کتاب‌های با chapter‌های گم‌شده (${missingChapters.length} کتاب):\n`);
        for (const m of missingChapters) {
            console.log(`   ${m.book}: انتظار ${m.expected} chapter، یافت شد ${m.found} → ${m.missing} گم‌شده`);
        }
    } else {
        console.log('\n✅ همه chapter‌ها در database موجودند!');
    }

    console.log('\n' + '='.repeat(70));
}

analyzeGaps();
