const express = require('express');
const { pool } = require('../db-postgres');
// ❌ Supabase disabled - using local PostgreSQL only
// const supabaseClient = require('../supabase-client');
const supabaseClient = null; // Disabled
const router = express.Router();

// Mock data generator for when database is unavailable
function generateMockBibleBooks() {
  return [
    // Old Testament
    { key: 'GEN', name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50, testament: 'OT' },
    { key: 'EXO', name: { en: 'Exodus', fa: 'خروج' }, chapters: 40, testament: 'OT' },
    { key: 'LEV', name: { en: 'Leviticus', fa: 'لاویان' }, chapters: 27, testament: 'OT' },
    { key: 'NUM', name: { en: 'Numbers', fa: 'اعداد' }, chapters: 36, testament: 'OT' },
    { key: 'DEU', name: { en: 'Deuteronomy', fa: 'تثنیه' }, chapters: 34, testament: 'OT' },
    { key: 'JOS', name: { en: 'Joshua', fa: 'یوشع' }, chapters: 24, testament: 'OT' },
    { key: 'JDG', name: { en: 'Judges', fa: 'داوران' }, chapters: 21, testament: 'OT' },
    { key: 'RUT', name: { en: 'Ruth', fa: 'روت' }, chapters: 4, testament: 'OT' },
    { key: '1SA', name: { en: '1 Samuel', fa: 'اول سموئیل' }, chapters: 31, testament: 'OT' },
    { key: '2SA', name: { en: '2 Samuel', fa: 'دوم سموئیل' }, chapters: 24, testament: 'OT' },
    { key: '1KI', name: { en: '1 Kings', fa: 'اول پادشاهان' }, chapters: 22, testament: 'OT' },
    { key: '2KI', name: { en: '2 Kings', fa: 'دوم پادشاهان' }, chapters: 25, testament: 'OT' },
    { key: '1CH', name: { en: '1 Chronicles', fa: 'اول تواریخ' }, chapters: 29, testament: 'OT' },
    { key: '2CH', name: { en: '2 Chronicles', fa: 'دوم تواریخ' }, chapters: 36, testament: 'OT' },
    { key: 'EZR', name: { en: 'Ezra', fa: 'عزرا' }, chapters: 10, testament: 'OT' },
    { key: 'NEH', name: { en: 'Nehemiah', fa: 'نحمیا' }, chapters: 13, testament: 'OT' },
    { key: 'EST', name: { en: 'Esther', fa: 'استر' }, chapters: 10, testament: 'OT' },
    { key: 'JOB', name: { en: 'Job', fa: 'ایوب' }, chapters: 42, testament: 'OT' },
    { key: 'PSA', name: { en: 'Psalms', fa: 'مزامیر' }, chapters: 150, testament: 'OT' },
    { key: 'PRO', name: { en: 'Proverbs', fa: 'امثال' }, chapters: 31, testament: 'OT' },
    { key: 'ECC', name: { en: 'Ecclesiastes', fa: 'جامعه' }, chapters: 12, testament: 'OT' },
    { key: 'SNG', name: { en: 'Song of Solomon', fa: 'غزل غزلها' }, chapters: 8, testament: 'OT' },
    { key: 'ISA', name: { en: 'Isaiah', fa: 'اشعیا' }, chapters: 66, testament: 'OT' },
    { key: 'JER', name: { en: 'Jeremiah', fa: 'ارمیا' }, chapters: 52, testament: 'OT' },
    { key: 'LAM', name: { en: 'Lamentations', fa: 'مراثی ارمیا' }, chapters: 5, testament: 'OT' },
    { key: 'EZK', name: { en: 'Ezekiel', fa: 'حزقیال' }, chapters: 48, testament: 'OT' },
    { key: 'DAN', name: { en: 'Daniel', fa: 'دانیال' }, chapters: 12, testament: 'OT' },
    { key: 'HOS', name: { en: 'Hosea', fa: 'هوشع' }, chapters: 14, testament: 'OT' },
    { key: 'JOL', name: { en: 'Joel', fa: 'یوئیل' }, chapters: 3, testament: 'OT' },
    { key: 'AMO', name: { en: 'Amos', fa: 'عاموس' }, chapters: 9, testament: 'OT' },
    { key: 'OBA', name: { en: 'Obadiah', fa: 'عوبدیا' }, chapters: 1, testament: 'OT' },
    { key: 'JON', name: { en: 'Jonah', fa: 'یونس' }, chapters: 4, testament: 'OT' },
    { key: 'MIC', name: { en: 'Micah', fa: 'میخا' }, chapters: 7, testament: 'OT' },
    { key: 'NAM', name: { en: 'Nahum', fa: 'ناحوم' }, chapters: 3, testament: 'OT' },
    { key: 'HAB', name: { en: 'Habakkuk', fa: 'حبقوق' }, chapters: 3, testament: 'OT' },
    { key: 'ZEP', name: { en: 'Zephaniah', fa: 'صفنیا' }, chapters: 3, testament: 'OT' },
    { key: 'HAG', name: { en: 'Haggai', fa: 'حجی' }, chapters: 2, testament: 'OT' },
    { key: 'ZEC', name: { en: 'Zechariah', fa: 'زکریا' }, chapters: 14, testament: 'OT' },
    { key: 'MAL', name: { en: 'Malachi', fa: 'ملاکی' }, chapters: 4, testament: 'OT' },
    // New Testament
    { key: 'MAT', name: { en: 'Matthew', fa: 'متی' }, chapters: 28, testament: 'NT' },
    { key: 'MRK', name: { en: 'Mark', fa: 'مرقس' }, chapters: 16, testament: 'NT' },
    { key: 'LUK', name: { en: 'Luke', fa: 'لوقا' }, chapters: 24, testament: 'NT' },
    { key: 'JHN', name: { en: 'John', fa: 'یوحنا' }, chapters: 21, testament: 'NT' },
    { key: 'ACT', name: { en: 'Acts', fa: 'اعمال رسولان' }, chapters: 28, testament: 'NT' },
    { key: 'ROM', name: { en: 'Romans', fa: 'رومیان' }, chapters: 16, testament: 'NT' },
    { key: '1CO', name: { en: '1 Corinthians', fa: 'اول قرنتیان' }, chapters: 16, testament: 'NT' },
    { key: '2CO', name: { en: '2 Corinthians', fa: 'دوم قرنتیان' }, chapters: 13, testament: 'NT' },
    { key: 'GAL', name: { en: 'Galatians', fa: 'غلاطیان' }, chapters: 6, testament: 'NT' },
    { key: 'EPH', name: { en: 'Ephesians', fa: 'افسسیان' }, chapters: 6, testament: 'NT' },
    { key: 'PHP', name: { en: 'Philippians', fa: 'فیلیپیان' }, chapters: 4, testament: 'NT' },
    { key: 'COL', name: { en: 'Colossians', fa: 'کولسیان' }, chapters: 4, testament: 'NT' },
    { key: '1TH', name: { en: '1 Thessalonians', fa: 'اول تسالونیکیان' }, chapters: 5, testament: 'NT' },
    { key: '2TH', name: { en: '2 Thessalonians', fa: 'دوم تسالونیکیان' }, chapters: 3, testament: 'NT' },
    { key: '1TI', name: { en: '1 Timothy', fa: 'اول تیموتاؤس' }, chapters: 6, testament: 'NT' },
    { key: '2TI', name: { en: '2 Timothy', fa: 'دوم تیموتاؤس' }, chapters: 4, testament: 'NT' },
    { key: 'TIT', name: { en: 'Titus', fa: 'تیطس' }, chapters: 3, testament: 'NT' },
    { key: 'PHM', name: { en: 'Philemon', fa: 'فلیمون' }, chapters: 1, testament: 'NT' },
    { key: 'HEB', name: { en: 'Hebrews', fa: 'عبرانیان' }, chapters: 13, testament: 'NT' },
    { key: 'JAS', name: { en: 'James', fa: 'یعقوب' }, chapters: 5, testament: 'NT' },
    { key: '1PE', name: { en: '1 Peter', fa: 'اول پطرس' }, chapters: 5, testament: 'NT' },
    { key: '2PE', name: { en: '2 Peter', fa: 'دوم پطرس' }, chapters: 3, testament: 'NT' },
    { key: '1JN', name: { en: '1 John', fa: 'اول یوحنا' }, chapters: 5, testament: 'NT' },
    { key: '2JN', name: { en: '2 John', fa: 'دوم یوحنا' }, chapters: 1, testament: 'NT' },
    { key: '3JN', name: { en: '3 John', fa: 'سوم یوحنا' }, chapters: 1, testament: 'NT' },
    { key: 'JUD', name: { en: 'Jude', fa: 'یهودا' }, chapters: 1, testament: 'NT' },
    { key: 'REV', name: { en: 'Revelation', fa: 'مکاشفه' }, chapters: 22, testament: 'NT' }
  ];
}

