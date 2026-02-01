/**
 * Import KJV Bible from JSON files to PostgreSQL
 * وارد کردن آیات انگلیسی KJV به دیتابیس
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'mychurch_user',
  password: 'MyChurch2024Secure!',
  database: 'mychurch'
});

const KJV_PATH = '/root/Mychurch/bible_data/text/KJV';

const BOOK_CODES = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

async function importKJV() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting KJV Bible import...\n');
    
    // Check/Create KJV translation
    let transResult = await client.query("SELECT id FROM bible_translations WHERE code = 'kjv'");
    let translationId;
    
    if (transResult.rows.length === 0) {
      const insert = await client.query(`
        INSERT INTO bible_translations (code, name_en, name_fa, description_en, description_fa, language, is_active, is_default, sort_order)
        VALUES ('kjv', 'King James Version', 'ترجمه کینگ جیمز', 'King James Version - Classic English Bible', 'ترجمه کلاسیک انگلیسی کتاب مقدس', 'en', true, false, 45)
        RETURNING id
      `);
      translationId = insert.rows[0].id;
      console.log(`✅ Created KJV translation: ID ${translationId}`);
    } else {
      translationId = transResult.rows[0].id;
      console.log(`✅ Found KJV translation: ID ${translationId}`);
    }
    
    // Clear existing KJV verses
    await client.query('DELETE FROM bible_verses WHERE translation_id = $1', [translationId]);
    console.log('🗑️ Cleared existing KJV verses\n');
    
    let totalVerses = 0;
    let totalChapters = 0;
    
    for (const bookCode of BOOK_CODES) {
      const bookDir = path.join(KJV_PATH, bookCode);
      
      if (!fs.existsSync(bookDir)) {
        console.log(`⚠️ ${bookCode}: folder not found`);
        continue;
      }
      
      const files = fs.readdirSync(bookDir).filter(f => f.endsWith('.json')).sort((a,b) => parseInt(a) - parseInt(b));
      let bookVerses = 0;
      
      for (const file of files) {
        const filePath = path.join(bookDir, file);
        let data;
        
        try {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
          continue;
        }
        
        if (!data.verses || data.verses.length === 0) continue;
        
        const chapter = data.chapter;
        
        // Get or create chapter
        let chapterResult = await client.query(
          'SELECT id FROM bible_chapters WHERE book_iso = $1 AND chapter_number = $2',
          [bookCode, chapter]
        );
        
        let chapterId;
        if (chapterResult.rows.length === 0) {
          const ins = await client.query(
            'INSERT INTO bible_chapters (book_iso, chapter_number) VALUES ($1, $2) RETURNING id',
            [bookCode, chapter]
          );
          chapterId = ins.rows[0].id;
        } else {
          chapterId = chapterResult.rows[0].id;
        }
        
        // Insert verses
        for (const verse of data.verses) {
          await client.query(`
            INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en, translation_id)
            VALUES ($1, $2, $3, $4, $5)
          `, [chapterId, verse.verse, verse.text, verse.text, translationId]);
          bookVerses++;
        }
        
        totalChapters++;
      }
      
      totalVerses += bookVerses;
      console.log(`📚 ${bookCode}: ${files.length} chapters, ${bookVerses} verses`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Import Complete!');
    console.log(`   📚 Chapters: ${totalChapters}`);
    console.log(`   📖 Verses: ${totalVerses}`);
    
    // Verify
    const verify = await client.query('SELECT COUNT(*) as cnt FROM bible_verses WHERE translation_id = $1', [translationId]);
    console.log(`\n🔍 Verification: ${verify.rows[0].cnt} verses in database`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

importKJV().catch(console.error);
