#!/usr/bin/env node

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Complete Bible books data (66 books total)
const BIBLE_BOOKS = [
  // Old Testament (39 books)
  { book_number: 1, name_en: 'Genesis', name_fa: 'پیدایش', abbreviation: 'Gen', testament: 'OT', chapters_count: 50 },
  { book_number: 2, name_en: 'Exodus', name_fa: 'خروج', abbreviation: 'Ex', testament: 'OT', chapters_count: 40 },
  { book_number: 3, name_en: 'Leviticus', name_fa: 'لاویان', abbreviation: 'Lev', testament: 'OT', chapters_count: 27 },
  { book_number: 4, name_en: 'Numbers', name_fa: 'اعداد', abbreviation: 'Num', testament: 'OT', chapters_count: 36 },
  { book_number: 5, name_en: 'Deuteronomy', name_fa: 'تثنیه', abbreviation: 'Dt', testament: 'OT', chapters_count: 34 },
  { book_number: 6, name_en: 'Joshua', name_fa: 'یوشع', abbreviation: 'Josh', testament: 'OT', chapters_count: 24 },
  { book_number: 7, name_en: 'Judges', name_fa: 'داوران', abbreviation: 'Judg', testament: 'OT', chapters_count: 21 },
  { book_number: 8, name_en: 'Ruth', name_fa: 'روت', abbreviation: 'Ruth', testament: 'OT', chapters_count: 4 },
  { book_number: 9, name_en: '1 Samuel', name_fa: 'اول سموئیل', abbreviation: '1Sam', testament: 'OT', chapters_count: 31 },
  { book_number: 10, name_en: '2 Samuel', name_fa: 'دوم سموئیل', abbreviation: '2Sam', testament: 'OT', chapters_count: 24 },
  { book_number: 11, name_en: '1 Kings', name_fa: 'اول پادشاهان', abbreviation: '1Kgs', testament: 'OT', chapters_count: 22 },
  { book_number: 12, name_en: '2 Kings', name_fa: 'دوم پادشاهان', abbreviation: '2Kgs', testament: 'OT', chapters_count: 25 },
  { book_number: 13, name_en: '1 Chronicles', name_fa: 'اول تواریخ', abbreviation: '1Chr', testament: 'OT', chapters_count: 29 },
  { book_number: 14, name_en: '2 Chronicles', name_fa: 'دوم تواریخ', abbreviation: '2Chr', testament: 'OT', chapters_count: 36 },
  { book_number: 15, name_en: 'Ezra', name_fa: 'عزرا', abbreviation: 'Ezra', testament: 'OT', chapters_count: 10 },
  { book_number: 16, name_en: 'Nehemiah', name_fa: 'نحمیا', abbreviation: 'Neh', testament: 'OT', chapters_count: 13 },
  { book_number: 17, name_en: 'Esther', name_fa: 'استر', abbreviation: 'Est', testament: 'OT', chapters_count: 10 },
  { book_number: 18, name_en: 'Job', name_fa: 'ایوب', abbreviation: 'Job', testament: 'OT', chapters_count: 42 },
  { book_number: 19, name_en: 'Psalms', name_fa: 'مزامیر', abbreviation: 'Ps', testament: 'OT', chapters_count: 150 },
  { book_number: 20, name_en: 'Proverbs', name_fa: 'امثال سلیمان', abbreviation: 'Prov', testament: 'OT', chapters_count: 31 },
  { book_number: 21, name_en: 'Ecclesiastes', name_fa: 'جامعه', abbreviation: 'Eccl', testament: 'OT', chapters_count: 12 },
  { book_number: 22, name_en: 'Song of Songs', name_fa: 'غزل غزلهای سلیمان', abbreviation: 'Song', testament: 'OT', chapters_count: 8 },
  { book_number: 23, name_en: 'Isaiah', name_fa: 'اشعیا', abbreviation: 'Isa', testament: 'OT', chapters_count: 66 },
  { book_number: 24, name_en: 'Jeremiah', name_fa: 'ارمیا', abbreviation: 'Jer', testament: 'OT', chapters_count: 52 },
  { book_number: 25, name_en: 'Lamentations', name_fa: 'مراثی ارمیا', abbreviation: 'Lam', testament: 'OT', chapters_count: 5 },
  { book_number: 26, name_en: 'Ezekiel', name_fa: 'حزقیال', abbreviation: 'Ezek', testament: 'OT', chapters_count: 48 },
  { book_number: 27, name_en: 'Daniel', name_fa: 'دانیال', abbreviation: 'Dan', testament: 'OT', chapters_count: 12 },
  { book_number: 28, name_en: 'Hosea', name_fa: 'هوشع', abbreviation: 'Hos', testament: 'OT', chapters_count: 14 },
  { book_number: 29, name_en: 'Joel', name_fa: 'یوئیل', abbreviation: 'Joel', testament: 'OT', chapters_count: 3 },
  { book_number: 30, name_en: 'Amos', name_fa: 'عاموس', abbreviation: 'Amos', testament: 'OT', chapters_count: 9 },
  { book_number: 31, name_en: 'Obadiah', name_fa: 'عوبدیا', abbreviation: 'Obad', testament: 'OT', chapters_count: 1 },
  { book_number: 32, name_en: 'Jonah', name_fa: 'یونس', abbreviation: 'Jonah', testament: 'OT', chapters_count: 4 },
  { book_number: 33, name_en: 'Micah', name_fa: 'میکاه', abbreviation: 'Mic', testament: 'OT', chapters_count: 7 },
  { book_number: 34, name_en: 'Nahum', name_fa: 'ناحوم', abbreviation: 'Nah', testament: 'OT', chapters_count: 3 },
  { book_number: 35, name_en: 'Habakkuk', name_fa: 'حبقوق', abbreviation: 'Hab', testament: 'OT', chapters_count: 3 },
  { book_number: 36, name_en: 'Zephaniah', name_fa: 'صفنیا', abbreviation: 'Zeph', testament: 'OT', chapters_count: 3 },
  { book_number: 37, name_en: 'Haggai', name_fa: 'حجی', abbreviation: 'Hag', testament: 'OT', chapters_count: 2 },
  { book_number: 38, name_en: 'Zechariah', name_fa: 'زکریا', abbreviation: 'Zech', testament: 'OT', chapters_count: 14 },
  { book_number: 39, name_en: 'Malachi', name_fa: 'ملاکی', abbreviation: 'Mal', testament: 'OT', chapters_count: 4 },

  // New Testament (27 books)
  { book_number: 40, name_en: 'Matthew', name_fa: 'متی', abbreviation: 'Matt', testament: 'NT', chapters_count: 28 },
  { book_number: 41, name_en: 'Mark', name_fa: 'مرقس', abbreviation: 'Mark', testament: 'NT', chapters_count: 16 },
  { book_number: 42, name_en: 'Luke', name_fa: 'لوقا', abbreviation: 'Luke', testament: 'NT', chapters_count: 24 },
  { book_number: 43, name_en: 'John', name_fa: 'یوحنا', abbreviation: 'John', testament: 'NT', chapters_count: 21 },
  { book_number: 44, name_en: 'Acts', name_fa: 'اعمال رسولان', abbreviation: 'Acts', testament: 'NT', chapters_count: 28 },
  { book_number: 45, name_en: 'Romans', name_fa: 'رومیان', abbreviation: 'Rom', testament: 'NT', chapters_count: 16 },
  { book_number: 46, name_en: '1 Corinthians', name_fa: 'اول قرنتیان', abbreviation: '1Cor', testament: 'NT', chapters_count: 16 },
  { book_number: 47, name_en: '2 Corinthians', name_fa: 'دوم قرنتیان', abbreviation: '2Cor', testament: 'NT', chapters_count: 13 },
  { book_number: 48, name_en: 'Galatians', name_fa: 'غلاطیان', abbreviation: 'Gal', testament: 'NT', chapters_count: 6 },
  { book_number: 49, name_en: 'Ephesians', name_fa: 'افسسیان', abbreviation: 'Eph', testament: 'NT', chapters_count: 6 },
  { book_number: 50, name_en: 'Philippians', name_fa: 'فیلیپیان', abbreviation: 'Phil', testament: 'NT', chapters_count: 4 },
  { book_number: 51, name_en: 'Colossians', name_fa: 'کولسیان', abbreviation: 'Col', testament: 'NT', chapters_count: 4 },
  { book_number: 52, name_en: '1 Thessalonians', name_fa: 'اول تسالونیکیان', abbreviation: '1Thess', testament: 'NT', chapters_count: 5 },
  { book_number: 53, name_en: '2 Thessalonians', name_fa: 'دوم تسالونیکیان', abbreviation: '2Thess', testament: 'NT', chapters_count: 3 },
  { book_number: 54, name_en: '1 Timothy', name_fa: 'اول تیموتائوس', abbreviation: '1Tim', testament: 'NT', chapters_count: 6 },
  { book_number: 55, name_en: '2 Timothy', name_fa: 'دوم تیموتائوس', abbreviation: '2Tim', testament: 'NT', chapters_count: 4 },
  { book_number: 56, name_en: 'Titus', name_fa: 'تیطس', abbreviation: 'Titus', testament: 'NT', chapters_count: 3 },
  { book_number: 57, name_en: 'Philemon', name_fa: 'فیلیمون', abbreviation: 'Phlm', testament: 'NT', chapters_count: 1 },
  { book_number: 58, name_en: 'Hebrews', name_fa: 'عبرانیان', abbreviation: 'Heb', testament: 'NT', chapters_count: 13 },
  { book_number: 59, name_en: 'James', name_fa: 'یعقوب', abbreviation: 'Jas', testament: 'NT', chapters_count: 5 },
  { book_number: 60, name_en: '1 Peter', name_fa: 'اول پطرس', abbreviation: '1Pet', testament: 'NT', chapters_count: 5 },
  { book_number: 61, name_en: '2 Peter', name_fa: 'دوم پطرس', abbreviation: '2Pet', testament: 'NT', chapters_count: 3 },
  { book_number: 62, name_en: '1 John', name_fa: 'اول یوحنا', abbreviation: '1John', testament: 'NT', chapters_count: 5 },
  { book_number: 63, name_en: '2 John', name_fa: 'دوم یوحنا', abbreviation: '2John', testament: 'NT', chapters_count: 1 },
  { book_number: 64, name_en: '3 John', name_fa: 'سوم یوحنا', abbreviation: '3John', testament: 'NT', chapters_count: 1 },
  { book_number: 65, name_en: 'Jude', name_fa: 'یهودا', abbreviation: 'Jude', testament: 'NT', chapters_count: 1 },
  { book_number: 66, name_en: 'Revelation', name_fa: 'مکاشفۀ یوحنا', abbreviation: 'Rev', testament: 'NT', chapters_count: 22 }
];