// Generate mock verses for testing
function generateMockVerses(bookKey, chapter) {
  // Sample verses based on Genesis 1 as template
  const sampleVerses = {
    fa: [
      'در ابتدا خدا آسمان و زمین را آفرید.',
      'و زمین خراب و خالی بود و تاریکی بر روی عمق ها بود و روح خدا بر روی آبها حرکت می کرد.',
      'و خدا گفت: نور بشود. و نور شد.',
      'و خدا نور را دید که نیکو است و خدا در میان نور و تاریکی جدایی انداخت.',
      'و خدا نور را روز نامید و تاریکی را شب نامید. و شام بود و صبح شد روز اول.',
      'و خدا گفت: فلکی در میان آبها باشد و در میان آبها جدایی بیندازد.',
      'پس خدا فلک را ساخت و میان آبهایی که زیر فلک است و آبهایی که بالای فلک است جدایی انداخت و چنین شد.',
      'و خدا فلک را آسمان نامید و شام بود و صبح شد روز دوم.',
      'و خدا گفت: آبهایی که زیر آسمان است در یک موضع جمع بشود و خشکی ظاهر گردد. و چنین شد.',
      'و خدا خشکی را زمین نامید و اجتماع آبها را دریا نامید. و خدا دید که نیکو است.'
    ],
    en: [
      'In the beginning God created the heavens and the earth.',
      'The earth was formless and empty. Darkness was on the surface of the deep. Gods Spirit was hovering over the surface of the waters.',
      'God said, "Let there be light," and there was light.',
      'God saw the light, and saw that it was good. God divided the light from the darkness.',
      'God called the light "day," and the darkness he called "night." There was evening and there was morning, one day.',
      'God said, "Let there be an expanse in the middle of the waters, and let it divide the waters from the waters."',
      'God made the expanse, and divided the waters which were under the expanse from the waters which were above the expanse; and it was so.',
      'God called the expanse "sky." There was evening and there was morning, a second day.',
      'God said, "Let the waters under the sky be gathered together to one place, and let the dry land appear;" and it was so.',
      'God called the dry land "earth," and the gathering together of the waters he called "seas." God saw that it was good.'
    ]
  };

  // Return appropriate number of verses (or cycle through if needed)
  const verseCount = Math.min(31, sampleVerses.fa.length); // Most chapters have ~31 verses
  const faVerses = [];
  const enVerses = [];

  for (let i = 0; i < verseCount; i++) {
    faVerses.push(sampleVerses.fa[i % sampleVerses.fa.length]);
    enVerses.push(sampleVerses.en[i % sampleVerses.en.length]);
  }

  return { fa: faVerses, en: enVerses };
}


