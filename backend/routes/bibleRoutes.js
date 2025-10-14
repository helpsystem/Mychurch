const express = require('express');
const { pool } = require('../db-postgres');
const router = express.Router();

// GET /api/bible/translations - Get all available translations
router.get('/translations', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        code,
        name_fa,
        name_en,
        description_fa,
        description_en,
        language,
        is_active,
        is_default,
        sort_order
      FROM bible_translations 
      WHERE is_active = true
      ORDER BY sort_order, name_fa
    `;
    const result = await pool.query(query);
    
    const translations = result.rows.map(translation => ({
      id: translation.id,
      code: translation.code,
      name: {
        en: translation.name_en,
        fa: translation.name_fa
      },
      description: {
        en: translation.description_en,
        fa: translation.description_fa
      },
      language: translation.language,
      isDefault: translation.is_default,
      sortOrder: translation.sort_order
    }));

    res.json({
      success: true,
      translations: translations
    });
  } catch (error) {
    console.error('❌ Error fetching Bible translations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Bible translations',
      error: error.message 
    });
  }
});

// GET /api/bible/books - Get all Bible books
router.get('/books', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        code,
        name_en,
        name_fa,
        testament,
        chapters_count
      FROM bible_books 
      ORDER BY id
    `;
    const result = await pool.query(query);
    
    // Transform data for frontend format
    const books = result.rows.map(book => ({
      key: book.code,
      name: {
        en: book.name_en,
        fa: book.name_fa
      },
      chapters: book.chapters_count,
      testament: book.testament
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

// GET /api/bible/content/:bookKey/:chapter - Get chapter content
router.get('/content/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    const { translation } = req.query; // Optional translation parameter
    
    // Find book by code, English name, or Farsi name (case-insensitive)
    const bookQuery = `
      SELECT id, name_en, name_fa, code
      FROM bible_books 
      WHERE LOWER(code) = LOWER($1) 
         OR LOWER(name_en) = LOWER($1)
         OR LOWER(name_fa) = LOWER($1)
         OR LOWER($1) = LOWER(REPLACE(name_en, ' ', ''))
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
    
    // Get chapter ID
    const chapterQuery = `
      SELECT id FROM bible_chapters 
      WHERE book_id = $1 AND chapter_number = $2
    `;
    const chapterResult = await pool.query(chapterQuery, [book.id, chapterNum]);
    
    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chapter not found' 
      });
    }
    
    const chapterId = chapterResult.rows[0].id;
    
    // Get translation info or use default
    let translationId = null;
    let selectedTranslation = null;
    
    if (translation) {
      const translationQuery = `
        SELECT id, code, name_fa, name_en
        FROM bible_translations 
        WHERE code = $1 AND is_active = true
      `;
      const translationResult = await pool.query(translationQuery, [translation]);
      
      if (translationResult.rows.length > 0) {
        translationId = translationResult.rows[0].id;
        selectedTranslation = translationResult.rows[0];
      }
    }
    
    // If no specific translation requested, get default translation
    if (!translationId) {
      const defaultTranslationQuery = `
        SELECT id, code, name_fa, name_en
        FROM bible_translations 
        WHERE is_default = true AND is_active = true
        ORDER BY sort_order
        LIMIT 1
      `;
      const defaultResult = await pool.query(defaultTranslationQuery);
      
      if (defaultResult.rows.length > 0) {
        translationId = defaultResult.rows[0].id;
        selectedTranslation = defaultResult.rows[0];
      }
    }
    
    // Get verses from bible_verses table for specific translation
    let versesQuery, versesResult;
    
    if (translationId) {
      versesQuery = `
        SELECT 
          verse_number,
          text_fa,
          text_en
        FROM bible_verses 
        WHERE chapter_id = $1 AND translation_id = $2
        ORDER BY verse_number
      `;
      versesResult = await pool.query(versesQuery, [chapterId, translationId]);
    } else {
      // Fallback to original query for backward compatibility
      versesQuery = `
        SELECT 
          verse_number,
          text_en,
          text_fa
        FROM bible_verses 
        WHERE chapter_id = $1 AND translation_id IS NULL
        ORDER BY verse_number
      `;
      versesResult = await pool.query(versesQuery, [chapterId]);
    }
    
    // Check if verses exist
    if (versesResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No verses available for this chapter and translation yet. Please try another translation.' 
      });
    }
    
    // Transform verses for frontend format
    const verses = {
      en: [],
      fa: []
    };
    
    for (const verse of versesResult.rows) {
      // Ensure we have the right index for the verse number
      const index = verse.verse_number - 1;
      verses.en[index] = verse.text_en || `Verse ${verse.verse_number} (English translation pending)`;
      verses.fa[index] = verse.text_fa || `آیه ${verse.verse_number} (ترجمه فارسی در حال تکمیل)`;
    }
    
    res.json({
      success: true,
      book: {
        key: book.code, // Use standardized code instead of user input
        name: {
          en: book.name_en,
          fa: book.name_fa
        }
      },
      chapter: chapterNum,
      verses: verses,
      translation: selectedTranslation ? {
        code: selectedTranslation.code,
        name: {
          en: selectedTranslation.name_en,
          fa: selectedTranslation.name_fa
        }
      } : null
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

// GET /api/bible/search - Search Bible verses
router.get('/search', async (req, res) => {
  try {
    const { query, lang = 'fa', translation } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const textField = lang === 'en' ? 'text_en' : 'text_fa';
    const nameField = lang === 'en' ? 'name_en' : 'name_fa';
    
    // Build query with optional translation filter
    let searchQuery = `
      SELECT 
        bb.code as book_key,
        bb.${nameField} as book_name,
        bc.chapter_number,
        bv.verse_number,
        bv.${textField} as verse_text,
        bt.name_fa as translation_name,
        bt.code as translation_code
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
      LEFT JOIN bible_translations bt ON bv.translation_id = bt.id
      WHERE LOWER(bv.${textField}) LIKE $1
    `;
    
    const queryParams = [searchTerm];
    
    if (translation) {
      searchQuery += ' AND bt.code = $2';
      queryParams.push(translation);
    }
    
    searchQuery += ` ORDER BY bb.id, bc.chapter_number, bv.verse_number LIMIT 50`;
    
    const result = await pool.query(searchQuery, queryParams);
    
    const searchResults = result.rows.map(row => ({
      bookKey: row.book_key,
      book: row.book_name,
      chapter: row.chapter_number,
      verse: row.verse_number,
      text: row.verse_text,
      translation: row.translation_name && row.translation_code ? {
        code: row.translation_code,
        name: row.translation_name
      } : null
    }));
    
    res.json({
      success: true,
      results: searchResults,
      count: searchResults.length,
      searchParams: {
        query: query,
        language: lang,
        translation: translation || 'all'
      }
    });
    
  } catch (error) {
    console.error('❌ Error searching Bible:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search Bible',
      error: error.message 
    });
  }
});

// GET /api/bible/stats - Get Bible database statistics
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses,
        (SELECT COUNT(*) FROM bible_translations WHERE is_active = true) as total_translations,
        (SELECT COUNT(*) FROM bible_verses WHERE text_fa IS NOT NULL AND text_fa != '') as verses_with_farsi,
        (SELECT COUNT(*) FROM bible_verses WHERE text_en IS NOT NULL AND text_en != '') as verses_with_english
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    // Get translation-specific stats
    const translationStatsQuery = `
      SELECT 
        bt.code,
        bt.name_fa,
        COUNT(bv.id) as verse_count
      FROM bible_translations bt
      LEFT JOIN bible_verses bv ON bt.id = bv.translation_id
      WHERE bt.is_active = true
      GROUP BY bt.id, bt.code, bt.name_fa
      ORDER BY bt.sort_order
    `;
    
    const translationStats = await pool.query(translationStatsQuery);
    
    res.json({
      success: true,
      stats: {
        totalBooks: parseInt(stats.total_books),
        totalChapters: parseInt(stats.total_chapters),
        totalVerses: parseInt(stats.total_verses),
        totalTranslations: parseInt(stats.total_translations),
        versesWithFarsi: parseInt(stats.verses_with_farsi),
        versesWithEnglish: parseInt(stats.verses_with_english),
        completionPercentage: {
          farsi: Math.round((stats.verses_with_farsi / stats.total_verses) * 100),
          english: Math.round((stats.verses_with_english / stats.total_verses) * 100)
        },
        translationStats: translationStats.rows.map(row => ({
          code: row.code,
          name: row.name_fa,
          verseCount: parseInt(row.verse_count)
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Bible stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Bible statistics',
      error: error.message 
    });
  }
});

// GET /api/bible/daily-verses - Get daily verses for worship presentations
router.get('/daily-verses', async (req, res) => {
  try {
    // Get a selection of popular verses for worship presentations
    const versesQuery = `
      SELECT 
        bb.code as book_key,
        bb.name_en,
        bb.name_fa,
        bc.chapter_number,
        bv.verse_number,
        bv.text_en,
        bv.text_fa
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
      WHERE (
        (bb.code = 'John' AND bc.chapter_number = 3 AND bv.verse_number = 16) OR
        (bb.code IN ('Ps', 'Psalm', 'Psalms') AND bc.chapter_number = 23 AND bv.verse_number = 1) OR
        (bb.code = 'Matt' AND bc.chapter_number = 5 AND bv.verse_number = 14) OR
        (bb.code = 'Rom' AND bc.chapter_number = 8 AND bv.verse_number = 28) OR
        (bb.code = 'Phil' AND bc.chapter_number = 4 AND bv.verse_number = 13) OR
        (bb.code = '1Cor' AND bc.chapter_number = 13 AND bv.verse_number = 13) OR
        (bb.code = 'Jer' AND bc.chapter_number = 29 AND bv.verse_number = 11) OR
        (bb.code = 'Prov' AND bc.chapter_number = 3 AND bv.verse_number = 5)
      )
      ORDER BY bb.id, bc.chapter_number, bv.verse_number
    `;
    
    const result = await pool.query(versesQuery);
    
    const verses = result.rows.map(row => ({
      id: `${row.book_key}-${row.chapter_number}-${row.verse_number}`,
      book: ['Ps', 'Psalm', 'Psalms'].includes(row.book_key) ? 'Psalms' : row.book_key,
      chapter: row.chapter_number,
      verse: row.verse_number.toString(),
      text: {
        en: row.text_en || `${row.book_key} ${row.chapter_number}:${row.verse_number} (English translation pending)`,
        fa: row.text_fa || `${row.name_fa} ${row.chapter_number}:${row.verse_number} (ترجمه فارسی در حال تکمیل)`
      },
      version: 'NIV / ترجمه معاصر'
    }));

    // If no verses found in database, return mock data
    if (verses.length === 0) {
      const mockVerses = [
        {
          id: '1',
          book: 'John',
          chapter: 3,
          verse: '16',
          text: {
            en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
            fa: 'زیرا خدا آنقدر جهان را دوست داشت که پسر یگانه خود را داد، تا هر که بر او ایمان آورد هلاک نشود، بلکه حیات جاودانی یابد.'
          },
          version: 'NIV / ترجمه معاصر'
        },
        {
          id: '2',
          book: 'Psalms',
          chapter: 23,
          verse: '1',
          text: {
            en: 'The Lord is my shepherd, I lack nothing.',
            fa: 'خداوند شبان من است، محتاج چیزی نخواهم بود.'
          },
          version: 'NIV / ترجمه معاصر'
        },
        {
          id: '3',
          book: 'Matthew',
          chapter: 5,
          verse: '14',
          text: {
            en: 'You are the light of the world. A town built on a hill cannot be hidden.',
            fa: 'شما نور جهان هستید. شهری که بر کوه واقع است نمی‌تواند پنهان شود.'
          },
          version: 'NIV / ترجمه معاصر'
        }
      ];
      
      res.json({
        success: true,
        verses: mockVerses
      });
    } else {
      res.json({
        success: true,
        verses: verses
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching daily verses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch daily verses',
      error: error.message 
    });
  }
});

// POST /api/bible/import - Import Bible data (for future use with population script)
router.post('/import', async (req, res) => {
  try {
    // This endpoint can be used for importing Bible data
    // For now, return success message
    res.json({
      success: true,
      message: 'Bible import endpoint is ready for implementation'
    });
  } catch (error) {
    console.error('❌ Error in Bible import:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import Bible data',
      error: error.message 
    });
  }
});

module.exports = router;