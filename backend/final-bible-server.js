// Bible API مستقل - فقط کتاب مقدس
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3005;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

console.log('🔗 Connecting to Supabase...');

// Supabase connection - مستقیم
const pool = new Pool({
  connectionString: 'postgresql://postgres.wxzhzsqicgwfxffxayhy:SamyarBB1989@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.connect()
  .then(() => console.log('✅ Connected to Supabase'))
  .catch(err => console.error('❌ Connection error:', err));

// GET /api/bible/books
app.get('/api/bible/books', async (req, res) => {
  try {
    console.log('📚 Getting Bible books...');
    const query = `
      SELECT 
        id, book_number, name_en, name_fa, abbreviation, testament, chapters_count
      FROM bible_books 
      ORDER BY book_number
    `;
    const result = await pool.query(query);
    
    const books = result.rows.map(book => ({
      key: book.abbreviation,
      name: {
        en: book.name_en,
        fa: book.name_fa
      },
      chapters: book.chapters_count || 1,
      testament: book.testament,
      bookNumber: book.book_number
    }));

    console.log('✅ Found', books.length, 'books');
    res.json({ success: true, books });
    
  } catch (error) {
    console.error('❌ Error fetching books:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Bible books',
      error: error.message 
    });
  }
});

// GET /api/bible/content/:bookKey/:chapter
app.get('/api/bible/content/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    console.log(`📖 Getting ${bookKey} chapter ${chapter}...`);
    
    // Find book
    const bookQuery = `
      SELECT id, name_en, name_fa, abbreviation
      FROM bible_books 
      WHERE LOWER(abbreviation) = LOWER($1) 
         OR LOWER(name_en) = LOWER($1)
         OR LOWER(name_fa) = LOWER($1)
    `;
    const bookResult = await pool.query(bookQuery, [bookKey]);
    
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bible book not found' 
      });
    }
    
    const book = bookResult.rows[0];
    const chapterNum = parseInt(chapter);
    
    // Get verses
    const versesQuery = `
      SELECT verse_number, text_en, text_fa
      FROM bible_verses 
      WHERE book_id = $1 AND chapter_number = $2
      ORDER BY verse_number
    `;
    const versesResult = await pool.query(versesQuery, [book.id, chapterNum]);
    
    if (versesResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chapter not found' 
      });
    }
    
    // Format verses
    const verses = { en: [], fa: [] };
    for (const verse of versesResult.rows) {
      const index = verse.verse_number - 1;
      verses.en[index] = verse.text_en || `Verse ${verse.verse_number}`;
      verses.fa[index] = verse.text_fa || `آیه ${verse.verse_number}`;
    }
    
    console.log('✅ Found', versesResult.rows.length, 'verses');
    res.json({
      success: true,
      book: {
        key: book.abbreviation,
        name: { en: book.name_en, fa: book.name_fa }
      },
      chapter: chapterNum,
      verses
    });
    
  } catch (error) {
    console.error('❌ Error fetching chapter:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch chapter',
      error: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Bible API',
    database: 'Supabase Connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Bible API running on http://localhost:${PORT}`);
  console.log('📖 Endpoints: /api/bible/books, /api/bible/content/:book/:chapter');
});