/**
 * Bible Text Import Script
 * 
 * This script extracts Bible text from a local directory and imports it into the database.
 * It handles multiple file formats (HTML, JSON, XML, TXT) and languages (English, Persian).
 * 
 * Usage:
 *   node bible-import-from-directory.js --source "D:\path\to\bible\files"
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/church_db',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Book mappings
const BOOK_INFO = {
  // Old Testament
  'Genesis': { code: 'GEN', testament: 'OT', chapters: 50, names: { en: 'Genesis', fa: 'پیدایش' } },
  'Exodus': { code: 'EXO', testament: 'OT', chapters: 40, names: { en: 'Exodus', fa: 'خروج' } },
  'Leviticus': { code: 'LEV', testament: 'OT', chapters: 27, names: { en: 'Leviticus', fa: 'لاویان' } },
  'Numbers': { code: 'NUM', testament: 'OT', chapters: 36, names: { en: 'Numbers', fa: 'اعداد' } },
  'Deuteronomy': { code: 'DEU', testament: 'OT', chapters: 34, names: { en: 'Deuteronomy', fa: 'تثنیه' } },
  // ... add all 66 books
  // New Testament
  'Matthew': { code: 'MAT', testament: 'NT', chapters: 28, names: { en: 'Matthew', fa: 'متی' } },
  'Mark': { code: 'MRK', testament: 'NT', chapters: 16, names: { en: 'Mark', fa: 'مرقس' } },
  'Luke': { code: 'LUK', testament: 'NT', chapters: 24, names: { en: 'Luke', fa: 'لوقا' } },
  'John': { code: 'JHN', testament: 'NT', chapters: 21, names: { en: 'John', fa: 'یوحنا' } },
  'Acts': { code: 'ACT', testament: 'NT', chapters: 28, names: { en: 'Acts', fa: 'اعمال رسولان' } },
  'Romans': { code: 'ROM', testament: 'NT', chapters: 16, names: { en: 'Romans', fa: 'رومیان' } },
  // ... add remaining books
};

/**
 * Parse HTML file and extract verses
 */
async function parseHTMLFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const verses = [];
  
  // Example HTML structure parsing
  // Adjust regex based on actual HTML structure
  const verseRegex = /<div class="verse"[^>]*data-chapter="(\d+)"[^>]*data-verse="(\d+)"[^>]*>(.*?)<\/div>/gs;
  let match;
  
  while ((match = verseRegex.exec(content)) !== null) {
    const [, chapter, verse, text] = match;
    verses.push({
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: text.replace(/<[^>]+>/g, '').trim()
    });
  }
  
  return verses;
}

/**
 * Parse JSON file and extract verses
 */
async function parseJSONFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Handle different JSON structures
  if (Array.isArray(data)) {
    return data;
  } else if (data.verses) {
    return data.verses;
  } else if (data.chapters) {
    // Flatten chapters structure
    const verses = [];
    Object.entries(data.chapters).forEach(([chapterNum, chapterVerses]) => {
      chapterVerses.forEach((text, index) => {
        verses.push({
          chapter: parseInt(chapterNum),
          verse: index + 1,
          text: text
        });
      });
    });
    return verses;
  }
  
  return [];
}

/**
 * Parse XML file and extract verses
 */
async function parseXMLFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const verses = [];
  
  // Simple XML parsing (for production, use xml2js library)
  const verseRegex = /<verse[^>]*chapter="(\d+)"[^>]*number="(\d+)"[^>]*>(.*?)<\/verse>/gs;
  let match;
  
  while ((match = verseRegex.exec(content)) !== null) {
    const [, chapter, verse, text] = match;
    verses.push({
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      text: text.replace(/<[^>]+>/g, '').trim()
    });
  }
  
  return verses;
}

/**
 * Parse plain text file
 */
async function parseTextFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const verses = [];
  const lines = content.split('\n');
  
  let currentChapter = 1;
  let verseNumber = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for chapter markers (e.g., "Chapter 1", "فصل ۱")
    const chapterMatch = trimmed.match(/^(?:Chapter|فصل)\s+(\d+)/i);
    if (chapterMatch) {
      currentChapter = parseInt(chapterMatch[1]);
      verseNumber = 1;
      continue;
    }
    
    // Check for verse numbers at start of line (e.g., "1. ", "۱. ")
    const verseMatch = trimmed.match(/^(\d+)[.:]\s*(.+)/);
    if (verseMatch) {
      verses.push({
        chapter: currentChapter,
        verse: parseInt(verseMatch[1]),
        text: verseMatch[2].trim()
      });
      verseNumber = parseInt(verseMatch[1]) + 1;
    } else if (trimmed.length > 10) {
      // Assume it's a verse without explicit numbering
      verses.push({
        chapter: currentChapter,
        verse: verseNumber++,
        text: trimmed
      });
    }
  }
  
  return verses;
}

/**
 * Detect language of text
 */
function detectLanguage(text) {
  // Simple Persian detection (check for Persian characters)
  const persianRegex = /[\u0600-\u06FF]/;
  return persianRegex.test(text) ? 'fa' : 'en';
}

