/**
 * Unified Bible API
 * 
 * Provides REST endpoints for the unified Bible Reader Interface
 * Supports both Simple Mode and Flipbook Mode with bilingual content
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Create a new pool for each request to avoid connection issues
const createPool = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * GET /api/bible-unified/books
 * Get all books with bilingual names
 */
router.get('/books', async (req, res) => {
  const pool = createPool();
  try {
    const query = `
      SELECT code, name_en, name_fa, testament, total_chapters, book_order
      FROM bible_books
      ORDER BY book_order
    `;
    
    const result = await pool.query(query);
    const books = result.rows;

    // Transform to unified format
    const unifiedBooks = books.map(book => ({
      code: book.code,
      number: book.book_order,
      testament: book.testament,
      names: {
        en: book.name_en,
        fa: book.name_fa
      },
      chapterCount: book.total_chapters
    }));

    res.json({
      success: true,
      books: unifiedBooks,
      totalBooks: unifiedBooks.length
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load Bible books',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

/**
 * GET /api/bible-unified/chapter
 * Get complete chapter with bilingual verses
 * Query params: book (code), chapter (number)
 */
router.get('/chapter', async (req, res) => {
  const pool = createPool();
  try {
    const { book, chapter } = req.query;

    if (!book || !chapter) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: book and chapter'
      });
    }

    const bookCode = book.toUpperCase();
    const chapterNum = parseInt(chapter);

    // Get book info
    const bookQuery = `
      SELECT code, name_en, name_fa, testament, total_chapters, book_order
      FROM bible_books
      WHERE code = $1
    `;
    const bookResult = await pool.query(bookQuery, [bookCode]);
    
    if (bookResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const bookInfo = bookResult.rows[0];

    // Get English verses
    const engQuery = `
      SELECT verse_number, verse_text
      FROM verses_eng
      WHERE book_code = $1 AND chapter = $2
      ORDER BY verse_number
    `;
    const engResult = await pool.query(engQuery, [bookCode, chapterNum]);

    // Get Persian verses
    const faQuery = `
      SELECT verse_number, verse_text
      FROM verses_qadim
      WHERE book_code = $1 AND chapter = $2
      ORDER BY verse_number
    `;
    const faResult = await pool.query(faQuery, [bookCode, chapterNum]);

    if (engResult.rows.length === 0 && faResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      });
    }

    // Combine verses
    const unifiedVerses = engResult.rows.map((engVerse, index) => ({
      number: engVerse.verse_number,
      text: {
        en: engVerse.verse_text || '',
        fa: faResult.rows[index]?.verse_text || ''
      },
      id: `${bookCode}-${chapterNum}-${engVerse.verse_number}`
    }));

    res.json({
      success: true,
      chapter: {
        book: {
          code: bookInfo.code,
          number: bookInfo.book_order,
          names: {
            en: bookInfo.name_en,
            fa: bookInfo.name_fa
          }
        },
        chapterNumber: chapterNum,
        verseCount: unifiedVerses.length,
        verses: unifiedVerses
      }
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chapter',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

/**
 * GET /api/bible-unified/verse
 * Get single verse with bilingual text
 * Query params: book, chapter, verse
 */
router.get('/verse', async (req, res) => {
  try {
    const { book, chapter, verse } = req.query;

    if (!book || !chapter || !verse) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: book, chapter, and verse'
      });
    }

    // Get book info
    let bookQuery = supabase.from('bible_books').select('*');
    
    if (isNaN(book)) {
      bookQuery = bookQuery.eq('book_code', book.toUpperCase());
    } else {
      bookQuery = bookQuery.eq('book_number', parseInt(book));
    }

    const { data: bookData, error: bookError } = await bookQuery.single();
    if (bookError || !bookData) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Get verse
    const { data: verseData, error: verseError } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book_code', bookData.book_code)
      .eq('chapter', parseInt(chapter))
      .eq('verse', parseInt(verse))
      .single();

    if (verseError || !verseData) {
      return res.status(404).json({ success: false, error: 'Verse not found' });
    }

    res.json({
      success: true,
      verse: {
        reference: {
          book: {
            code: bookData.book_code,
            names: {
              en: bookData.book_name_en || bookData.book_name,
              fa: bookData.book_name_fa || bookData.book_name
            }
          },
          chapter: parseInt(chapter),
          verse: parseInt(verse)
        },
        text: {
          en: verseData.verse_text_en || verseData.verse_text,
          fa: verseData.verse_text_fa || verseData.verse_text
        },
        id: `${bookData.book_code}-${chapter}-${verse}`
      }
    });
  } catch (error) {
    console.error('Error fetching verse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-unified/search
 * Search verses by keyword (supports both languages)
 * Query params: q (search term), lang (en/fa/both), limit
 */
router.get('/search', async (req, res) => {
  try {
    const { q, lang = 'both', limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing search query parameter: q'
      });
    }

    let query = supabase
      .from('bible_verses')
      .select('*')
      .limit(parseInt(limit));

    // Search based on language
    if (lang === 'en') {
      query = query.ilike('verse_text_en', `%${q}%`);
    } else if (lang === 'fa') {
      query = query.ilike('verse_text_fa', `%${q}%`);
    } else {
      // Search both languages
      query = query.or(`verse_text_en.ilike.%${q}%,verse_text_fa.ilike.%${q}%`);
    }

    const { data: verses, error } = await query;

    if (error) throw error;

    // Get book names for results
    const bookCodes = [...new Set(verses.map(v => v.book_code))];
    const { data: books } = await supabase
      .from('bible_books')
      .select('*')
      .in('book_code', bookCodes);

    const bookMap = {};
    books?.forEach(b => {
      bookMap[b.book_code] = {
        en: b.book_name_en || b.book_name,
        fa: b.book_name_fa || b.book_name
      };
    });

    // Transform results
    const results = verses.map(v => ({
      reference: {
        book: {
          code: v.book_code,
          names: bookMap[v.book_code] || { en: v.book_code, fa: v.book_code }
        },
        chapter: v.chapter,
        verse: v.verse
      },
      text: {
        en: v.verse_text_en || v.verse_text,
        fa: v.verse_text_fa || v.verse_text
      },
      id: `${v.book_code}-${v.chapter}-${v.verse}`
    }));

    res.json({
      success: true,
      query: q,
      language: lang,
      resultCount: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching verses:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-unified/navigation
 * Get navigation info (prev/next chapter)
 * Query params: book, chapter
 */
router.get('/navigation', async (req, res) => {
  try {
    const { book, chapter } = req.query;

    if (!book || !chapter) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Get current book
    let bookQuery = supabase.from('bible_books').select('*');
    
    if (isNaN(book)) {
      bookQuery = bookQuery.eq('book_code', book.toUpperCase());
    } else {
      bookQuery = bookQuery.eq('book_number', parseInt(book));
    }

    const { data: currentBook } = await bookQuery.single();
    
    if (!currentBook) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const currentChapter = parseInt(chapter);
    let prevChapter = null;
    let nextChapter = null;

    // Previous chapter
    if (currentChapter > 1) {
      prevChapter = {
        book: currentBook.book_code,
        chapter: currentChapter - 1
      };
    } else if (currentBook.book_number > 1) {
      // Get previous book's last chapter
      const { data: prevBook } = await supabase
        .from('bible_books')
        .select('*')
        .eq('book_number', currentBook.book_number - 1)
        .single();
      
      if (prevBook && prevBook.chapter_count) {
        prevChapter = {
          book: prevBook.book_code,
          chapter: prevBook.chapter_count
        };
      }
    }

    // Next chapter
    if (currentChapter < currentBook.chapter_count) {
      nextChapter = {
        book: currentBook.book_code,
        chapter: currentChapter + 1
      };
    } else {
      // Get next book's first chapter
      const { data: nextBook } = await supabase
        .from('bible_books')
        .select('*')
        .eq('book_number', currentBook.book_number + 1)
        .single();
      
      if (nextBook) {
        nextChapter = {
          book: nextBook.book_code,
          chapter: 1
        };
      }
    }

    res.json({
      success: true,
      navigation: {
        current: {
          book: currentBook.book_code,
          chapter: currentChapter
        },
        previous: prevChapter,
        next: nextChapter
      }
    });
  } catch (error) {
    console.error('Error getting navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
