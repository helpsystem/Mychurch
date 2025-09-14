import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  connectionTimeoutMillis: 15000,
});

// Complete Bible book mapping with proper Persian names
const BIBLE_BOOKS = {
  // Old Testament
  'پیدایش': { book_number: 1, name_en: 'Genesis', testament: 'OT' },
  'خروج': { book_number: 2, name_en: 'Exodus', testament: 'OT' },
  'لاویان': { book_number: 3, name_en: 'Leviticus', testament: 'OT' },
  'اعداد': { book_number: 4, name_en: 'Numbers', testament: 'OT' },
  'تثنیه': { book_number: 5, name_en: 'Deuteronomy', testament: 'OT' },
  'یوشع': { book_number: 6, name_en: 'Joshua', testament: 'OT' },
  'داوران': { book_number: 7, name_en: 'Judges', testament: 'OT' },
  'روت': { book_number: 8, name_en: 'Ruth', testament: 'OT' },
  'اول سموئیل': { book_number: 9, name_en: '1 Samuel', testament: 'OT' },
  'دوم سموئیل': { book_number: 10, name_en: '2 Samuel', testament: 'OT' },
  'اول پادشاهان': { book_number: 11, name_en: '1 Kings', testament: 'OT' },
  'دوم پادشاهان': { book_number: 12, name_en: '2 Kings', testament: 'OT' },
  'اول تواریخ': { book_number: 13, name_en: '1 Chronicles', testament: 'OT' },
  'دوم تواریخ': { book_number: 14, name_en: '2 Chronicles', testament: 'OT' },
  'عزرا': { book_number: 15, name_en: 'Ezra', testament: 'OT' },
  'نحمیا': { book_number: 16, name_en: 'Nehemiah', testament: 'OT' },
  'استر': { book_number: 17, name_en: 'Esther', testament: 'OT' },
  'ایوب': { book_number: 18, name_en: 'Job', testament: 'OT' },
  'مزامیر': { book_number: 19, name_en: 'Psalms', testament: 'OT' },
  'امثال سلیمان': { book_number: 20, name_en: 'Proverbs', testament: 'OT' },
  'جامعه': { book_number: 21, name_en: 'Ecclesiastes', testament: 'OT' },
  'غزل غزلهای سلیمان': { book_number: 22, name_en: 'Song of Songs', testament: 'OT' },
  'اشعیا': { book_number: 23, name_en: 'Isaiah', testament: 'OT' },
  'ارمیا': { book_number: 24, name_en: 'Jeremiah', testament: 'OT' },
  'مراثی ارمیا': { book_number: 25, name_en: 'Lamentations', testament: 'OT' },
  'حزقیال': { book_number: 26, name_en: 'Ezekiel', testament: 'OT' },
  'دانیال': { book_number: 27, name_en: 'Daniel', testament: 'OT' },
  // New Testament  
  'متی': { book_number: 40, name_en: 'Matthew', testament: 'NT' },
  'مرقس': { book_number: 41, name_en: 'Mark', testament: 'NT' },
  'لوقا': { book_number: 42, name_en: 'Luke', testament: 'NT' },
  'یوحنا': { book_number: 43, name_en: 'John', testament: 'NT' },
  'اعمال رسولان': { book_number: 44, name_en: 'Acts', testament: 'NT' },
  'رومیان': { book_number: 45, name_en: 'Romans', testament: 'NT' },
  'اول قرنتیان': { book_number: 46, name_en: '1 Corinthians', testament: 'NT' },
  'دوم قرنتیان': { book_number: 47, name_en: '2 Corinthians', testament: 'NT' },
  'غلاطیان': { book_number: 48, name_en: 'Galatians', testament: 'NT' },
  'افسسیان': { book_number: 49, name_en: 'Ephesians', testament: 'NT' },
  'فیلیپیان': { book_number: 50, name_en: 'Philippians', testament: 'NT' },
  'کولسیان': { book_number: 51, name_en: 'Colossians', testament: 'NT' },
  'اول تسالونیکیان': { book_number: 52, name_en: '1 Thessalonians', testament: 'NT' },
  'دوم تسالونیکیان': { book_number: 53, name_en: '2 Thessalonians', testament: 'NT' },
  'اول تیموتائوس': { book_number: 54, name_en: '1 Timothy', testament: 'NT' },
  'دوم تیموتائوس': { book_number: 55, name_en: '2 Timothy', testament: 'NT' },
  'تیطس': { book_number: 56, name_en: 'Titus', testament: 'NT' },
  'فیلیمون': { book_number: 57, name_en: 'Philemon', testament: 'NT' },
  'عبرانیان': { book_number: 58, name_en: 'Hebrews', testament: 'NT' },
  'یعقوب': { book_number: 59, name_en: 'James', testament: 'NT' },
  'اول پطرس': { book_number: 60, name_en: '1 Peter', testament: 'NT' },
  'دوم پطرس': { book_number: 61, name_en: '2 Peter', testament: 'NT' },
  'اول یوحنا': { book_number: 62, name_en: '1 John', testament: 'NT' },
  'دوم یوحنا': { book_number: 63, name_en: '2 John', testament: 'NT' },
  'سوم یوحنا': { book_number: 64, name_en: '3 John', testament: 'NT' },
  'یهودا': { book_number: 65, name_en: 'Jude', testament: 'NT' },
  'مکاشفۀ یوحنا': { book_number: 66, name_en: 'Revelation', testament: 'NT' }
};

