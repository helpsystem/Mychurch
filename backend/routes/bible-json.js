/**
 * Bible JSON API - Fallback route that reads from bible_data.json
 * Used when database is unavailable or empty
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to bible_data.json
const BIBLE_JSON_PATH = path.join(__dirname, '..', '..', 'public', 'bible_data.json');

// Cache for Bible data
let bibleDataCache = null;

// Load Bible data from JSON file
function loadBibleData() {
  if (bibleDataCache) return bibleDataCache;
  
  try {
    const rawData = fs.readFileSync(BIBLE_JSON_PATH, 'utf8');
    bibleDataCache = JSON.parse(rawData);
    console.log('✅ Loaded bible_data.json successfully');
    return bibleDataCache;
  } catch (error) {
    console.error('❌ Error loading bible_data.json:', error);
    throw error;
  }
}

/**
 * GET /api/bible-json/books
 * Returns list of all Bible books from JSON
 */
router.get('/books', (req, res) => {
  try {
    const bibleData = loadBibleData();
    
    if (!bibleData || !bibleData.book_info) {
      return res.status(404).json({
        success: false,
        error: 'Bible book information not found'
      });
    }

    // Convert book_info object to array
    const books = Object.entries(bibleData.book_info).map(([code, info]) => ({
      code: code,
      name_en: info.name_en,
      name_fa: info.name_fa,
      testament: info.testament,
      book_order: info.book_number,
      chapters: info.chapters
    }));

    res.json({
      success: true,
      books: books
    });
  } catch (error) {
    console.error('Error fetching books from JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load Bible books'
    });
  }
});

/**
 * GET /api/bible-json/content/:bookCode/:chapter
 * Returns bilingual verses for a specific chapter from JSON
 */
router.get('/content/:bookCode/:chapter', (req, res) => {
  try {
    const { bookCode, chapter } = req.params;
    const chapterNum = parseInt(chapter);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chapter number'
      });
    }

    const bibleData = loadBibleData();
    
    if (!bibleData || !bibleData.verses) {
      return res.status(404).json({
        success: false,
        error: 'Bible verses not found'
      });
    }

    // Find verses for this book and chapter
    const chapterVerses = bibleData.verses.filter(v => 
      v.book_code === bookCode && v.chapter === chapterNum
    );

    if (chapterVerses.length === 0) {
      return res.json({
        success: true,
        bookCode,
        chapter: chapterNum,
        verses: { en: [], fa: [] },
        message: 'No verses found for this chapter'
      });
    }

    // Sort by verse number
    chapterVerses.sort((a, b) => a.verse - b.verse);

    // Get book info
    const bookInfo = bibleData.book_info?.[bookCode];

    res.json({
      success: true,
      bookCode,
      chapter: chapterNum,
      book: {
        name_en: bookInfo?.name_en || bookCode,
        name_fa: bookInfo?.name_fa || bookCode
      },
      verses: {
        en: chapterVerses.map(v => v.text_en || ''),
        fa: chapterVerses.map(v => v.text_fa || '')
      },
      versesData: chapterVerses.map(v => ({
        verseNumber: v.verse,
        text_en: v.text_en || '',
        text_fa: v.text_fa || ''
      }))
    });

    console.log(`✅ Loaded ${chapterVerses.length} verses from JSON for ${bookCode} ${chapterNum}`);
  } catch (error) {
    console.error('Error fetching chapter from JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chapter content'
    });
  }
});

/**
 * GET /api/bible-json/book/:code
 * Returns information about a specific book from JSON
 */
router.get('/book/:code', (req, res) => {
  try {
    const { code } = req.params;
    const bibleData = loadBibleData();
    
    if (!bibleData || !bibleData.book_info) {
      return res.status(404).json({
        success: false,
        error: 'Bible book information not found'
      });
    }

    const bookInfo = bibleData.book_info[code];
    
    if (!bookInfo) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    res.json({
      success: true,
      book: {
        code: code,
        name_en: bookInfo.name_en,
        name_fa: bookInfo.name_fa,
        testament: bookInfo.testament,
        book_order: bookInfo.book_number,
        chapters: bookInfo.chapters
      }
    });
  } catch (error) {
    console.error('Error fetching book from JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load book information'
    });
  }
});

module.exports = router;
