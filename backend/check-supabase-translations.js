// بررسی ترجمه‌های کتاب مقدس با Supabase Client
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL یا SUPABASE_SERVICE_KEY یافت نشد!');
  process.exit(1);
}

console.log(`🔗 اتصال به: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslations() {
  try {
    console.log('🔍 بررسی ترجمه‌های کتاب مقدس...\n');

    // لیست ترجمه‌ها
    const { data: translations, error: trError } = await supabase
      .from('bible_translations')
      .select('*')
      .order('sort_order');

    if (trError) {
      console.log('❌ خطا در خواندن bible_translations:', trError.message);
      return;
    }

    if (!translations || translations.length === 0) {
      console.log('❌ هیچ ترجمه‌ای یافت نشد!\n');
      return;
    }

    console.log(`✅ تعداد ترجمه‌ها: ${translations.length}\n`);
    console.log('📋 جزئیات ترجمه‌ها:\n');

    for (const tr of translations) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID: ${tr.id} | کد: ${tr.code.toUpperCase()}`);
      console.log(`نام فارسی: ${tr.name_fa || 'ندارد'}`);
      console.log(`نام انگلیسی: ${tr.name_en || 'ندارد'}`);
      console.log(`ترتیب: ${tr.sort_order}`);

      // تعداد آیات
      const { count, error: countError } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: true })
        .eq('translation_id', tr.id);

      if (countError) {
        console.log(`❌ خطا در شمارش آیات: ${countError.message}`);
      } else {
        console.log(`📖 تعداد آیات: ${(count || 0).toLocaleString()}`);

        // نمونه آیه
        if (count && count > 0) {
          const { data: sampleVerse, error: sampleError } = await supabase
            .from('bible_verses')
            .select(`
              verse_number,
              text_fa,
              text_en,
              bible_chapters (
                chapter_number,
                bible_books (
                  usfm_code,
                  name_fa,
                  name_en
                )
              )
            `)
            .eq('translation_id', tr.id)
            .limit(1)
            .single();

          if (!sampleError && sampleVerse) {
            const book = sampleVerse.bible_chapters?.bible_books;
            const chapter = sampleVerse.bible_chapters?.chapter_number;
            console.log(`\n🔖 نمونه آیه: ${book?.usfm_code} ${chapter}:${sampleVerse.verse_number}`);
            console.log(`   کتاب: ${book?.name_fa} / ${book?.name_en}`);
            if (sampleVerse.text_fa) {
              console.log(`   متن فارسی: ${sampleVerse.text_fa.substring(0, 80)}${sampleVerse.text_fa.length > 80 ? '...' : ''}`);
            }
            if (sampleVerse.text_en) {
              console.log(`   متن انگلیسی: ${sampleVerse.text_en.substring(0, 80)}${sampleVerse.text_en.length > 80 ? '...' : ''}`);
            }
          }
        }
      }
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ بررسی کامل شد!');

  } catch (error) {
    console.error('❌ خطای غیرمنتظره:', error.message);
    console.error('جزئیات:', error);
  }
}

checkTranslations();
