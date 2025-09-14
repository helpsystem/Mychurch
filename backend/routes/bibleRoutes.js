const express = require('express');
const { pool } = require('../db-postgres');
const router = express.Router();

// GET /api/bible/books - Get all Bible books
router.get('/books', async (req, res) => {
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
    
    // Transform data for frontend format
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

// GET /api/bible/content/:bookKey/:chapter - Get chapter content
router.get('/content/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    
    // Find book by abbreviation, English name, or Farsi name (case-insensitive)
    const bookQuery = `
      SELECT id, name_en, name_fa, book_number, abbreviation
      FROM bible_books 
      WHERE LOWER(abbreviation) = LOWER($1) 
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
    
    // Get chapter info
    const chapterQuery = `
      SELECT id, verses_count
      FROM bible_chapters 
      WHERE book_id = $1 AND chapter_number = $2
    `;
    const chapterResult = await pool.query(chapterQuery, [book.id, chapterNum]);
    
    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chapter not found' 
      });
    }
    
    const chapterInfo = chapterResult.rows[0];
    
    // Get verses
    const versesQuery = `
      SELECT 
        verse_number,
        text_en,
        text_fa
      FROM bible_verses 
      WHERE chapter_id = $1 
      ORDER BY verse_number
    `;
    const versesResult = await pool.query(versesQuery, [chapterInfo.id]);
    
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
        key: bookKey,
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

// GET /api/bible/search - Search Bible verses
router.get('/search', async (req, res) => {
  try {
    const { query, lang = 'fa' } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const textField = lang === 'en' ? 'text_en' : 'text_fa';
    const nameField = lang === 'en' ? 'name_en' : 'name_fa';
    
    const searchQuery = `
      SELECT 
        bb.abbreviation as book_key,
        bb.${nameField} as book_name,
        bc.chapter_number,
        bv.verse_number,
        bv.${textField} as verse_text
      FROM bible_verses bv
      JOIN bible_chapters bc ON bv.chapter_id = bc.id
      JOIN bible_books bb ON bc.book_id = bb.id
      WHERE LOWER(bv.${textField}) LIKE $1
      ORDER BY bb.book_number, bc.chapter_number, bv.verse_number
      LIMIT 50
    `;
    
    const result = await pool.query(searchQuery, [searchTerm]);
    
    const searchResults = result.rows.map(row => ({
      bookKey: row.book_key,
      book: row.book_name,
      chapter: row.chapter_number,
      verse: row.verse_number,
      text: row.verse_text
    }));
    
    res.json({
      success: true,
      results: searchResults,
      count: searchResults.length
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
        (SELECT COUNT(*) FROM bible_verses WHERE text_fa IS NOT NULL AND text_fa != '') as verses_with_farsi,
        (SELECT COUNT(*) FROM bible_verses WHERE text_en IS NOT NULL AND text_en != '') as verses_with_english
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      stats: {
        totalBooks: parseInt(stats.total_books),
        totalChapters: parseInt(stats.total_chapters),
        totalVerses: parseInt(stats.total_verses),
        versesWithFarsi: parseInt(stats.verses_with_farsi),
        versesWithEnglish: parseInt(stats.verses_with_english),
        completionPercentage: {
          farsi: Math.round((stats.verses_with_farsi / stats.total_verses) * 100),
          english: Math.round((stats.verses_with_english / stats.total_verses) * 100)
        }
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
        bb.abbreviation as book_key,
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
        (bb.abbreviation = 'John' AND bc.chapter_number = 3 AND bv.verse_number = 16) OR
        (bb.abbreviation = 'Psalm' AND bc.chapter_number = 23 AND bv.verse_number = 1) OR
        (bb.abbreviation = 'Matt' AND bc.chapter_number = 5 AND bv.verse_number = 14) OR
        (bb.abbreviation = 'Rom' AND bc.chapter_number = 8 AND bv.verse_number = 28) OR
        (bb.abbreviation = 'Phil' AND bc.chapter_number = 4 AND bv.verse_number = 13) OR
        (bb.abbreviation = '1Cor' AND bc.chapter_number = 13 AND bv.verse_number = 13) OR
        (bb.abbreviation = 'Jer' AND bc.chapter_number = 29 AND bv.verse_number = 11) OR
        (bb.abbreviation = 'Prov' AND bc.chapter_number = 3 AND bv.verse_number = 5)
      )
      ORDER BY bb.book_number, bc.chapter_number, bv.verse_number
    `;
    
    const result = await pool.query(versesQuery);
    
    const verses = result.rows.map(row => ({
      id: `${row.book_key}-${row.chapter_number}-${row.verse_number}`,
      book: row.book_key === 'Psalm' ? 'Psalms' : row.book_key,
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