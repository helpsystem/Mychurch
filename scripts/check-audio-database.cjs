/**
 * بررسی وضعیت جدول bible_audio_files در Supabase
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  console.log('🔍 بررسی دیتابیس...\n');

  try {
    // 1. بررسی وجود جدول
    console.log('1️⃣ بررسی وجود جدول bible_audio_files...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bible_audio_files'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('   ✅ جدول موجود است\n');

      // 2. بررسی تعداد رکوردها
      console.log('2️⃣ تعداد فایل‌های آپلود شده:');
      const countResult = await pool.query('SELECT COUNT(*) FROM bible_audio_files');
      console.log(`   📊 ${countResult.rows[0].count} فایل\n`);

      if (parseInt(countResult.rows[0].count) > 0) {
        // 3. نمایش ساختار جدول
        console.log('3️⃣ ساختار جدول:');
        const structure = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'bible_audio_files'
          ORDER BY ordinal_position
        `);
        structure.rows.forEach(row => {
          console.log(`   🔧 ${row.column_name}: ${row.data_type}`);
        });

        // 4. نمایش چند نمونه
        console.log('\n4️⃣ نمونه رکوردها:');
        const samples = await pool.query(`
          SELECT book_iso, language, file_size, url
          FROM bible_audio_files 
          ORDER BY book_iso 
          LIMIT 5
        `);
        samples.rows.forEach(row => {
          console.log(`   📖 ${row.book_iso} (${row.language}) - ${(row.file_size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      🔗 ${row.url ? row.url.substring(0, 80) + '...' : 'N/A'}`);
        });

        // 5. آمار به تفکیک زبان
        console.log('\n5️⃣ آمار به تفکیک زبان:');
        const stats = await pool.query(`
          SELECT 
            language,
            COUNT(*) as file_count,
            SUM(file_size) as total_size
          FROM bible_audio_files
          GROUP BY language
        `);
        stats.rows.forEach(row => {
          console.log(`   🌐 ${row.language}: ${row.file_count} فایل - ${(row.total_size / 1024 / 1024 / 1024).toFixed(2)} GB`);
        });

      } else {
        console.log('   ⚠️ هیچ فایلی آپلود نشده است');
        console.log('   💡 برای آپلود اجرا کنید: node scripts/upload-bible-audio.cjs');
      }

    } else {
      console.log('   ❌ جدول وجود ندارد!\n');
      console.log('📝 برای ساخت جدول:');
      console.log('   1. برو به Supabase Dashboard → SQL Editor');
      console.log('   2. محتوای scripts/create-bible-audio-table.sql را اجرا کن\n');
    }

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
