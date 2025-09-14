import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Database connection with optimized settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  connectionTimeoutMillis: 10000,
});

// Standard Bible book order and mapping
const BIBLE_BOOKS = {
  1: { name_en: 'Genesis', name_fa: 'پیدایش', testament: 'OT' },
  2: { name_en: 'Exodus', name_fa: 'خروج', testament: 'OT' },
  3: { name_en: 'Leviticus', name_fa: 'لاویان', testament: 'OT' },
  4: { name_en: 'Numbers', name_fa: 'اعداد', testament: 'OT' },
  5: { name_en: 'Deuteronomy', name_fa: 'تثنیه', testament: 'OT' },
  6: { name_en: 'Joshua', name_fa: 'یوشع', testament: 'OT' },
  7: { name_en: 'Judges', name_fa: 'داوران', testament: 'OT' },
  8: { name_en: 'Ruth', name_fa: 'روت', testament: 'OT' },
  9: { name_en: '1 Samuel', name_fa: '1 سموئیل', testament: 'OT' },
  10: { name_en: '2 Samuel', name_fa: '2 سموئیل', testament: 'OT' },
  // Add more as needed...
  40: { name_en: 'Matthew', name_fa: 'متی', testament: 'NT' },
  41: { name_en: 'Mark', name_fa: 'مرقس', testament: 'NT' },
  42: { name_en: 'Luke', name_fa: 'لوقا', testament: 'NT' },
  43: { name_en: 'John', name_fa: 'یوحنا', testament: 'NT' },
};

// Function to clear existing data
async function clearExistingData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bible_verses');
    await client.query('DELETE FROM bible_chapters');  
    await client.query('DELETE FROM bible_books WHERE book_number > 66'); // Keep the base books
    await client.query('COMMIT');
    console.log('✅ Existing Bible data cleared');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Parse a simple verse format - extract book, chapter, verse from patterns
function parseVerseData(text, version) {
  const verses = [];
  
  // Split text by lines and process
  const lines = text.split('\n');
  let currentBook = 1; // Default to Genesis
  let currentChapter = 1;
  let currentVerse = 1;
  
  for (const line of lines) {
    // Match INSERT pattern with VALUES
    const valueMatch = line.match(/\('([^']+)','[^']*',(\d+),(\d+)\s*,\s*'([^']+)',.*?\)/);
    if (valueMatch) {
      const [, ver, chapter, verse, textFa] = valueMatch;
      
      // Skip non-verse content (headers, empty text, etc.)
      if (textFa && textFa.trim().length > 10 && 
          !textFa.includes('فصلهای') && 
          !textFa.includes('مقدّمه') &&
          !textFa.includes('تقسیمبندی')) {
        
        verses.push({
          version: ver,
          book: currentBook,
          chapter: parseInt(chapter) || currentChapter,
          verse_number: parseInt(verse) || currentVerse++,
          text_fa: textFa.trim()
        });
      }
    }
  }
  
  return verses;
}

// Batch insert verses efficiently
async function batchInsertVerses(verses, batchSize = 1000) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let processed = 0;
    
    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      
      // Group by book and chapter for efficient processing
      const groupedBatch = {};
      
      for (const verse of batch) {
        const bookKey = verse.book || 1;
        const chapterKey = verse.chapter || 1;
        
        if (!groupedBatch[bookKey]) {
          groupedBatch[bookKey] = {};
        }
        if (!groupedBatch[bookKey][chapterKey]) {
          groupedBatch[bookKey][chapterKey] = [];
        }
        
        groupedBatch[bookKey][chapterKey].push(verse);
      }
      
      // Process each book/chapter group
      for (const bookNum of Object.keys(groupedBatch)) {
        // Get or create book
        let bookResult = await client.query(
          'SELECT id FROM bible_books WHERE book_number = $1',
          [parseInt(bookNum)]
        );
        
        let bookId;
        if (bookResult.rows.length === 0) {
          const bookInfo = BIBLE_BOOKS[parseInt(bookNum)] || BIBLE_BOOKS[1];
          bookResult = await client.query(
            `INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count, created_at)
             VALUES ($1, $2, $3, $4, $5, 50, NOW()) RETURNING id`,
            [parseInt(bookNum), bookInfo.name_en, bookInfo.name_fa, bookInfo.name_en.substring(0, 4), bookInfo.testament]
          );
        }
        bookId = bookResult.rows[0].id;
        
        // Process chapters for this book
        for (const chapterNum of Object.keys(groupedBatch[bookNum])) {
          // Get or create chapter
          let chapterResult = await client.query(
            'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
            [bookId, parseInt(chapterNum)]
          );
          
          let chapterId;
          if (chapterResult.rows.length === 0) {
            chapterResult = await client.query(
              `INSERT INTO bible_chapters (book_id, chapter_number, verses_count, created_at)
               VALUES ($1, $2, 50, NOW()) RETURNING id`,
              [bookId, parseInt(chapterNum)]
            );
          }
          chapterId = chapterResult.rows[0].id;
          
          // Insert verses for this chapter
          const chapterVerses = groupedBatch[bookNum][chapterNum];
          for (const verse of chapterVerses) {
            await client.query(
              `INSERT INTO bible_verses (chapter_id, verse_number, text_en, text_fa, created_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT DO NOTHING`,
              [chapterId, verse.verse_number, 'English text pending', verse.text_fa]
            );
            processed++;
          }
        }
      }
      
      console.log(`📖 Processed ${Math.min(i + batchSize, verses.length)}/${verses.length} verses`);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully inserted ${processed} verses`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during batch insert:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main import function
async function importBibleData() {
  try {
    console.log('🚀 Starting Bible data import...');
    
    // Clear existing data
    await clearExistingData();
    
    // Import Mojdeh version only first (most manageable)
    console.log('📖 Processing Mojdeh version...');
    const mojdehContent = fs.readFileSync('attached_assets/verses_mojdeh_1757861410662.sql', 'utf8');
    const mojdehVerses = parseVerseData(mojdehContent, 'mojdeh');
    
    console.log(`Found ${mojdehVerses.length} verses in Mojdeh version`);
    
    if (mojdehVerses.length > 0) {
      // Take first 1000 verses for testing
      const testVerses = mojdehVerses.slice(0, 1000);
      console.log(`🧪 Testing with first ${testVerses.length} verses`);
      await batchInsertVerses(testVerses, 100);
    }
    
    // Verify results
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_verses,
          COUNT(DISTINCT bb.id) as total_books,
          COUNT(DISTINCT bc.id) as total_chapters
        FROM bible_verses bv
        JOIN bible_chapters bc ON bv.chapter_id = bc.id
        JOIN bible_books bb ON bc.book_id = bb.id
      `);
      
      console.log('📊 Import Summary:');
      console.log(`   Verses: ${result.rows[0].total_verses}`);
      console.log(`   Books: ${result.rows[0].total_books}`);
      console.log(`   Chapters: ${result.rows[0].total_chapters}`);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importBibleData().catch(console.error);

export { importBibleData };