/**
 * Import Bible from API.Bible Service
 * This script imports Bible verses gradually from API.Bible
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Pool } = require('pg');
const { importBook, importChapterToDatabase } = require('../services/apiBibleService');

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Import specific books
 */
async function importSpecificBooks(bookCodes) {
  console.log('🔄 Starting Bible Import from API.Bible...\n');
  console.log(`📋 Books to import: ${bookCodes.join(', ')}\n`);

  try {
    let totalVerses = 0;
    
    for (const bookCode of bookCodes) {
      const verses = await importBook(pool, bookCode);
      totalVerses += verses;
    }

    // Show statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses,
        (SELECT COUNT(*) FROM bible_verses WHERE text_fa IS NOT NULL) as verses_with_fa,
        (SELECT COUNT(*) FROM bible_verses WHERE text_en IS NOT NULL) as verses_with_en
    `);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Total Books: ${stats.rows[0].total_books}`);
    console.log(`   Total Chapters: ${stats.rows[0].total_chapters}`);
    console.log(`   Total Verses: ${stats.rows[0].total_verses}`);
    console.log(`   Verses with Persian: ${stats.rows[0].verses_with_fa}`);
    console.log(`   Verses with English: ${stats.rows[0].verses_with_en}`);
    console.log(`   Verses imported this session: ${totalVerses}\n`);

    console.log('✅ Import completed successfully! 🎉\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Import New Testament (27 books)
 */
async function importNewTestament() {
  const ntBooks = [
    'MAT', 'MRK', 'LUK', 'JHN', 'ACT',
    'ROM', '1CO', '2CO', 'GAL', 'EPH',
    'PHP', 'COL', '1TH', '2TH', '1TI',
    '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
    '1PE', '2PE', '1JN', '2JN', '3JN',
    'JUD', 'REV'
  ];
  
  await importSpecificBooks(ntBooks);
}

/**
 * Import Old Testament (39 books)
 */
async function importOldTestament() {
  const otBooks = [
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU',
    'JOS', 'JDG', 'RUT', '1SA', '2SA',
    '1KI', '2KI', '1CH', '2CH', 'EZR',
    'NEH', 'EST', 'JOB', 'PSA', 'PRO',
    'ECC', 'SNG', 'ISA', 'JER', 'LAM',
    'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
    'OBA', 'JON', 'MIC', 'NAM', 'HAB',
    'ZEP', 'HAG', 'ZEC', 'MAL'
  ];
  
  await importSpecificBooks(otBooks);
}

/**
 * Import essential books (most read books)
 */
async function importEssentialBooks() {
  const essentialBooks = [
    // Gospels
    'MAT', 'MRK', 'LUK', 'JHN',
    // Genesis & Exodus
    'GEN', 'EXO',
    // Psalms & Proverbs
    'PSA', 'PRO',
    // Romans & Acts
    'ROM', 'ACT',
    // Revelation
    'REV'
  ];
  
  await importSpecificBooks(essentialBooks);
}

/**
 * Import a single chapter (for testing)
 */
async function importSingleChapter(bookCode, chapterNumber) {
  console.log(`🔄 Importing ${bookCode} chapter ${chapterNumber}...\n`);

  try {
    // Get book ID
    const bookResult = await pool.query(
      'SELECT id FROM bible_books WHERE code = $1',
      [bookCode]
    );
    
    if (bookResult.rows.length === 0) {
      throw new Error(`Book not found: ${bookCode}`);
    }
    
    const bookId = bookResult.rows[0].id;
    
    // Import chapter
    await importChapterToDatabase(pool, bookId, chapterNumber);
    
    console.log('\n✅ Chapter imported successfully!\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  (async () => {
    try {
      if (!process.env.BIBLE_API_KEY) {
        console.error('❌ Error: BIBLE_API_KEY not found in .env file');
        console.log('Please add: BIBLE_API_KEY=your_api_key_here\n');
        process.exit(1);
      }

      switch (command) {
        case 'nt':
        case 'new-testament':
          await importNewTestament();
          break;
          
        case 'ot':
        case 'old-testament':
          await importOldTestament();
          break;
          
        case 'essential':
          await importEssentialBooks();
          break;
          
        case 'chapter':
          const bookCode = args[1];
          const chapterNum = parseInt(args[2]);
          if (!bookCode || !chapterNum) {
            console.error('Usage: node import-from-api.js chapter <BOOK_CODE> <CHAPTER_NUMBER>');
            console.error('Example: node import-from-api.js chapter GEN 1');
            process.exit(1);
          }
          await importSingleChapter(bookCode, chapterNum);
          break;
          
        case 'books':
          const bookCodes = args.slice(1);
          if (bookCodes.length === 0) {
            console.error('Usage: node import-from-api.js books <BOOK1> <BOOK2> ...');
            console.error('Example: node import-from-api.js books GEN EXO MAT');
            process.exit(1);
          }
          await importSpecificBooks(bookCodes);
          break;
          
        default:
          console.log('📖 Bible Import Tool - API.Bible\n');
          console.log('Usage:');
          console.log('  node import-from-api.js nt                    - Import New Testament (27 books)');
          console.log('  node import-from-api.js ot                    - Import Old Testament (39 books)');
          console.log('  node import-from-api.js essential             - Import essential books (11 books)');
          console.log('  node import-from-api.js chapter GEN 1         - Import single chapter');
          console.log('  node import-from-api.js books GEN EXO MAT     - Import specific books\n');
          console.log('📝 Note: API.Bible has rate limits. Import will be slow but steady.\n');
          process.exit(0);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  importNewTestament,
  importOldTestament,
  importEssentialBooks,
  importSingleChapter,
  importSpecificBooks
};
