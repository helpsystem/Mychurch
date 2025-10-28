const { Pool } = require('pg');

/**
 * Load Bible data from Supabase PostgreSQL database
 * This script populates the BibleFlipbook component with data from your existing database
 */

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

  // Load all Bible books
  async loadBooks() {
    try {
      const query = `
        SELECT 
          code, 
          name_en, 
          name_fa, 
          testament,
          total_chapters,
          book_order
        FROM bible_books 
        ORDER BY book_order;
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

  // Load verses for specific book and chapter
  async loadChapterVerses(bookCode, chapter, translation = 'qadim') {
    try {
      const tableName = `verses_${translation}`;
      const query = `
        SELECT 
          id,
          book_code,
          chapter,
          verse_number,
          verse_text
        FROM ${tableName}
        WHERE book_code = $1 AND chapter = $2
        ORDER BY verse_number;
      `;
      
      const result = await pool.query(query, [bookCode, chapter]);
      
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
      const [englishVerses, persianVerses] = await Promise.all([
        this.loadChapterVerses(bookCode, chapter, 'eng'),
        this.loadChapterVerses(bookCode, chapter, 'qadim')
      ]);

      // Combine verses by verse number
      const bilingualVerses = englishVerses.map((enVerse, index) => ({
        verse_number: enVerse.verse_number,
        book_code: bookCode,
        chapter: chapter,
        en: enVerse.verse_text,
        fa: persianVerses[index]?.verse_text || ''
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
  console.log('\n=== Bible Database Loader Test ===\n');
  
  const loader = new BibleDatabaseLoader();

  try {
    // Test connection
    await loader.testConnection();

    // Load all books
    console.log('\nLoading Bible books...');
    await loader.loadBooks();

    // Test loading a chapter (John 1 in English and Persian)
    console.log('\nLoading John Chapter 1 (Bilingual)...');
    const john1 = await loader.loadBilingualChapter('JHN', 1);
    
    console.log('\nSample verses:');
    console.log('Verse 1 (EN):', john1[0].en);
    console.log('Verse 1 (FA):', john1[0].fa);

    // Get book info
    console.log('\nBook information for John:');
    const johnInfo = await loader.getBookInfo('JHN');
    console.log(JSON.stringify(johnInfo, null, 2));

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