// GET /api/bible/translations - Get all available translations
router.get('/translations', async (req, res) => {
  try {
    // Check if database is available
    if (!pool || typeof pool.query !== 'function') {
      console.log('⚠️  Using mock Bible translations (no database)');
      return res.json({
        success: true,
        translations: [
          {
            id: 1,
            code: 'qadim',
            name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' },
            description: { en: 'Traditional Persian translation', fa: 'ترجمه سنتی فارسی' },
            language: 'fa',
            isDefault: true,
            sortOrder: 1
          },
          {
            id: 2,
            code: 'mojdeh',
            name: { en: 'Good News Persian', fa: 'مژده فارسی' },
            description: { en: 'Modern Persian translation', fa: 'ترجمه مدرن فارسی' },
            language: 'fa',
            isDefault: false,
            sortOrder: 2
          },
          {
            id: 3,
            code: 'tafsiri',
            name: { en: 'Persian Explanatory', fa: 'تفسیری فارسی' },
            description: { en: 'Explanatory Persian translation', fa: 'ترجمه تفسیری فارسی' },
            language: 'fa',
            isDefault: false,
            sortOrder: 3
          }
        ]
      });
    }

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
    // Return mock data as fallback
    res.json({
      success: true,
      translations: [
        {
          id: 1,
          code: 'qadim',
          name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' },
          description: { en: 'Traditional Persian translation', fa: 'ترجمه سنتی فارسی' },
          language: 'fa',
          isDefault: true,
          sortOrder: 1
        },
        {
          id: 2,
          code: 'mojdeh',
          name: { en: 'Good News Persian', fa: 'مژده فارسی' },
          description: { en: 'Modern Persian translation', fa: 'ترجمه مدرن فارسی' },
          language: 'fa',
          isDefault: false,
          sortOrder: 2
        }
      ]
    });
  }
});

