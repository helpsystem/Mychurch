const express = require('express');
const router = express.Router();
const BibleDatabaseLoader = require('../loadBibleFromDB');

// Initialize database loader
const bibleLoader = new BibleDatabaseLoader();

/**
 * GET /api/bible/books
 * Returns list of all Bible books
 */
router.get('/books', async (req, res) => {
  try {
    const books = await bibleLoader.loadBooks();
    res.json({
      success: true,
      books: books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load Bible books'
    });
  }
});

/**
 * GET /api/bible/book/:code
 * Returns information about a specific book
 */
router.get('/book/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const book = await bibleLoader.getBookInfo(code);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    res.json({
      success: true,
      book: book
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load book information'
    });
  }
});

/**
 * GET /api/bible/content/:bookCode/:chapter
 * Returns bilingual verses for a specific chapter
 * Query params: 
 *   - translation: 'qadim' | 'mojdeh' | 'tafsiri' | 'eng' (default: both en+fa)
 */
router.get('/content/:bookCode/:chapter', async (req, res) => {
  try {
    const { bookCode, chapter } = req.params;
    const { translation } = req.query;

    // Validate inputs
    const chapterNum = parseInt(chapter);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chapter number'
      });
    }

    let verses;
    
    // If specific translation requested
    if (translation && translation !== 'bilingual') {
      verses = await bibleLoader.loadChapterVerses(bookCode, chapterNum, translation);
      
      return res.json({
        success: true,
        bookCode,
        chapter: chapterNum,
        translation,
        verses: verses.map(v => v.verse_text),
        versesData: verses
      });
    }

    // Default: Load bilingual (English + Persian)
    verses = await bibleLoader.loadBilingualChapter(bookCode, chapterNum);
    
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
    console.error('Error fetching chapter content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chapter content'
    });
  }
});

/**
 * GET /api/bible/verse/:bookCode/:chapter/:verse
 * Returns a specific verse
 */
router.get('/verse/:bookCode/:chapter/:verse', async (req, res) => {
  try {
    const { bookCode, chapter, verse } = req.params;
    const { translation = 'bilingual' } = req.query;

    const chapterNum = parseInt(chapter);
    const verseNum = parseInt(verse);

    if (isNaN(chapterNum) || isNaN(verseNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chapter or verse number'
      });
    }

    if (translation === 'bilingual') {
      const verses = await bibleLoader.loadBilingualChapter(bookCode, chapterNum);
      const targetVerse = verses.find(v => v.verse_number === verseNum);

      if (!targetVerse) {
        return res.status(404).json({
          success: false,
          error: 'Verse not found'
        });
      }

      return res.json({
        success: true,
        verse: targetVerse
      });
    }

    // Single translation
    const verses = await bibleLoader.loadChapterVerses(bookCode, chapterNum, translation);
    const targetVerse = verses.find(v => v.verse_number === verseNum);

    if (!targetVerse) {
      return res.status(404).json({
        success: false,
        error: 'Verse not found'
      });
    }

    res.json({
      success: true,
      verse: targetVerse
    });
  } catch (error) {
    console.error('Error fetching verse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load verse'
    });
  }
});

/**
 * GET /api/bible/search
 * Search Bible verses
 * Query params:
 *   - q: search query
 *   - translation: qadim | mojdeh | tafsiri | eng
 *   - book: optional book code filter
 */
router.get('/search', async (req, res) => {
  try {
    const { q, translation = 'qadim', book } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    // Simple search implementation (can be enhanced)
    const tableName = `verses_${translation}`;
    let query = `
      SELECT 
        id, book_code, chapter, verse_number, verse_text
      FROM ${tableName}
      WHERE verse_text ILIKE $1
      ${book ? 'AND book_code = $2' : ''}
      ORDER BY book_code, chapter, verse_number
      LIMIT 50;
    `;

    const params = book 
      ? [`%${q}%`, book]
      : [`%${q}%`];

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query(query, params);

    res.json({
      success: true,
      results: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching verses:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;
