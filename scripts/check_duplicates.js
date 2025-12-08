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

async function checkDuplicates() {
    console.log('🔍 بررسی verses تکراری\n');

    // Get Genesis Chapter 1 (Farsi)
    const { data: chapter } = await supabase
        .from('bible_chapters')
        .select('id')
        .eq('book_iso', 'GEN')
        .eq('chapter_number', 1)
        .eq('language', 'farsi')
        .single();

    console.log(`Chapter ID: ${chapter.id}\n`);

    // Get all verses for this chapter
    const { data: verses } = await supabase
        .from('bible_verses')
        .select('id, verse_number, translation_id, text_fa, text_en')
        .eq('chapter_id', chapter.id)
        .order('verse_number')
        .order('translation_id');

    console.log(`📝 تعداد کل verses: ${verses?.length}\n`);

    // Group by verse_number
    const grouped = {};
    for (const v of verses || []) {
        if (!grouped[v.verse_number]) {
            grouped[v.verse_number] = [];
        }
        grouped[v.verse_number].push(v);
    }

    console.log('📊 آیات تکراری:\n');

    let totalDuplicates = 0;
    for (const [verseNum, verseList] of Object.entries(grouped)) {
        if (verseList.length > 1) {
            console.log(`\nآیه ${verseNum}: ${verseList.length} نسخه`);
            for (const v of verseList) {
                console.log(`  - ID: ${v.id}, Translation: ${v.translation_id}, FA: "${v.text_fa?.substring(0, 50)}..."`);
            }
            totalDuplicates += verseList.length - 1;
        }
    }

    console.log(`\n💡 خلاصه:`);
    console.log(`   - Verses منحصر به فرد: ${Object.keys(grouped).length}`);
    console.log(`   - کل سطرها در DB: ${verses?.length}`);
    console.log(`   - تعداد تکراری: ${totalDuplicates}`);

    // Check translation IDs
    const translations = [...new Set(verses?.map(v => v.translation_id))];
    console.log(`\n📚 Translation IDs موجود: ${translations.join(', ')}`);
}

checkDuplicates();
