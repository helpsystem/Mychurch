require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err));

// Bible Routes
app.get('/api/bible/books', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        book_number,
        name_en,
        name_fa,
        abbreviation,
        testament,
        chapters_count
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
      chapters: book.chapters_count,
      testament: book.testament,
      bookNumber: book.book_number
    }));

    res.json({
      success: true,
      books: books
    });
  } catch (error) {
    console.error('❌ Error fetching Bible books:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Bible books',
      error: error.message 
    });
  }
});

app.get('/api/bible/content/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    
    // Find book
    const bookQuery = `
      SELECT id, name_en, name_fa, book_number, abbreviation
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
    
    // Get verses directly from bible_verses table
    const versesQuery = `
      SELECT 
        verse_number,
        text_en,
        text_fa
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
    
    // Transform verses for frontend
    const verses = {
      en: [],
      fa: []
    };
    
    for (const verse of versesResult.rows) {
      const index = verse.verse_number - 1;
      verses.en[index] = verse.text_en || `Verse ${verse.verse_number} (English translation pending)`;
      verses.fa[index] = verse.text_fa || `آیه ${verse.verse_number} (ترجمه فارسی در حال تکمیل)`;
    }
    
    res.json({
      success: true,
      book: {
        key: book.abbreviation,
        name: {
          en: book.name_en,
          fa: book.name_fa
        }
      },
      chapter: chapterNum,
      verses: verses
    });
    
  } catch (error) {
    console.error('❌ Error fetching Bible chapter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Bible chapter',
      error: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bible API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Bible API Server running on http://localhost:${PORT}`);
  console.log('📖 Available endpoints:');
  console.log('  GET /api/bible/books - Get all Bible books');
  console.log('  GET /api/bible/content/:book/:chapter - Get chapter content');
  console.log('  GET /api/health - Health check');
});