/**
 * Scan directory recursively for Bible files
 */
async function scanDirectory(dirPath) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check if it's a supported file type
        const ext = path.extname(entry.name).toLowerCase();
        if (['.html', '.json', '.xml', '.txt'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return files;
}

/**
 * Extract book name from file path or name
 */
function extractBookInfo(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Try to match known book names
  for (const [bookName, info] of Object.entries(BOOK_INFO)) {
    if (fileName.toLowerCase().includes(bookName.toLowerCase()) ||
        fileName.includes(info.code.toLowerCase())) {
      return info;
    }
  }
  
  // Try Persian names
  for (const [, info] of Object.entries(BOOK_INFO)) {
    if (fileName.includes(info.names.fa)) {
      return info;
    }
  }
  
  return null;
}

/**
 * Import verses into database
 */
async function importVerses(bookInfo, verses, language) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`Importing ${verses.length} verses for ${bookInfo.names[language]} (${language})...`);
    
    // Get or create book
    const bookQuery = `
      INSERT INTO bible_books (code, name_en, name_fa, testament, chapters_count)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO UPDATE SET
        name_en = EXCLUDED.name_en,
        name_fa = EXCLUDED.name_fa
      RETURNING id
    `;
    
    const bookResult = await client.query(bookQuery, [
      bookInfo.code,
      bookInfo.names.en,
      bookInfo.names.fa,
      bookInfo.testament,
      bookInfo.chapters
    ]);
    
    const bookId = bookResult.rows[0].id;
    
    // Group verses by chapter
    const chapterMap = new Map();
    verses.forEach(v => {
      if (!chapterMap.has(v.chapter)) {
        chapterMap.set(v.chapter, []);
      }
      chapterMap.get(v.chapter).push(v);
    });
    
    // Import each chapter
    for (const [chapterNum, chapterVerses] of chapterMap) {
      // Get or create chapter
      const chapterQuery = `
        INSERT INTO bible_chapters (book_id, chapter_number, verse_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (book_id, chapter_number) DO UPDATE SET
          verse_count = EXCLUDED.verse_count
        RETURNING id
      `;
      
      const chapterResult = await client.query(chapterQuery, [
        bookId,
        chapterNum,
        chapterVerses.length
      ]);
      
      const chapterId = chapterResult.rows[0].id;
      
      // Import verses
      for (const verse of chapterVerses) {
        const verseQuery = `
          INSERT INTO bible_verses (
            chapter_id,
            verse_number,
            text_${language}
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
            text_${language} = EXCLUDED.text_${language}
        `;
        
        await client.query(verseQuery, [
          chapterId,
          verse.verse,
          verse.text
        ]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully imported ${bookInfo.names[language]}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error importing ${bookInfo.names[language]}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  console.log(`\n📖 Processing: ${path.basename(filePath)}`);
  
  const bookInfo = extractBookInfo(filePath);
  if (!bookInfo) {
    console.log(`⚠️  Could not determine book from filename`);
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  let verses = [];
  
  try {
    switch (ext) {
      case '.html':
        verses = await parseHTMLFile(filePath);
        break;
      case '.json':
        verses = await parseJSONFile(filePath);
        break;
      case '.xml':
        verses = await parseXMLFile(filePath);
        break;
      case '.txt':
        verses = await parseTextFile(filePath);
        break;
      default:
        console.log(`⚠️  Unsupported file type: ${ext}`);
        return;
    }
    
    if (verses.length === 0) {
      console.log(`⚠️  No verses found in file`);
      return;
    }
    
    // Detect language from first verse
    const language = detectLanguage(verses[0].text);
    console.log(`📝 Detected language: ${language === 'fa' ? 'Persian' : 'English'}`);
    console.log(`📊 Found ${verses.length} verses`);
    
    // Import to database
    await importVerses(bookInfo, verses, language);
    
  } catch (error) {
    console.error(`❌ Error processing file:`, error.message);
  }
}

/**
 * Main import function
 */
async function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  
  if (sourceIndex === -1 || !args[sourceIndex + 1]) {
    console.log('Usage: node bible-import-from-directory.js --source "D:\\path\\to\\bible\\files"');
    process.exit(1);
  }
  
  const sourcePath = args[sourceIndex + 1];
  
  console.log('🚀 Bible Import Script');
  console.log('=' .repeat(50));
  console.log(`📁 Source Directory: ${sourcePath}`);
  
  try {
    // Check if directory exists
    await fs.access(sourcePath);
    
    // Scan for files
    console.log('\n🔍 Scanning for Bible files...');
    const files = await scanDirectory(sourcePath);
    console.log(`📚 Found ${files.length} potential Bible files`);
    
    if (files.length === 0) {
      console.log('No supported files found (HTML, JSON, XML, TXT)');
      return;
    }
    
    // Process each file
    for (const file of files) {
      await processFile(file);
    }
    
    console.log('\n✅ Import complete!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseHTMLFile, parseJSONFile, parseXMLFile, parseTextFile, detectLanguage };