// GET /api/bible/books - Get all Bible books
router.get('/books', async (req, res) => {
  try {
    // Try Supabase Client first (uses HTTPS, bypasses port 5432 block)
    if (supabaseClient) {
      try {
        const books = await supabaseClient.getBibleBooks();

        // Transform to frontend format
        const formattedBooks = books.map(book => ({
          key: book.book_iso,
          name: {
            en: book.book_name,
            fa: book.book_name_fa
          },
          chapters: 50, // Default, will be calculated properly later
          testament: book.testament
        }));

        console.log('✅ Bible books fetched via Supabase Client (HTTPS)');
        return res.json({
          success: true,
          books: formattedBooks,
          total: formattedBooks.length
        });
      } catch (supabaseError) {
        console.error('⚠️  Supabase Client error:', supabaseError.message);
      }
    }

    // Check if database is available
    if (!pool || typeof pool.query !== 'function') {
      console.log('⚠️  Using mock Bible books (no database)');
      return res.json({
        success: true,
        books: generateMockBibleBooks(),
        total: 66
      });
    }

    const query = `
      SELECT 
        id,
        book_iso as code,
        book_name as name_en,
        book_name_fa as name_fa,
        testament,
        50 as chapters_count
      FROM bible_books 
      ORDER BY book_number
    `;
    const result = await pool.query(query);

    // Old Testament books (39 books)
    const OT_BOOKS = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'];

    // Transform data for frontend format
    const books = result.rows.map(book => {
      // Determine testament based on book code if not provided
      const testament = book.testament || (OT_BOOKS.includes(book.code) ? 'OT' : 'NT');

      return {
        key: book.code,
        name: {
          en: book.name_en,
          fa: book.name_fa
        },
        chapters: book.chapters_count,
        testament: testament
      };
    });

    res.json({
      success: true,
      books: books,
      total: books.length
    });
  } catch (error) {
    console.error('❌ Error fetching Bible books:', error);
    // Return mock data as fallback
    res.json({
      success: true,
      books: generateMockBibleBooks(),
      total: 66
    });
  }
});

