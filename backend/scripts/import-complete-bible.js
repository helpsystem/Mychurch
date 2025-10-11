/**
 * Import Complete Bible Database
 * This script imports the complete Bible (Old & New Testament) from SQL file
 * Into PostgreSQL database with proper structure
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

async function importBibleFromSQL() {
  console.log('🔄 Starting Bible import...\n');

  try {
    // 1. Drop existing tables
    console.log('📋 Step 1: Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS bible_verses CASCADE;
      DROP TABLE IF EXISTS bible_chapters CASCADE;
      DROP TABLE IF EXISTS bible_books CASCADE;
    `);
    console.log('✅ Tables dropped\n');

    // 2. Create new tables with proper structure
    console.log('📋 Step 2: Creating new tables...');
    await pool.query(`
      -- Books table
      CREATE TABLE bible_books (
        id SERIAL PRIMARY KEY,
        code VARCHAR(2) NOT NULL UNIQUE,
        name_fa TEXT NOT NULL,
        name_en TEXT NOT NULL,
        testament VARCHAR(2) NOT NULL CHECK (testament IN ('OT', 'NT')),
        chapters_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Chapters table
      CREATE TABLE bible_chapters (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
        chapter_number INTEGER NOT NULL,
        audio_local TEXT,
        audio_online_fa TEXT,
        audio_online_en TEXT,
        verses_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, chapter_number)
      );

      -- Verses table
      CREATE TABLE bible_verses (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER NOT NULL REFERENCES bible_chapters(id) ON DELETE CASCADE,
        verse_number INTEGER NOT NULL,
        text_fa TEXT,
        text_en TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chapter_id, verse_number)
      );

      -- Indexes for performance
      CREATE INDEX idx_chapters_book ON bible_chapters(book_id);
      CREATE INDEX idx_verses_chapter ON bible_verses(chapter_id);
      CREATE INDEX idx_books_testament ON bible_books(testament);
    `);
    console.log('✅ Tables created\n');

    // 3. Read and parse SQL file
    console.log('📋 Step 3: Reading SQL file...');
    const sqlFilePath = path.join(__dirname, '../../attached_assets/bible_fa_en_1758111193552.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded\n');

    // 4. Parse INSERT statements
    console.log('📋 Step 4: Parsing INSERT statements...');
    
    const booksData = [];
    const chaptersData = [];
    const versesData = [];

    // Extract books
    const bookRegex = /INSERT INTO books VALUES \((\d+),'([^']+)','([^']+)','([^']+)','([^']+)'\);/g;
    let match;
    while ((match = bookRegex.exec(sqlContent)) !== null) {
      booksData.push({
        id: parseInt(match[1]),
        code: match[2],
        name_fa: decodeUTF8(match[3]),
        name_en: match[4],
        testament: match[5]
      });
    }
    console.log(`   Found ${booksData.length} books`);

    // Extract chapters
    const chapterRegex = /INSERT INTO chapters VALUES \((\d+),(\d+),(\d+),([^,]*),([^,]*),([^)]*)\);/g;
    while ((match = chapterRegex.exec(sqlContent)) !== null) {
      chaptersData.push({
        id: parseInt(match[1]),
        book_id: parseInt(match[2]),
        chapter_number: parseInt(match[3]),
        audio_local: match[4] === 'NULL' ? null : match[4],
        audio_online_fa: match[5] === 'NULL' ? null : match[5],
        audio_online_en: match[6] === 'NULL' ? null : match[6]
      });
    }
    console.log(`   Found ${chaptersData.length} chapters`);

    // Extract verses (more complex due to text content)
    const verseRegex = /INSERT INTO verses VALUES \((\d+),(\d+),(\d+),'([^']*?)','([^']*?)'\);/gs;
    while ((match = verseRegex.exec(sqlContent)) !== null) {
      versesData.push({
        id: parseInt(match[1]),
        chapter_id: parseInt(match[2]),
        verse_number: parseInt(match[3]),
        text_fa: decodeUTF8(match[4]),
        text_en: match[5]
      });
    }
    console.log(`   Found ${versesData.length} verses\n`);

    // 5. Insert data in batches
    console.log('📋 Step 5: Inserting data...\n');

    // Insert books
    console.log('   Inserting books...');
    for (const book of booksData) {
      await pool.query(`
        INSERT INTO bible_books (id, code, name_fa, name_en, testament)
        VALUES ($1, $2, $3, $4, $5)
      `, [book.id, book.code, book.name_fa, book.name_en, book.testament]);
    }
    console.log(`   ✅ ${booksData.length} books inserted`);

    // Insert chapters
    console.log('   Inserting chapters...');
    for (const chapter of chaptersData) {
      await pool.query(`
        INSERT INTO bible_chapters (id, book_id, chapter_number, audio_local, audio_online_fa, audio_online_en)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [chapter.id, chapter.book_id, chapter.chapter_number, chapter.audio_local, chapter.audio_online_fa, chapter.audio_online_en]);
    }
    console.log(`   ✅ ${chaptersData.length} chapters inserted`);

    // Insert verses in batches of 1000
    console.log('   Inserting verses (this may take a while)...');
    const batchSize = 1000;
    for (let i = 0; i < versesData.length; i += batchSize) {
      const batch = versesData.slice(i, i + batchSize);
      const values = batch.map((v, idx) => {
        const base = i + idx;
        return `($${base * 4 + 1}, $${base * 4 + 2}, $${base * 4 + 3}, $${base * 4 + 4})`;
      }).join(',');
      
      const params = batch.flatMap(v => [v.chapter_id, v.verse_number, v.text_fa, v.text_en]);
      
      await pool.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en)
        VALUES ${values}
      `, params);
      
      console.log(`   Progress: ${Math.min(i + batchSize, versesData.length)}/${versesData.length} verses`);
    }
    console.log(`   ✅ ${versesData.length} verses inserted\n`);

    // 6. Update counts
    console.log('📋 Step 6: Updating counts...');
    await pool.query(`
      UPDATE bible_books b
      SET chapters_count = (
        SELECT COUNT(*) FROM bible_chapters c WHERE c.book_id = b.id
      );

      UPDATE bible_chapters c
      SET verses_count = (
        SELECT COUNT(*) FROM bible_verses v WHERE v.chapter_id = c.id
      );
    `);
    console.log('✅ Counts updated\n');

    // 7. Verify import
    console.log('📋 Step 7: Verifying import...');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_books WHERE testament = 'OT') as ot_books,
        (SELECT COUNT(*) FROM bible_books WHERE testament = 'NT') as nt_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses
    `);
    
    console.log('\n📊 Import Statistics:');
    console.log(`   Total Books: ${stats.rows[0].total_books}`);
    console.log(`   Old Testament: ${stats.rows[0].ot_books} books`);
    console.log(`   New Testament: ${stats.rows[0].nt_books} books`);
    console.log(`   Total Chapters: ${stats.rows[0].total_chapters}`);
    console.log(`   Total Verses: ${stats.rows[0].total_verses}\n`);

    // Sample data
    const sample = await pool.query(`
      SELECT 
        b.name_fa as book_fa,
        b.name_en as book_en,
        c.chapter_number,
        v.verse_number,
        SUBSTRING(v.text_fa, 1, 50) as text_fa_preview,
        SUBSTRING(v.text_en, 1, 50) as text_en_preview
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE b.code = '01' AND c.chapter_number = 1
      LIMIT 3
    `);

    console.log('📖 Sample verses (Genesis 1:1-3):');
    sample.rows.forEach(row => {
      console.log(`\n   ${row.book_fa} ${row.chapter_number}:${row.verse_number}`);
      console.log(`   FA: ${row.text_fa_preview}...`);
      console.log(`   EN: ${row.text_en_preview}...`);
    });

    console.log('\n✅ Bible import completed successfully! 🎉\n');

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Helper function to decode UTF-8 encoded strings
function decodeUTF8(str) {
  try {
    // The SQL file has URL-encoded UTF-8 strings
    return decodeURIComponent(escape(str));
  } catch (e) {
    // If decoding fails, return as is
    return str;
  }
}

// Run import
if (require.main === module) {
  importBibleFromSQL()
    .then(() => {
      console.log('Import script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import script failed:', error);
      process.exit(1);
    });
}

module.exports = { importBibleFromSQL };
