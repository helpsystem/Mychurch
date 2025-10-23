/**
 * Simplified Bible Unified API with Mock Data
 * Using mock data to avoid database connection issues
 */

const express = require('express');
const router = express.Router();

// Mock Bible books data
const MOCK_BOOKS = [
  { code: 'GEN', number: 1, testament: 'OT', names: { en: 'Genesis', fa: 'پیدایش' }, chapterCount: 50 },
  { code: 'EXO', number: 2, testament: 'OT', names: { en: 'Exodus', fa: 'خروج' }, chapterCount: 40 },
  { code: 'LEV', number: 3, testament: 'OT', names: { en: 'Leviticus', fa: 'لاویان' }, chapterCount: 27 },
  { code: 'MAT', number: 40, testament: 'NT', names: { en: 'Matthew', fa: 'متی' }, chapterCount: 28 },
  { code: 'JHN', number: 43, testament: 'NT', names: { en: 'John', fa: 'یوحنا' }, chapterCount: 21 }
];

// Mock verse data for Genesis 1
const MOCK_GENESIS_1 = [
  { number: 1, text: { en: 'In the beginning God created the heaven and the earth.', fa: 'در ابتدا خدا آسمان‌ها و زمین را آفرید.' } },
  { number: 2, text: { en: 'And the earth was without form, and void; and darkness was upon the face of the deep.', fa: 'و زمین بی‌شکل و خالی بود و تاریکی بر روی ژرفنا بود.' } },
  { number: 3, text: { en: 'And God said, Let there be light: and there was light.', fa: 'و خدا گفت: نور بشود، و نور شد.' } }
];

/**
 * GET /api/bible-unified/books
 */
router.get('/books', async (req, res) => {
  try {
    res.json({
      success: true,
      books: MOCK_BOOKS,
      totalBooks: MOCK_BOOKS.length
    });
  } catch (error) {
    console.error('Error in /books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load books'
    });
  }
});

/**
 * GET /api/bible-unified/chapter
 */
router.get('/chapter', async (req, res) => {
  try {
    const { book, chapter } = req.query;

    if (!book || !chapter) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters'
      });
    }

    const bookCode = book.toUpperCase();
    const bookInfo = MOCK_BOOKS.find(b => b.code === bookCode);

    if (!bookInfo) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const verses = MOCK_GENESIS_1.map(v => ({
      ...v,
      id: `${bookCode}-${chapter}-${v.number}`
    }));

    res.json({
      success: true,
      chapter: {
        book: bookInfo,
        chapterNumber: parseInt(chapter),
        verseCount: verses.length,
        verses
      }
    });
  } catch (error) {
    console.error('Error in /chapter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chapter'
    });
  }
});

// Placeholder for other endpoints
router.get('/verse', (req, res) => {
  res.json({ success: false, error: 'Not implemented' });
});

router.get('/search', (req, res) => {
  res.json({ success: false, error: 'Not implemented', results: [] });
});

router.get('/navigation', (req, res) => {
  res.json({ success: false, error: 'Not implemented' });
});

module.exports = router;