// GET /api/bible/content/:bookKey/:chapter - Get chapter content
router.get('/content/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    const { faTranslation = 'qadim' } = req.query; // Persian translation: qadim | mojdeh | tafsiri

    // Map Persian translation names to translation IDs
    const translationMap = {
      'qadim': 2,    // ترجمه قدیم
      'mojdeh': 1,   // مژده
      'tafsiri': 3   // تفسیری (OT only)
    };

    const persianTransId = translationMap[faTranslation] || 2; // Default to qadim

    // ✅ Try PostgreSQL pool FIRST (local database)
    if (pool && typeof pool.query === 'function') {
      try {
        console.log(`📖 Fetching verses via Supabase Client: ${bookKey} chapter ${chapter} (FA: ${faTranslation})`);

        // Get book info first
        const books = await supabaseClient.getBibleBooks();
        const book = books.find(b =>
          b.book_iso.toLowerCase() === bookKey.toLowerCase() ||
          b.book_name.toLowerCase() === bookKey.toLowerCase() ||
          b.book_name_fa === bookKey
        );

        if (!book) {
          return res.status(404).json({
            success: false,
            message: 'Bible book not found'
          });
        }

        // Fetch English (NET - translation 8) + Selected Persian translation
        let verses = [];
        let translationUsed = null;

        try {
          const [trans8Verses, transFaVerses] = await Promise.all([
            supabaseClient.getVerses(book.book_iso, parseInt(chapter), 8).catch(() => []),      // English NET
            supabaseClient.getVerses(book.book_iso, parseInt(chapter), persianTransId).catch(() => [])  // Persian selected
          ]);

          if (trans8Verses.length > 0 || transFaVerses.length > 0) {
            // Merge both translations
            const maxVerses = Math.max(trans8Verses.length, transFaVerses.length);
            for (let i = 0; i < maxVerses; i++) {
              verses.push({
                verse_number: (trans8Verses[i]?.verse_number || transFaVerses[i]?.verse_number || i + 1),
                text_en: trans8Verses[i]?.text_en || trans8Verses[i]?.text_fa || '',
                text_fa: transFaVerses[i]?.text_fa || transFaVerses[i]?.text_en || ''
              });
            }
            translationUsed = `NET + ${faTranslation}`;
          }
        } catch (err) {
          console.log(`⚠️ Translation 8/${persianTransId} failed, trying fallback...`);
        }

        // Fallback: try qadim if selected translation failed
        if (verses.length === 0 && faTranslation !== 'qadim') {
          try {
            const [trans8Verses, trans2Verses] = await Promise.all([
              supabaseClient.getVerses(book.book_iso, parseInt(chapter), 8).catch(() => []),
              supabaseClient.getVerses(book.book_iso, parseInt(chapter), 2).catch(() => [])
            ]);

            const maxVerses = Math.max(trans8Verses.length, trans2Verses.length);
            for (let i = 0; i < maxVerses; i++) {
              verses.push({
                verse_number: (trans8Verses[i]?.verse_number || trans2Verses[i]?.verse_number || i + 1),
                text_en: trans8Verses[i]?.text_en || '',
                text_fa: trans2Verses[i]?.text_fa || ''
              });
            }
            translationUsed = 'NET + qadim (fallback)';
          } catch { }
        }

        // Final fallback: mojdeh
        if (verses.length === 0) {
          verses = await supabaseClient.getVerses(book.book_iso, parseInt(chapter), 1);
          translationUsed = 'mojdeh (final fallback)';
        }

        // Transform to frontend format
        const versesFormatted = {
          en: [],
          fa: []
        };

        for (const verse of verses) {
          const index = verse.verse_number - 1;
          versesFormatted.fa[index] = verse.text_fa || '';
          versesFormatted.en[index] = verse.text_en || '';
        }

        console.log(`✅ Bible verses fetched via Supabase Client (HTTPS) - ${verses.length} verses (${translationUsed})`);

        // Translation metadata
        const translationNames = {
          'qadim': { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' },
          'mojdeh': { en: 'Good News Persian', fa: 'مژده فارسی' },
          'tafsiri': { en: 'Persian Explanatory', fa: 'تفسیری فارسی' }
        };


        // Construct audio and timing URLs (pointing to local static files)
        // We use QADIM as the standard for audio/timing currently
        const audioUrl = `/bible_data/audio/QADIM/${book.book_iso}/${parseInt(chapter)}.mp3`;
        const timingUrl = `/bible_data/timestamps/QADIM/${book.book_iso}/${parseInt(chapter)}.json`;

        return res.json({
          success: true,
          book: {
            key: book.book_iso,
            name: {
              en: book.book_name,
              fa: book.book_name_fa
            }
          },
          chapter: parseInt(chapter),
          verses: versesFormatted,
          audioUrl: audioUrl,
          timingUrl: timingUrl,
          translations: {
            en: { code: 'NET', name: { en: 'New English Translation', fa: 'ترجمه نوین انگلیسی' } },
            fa: { code: faTranslation, name: translationNames[faTranslation] || translationNames['qadim'] }
          },
          translationUsed: translationUsed
        });
      } catch (supabaseError) {
        console.error('⚠️  Supabase Client error:', supabaseError.message);
        // Fall through to try pool connection
      }
    }

    // Check if database is available
    if (!pool || typeof pool.query !== 'function') {
      console.log('⚠️  Using mock Bible verses (no database)');
      const mockVerses = generateMockVerses(bookKey, parseInt(chapter));
      return res.json({
        success: true,
        book: { key: bookKey, name: { en: bookKey, fa: bookKey } },
        chapter: parseInt(chapter),
        verses: mockVerses,
        translation: { code: 'qadim', name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' } },
        usingMockData: true
      });
    }

    try {
      // Find book by code, English name, or Farsi name (case-insensitive)
      const bookQuery = `
        SELECT id, book_name as name_en, book_name_fa as name_fa, book_iso as code
        FROM bible_books 
        WHERE LOWER(book_iso) = LOWER($1) 
           OR LOWER(book_name) = LOWER($1)
           OR LOWER(book_name_fa) = LOWER($1)
           OR LOWER($1) = LOWER(REPLACE(book_name, ' ', ''))
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

      // First, find the chapter_id for this book and chapter
      const chapterQuery = `
        SELECT id FROM bible_chapters 
        WHERE book_iso = $1 AND chapter_number = $2
        LIMIT 1
      `;
      const chapterResult = await pool.query(chapterQuery, [book.code, chapterNum]);
      
      if (chapterResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chapter not found'
        });
      }
      
      const chapterId = chapterResult.rows[0].id;

      // Get translation info
      let translationId = persianTransId;
      let selectedTranslation = null;

      const translationQuery = `
        SELECT id, code, name_fa, name_en
        FROM bible_translations 
        WHERE id = $1 AND is_active = true
      `;
      const translationResult = await pool.query(translationQuery, [translationId]);

      if (translationResult.rows.length > 0) {
        selectedTranslation = translationResult.rows[0];
      }

      // Get Persian verses using chapter_id
      const persianVersesQuery = `
        SELECT verse_number, text_fa
        FROM bible_verses 
        WHERE chapter_id = $1 AND translation_id = $2
        ORDER BY verse_number
      `;
      const persianVerses = await pool.query(persianVersesQuery, [chapterId, translationId]);

      // Get English verses (translation_id = 8 for NET)
      const englishVersesQuery = `
        SELECT verse_number, text_en
        FROM bible_verses 
        WHERE chapter_id = $1 AND translation_id = 8
        ORDER BY verse_number
      `;
      const englishVerses = await pool.query(englishVersesQuery, [chapterId]);

      // If no verses found, return 404
      if (persianVerses.rows.length === 0 && englishVerses.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No verses available for this chapter yet.'
        });
      }

      // Transform verses for frontend format (combine Persian and English)
      const verses = {
        en: [],
        fa: []
      };

      // Map Persian verses
      for (const verse of persianVerses.rows) {
        const index = verse.verse_number - 1;
        verses.fa[index] = verse.text_fa || '';
      }

      // Map English verses
      for (const verse of englishVerses.rows) {
        const index = verse.verse_number - 1;
        verses.en[index] = verse.text_en || '';
      }


      // Construct audio and timing URLs
      const audioUrl = `/bible_data/audio/QADIM/${book.code}/${chapterNum}.mp3`;
      const timingUrl = `/bible_data/timestamps/QADIM/${book.code}/${chapterNum}.json`;

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
        audioUrl: audioUrl,
        timingUrl: timingUrl,
        translation: selectedTranslation ? {
          code: selectedTranslation.code,
          name: {
            en: selectedTranslation.name_en,
            fa: selectedTranslation.name_fa
          }
        } : null
      });

    } catch (dbError) {
      // Database error - fallback to mock data
      console.log('⚠️  Database error, using mock Bible verses');
      console.error('DB Error:', dbError.message);
      const mockVerses = generateMockVerses(bookKey, parseInt(chapter));
      return res.json({
        success: true,
        book: { key: bookKey, name: { en: bookKey, fa: bookKey } },
        chapter: parseInt(chapter),
        verses: mockVerses,
        translation: { code: 'qadim', name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' } },
        usingMockData: true
      });
    }

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

// POST /api/bible/import - Import Bible data (for admin upload)
router.post('/import', async (req, res) => {
  try {
    const { book, language, verses } = req.body;

    if (!book || !language || !verses || !Array.isArray(verses)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: book, language, verses'
      });
    }

    // Check database availability
    if (!pool || typeof pool.query !== 'function') {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Cannot import verses at this time.'
      });
    }

    const client = await pool.connect();
    let importedCount = 0;

    try {
      await client.query('BEGIN');

      // Find book by name or code
      const bookQuery = `
        SELECT id, code, name_en, chapters_count 
        FROM bible_books 
        WHERE LOWER(name_en) = LOWER($1) OR LOWER(code) = LOWER($1)
        LIMIT 1
      `;
      const bookResult = await client.query(bookQuery, [book]);

      if (bookResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Book "${book}" not found in database`
        });
      }

      const bookData = bookResult.rows[0];
      const bookId = bookData.id;

      // Group verses by chapter
      const chapterMap = new Map();
      verses.forEach(v => {
        if (!chapterMap.has(v.chapter)) {
          chapterMap.set(v.chapter, []);
        }
        chapterMap.get(v.chapter).push(v);
      });

      // Import each chapter
      for (const [chapterNum, chapterVerses] of chapterMap) {
        // Get or create chapter
        const chapterQuery = `
          INSERT INTO bible_chapters (book_id, chapter_number, verse_count)
          VALUES ($1, $2, $3)
          ON CONFLICT (book_id, chapter_number) DO UPDATE SET
            verse_count = EXCLUDED.verse_count
          RETURNING id
        `;

        const chapterResult = await client.query(chapterQuery, [
          bookId,
          chapterNum,
          chapterVerses.length
        ]);

        const chapterId = chapterResult.rows[0].id;

        // Import verses
        for (const verse of chapterVerses) {
          const textField = language === 'en' ? 'text_en' :
            language === 'fa' ? 'text_fa' : 'text_ar';

          const verseQuery = `
            INSERT INTO bible_verses (
              chapter_id,
              verse_number,
              ${textField}
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
              ${textField} = EXCLUDED.${textField}
          `;

          await client.query(verseQuery, [
            chapterId,
            verse.verse,
            verse.text
          ]);

          importedCount++;
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} verses`,
        data: {
          book: bookData.name_en,
          bookCode: bookData.code,
          language,
          versesImported: importedCount,
          chaptersImported: chapterMap.size
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

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