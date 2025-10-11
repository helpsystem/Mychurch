const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT 
    v.verse_number, 
    v.text_fa, 
    v.text_en 
  FROM bible_verses v
  JOIN bible_chapters c ON v.chapter_id = c.id
  JOIN bible_books b ON c.book_id = b.id
  WHERE b.code = 'JHN' 
    AND c.chapter_number = 3 
    AND v.verse_number = 16
`).then(result => {
  console.log('\n📖 یوحنا 3:16 (John 3:16)\n');
  result.rows.forEach(verse => {
    console.log('🇮🇷 Persian:');
    console.log(verse.text_fa);
    console.log('\n🇬🇧 English:');
    console.log(verse.text_en);
    console.log('\n');
  });
  pool.end();
}).catch(error => {
  console.error('Error:', error);
  pool.end();
  process.exit(1);
});
