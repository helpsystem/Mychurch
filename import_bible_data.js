import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Book mapping from Persian to English
const bookMapping = {
  'پیدایش': { name_en: 'Genesis', book_number: 1, testament: 'OT' },
  'خروج': { name_en: 'Exodus', book_number: 2, testament: 'OT' },
  'لاویان': { name_en: 'Leviticus', book_number: 3, testament: 'OT' },
  // We'll expand this as needed
};

// Function to parse SQL file and extract verses
function parseSqlFile(filePath, version) {
  const content = fs.readFileSync(filePath, 'utf8');
  const verses = [];
  
  // Extract INSERT statements
  const insertPattern = /INSERT\s+IGNORE\s+INTO\s+`bible`[^;]+VALUES\s*([\s\S]*?)(?=INSERT|$)/gi;
  const matches = content.match(insertPattern);
  
  if (matches) {
    matches.forEach(match => {
      // Extract values
      const valuePattern = /\('([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+)\s*,\s*'([^']*)',\s*(NULL|'[^']*')\)/g;
      let valueMatch;
      while ((valueMatch = valuePattern.exec(match)) !== null) {
        const [, ver, book, chapter, verse, textFa, textEn] = valueMatch;
        
        // Skip empty or header-like verses
        if (textFa && textFa.trim() && !textFa.includes('فصلهای') && textFa.length > 5) {
          verses.push({
            version: ver,
            book,
            chapter: parseInt(chapter),
            verse_number: parseInt(verse),
            text_fa: textFa.trim(),
            text_en: textEn === 'NULL' ? null : textEn.replace(/^'|'$/g, '')
          });
        }
      }
    });
  }
  
  return verses;
}

// Function to get or create book
async function getOrCreateBook(bookName, bookNumber, testament) {
  const client = await pool.connect();
  try {
    // Check if book exists
    let result = await client.query(
      'SELECT id FROM bible_books WHERE name_fa = $1 OR book_number = $2',
      [bookName, bookNumber]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    
    // Create new book
    result = await client.query(
      `INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count, created_at)
       VALUES ($1, $2, $3, $4, $5, 50, NOW()) RETURNING id`,
      [bookNumber, bookMapping[bookName]?.name_en || bookName, bookName, bookName.substring(0, 3), testament]
    );
    
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

// Function to get or create chapter
async function getOrCreateChapter(bookId, chapterNumber) {
  const client = await pool.connect();
  try {
    // Check if chapter exists
    let result = await client.query(
      'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
      [bookId, chapterNumber]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    
    // Create new chapter
    result = await client.query(
      `INSERT INTO bible_chapters (book_id, chapter_number, verses_count, created_at)
       VALUES ($1, $2, 50, NOW()) RETURNING id`,
      [bookId, chapterNumber]
    );
    
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

// Main import function
async function importBibleData() {
  const files = [
    { path: 'attached_assets/verses_mojdeh_1757861410662.sql', version: 'mojdeh' },
    { path: 'attached_assets/verses_qadim_1757861410663.sql', version: 'qadim' }
  ];
  
  for (const file of files) {
    console.log(`Importing ${file.version}...`);
    
    try {
      const verses = parseSqlFile(file.path, file.version);
      console.log(`Found ${verses.length} verses in ${file.version}`);
      
      // Group verses by book and chapter
      const groupedVerses = {};
      verses.forEach(verse => {
        const bookKey = 'Genesis'; // Default for now
        if (!groupedVerses[bookKey]) {
          groupedVerses[bookKey] = {};
        }
        if (!groupedVerses[bookKey][verse.chapter]) {
          groupedVerses[bookKey][verse.chapter] = [];
        }
        groupedVerses[bookKey][verse.chapter].push(verse);
      });
      
      // Import verses
      for (const bookName of Object.keys(groupedVerses)) {
        const bookId = await getOrCreateBook(bookName, 1, 'OT');
        
        for (const chapterNum of Object.keys(groupedVerses[bookName])) {
          const chapterId = await getOrCreateChapter(bookId, parseInt(chapterNum));
          const chapterVerses = groupedVerses[bookName][chapterNum];
          
          // Import verses for this chapter
          const client = await pool.connect();
          try {
            for (const verse of chapterVerses) {
              await client.query(
                `INSERT INTO bible_verses (chapter_id, verse_number, text_en, text_fa, created_at)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
                 text_fa = EXCLUDED.text_fa, text_en = EXCLUDED.text_en`,
                [chapterId, verse.verse_number, verse.text_en || 'English text to be added', verse.text_fa]
              );
            }
          } finally {
            client.release();
          }
        }
      }
      
      console.log(`Completed importing ${file.version}`);
    } catch (error) {
      console.error(`Error importing ${file.version}:`, error);
    }
  }
  
  console.log('Bible import completed!');
  await pool.end();
}

// Run the import
importBibleData().catch(console.error);

export { importBibleData };