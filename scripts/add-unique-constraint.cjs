/**
 * اضافه کردن UNIQUE constraint به جدول bible_audio_files
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addConstraint() {
  console.log('🔧 اضافه کردن UNIQUE constraint...\n');

  try {
    // بررسی وجود constraint
    const checkResult = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'bible_audio_files' 
        AND constraint_type = 'UNIQUE'
    `);

    console.log(`📋 Constraints موجود: ${checkResult.rows.length}`);
    checkResult.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}`);
    });

    // اضافه کردن constraint
    console.log('\n➕ اضافه کردن constraint جدید...');
    
    await pool.query(`
      ALTER TABLE bible_audio_files 
      ADD CONSTRAINT unique_book_chapter_lang 
      UNIQUE (book_iso, chapter_number, language)
    `);

    console.log('✅ constraint اضافه شد!');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️ constraint از قبل موجود است');
    } else {
      console.error('❌ خطا:', error.message);
    }
  } finally {
    await pool.end();
  }
}

addConstraint();
