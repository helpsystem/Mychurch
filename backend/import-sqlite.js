const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// ساخت دیتابیس SQLite
const dbPath = path.join(__dirname, 'church.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 وارد کردن داده‌ها به SQLite...');

// خواندن فایل SQL
const sqlContent = fs.readFileSync('../scripts/db/all_bibles_final.sql', 'utf8');

// تبدیل SQL PostgreSQL به SQLite
let sqliteContent = sqlContent
  .replace(/BEGIN TRANSACTION;/g, 'BEGIN;')
  .replace(/COMMIT;/g, 'COMMIT;')
  .replace(/CREATE TABLE IF NOT EXISTS/g, 'CREATE TABLE IF NOT EXISTS');

// اجرای SQL
db.serialize(() => {
  // تقسیم SQL به دستورات جداگانه
  const statements = sqliteContent.split(';').filter(stmt => stmt.trim());
  
  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement + ';', (err) => {
        if (err) {
          console.log(`❌ خطا در دستور ${index + 1}:`, err.message);
        } else if (index % 100 === 0) {
          console.log(`✅ ${index + 1} دستور اجرا شد`);
        }
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ خطا در بستن دیتابیس:', err.message);
  } else {
    console.log('✅ داده‌ها با موفقیت به SQLite وارد شدند!');
    console.log('📁 مسیر دیتابیس:', dbPath);
  }
});