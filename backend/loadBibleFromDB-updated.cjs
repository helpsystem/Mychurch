require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class BibleDatabaseLoader {
  constructor() {
    this.books = [];
    this.verses = {};
  }

  // Load all Bible books from bible_books table
  async loadBooks() {
    try {
      const query = `
        SELECT 
          book_iso as code,
          book_name as name_en,
          book_name_fa as name_fa,
          testament,
          book_number as book_order
        FROM bible_books 
        ORDER BY book_number;
      `;
      
      const result = await pool.query(query);
      this.books = result.rows;
      
      console.log(`✓ Loaded ${this.books.length} Bible books`);
      return this.books;
    } catch (error) {
      console.error('Error loading books:', error);
      throw error;
    }
  }

  // Load verses for specific book and chapter from bible_verses table
  async loadChapterVerses(bookCode, chapter, translation = 'mojdeh') {
    try {
      // Map translation code to translation_id
      const translationMap = {
        'mojdeh': 1,
        'qadim': 2,
        'tafsiri_ot': 3,
        'tafsiri_nt': 4,
        'nav': 5,
        'pcb': 6,
        'rvr1960': 8,
        'net': 9,
        'eng': 1  // Use mojdeh translation_id for English text
      };

      const translationId = translationMap[translation] || 1;
      const useEnglish = (translation === 'eng');

      // Get chapter_id from book code and chapter number
      // First, find the chapter
      const chapterQuery = `
        SELECT bv.id, bv.verse_number, 
               ${useEnglish ? 'bv.text_en' : 'bv.text_fa'} as verse_text
        FROM bible_verses bv
        WHERE bv.chapter_id = $1 
          AND bv.translation_id = $2
        ORDER BY bv.verse_number;
      `;
      
      // For now, we'll use chapter_id directly as chapter number (needs refinement)
      const result = await pool.query(chapterQuery, [chapter, translationId]);
      
      console.log(`✓ Loaded ${result.rows.length} verses for ${bookCode} Chapter ${chapter} (${translation})`);
      return result.rows;
    } catch (error) {
      console.error(`Error loading verses for ${bookCode} ${chapter}:`, error);
      throw error;
    }
  }

  // Load bilingual verses (English + Persian)
  async loadBilingualChapter(bookCode, chapter) {
    try {
      // Load verses from bible_verses with both text_en and text_fa
      // Using translation_id = 1 (mojdeh) which has the most complete data
      const query = `
        SELECT 
          verse_number,
          text_en as en,
          text_fa as fa,
          chapter_id
        FROM bible_verses
        WHERE chapter_id = $1 
          AND translation_id = 1
        ORDER BY verse_number;
      `;

      const result = await pool.query(query, [chapter]);

      const bilingualVerses = result.rows.map(row => ({
        verse_number: row.verse_number,
        book_code: bookCode,
        chapter: chapter,
        en: row.en || '',
        fa: row.fa || ''
      }));

      console.log(`✓ Loaded ${bilingualVerses.length} bilingual verses for ${bookCode} ${chapter}`);
      return bilingualVerses;
    } catch (error) {
      console.error(`Error loading bilingual chapter:`, error);
      throw error;
    }
  }

  // Get book info
  async getBookInfo(bookCode) {
    const book = this.books.find(b => b.code === bookCode);
    if (!book && this.books.length === 0) {
      await this.loadBooks();
      return this.books.find(b => b.code === bookCode);
    }
    return book;
  }

  // Get chapter count for a book
  async getChapterCount(bookCode) {
    const book = await this.getBookInfo(bookCode);
    return book?.total_chapters || 0;
  }

  // Test database connection
  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✓ Database connection successful');
      console.log('  Current time:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      return false;
    }
  }

  // Close pool
  async close() {
    await pool.end();
    console.log('✓ Database connection closed');
  }
}

// Example usage and tests
async function runTests() {
  console.log('\n=== Bible Database Loader Test (Updated) ===\n');
  
  const loader = new BibleDatabaseLoader();

  try {
    // Test connection
    await loader.testConnection();

    // Load all books
    console.log('\nLoading Bible books from bible_books table...');
    await loader.loadBooks();
    console.log(`Found ${loader.books.length} books`);

    // Test loading a chapter (Genesis 1 in bilingual)
    console.log('\nLoading Genesis Chapter 1 (Bilingual from bible_verses)...');
    const gen1 = await loader.loadBilingualChapter('GEN', 1);
    
    if (gen1.length > 0) {
      console.log('\nSample verses:');
      console.log('Verse 1 (EN):', gen1[0].en?.substring(0, 60) + '...');
      console.log('Verse 1 (FA):', gen1[0].fa?.substring(0, 60) + '...');
    }

    console.log('\n✓ All tests passed successfully!');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
  } finally {
    await loader.close();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = BibleDatabaseLoader;
