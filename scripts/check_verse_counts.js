import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

async function checkVerses() {
    console.log('🔍 بررسی تعداد verses در database\n');

    // Get all Farsi chapters
    const { data: chapters } = await supabase
        .from('bible_chapters')
        .select('id, book_iso, chapter_number')
        .eq('language', 'farsi');

    console.log(`📖 تعداد کل chapters فارسی: ${chapters?.length || 0}\n`);

    // Count verses for each chapter
    let totalVerses = 0;
    const verseCounts = {};

    for (const chapter of chapters || []) {
        const { count } = await supabase
            .from('bible_verses')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', chapter.id);

        totalVerses += count || 0;

        if (!verseCounts[chapter.book_iso]) {
            verseCounts[chapter.book_iso] = 0;
        }
        verseCounts[chapter.book_iso] += count || 0;
    }

    console.log(`📝 تعداد کل verses در database (برای Farsi chapters): ${totalVerses.toLocaleString()}\n`);
    console.log('='.repeat(50));
    console.log('\n📊 تعداد verses به تفکیک کتاب:\n');

    const sortedBooks = Object.entries(verseCounts).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [book, count] of sortedBooks) {
        console.log(`${book.padEnd(5)}: ${String(count).padStart(5)} verses`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n💡 خلاصه:`);
    console.log(`   - Verses در فایل‌ها: 31,102`);
    console.log(`   - Verses در database: ${totalVerses.toLocaleString()}`);
    console.log(`   - Verses آپدیت شده: 24,584`);
    console.log(`   - اختلاف: ${(31102 - totalVerses).toLocaleString()} verses در فایل وجود دارن که در DB نیستن`);
}

checkVerses();