// Enhanced metadata detection patterns
function isMetadata(text) {
  if (!text || typeof text !== 'string') return true;
  
  const cleanText = text.trim();
  
  // Skip empty or very short text
  if (cleanText.length < 10) return true;
  
  // Skip encoding artifacts
  if (cleanText.includes('�') || cleanText.includes('ƼƼƼ')) return true;
  
  // Skip common header/outline patterns
  const metadataPatterns = [
    /فصلهای?[-\s]*\d*/,           // Chapter headers
    /مقدّ?مه/,                    // Introduction
    /تقسیم\s*بندی/,              // Division/outline
    /خلاصه/,                      // Summary
    /فهرست/,                     // Index/list
    /عنوان/,                     // Title
    /\d+[:：]\d+(?:-\d+)?:?$/,    // Verse references like "25:2-1:"
    /^[-\s]*\d+[-\s]*$/,          // Just numbers or dashes
    /^\d+\.\d+/,                  // Decimal numbering
    /^[A-Z\s]{3,}$/,              // All caps titles
  ];
  
  return metadataPatterns.some(pattern => pattern.test(cleanText));
}

// Better book name detection
function findBookName(text) {
  if (!text) return null;
  
  const cleanText = text.trim();
  
  // Direct match with book names
  for (const [persianName, bookInfo] of Object.entries(BIBLE_BOOKS)) {
    if (cleanText === persianName) {
      return { name: persianName, ...bookInfo };
    }
  }
  
  return null;
}

