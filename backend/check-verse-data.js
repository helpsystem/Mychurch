const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerseData() {
  try {
    // Get a sample verse from Genesis 1
    const result = await pool.query(`
      SELECT 
        bv.verse_number,
        bv.text_fa,
        bv.text_en,
        bb.code,
        bc.chapter_number
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
      WHERE bb.code = 'GEN' AND bc.chapter_number = 1
      ORDER BY bv.verse_number
      LIMIT 5
    `);
    
    console.log('\n📖 Sample verses from Genesis 1:\n');
    result.rows.forEach(row => {
      console.log(`\nVerse ${row.verse_number}:`);
      console.log(`  text_fa: ${row.text_fa?.substring(0, 100)}...`);
      console.log(`  text_en: ${row.text_en?.substring(0, 100)}...`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

checkVerseData();