// Helper function to parse verse text from HTML
function parseVersesFromHtml(html) {
  const verses = [];
  
  // Extract verse content after ### فصل X
  const chapterMatch = html.match(/### فصل\s+\d+\s*([\s\S]*)/);
  if (!chapterMatch) return verses;
  
  const content = chapterMatch[1];
  
  // Split by verse numbers and clean up
  const lines = content.split(/\n\n/).filter(line => line.trim());
  
  let verseNumber = 1;
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine && !cleanLine.includes('[Go to top')) {
      // Remove any HTML tags and clean the text
      const cleanText = cleanLine.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (cleanText && cleanText.length > 10) { // Filter out very short/invalid lines
        verses.push({
          verse_number: verseNumber,
          text_fa: cleanText
        });
        verseNumber++;
      }
    }
  }
  
  return verses;
}

// Helper function to get English Bible text (we'll use a simple ESV API or fallback)
async function getEnglishVerses(bookNumber, chapterNumber, versesCount) {
  const verses = [];
  
  // For now, we'll create placeholder English text
  // In a real implementation, you'd fetch from an English Bible API
  for (let i = 1; i <= versesCount; i++) {
    verses.push({
      verse_number: i,
      text_en: `English verse ${i} of chapter ${chapterNumber} in book ${bookNumber} (placeholder - to be updated with real English Bible API)`
    });
  }
  
  return verses;
}

