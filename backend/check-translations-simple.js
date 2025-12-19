// بررسی ساده ترجمه‌های موجود در دیتابیس
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function checkTranslations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 بررسی ترجمه‌های کتاب مقدس در Supabase...\n');

    // بررسی جدول bible_translations
    console.log('📋 جدول bible_translations:');
    const translationsResult = await pool.query(`
      SELECT id, code, name_en, name_fa, sort_order 
      FROM bible_translations 
      ORDER BY sort_order;
    `);

    if (translationsResult.rows.length === 0) {
      console.log('❌ هیچ ترجمه‌ای یافت نشد!\n');
    } else {
      console.log(`✅ تعداد ترجمه‌ها: ${translationsResult.rows.length}\n`);
      for (const tr of translationsResult.rows) {
        console.log(`  ID ${tr.id}: ${tr.code.toUpperCase()} - ${tr.name_fa} (${tr.name_en})`);
        
        // تعداد آیات برای هر ترجمه
        const versesResult = await pool.query(`
          SELECT COUNT(*) as count 
          FROM bible_verses 
          WHERE translation_id = $1;
        `, [tr.id]);
        
        const count = parseInt(versesResult.rows[0].count);
        console.log(`     📖 تعداد آیات: ${count.toLocaleString()}`);
        
        // نمونه آیه
        if (count > 0) {
          const sampleResult = await pool.query(`
            SELECT bk.usfm_code, bc.chapter_number, bv.verse_number, 
                   SUBSTRING(bv.text_fa, 1, 60) as sample_text
            FROM bible_verses bv
            JOIN bible_chapters bc ON bv.chapter_id = bc.id
            JOIN bible_books bk ON bc.book_id = bk.id
            WHERE bv.translation_id = $1
            LIMIT 1;
          `, [tr.id]);
          
          if (sampleResult.rows.length > 0) {
            const sample = sampleResult.rows[0];
            console.log(`     نمونه: ${sample.usfm_code} ${sample.chapter_number}:${sample.verse_number}`);
            console.log(`     متن: ${sample.sample_text}...`);
          }
        }
        console.log();
      }
    }

    await pool.end();
    console.log('✅ بررسی کامل شد!');
  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error('جزئیات:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTranslations();
