const fs = require('fs');
const { Pool } = require('pg');

// تنظیمات دیتابیس
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'church_db',
  password: 'SamyarBB1989',
  port: 5433,
});

async function importBibleData() {
  try {
    console.log('🔌 اتصال به دیتابیس...');
    
    // تست اتصال
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ اتصال موفق:', result.rows[0].version);
    
    // خواندن فایل SQL
    console.log('📖 خواندن فایل SQL...');
    const sqlContent = fs.readFileSync('./scripts/db/all_bibles_final.sql', 'utf8');
    
    // اجرای SQL
    console.log('⚡ وارد کردن داده‌ها...');
    await client.query(sqlContent);
    
    console.log('✅ داده‌ها با موفقیت وارد شدند!');
    
    // بررسی تعداد داده‌ها
    const chaptersCount = await client.query('SELECT COUNT(*) FROM chapters');
    const versesCount = await client.query('SELECT COUNT(*) FROM verses');
    
    console.log(`📊 آمار:`);
    console.log(`   - فصل‌ها: ${chaptersCount.rows[0].count}`);
    console.log(`   - آیات: ${versesCount.rows[0].count}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
    
    // اگر دیتابیس وجود ندارد، آن را بسازیم
    if (error.message.includes('does not exist')) {
      console.log('🏗️ ساخت دیتابیس...');
      await createDatabase();
    }
  } finally {
    await pool.end();
  }
}

async function createDatabase() {
  const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'SamyarBB1989',
    port: 5433,
  });

  try {
    const client = await adminPool.connect();
    await client.query('CREATE DATABASE church_db');
    console.log('✅ دیتابیس church_db ساخته شد');
    client.release();
    
    // حالا دوباره داده‌ها را وارد کنیم
    await importBibleData();
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ دیتابیس از قبل موجود است');
      // دوباره تلاش کنیم
      await importBibleData();
    } else {
      console.error('❌ خطا در ساخت دیتابیس:', error.message);
    }
  } finally {
    await adminPool.end();
  }
}

// اجرا
importBibleData();