// Main function to populate Bible data
async function populateBibleData() {
  try {
    console.log('🚀 Starting Bible data population...');
    
    // Step 1: Update/Insert all Bible books
    console.log('📚 Updating Bible books...');
    
    for (const book of BIBLE_BOOKS) {
      await pool.query(`
        INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (book_number) DO UPDATE SET
          name_en = EXCLUDED.name_en,
          name_fa = EXCLUDED.name_fa,
          abbreviation = EXCLUDED.abbreviation,
          testament = EXCLUDED.testament,
          chapters_count = EXCLUDED.chapters_count
      `, [book.book_number, book.name_en, book.name_fa, book.abbreviation, book.testament, book.chapters_count]);
    }
    
    console.log(`✅ Updated ${BIBLE_BOOKS.length} Bible books`);
    
    // Step 2: Populate chapters and verses for first few books (sample)
    console.log('📖 Starting to populate Bible content...');
    
    const sampleBooks = BIBLE_BOOKS.slice(0, 5); // First 5 books for testing
    
    for (const book of sampleBooks) {
      console.log(`📑 Processing ${book.name_en} (${book.name_fa})...`);
      
      const bookNumberFormatted = book.book_number.toString().padStart(2, '0');
      
      // Get book ID from database
      const bookResult = await pool.query('SELECT id FROM bible_books WHERE book_number = $1', [book.book_number]);
      const bookId = bookResult.rows[0].id;
      
      for (let chapterNum = 1; chapterNum <= Math.min(book.chapters_count, 3); chapterNum++) { // First 3 chapters only for testing
        try {
          console.log(`  📄 Processing Chapter ${chapterNum}...`);
          
          // Fetch Persian content from wordproject.org
          const url = `https://www.wordproject.org/bibles/fa/${bookNumberFormatted}/${chapterNum}.htm`;
          console.log(`  🌐 Fetching: ${url}`);
          
          const response = await axios.get(url, { timeout: 30000 });
          const verses = parseVersesFromHtml(response.data);
          
          if (verses.length === 0) {
            console.log(`    ⚠️ No verses found for chapter ${chapterNum}`);
            continue;
          }
          
          // Insert chapter
          const chapterResult = await pool.query(`
            INSERT INTO bible_chapters (book_id, chapter_number, verses_count)
            VALUES ($1, $2, $3)
            ON CONFLICT (book_id, chapter_number) DO UPDATE SET
              verses_count = EXCLUDED.verses_count
            RETURNING id
          `, [bookId, chapterNum, verses.length]);
          
          const chapterId = chapterResult.rows[0].id;
          
          // Get English verses (placeholder for now)
          const englishVerses = await getEnglishVerses(book.book_number, chapterNum, verses.length);
          
          // Insert verses
          for (let i = 0; i < verses.length; i++) {
            const persianVerse = verses[i];
            const englishVerse = englishVerses[i] || { text_en: 'English text pending...' };
            
            await pool.query(`
              INSERT INTO bible_verses (chapter_id, verse_number, text_en, text_fa)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
                text_en = EXCLUDED.text_en,
                text_fa = EXCLUDED.text_fa
            `, [chapterId, persianVerse.verse_number, englishVerse.text_en, persianVerse.text_fa]);
          }
          
          console.log(`    ✅ Inserted ${verses.length} verses for chapter ${chapterNum}`);
          
          // Small delay to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`    ❌ Error processing chapter ${chapterNum}:`, error.message);
        }
      }
      
      console.log(`✅ Completed ${book.name_en}`);
    }
    
    // Step 3: Show final statistics
    const booksCount = await pool.query('SELECT COUNT(*) FROM bible_books');
    const chaptersCount = await pool.query('SELECT COUNT(*) FROM bible_chapters');
    const versesCount = await pool.query('SELECT COUNT(*) FROM bible_verses');
    
    console.log('\n🎉 Bible Database Population Complete!');
    console.log(`📚 Total Books: ${booksCount.rows[0].count}`);
    console.log(`📄 Total Chapters: ${chaptersCount.rows[0].count}`);
    console.log(`📝 Total Verses: ${versesCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error populating Bible data:', error);
  } finally {
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  populateBibleData();
}

module.exports = { populateBibleData, BIBLE_BOOKS };