/**
 * Import NET English Bible verses from JSON files to PostgreSQL
 * آیات انگلیسی NET را از فایل‌های JSON به دیتابیس وارد می‌کند
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'mychurch_user',
  password: 'MyChurch2024Secure!',
  database: 'mychurch'
});

// Book code mapping (USFM to database)
const BOOK_CODES = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

const NET_DATA_PATH = '/root/Mychurch/bible_data/text/NET';

async function importNETBible() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting NET English Bible import...\n');
    
    // Check if NET translation exists, if not create it
    const transCheck = await client.query(
      "SELECT id FROM bible_translations WHERE code = 'net'"
    );
    
    let translationId;
    if (transCheck.rows.length === 0) {
      // Insert NET translation
      const insertTrans = await client.query(`
        INSERT INTO bible_translations (code, name_en, name_fa, description_en, description_fa, language, is_active, is_default, sort_order)
        VALUES ('net', 'New English Translation', 'ترجمه جدید انگلیسی', 'NET Bible', 'کتاب مقدس NET', 'en', true, false, 50)
        RETURNING id
      `);
      translationId = insertTrans.rows[0].id;
      console.log(`✅ Created NET translation with ID: ${translationId}`);
    } else {
      translationId = transCheck.rows[0].id;
      console.log(`✅ Found existing NET translation with ID: ${translationId}`);
    }
    
    // Clear existing NET verses
    const deleteResult = await client.query(
      'DELETE FROM bible_verses WHERE translation_id = $1',
      [translationId]
    );
    console.log(`🗑️ Deleted ${deleteResult.rowCount} existing NET verses`);
    
    let totalVerses = 0;
    let bookCount = 0;
    
    // Process each book
    for (const bookCode of BOOK_CODES) {
      const bookPath = path.join(NET_DATA_PATH, bookCode);
      
      if (!fs.existsSync(bookPath)) {
        console.log(`⚠️ Skipping ${bookCode} - folder not found`);
        continue;
      }
      
      // Get chapter files
      const chapterFiles = fs.readdirSync(bookPath)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => parseInt(a) - parseInt(b));
      
      let bookVerses = 0;
      
      for (const chapterFile of chapterFiles) {
        const chapterPath = path.join(bookPath, chapterFile);
        const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
        
        // Get chapter_id from bible_chapters table using book_iso
        const chapterResult = await client.query(`
          SELECT id FROM bible_chapters 
          WHERE book_iso = $1 AND chapter_number = $2
        `, [bookCode, chapterData.chapter]);
        
        let chapterId;
        if (chapterResult.rows.length === 0) {
          // Insert chapter
          const insertChapter = await client.query(`
            INSERT INTO bible_chapters (book_iso, chapter_number)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING id
          `, [bookCode, chapterData.chapter]);
          
          if (insertChapter.rows.length > 0) {
            chapterId = insertChapter.rows[0].id;
          } else {
            // Fetch again in case of race condition
            const retry = await client.query(
              'SELECT id FROM bible_chapters WHERE book_iso = $1 AND chapter_number = $2',
              [bookCode, chapterData.chapter]
            );
            chapterId = retry.rows[0]?.id;
          }
        } else {
          chapterId = chapterResult.rows[0].id;
        }
        
        if (!chapterId) {
          console.log(`⚠️ Could not get chapter_id for ${bookCode} ${chapterData.chapter}`);
          continue;
        }
        
        // Insert verses
        for (const verse of chapterData.verses) {
          await client.query(`
            INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en, translation_id)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            chapterId,
            verse.verse,
            verse.text, // Store English in text_fa for this translation
            verse.text, // Also in text_en
            translationId
          ]);
          bookVerses++;
          totalVerses++;
        }
      }
      
      bookCount++;
      console.log(`📚 ${bookCode}: ${chapterFiles.length} chapters, ${bookVerses} verses`);
    }
    
    console.log('\n✅ Import completed!');
    console.log(`📊 Statistics:`);
    console.log(`   📚 Books: ${bookCount}`);
    console.log(`   📖 Total verses: ${totalVerses}`);
    
    // Verify
    const verifyResult = await client.query(
      'SELECT COUNT(*) as cnt FROM bible_verses WHERE translation_id = $1',
      [translationId]
    );
    console.log(`\n🔍 Verification: ${verifyResult.rows[0].cnt} verses in database`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
importNETBible().catch(console.error);
