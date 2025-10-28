require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const BibleDatabaseLoader = require('./loadBibleFromDB');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Bible loader
const bibleLoader = new BibleDatabaseLoader();

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Bible test server is running!' });
});

// GET /api/bible/books
app.get('/api/bible/books', async (req, res) => {
  try {
    const books = await bibleLoader.loadBooks();
    
    const formattedBooks = books.map(book => ({
      key: book.code,
      name: {
        en: book.name_en,
        fa: book.name_fa
      },
      testament: book.testament,
      chapters: 50 // Default
    }));

    res.json({
      success: true,
      books: formattedBooks,
      total: formattedBooks.length
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bible/content/:bookCode/:chapter
app.get('/api/bible/content/:bookCode/:chapter', async (req, res) => {
  try {
    const { bookCode, chapter } = req.params;
    const chapterNum = parseInt(chapter);

    console.log(`📖 Loading ${bookCode} Chapter ${chapterNum}...`);

    const verses = await bibleLoader.loadBilingualChapter(bookCode, chapterNum);

    res.json({
      success: true,
      bookCode,
      chapter: chapterNum,
      verses: {
        en: verses.map(v => v.en),
        fa: verses.map(v => v.fa)
      },
      versesData: verses
    });
  } catch (error) {
    console.error(`Error loading ${req.params.bookCode} ${req.params.chapter}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Bible Test Server running on http://localhost:${PORT}`);
  console.log(`📖 Books: http://localhost:${PORT}/api/bible/books`);
  console.log(`📖 Content: http://localhost:${PORT}/api/bible/content/GEN/1\n`);
}).on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
  }
  process.exit(1);
});
