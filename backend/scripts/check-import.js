const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkImportedVerses() {
  try {
    // Total verses
    const total = await pool.query('SELECT COUNT(*) FROM bible_verses');
    console.log(`\n📊 Total verses in database: ${total.rows[0].count}`);
    
    // Verses with real Persian
    const realFa = await pool.query(`
      SELECT COUNT(*) FROM bible_verses 
      WHERE text_fa IS NOT NULL 
        AND text_fa NOT LIKE 'آیه%'
    `);
    console.log(`   Verses with Persian text: ${realFa.rows[0].count}`);
    
    // Verses with real English
    const realEn = await pool.query(`
      SELECT COUNT(*) FROM bible_verses 
      WHERE text_en IS NOT NULL 
        AND text_en NOT LIKE 'Verse%'
    `);
    console.log(`   Verses with English text: ${realEn.rows[0].count}`);
    
    // Sample some verses
    const sample = await pool.query(`
      SELECT 
        b.name_en,
        c.chapter_number,
        v.verse_number,
        SUBSTRING(v.text_fa, 1, 60) as fa_sample,
        SUBSTRING(v.text_en, 1, 60) as en_sample
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE v.text_fa NOT LIKE 'آیه%'
        AND v.text_en NOT LIKE 'Verse%'
      ORDER BY b.id, c.chapter_number, v.verse_number
      LIMIT 5
    `);
    
    console.log('\n📖 Sample imported verses:\n');
    sample.rows.forEach(v => {
      console.log(`${v.name_en} ${v.chapter_number}:${v.verse_number}`);
      console.log(`FA: ${v.fa_sample}...`);
      console.log(`EN: ${v.en_sample}...`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkImportedVerses();