// Clear existing data safely
async function clearBibleData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bible_verses');
    await client.query('DELETE FROM bible_chapters');
    
    // Keep bible_books but reset the verses/chapters
    await client.query('UPDATE bible_books SET chapters_count = 0');
    
    await client.query('COMMIT');
    console.log('✅ Bible data cleared successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Parse SQL file with better encoding and structure handling
function parseAdvancedSqlFile(filePath, version) {
  console.log(`📖 Parsing ${version} from: ${filePath}`);
  
  let content;
  try {
    // Read with explicit UTF-8 encoding
    content = fs.readFileSync(filePath, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    return { verses: [], stats: { total: 0, books: 0, filtered: 0 } };
  }
  
  const verses = [];
  let currentBook = null;
  let stats = { total: 0, books: 0, filtered: 0 };
  
  // Extract all VALUES tuples more robustly
  const valuesRegex = /\(([^)]+)\)/g;
  let match;
  
  while ((match = valuesRegex.exec(content)) !== null) {
    const tuple = match[1];
    
    // Parse tuple - handle quoted strings with commas
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < tuple.length; i++) {
      const char = tuple[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      } else if (char === quoteChar && inQuotes) {
        // Check if it's an escaped quote
        if (i + 1 < tuple.length && tuple[i + 1] === quoteChar) {
          current += char;
          i++; // Skip next quote
          continue;
        }
        inQuotes = false;
        quoteChar = null;
        continue;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    parts.push(current.trim());
    
    stats.total++;
    
    // Extract fields
    if (parts.length >= 5) {
      const [versionField, bookField, chapterField, verseField, textFaField] = parts;
      
      const textFa = textFaField.replace(/^['"]|['"]$/g, ''); // Remove quotes
      const chapter = parseInt(chapterField) || 1;
      const verse = parseInt(verseField) || 1;
      
      // Check if this is a book name
      const bookInfo = findBookName(textFa);
      if (bookInfo) {
        currentBook = bookInfo;
        stats.books++;
        console.log(`📚 Found book: ${bookInfo.name} (${bookInfo.name_en})`);
        continue;
      }
      
      // Skip metadata
      if (isMetadata(textFa)) {
        stats.filtered++;
        continue;
      }
      
      // If we have a valid verse and current book context
      if (currentBook && textFa.length > 15) {
        verses.push({
          version: version,
          book: currentBook,
          chapter: chapter,
          verse_number: verse,
          text_fa: textFa,
          text_en: null
        });
      }
    }
  }
  
  console.log(`📊 Parse stats for ${version}:`, stats);
  console.log(`🎯 Valid verses extracted: ${verses.length}`);
  
  return { verses, stats };
}

// Optimized batch insert with proper book/chapter creation
async function smartInsertVerses(verses, version) {
  if (!verses.length) {
    console.log('⚠️  No verses to insert');
    return;
  }
  
  const client = await pool.connect();
  let insertedCount = 0;
  
  try {
    await client.query('BEGIN');
    
    // Group by book
    const bookGroups = {};
    verses.forEach(verse => {
      const bookKey = verse.book.book_number;
      if (!bookGroups[bookKey]) {
        bookGroups[bookKey] = {};
      }
      if (!bookGroups[bookKey][verse.chapter]) {
        bookGroups[bookKey][verse.chapter] = [];
      }
      bookGroups[bookKey][verse.chapter].push(verse);
    });
    
    // Process each book
    for (const [bookNumber, chapters] of Object.entries(bookGroups)) {
      const bookNum = parseInt(bookNumber);
      const firstVerse = Object.values(chapters)[0][0];
      const bookInfo = firstVerse.book;
      
      // Ensure book exists
      let bookResult = await client.query(
        'SELECT id FROM bible_books WHERE book_number = $1',
        [bookNum]
      );
      
      let bookId;
      if (bookResult.rows.length === 0) {
        bookResult = await client.query(
          `INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
          [bookNum, bookInfo.name_en, bookInfo.name, bookInfo.name_en.substring(0, 4), bookInfo.testament, Object.keys(chapters).length]
        );
      }
      bookId = bookResult.rows[0].id;
      
      // Process chapters
      for (const [chapterNum, chapterVerses] of Object.entries(chapters)) {
        const chapNum = parseInt(chapterNum);
        
        // Ensure chapter exists
        let chapterResult = await client.query(
          'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
          [bookId, chapNum]
        );
        
        let chapterId;
        if (chapterResult.rows.length === 0) {
          chapterResult = await client.query(
            `INSERT INTO bible_chapters (book_id, chapter_number, verses_count, created_at)
             VALUES ($1, $2, $3, NOW()) RETURNING id`,
            [bookId, chapNum, chapterVerses.length]
          );
        }
        chapterId = chapterResult.rows[0].id;
        
        // Insert verses
        for (const verse of chapterVerses) {
          await client.query(
            `INSERT INTO bible_verses (chapter_id, verse_number, text_en, text_fa, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT DO NOTHING`,
            [chapterId, verse.verse_number, verse.text_en || 'English translation pending', verse.text_fa]
          );
          insertedCount++;
        }
      }
      
      console.log(`📖 Completed book: ${bookInfo.name} (${Object.keys(chapters).length} chapters)`);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully imported ${insertedCount} verses for ${version}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error importing ${version}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Quality validation
async function validateImport() {
  const client = await pool.connect();
  try {
    // Get stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_verses,
        COUNT(DISTINCT bb.id) as total_books,
        COUNT(DISTINCT bc.id) as total_chapters
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
    `);
    
    // Sample verses for quality check
    const sampleResult = await client.query(`
      SELECT bb.name_fa, bc.chapter_number, bv.verse_number, 
             LEFT(bv.text_fa, 100) as preview
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
      ORDER BY bb.book_number, bc.chapter_number, bv.verse_number
      LIMIT 5
    `);
    
    const stats = statsResult.rows[0];
    
    console.log('\n📊 Import Validation:');
    console.log(`   📖 Total verses: ${stats.total_verses}`);
    console.log(`   📚 Total books: ${stats.total_books}`);
    console.log(`   📄 Total chapters: ${stats.total_chapters}`);
    
    console.log('\n🔍 Sample verses:');
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.name_fa} ${row.chapter_number}:${row.verse_number} - ${row.preview}...`);
    });
    
    return stats;
    
  } finally {
    client.release();
  }
}

// Main import function
async function importBibleDataFixed() {
  try {
    console.log('🚀 Starting improved Bible import...');
    
    // Clear existing data
    await clearBibleData();
    
    // Import Mojdeh version with proper parsing
    console.log('\n📖 Processing Mojdeh version...');
    const { verses, stats } = parseAdvancedSqlFile(
      'attached_assets/verses_mojdeh_1757861410662.sql',
      'mojdeh'
    );
    
    if (verses.length > 0) {
      // For testing, take first few books
      const testVerses = verses.slice(0, 500); // Start with 500 verses
      console.log(`🧪 Testing import with first ${testVerses.length} verses`);
      await smartInsertVerses(testVerses, 'mojdeh');
    }
    
    // Validate results
    const validationStats = await validateImport();
    
    return validationStats;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Export for use
export { importBibleDataFixed };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importBibleDataFixed().catch(console.error);
}