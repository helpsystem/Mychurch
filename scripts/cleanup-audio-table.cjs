/**
 * پاک کردن رکوردهای قدیمی (Lord's Prayer) و آماده‌سازی برای آپلود کتاب‌های کتاب مقدس
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanup() {
  console.log('🗑️ پاک‌سازی رکوردهای قدیمی...\n');

  try {
    // حذف رکوردهایی که book_iso ندارند (Lord's Prayer files)
    const result = await pool.query(`
      DELETE FROM bible_audio_files 
      WHERE book_iso IS NULL OR book_iso = ''
    `);

    console.log(`✅ ${result.rowCount} رکورد قدیمی حذف شد\n`);

    // نمایش رکوردهای باقی‌مانده
    const remaining = await pool.query('SELECT COUNT(*) FROM bible_audio_files');
    console.log(`📊 رکوردهای باقی‌مانده: ${remaining.rows[0].count}\n`);

    if (parseInt(remaining.rows[0].count) > 0) {
      const samples = await pool.query(`
        SELECT book_iso, language, file_size 
        FROM bible_audio_files 
        LIMIT 5
      `);
      console.log('نمونه رکوردهای باقی‌مانده:');
      samples.rows.forEach(row => {
        console.log(`  📖 ${row.book_iso} (${row.language})`);
      });
    }

    console.log('\n✅ آماده برای آپلود فایل‌های جدید!');
    console.log('💡 اجرا کنید: node scripts/upload-bible-audio.cjs\n');

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    await pool.end();
  }
}

cleanup();
