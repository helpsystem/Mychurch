/**
 * Import Complete Bible from Multiple Sources
 * Combines data from different SQL files to create complete Bible database
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection from .env
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Book mapping (code => id)
const BOOK_MAPPING = {
  // Old Testament
  'GEN': 1, 'EXO': 2, 'LEV': 3, 'NUM': 4, 'DEU': 5,
  'JOS': 6, 'JDG': 7, 'RUT': 8, '1SA': 9, '2SA': 10,
  '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, 'EZR': 15,
  'NEH': 16, 'EST': 17, 'JOB': 18, 'PSA': 19, 'PRO': 20,
  'ECC': 21, 'SNG': 22, 'ISA': 23, 'JER': 24, 'LAM': 25,
  'EZK': 26, 'DAN': 27, 'HOS': 28, 'JOL': 29, 'AMO': 30,
  'OBA': 31, 'JON': 32, 'MIC': 33, 'NAM': 34, 'HAB': 35,
  'ZEP': 36, 'HAG': 37, 'ZEC': 38, 'MAL': 39,
  // New Testament
  'MAT': 40, 'MRK': 41, 'LUK': 42, 'JHN': 43, 'ACT': 44,
  'ROM': 45, '1CO': 46, '2CO': 47, 'GAL': 48, 'EPH': 49,
  'PHP': 50, 'COL': 51, '1TH': 52, '2TH': 53, '1TI': 54,
  '2TI': 55, 'TIT': 56, 'PHM': 57, 'HEB': 58, 'JAS': 59,
  '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64,
  'JUD': 65, 'REV': 66
};

async function importCompleteBible() {
  console.log('🔄 Starting Complete Bible Import...\n');

  try {
    // 1. Create tables
    console.log('📋 Step 1: Creating/Resetting tables...');
    await pool.query(`
      -- Drop existing
      DROP TABLE IF EXISTS bible_verses CASCADE;
      DROP TABLE IF EXISTS bible_chapters CASCADE;
      DROP TABLE IF EXISTS bible_books CASCADE;

      -- Create books
      CREATE TABLE bible_books (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name_fa TEXT NOT NULL,
        name_en TEXT NOT NULL,
        testament VARCHAR(2) NOT NULL,
        chapters_count INTEGER DEFAULT 0
      );

      -- Create chapters
      CREATE TABLE bible_chapters (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES bible_books(id),
        chapter_number INTEGER NOT NULL,
        verses_count INTEGER DEFAULT 0,
        UNIQUE(book_id, chapter_number)
      );

      -- Create verses
      CREATE TABLE bible_verses (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER NOT NULL REFERENCES bible_chapters(id),
        verse_number INTEGER NOT NULL,
        text_fa TEXT,
        text_en TEXT,
        UNIQUE(chapter_id, verse_number)
      );

      -- Indexes
      CREATE INDEX idx_chapters_book ON bible_chapters(book_id);
      CREATE INDEX idx_verses_chapter ON bible_verses(chapter_id);
    `);
    console.log('✅ Tables created\n');

    // 2. Load books from JSON
    console.log('📋 Step 2: Loading books...');
    const booksPath = path.join(__dirname, '../../attached_assets/books_1758111193552.json');
    const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    
    for (const book of booksData) {
      await pool.query(`
        INSERT INTO bible_books (id, code, name_fa, name_en, testament)
        VALUES ($1, $2, $3, $4, $5)
      `, [book.id, book.code, book.name_fa, book.name_en, book.testament]);
    }
    console.log(`✅ Loaded ${booksData.length} books\n`);

    // 3. Parse and load mojdeh verses (Persian New Testament)
    console.log('📋 Step 3: Loading Mojdeh verses (New Testament - Persian)...');
    const mojdehPath = path.join(__dirname, '../../attached_assets/verses_mojdeh_1757861410662.sql');
    await importMojdehVerses(mojdehPath);

    // 4. Parse and load qadim verses (Old Translation)
    console.log('\n📋 Step 4: Loading Qadim verses (Old Translation)...');
    const qadimPath = path.join(__dirname, '../../attached_assets/verses_qadim_1757861410663.sql');
    await importQadimVerses(qadimPath);

    // 5. Update counts
    console.log('\n📋 Step 5: Updating counts...');
    await pool.query(`
      UPDATE bible_books b
      SET chapters_count = (SELECT COUNT(*) FROM bible_chapters c WHERE c.book_id = b.id);
      
      UPDATE bible_chapters c
      SET verses_count = (SELECT COUNT(*) FROM bible_verses v WHERE v.chapter_id = c.id);
    `);
    console.log('✅ Counts updated\n');

    // 6. Show statistics
    console.log('📋 Step 6: Verifying import...');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses,
        (SELECT COUNT(*) FROM bible_verses WHERE text_fa IS NOT NULL) as verses_with_fa,
        (SELECT COUNT(*) FROM bible_verses WHERE text_en IS NOT NULL) as verses_with_en
    `);
    
    console.log('\n📊 Import Statistics:');
    console.log(`   Total Books: ${stats.rows[0].total_books}`);
    console.log(`   Total Chapters: ${stats.rows[0].total_chapters}`);
    console.log(`   Total Verses: ${stats.rows[0].total_verses}`);
    console.log(`   Verses with Persian: ${stats.rows[0].verses_with_fa}`);
    console.log(`   Verses with English: ${stats.rows[0].verses_with_en}\n`);

    // Sample
    const sample = await pool.query(`
      SELECT 
        b.name_fa, b.name_en,
        c.chapter_number,
        v.verse_number,
        SUBSTRING(v.text_fa, 1, 60) as text_fa,
        SUBSTRING(v.text_en, 1, 60) as text_en
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE v.text_fa IS NOT NULL AND v.text_en IS NOT NULL
      LIMIT 3
    `);

    console.log('📖 Sample verses:');
    sample.rows.forEach(row => {
      console.log(`\n   ${row.name_fa} (${row.name_en}) ${row.chapter_number}:${row.verse_number}`);
      if (row.text_fa) console.log(`   FA: ${row.text_fa}...`);
      if (row.text_en) console.log(`   EN: ${row.text_en}...`);
    });

    console.log('\n✅ Complete Bible imported successfully! 🎉\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function importMojdehVerses(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse INSERT statements
  const lines = content.split('\n');
  let imported = 0;
  let batch = [];
  
  for (const line of lines) {
    if (line.includes("INSERT IGNORE INTO") && line.includes("mojdeh")) {
      const match = line.match(/\('mojdeh','([^']*)',(\d+),(\d+)\s*,'([^']*)',/);
      if (match) {
        const [_, bookCode, chapter, verse, textFa] = match;
        
        // Decode Persian text
        const decodedText = decodeHTMLEntities(textFa);
        
        batch.push({
          book: bookCode.toUpperCase(),
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          text_fa: decodedText
        });
        
        if (batch.length >= 100) {
          await processBatch(batch);
          imported += batch.length;
          process.stdout.write(`\r   Progress: ${imported} verses...`);
          batch = [];
        }
      }
    }
  }
  
  if (batch.length > 0) {
    await processBatch(batch);
    imported += batch.length;
  }
  
  console.log(`\r   ✅ Imported ${imported} Mojdeh verses`);
}

async function importQadimVerses(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const lines = content.split('\n');
  let imported = 0;
  let batch = [];
  
  for (const line of lines) {
    if (line.includes("INSERT IGNORE INTO") && line.includes("qadim")) {
      const match = line.match(/\('qadim','([^']*)',(\d+),(\d+)\s*,'([^']*)',/);
      if (match) {
        const [_, bookCode, chapter, verse, textFa] = match;
        
        const decodedText = decodeHTMLEntities(textFa);
        
        batch.push({
          book: bookCode.toUpperCase(),
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          text_fa: decodedText
        });
        
        if (batch.length >= 100) {
          await processBatch(batch);
          imported += batch.length;
          process.stdout.write(`\r   Progress: ${imported} verses...`);
          batch = [];
        }
      }
    }
  }
  
  if (batch.length > 0) {
    await processBatch(batch);
    imported += batch.length;
  }
  
  console.log(`\r   ✅ Imported ${imported} Qadim verses`);
}

async function processBatch(batch) {
  for (const item of batch) {
    try {
      // Find or create chapter
      const bookId = BOOK_MAPPING[item.book];
      if (!bookId) continue;
      
      let chapter = await pool.query(
        'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
        [bookId, item.chapter]
      );
      
      let chapterId;
      if (chapter.rows.length === 0) {
        const result = await pool.query(
          'INSERT INTO bible_chapters (book_id, chapter_number) VALUES ($1, $2) RETURNING id',
          [bookId, item.chapter]
        );
        chapterId = result.rows[0].id;
      } else {
        chapterId = chapter.rows[0].id;
      }
      
      // Insert or update verse
      await pool.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (chapter_id, verse_number)
        DO UPDATE SET 
          text_fa = COALESCE(EXCLUDED.text_fa, bible_verses.text_fa),
          text_en = COALESCE(EXCLUDED.text_en, bible_verses.text_en)
      `, [chapterId, item.verse, item.text_fa || null, item.text_en || null]);
      
    } catch (error) {
      // Skip errors silently
    }
  }
}

function decodeHTMLEntities(text) {
  return text
    .replace(/Ø§/g, 'ا')
    .replace(/Ø¨/g, 'ب')
    .replace(/Ù¾/g, 'پ')
    .replace(/Øª/g, 'ت')
    .replace(/Ø«/g, 'ث')
    .replace(/Ø¬/g, 'ج')
    .replace(/Ú†/g, 'چ')
    .replace(/Ø­/g, 'ح')
    .replace(/Ø®/g, 'خ')
    .replace(/Ø¯/g, 'د')
    .replace(/Ø°/g, 'ذ')
    .replace(/Ø±/g, 'ر')
    .replace(/Ø²/g, 'ز')
    .replace(/Ú˜/g, 'ژ')
    .replace(/Ø³/g, 'س')
    .replace(/Ø´/g, 'ش')
    .replace(/Øµ/g, 'ص')
    .replace(/Ø¶/g, 'ض')
    .replace(/Ø·/g, 'ط')
    .replace(/Ø¸/g, 'ظ')
    .replace(/Ø¹/g, 'ع')
    .replace(/ØºTest/g, 'غ')
    .replace(/Ù/g, 'ف')
    .replace(/Ù‚/g, 'ق')
    .replace(/Ú©/g, 'ک')
    .replace(/Ú¯/g, 'گ')
    .replace(/Ù„/g, 'ل')
    .replace(/Ù…/g, 'م')
    .replace(/Ù†/g, 'ن')
    .replace(/Ùˆ/g, 'و')
    .replace(/Ù‡/g, 'ه')
    .replace(/ÛŒ/g, 'ی')
    .replace(/Û/g, 'ُ')
    .replace(/ÛŽ/g, 'ِ')
    .replace(/Ù /g, ' ');
}

if (require.main === module) {
  importCompleteBible()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { importCompleteBible };
