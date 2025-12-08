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
      console.log(`[DEBUG] Loading ${bookCode} Chapter ${chapter}...`);

      // IMPROVED: Prioritize Mojdeh (ID 1) for Persian as it is standard Iranian Farsi
      // Translation 8 = English (NET)
      // Translation 1 = Persian (Mojdeh - Modern Iranian)
      // Translation 9 = English fallback
      // Translation 2 = Persian fallback (Qadim - Old Version)

      const query = `
        SELECT 
          COALESCE(en.verse_number, fa.verse_number, en2.verse_number, fa2.verse_number) as verse_number,
          COALESCE(en.text_en, en.text_fa, en2.text_en, en2.text_fa, fa.text_fa, fa2.text_fa, '') as en,
          COALESCE(fa.text_fa, fa.text_en, fa2.text_fa, fa2.text_en, '') as fa,
          COALESCE(en.chapter_id, fa.chapter_id, en2.chapter_id, fa2.chapter_id) as chapter_id
        FROM (
          SELECT bv.verse_number, bv.text_en, bv.text_fa, bv.chapter_id
          FROM bible_verses bv
          INNER JOIN bible_chapters bc ON bv.chapter_id = bc.id
          WHERE bc.book_iso = $1 AND bc.chapter_number = $2 AND bv.translation_id = 8
        ) en
        FULL OUTER JOIN (
          SELECT bv.verse_number, bv.text_fa, bv.text_en, bv.chapter_id
          FROM bible_verses bv
          INNER JOIN bible_chapters bc ON bv.chapter_id = bc.id
          WHERE bc.book_iso = $1 AND bc.chapter_number = $2 AND bv.translation_id = 1
        ) fa ON en.verse_number = fa.verse_number
        FULL OUTER JOIN (
          SELECT bv.verse_number, bv.text_en, bv.text_fa, bv.chapter_id
          FROM bible_verses bv
          INNER JOIN bible_chapters bc ON bv.chapter_id = bc.id
          WHERE bc.book_iso = $1 AND bc.chapter_number = $2 AND bv.translation_id = 9
        ) en2 ON COALESCE(en.verse_number, fa.verse_number) = en2.verse_number
        FULL OUTER JOIN (
          SELECT bv.verse_number, bv.text_fa, bv.text_en, bv.chapter_id
          FROM bible_verses bv
          INNER JOIN bible_chapters bc ON bv.chapter_id = bc.id
          WHERE bc.book_iso = $1 AND bc.chapter_number = $2 AND bv.translation_id = 2
        ) fa2 ON COALESCE(en.verse_number, fa.verse_number, en2.verse_number) = fa2.verse_number
        ORDER BY COALESCE(en.verse_number, fa.verse_number, en2.verse_number, fa2.verse_number);
      `;

      const result = await pool.query(query, [bookCode, chapter]);
      console.log(`[DEBUG] Query returned ${result.rows.length} rows`);

      const bilingualVerses = result.rows.map(row => ({
        verse_number: row.verse_number,
        book_code: bookCode,
        chapter: chapter,
        en: row.en || '',
        fa: row.fa || ''
      }));

      console.log(`✓ Loaded ${bilingualVerses.length} bilingual verses for ${bookCode} ${chapter} (EN: trans 8/9, FA: trans 1/2 fallback)`);
      return bilingualVerses;
    } catch (error) {
      console.error(`Error loading bilingual chapter ${bookCode} ${chapter}:`, error);
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

    // NEW: Test John 3
    console.log('\nLoading John Chapter 3 (Bilingual)...');
    const john3 = await loader.loadBilingualChapter('JHN', 3);
    console.log(`Found ${john3.length} verses (expected: 36)`);

    if (john3.length > 0) {
      console.log('John 3:2 (EN):', john3[0]?.en?.substring(0, 80) || 'EMPTY');
      console.log('John 3:2 (FA):', john3[0]?.fa?.substring(0, 80) || 'EMPTY');

      // Try to find verse 16
      const v16 = john3.find(v => v.verse_number === 16);
      if (v16) {
        console.log('\nJohn 3:16 (EN):', v16.en?.substring(0, 80) || 'EMPTY');
        console.log('John 3:16 (FA):', v16.fa?.substring(0, 80) || 'EMPTY');
      } else {
        console.log('\n❌ Verse 16 not found! Available verses:', john3.map(v => v.verse_number).join(', '));
      }
    } else {
      console.log('❌ John 3 verses NOT FOUND!');
    }

    console.log('\n✓ All tests completed!');
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
