/**
 * Wordproject Audio Bible Routes
 * Serves audio files from local D:\ drive archives
 * English: D:\https___www.wordproject.org_bibles_audio_01_english_index.htm
 * Persian: D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Base paths for audio archives
const ENGLISH_AUDIO_BASE = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\audio\\01_english';
const PERSIAN_AUDIO_BASE = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\audio\\20_farsi';

// Bible book codes mapping (Wordproject uses b01.html, b02.html, etc.)
const BOOK_MAPPING = {
  'GEN': { code: 'b01', name_en: 'Genesis', name_fa: 'پیدایش', chapters: 50 },
  'EXO': { code: 'b02', name_en: 'Exodus', name_fa: 'خروج', chapters: 40 },
  'LEV': { code: 'b03', name_en: 'Leviticus', name_fa: 'لاویان', chapters: 27 },
  'NUM': { code: 'b04', name_en: 'Numbers', name_fa: 'اعداد', chapters: 36 },
  'DEU': { code: 'b05', name_en: 'Deuteronomy', name_fa: 'تثنیه', chapters: 34 },
  'JOS': { code: 'b06', name_en: 'Joshua', name_fa: 'یوشع', chapters: 24 },
  'JDG': { code: 'b07', name_en: 'Judges', name_fa: 'داوران', chapters: 21 },
  'RUT': { code: 'b08', name_en: 'Ruth', name_fa: 'روت', chapters: 4 },
  '1SA': { code: 'b09', name_en: '1 Samuel', name_fa: 'اول سموئیل', chapters: 31 },
  '2SA': { code: 'b10', name_en: '2 Samuel', name_fa: 'دوم سموئیل', chapters: 24 },
  '1KI': { code: 'b11', name_en: '1 Kings', name_fa: 'اول پادشاهان', chapters: 22 },
  '2KI': { code: 'b12', name_en: '2 Kings', name_fa: 'دوم پادشاهان', chapters: 25 },
  '1CH': { code: 'b13', name_en: '1 Chronicles', name_fa: 'اول تواریخ', chapters: 29 },
  '2CH': { code: 'b14', name_en: '2 Chronicles', name_fa: 'دوم تواریخ', chapters: 36 },
  'EZR': { code: 'b15', name_en: 'Ezra', name_fa: 'عزرا', chapters: 10 },
  'NEH': { code: 'b16', name_en: 'Nehemiah', name_fa: 'نحمیا', chapters: 13 },
  'EST': { code: 'b17', name_en: 'Esther', name_fa: 'استر', chapters: 10 },
  'JOB': { code: 'b18', name_en: 'Job', name_fa: 'ایوب', chapters: 42 },
  'PSA': { code: 'b19', name_en: 'Psalms', name_fa: 'مزامیر', chapters: 150 },
  'PRO': { code: 'b20', name_en: 'Proverbs', name_fa: 'امثال', chapters: 31 },
  'ECC': { code: 'b21', name_en: 'Ecclesiastes', name_fa: 'جامعه', chapters: 12 },
  'SNG': { code: 'b22', name_en: 'Song of Solomon', name_fa: 'غزل غزلها', chapters: 8 },
  'ISA': { code: 'b23', name_en: 'Isaiah', name_fa: 'اشعیا', chapters: 66 },
  'JER': { code: 'b24', name_en: 'Jeremiah', name_fa: 'ارمیا', chapters: 52 },
  'LAM': { code: 'b25', name_en: 'Lamentations', name_fa: 'مراثی', chapters: 5 },
  'EZK': { code: 'b26', name_en: 'Ezekiel', name_fa: 'حزقیال', chapters: 48 },
  'DAN': { code: 'b27', name_en: 'Daniel', name_fa: 'دانیال', chapters: 12 },
  'HOS': { code: 'b28', name_en: 'Hosea', name_fa: 'هوشع', chapters: 14 },
  'JOL': { code: 'b29', name_en: 'Joel', name_fa: 'یوئیل', chapters: 3 },
  'AMO': { code: 'b30', name_en: 'Amos', name_fa: 'عاموس', chapters: 9 },
  'OBA': { code: 'b31', name_en: 'Obadiah', name_fa: 'عوبدیا', chapters: 1 },
  'JON': { code: 'b32', name_en: 'Jonah', name_fa: 'یونس', chapters: 4 },
  'MIC': { code: 'b33', name_en: 'Micah', name_fa: 'میکاه', chapters: 7 },
  'NAM': { code: 'b34', name_en: 'Nahum', name_fa: 'ناحوم', chapters: 3 },
  'HAB': { code: 'b35', name_en: 'Habakkuk', name_fa: 'حبقوق', chapters: 3 },
  'ZEP': { code: 'b36', name_en: 'Zephaniah', name_fa: 'صفنیا', chapters: 3 },
  'HAG': { code: 'b37', name_en: 'Haggai', name_fa: 'حجی', chapters: 2 },
  'ZEC': { code: 'b38', name_en: 'Zechariah', name_fa: 'زکریا', chapters: 14 },
  'MAL': { code: 'b39', name_en: 'Malachi', name_fa: 'ملاکی', chapters: 4 },
  'MAT': { code: 'b40', name_en: 'Matthew', name_fa: 'متی', chapters: 28 },
  'MRK': { code: 'b41', name_en: 'Mark', name_fa: 'مرقس', chapters: 16 },
  'LUK': { code: 'b42', name_en: 'Luke', name_fa: 'لوقا', chapters: 24 },
  'JHN': { code: 'b43', name_en: 'John', name_fa: 'یوحنا', chapters: 21 },
  'ACT': { code: 'b44', name_en: 'Acts', name_fa: 'اعمال رسولان', chapters: 28 },
  'ROM': { code: 'b45', name_en: 'Romans', name_fa: 'رومیان', chapters: 16 },
  '1CO': { code: 'b46', name_en: '1 Corinthians', name_fa: 'اول قرنتیان', chapters: 16 },
  '2CO': { code: 'b47', name_en: '2 Corinthians', name_fa: 'دوم قرنتیان', chapters: 13 },
  'GAL': { code: 'b48', name_en: 'Galatians', name_fa: 'غلاطیان', chapters: 6 },
  'EPH': { code: 'b49', name_en: 'Ephesians', name_fa: 'افسسیان', chapters: 6 },
  'PHP': { code: 'b50', name_en: 'Philippians', name_fa: 'فیلیپیان', chapters: 4 },
  'COL': { code: 'b51', name_en: 'Colossians', name_fa: 'کولسیان', chapters: 4 },
  '1TH': { code: 'b52', name_en: '1 Thessalonians', name_fa: 'اول تسالونیکیان', chapters: 5 },
  '2TH': { code: 'b53', name_en: '2 Thessalonians', name_fa: 'دوم تسالونیکیان', chapters: 3 },
  '1TI': { code: 'b54', name_en: '1 Timothy', name_fa: 'اول تیموتائوس', chapters: 6 },
  '2TI': { code: 'b55', name_en: '2 Timothy', name_fa: 'دوم تیموتائوس', chapters: 4 },
  'TIT': { code: 'b56', name_en: 'Titus', name_fa: 'تیطس', chapters: 3 },
  'PHM': { code: 'b57', name_en: 'Philemon', name_fa: 'فلیمون', chapters: 1 },
  'HEB': { code: 'b58', name_en: 'Hebrews', name_fa: 'عبرانیان', chapters: 13 },
  'JAS': { code: 'b59', name_en: 'James', name_fa: 'یعقوب', chapters: 5 },
  '1PE': { code: 'b60', name_en: '1 Peter', name_fa: 'اول پطرس', chapters: 5 },
  '2PE': { code: 'b61', name_en: '2 Peter', name_fa: 'دوم پطرس', chapters: 3 },
  '1JN': { code: 'b62', name_en: '1 John', name_fa: 'اول یوحنا', chapters: 5 },
  '2JN': { code: 'b63', name_en: '2 John', name_fa: 'دوم یوحنا', chapters: 1 },
  '3JN': { code: 'b64', name_en: '3 John', name_fa: 'سوم یوحنا', chapters: 1 },
  'JUD': { code: 'b65', name_en: 'Jude', name_fa: 'یهودا', chapters: 1 },
  'REV': { code: 'b66', name_en: 'Revelation', name_fa: 'مکاشفه', chapters: 22 }
};

/**
 * GET /api/wordproject-audio/books
 * Returns list of all available books with audio
 */
router.get('/books', async (req, res) => {
  try {
    const books = Object.entries(BOOK_MAPPING).map(([bibleCode, info]) => ({
      code: bibleCode,  // GEN, EXO, etc. (keep Bible standard codes)
      wordprojectCode: info.code,  // b01, b02, etc. (internal use only)
      name_en: info.name_en,
      name_fa: info.name_fa,
      chapters: info.chapters,
      hasEnglishAudio: true, // Assuming all books have English
      hasPersianAudio: true  // Assuming all books have Persian
    }));

    res.json({
      success: true,
      count: books.length,
      books
    });
  } catch (error) {
    console.error('❌ Error fetching audio books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load audio books'
    });
  }
});

/**
 * GET /api/wordproject-audio/book/:bookCode
 * Returns chapters available for a specific book
 */
router.get('/book/:bookCode', async (req, res) => {
  try {
    const { bookCode } = req.params;
    const bookInfo = BOOK_MAPPING[bookCode.toUpperCase()];

    if (!bookInfo) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Generate chapter list
    const chapters = [];
    for (let i = 1; i <= bookInfo.chapters; i++) {
      chapters.push({
        chapter: i,
        audioUrl_en: `/api/wordproject-audio/play/${bookCode}/${i}/en`,
        audioUrl_fa: `/api/wordproject-audio/play/${bookCode}/${i}/fa`,
        downloadUrl_en: `/api/wordproject-audio/download/${bookCode}/${i}/en`,
        downloadUrl_fa: `/api/wordproject-audio/download/${bookCode}/${i}/fa`
      });
    }

    res.json({
      success: true,
      book: {
        code: bookCode,
        ...bookInfo,
        chapters
      }
    });
  } catch (error) {
    console.error('❌ Error fetching book chapters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load book chapters'
    });
  }
});

/**
 * Helper: Find audio file in directory
 */
async function findAudioFile(basePath, bookCode, chapter) {
  try {
    const bookInfo = BOOK_MAPPING[bookCode.toUpperCase()];
    if (!bookInfo) return null;

    const bookFolderCode = bookInfo.code; // e.g., 'b01'
    const chapterPadded = String(chapter).padStart(3, '0'); // e.g., '001'

    // Try different possible naming patterns
    const possiblePatterns = [
      `${bookFolderCode}_${chapterPadded}.mp3`,
      `${bookFolderCode}_${String(chapter).padStart(2, '0')}.mp3`,
      `${bookFolderCode}_${chapter}.mp3`,
      `${bookFolderCode.substring(1)}_${chapterPadded}.mp3`, // Without 'b' prefix
    ];

    // Check if book folder exists
    const bookFolderPath = path.join(basePath, bookFolderCode);
    
    try {
      await fs.access(bookFolderPath);
    } catch {
      // Try direct file in base path
      for (const pattern of possiblePatterns) {
        const filePath = path.join(basePath, pattern);
        try {
          await fs.access(filePath);
          return filePath;
        } catch {
          continue;
        }
      }
      return null;
    }

    // Search in book folder
    for (const pattern of possiblePatterns) {
      const filePath = path.join(bookFolderPath, pattern);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding audio file:', error);
    return null;
  }
}

/**
 * GET /api/wordproject-audio/play/:bookCode/:chapter/:lang
 * Stream audio file for playback
 */
router.get('/play/:bookCode/:chapter/:lang', async (req, res) => {
  try {
    const { bookCode, chapter, lang } = req.params;
    const chapterNum = parseInt(chapter);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).json({ error: 'Invalid chapter number' });
    }

    const basePath = lang === 'en' ? ENGLISH_AUDIO_BASE : PERSIAN_AUDIO_BASE;
    const audioPath = await findAudioFile(basePath, bookCode, chapterNum);

    if (!audioPath) {
      return res.status(404).json({
        error: 'Audio file not found',
        details: { bookCode, chapter: chapterNum, lang }
      });
    }

    // Check if file exists
    try {
      await fs.access(audioPath);
    } catch {
      return res.status(404).json({ error: 'Audio file not accessible' });
    }

    // Get file stats for Content-Length
    const stat = await fs.stat(audioPath);
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const readStream = require('fs').createReadStream(audioPath);
    readStream.pipe(res);

    readStream.on('error', (error) => {
      console.error('❌ Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio' });
      }
    });

  } catch (error) {
    console.error('❌ Error playing audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to play audio' });
    }
  }
});

/**
 * GET /api/wordproject-audio/download/:bookCode/:chapter/:lang
 * Download audio file
 */
router.get('/download/:bookCode/:chapter/:lang', async (req, res) => {
  try {
    const { bookCode, chapter, lang } = req.params;
    const chapterNum = parseInt(chapter);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).json({ error: 'Invalid chapter number' });
    }

    const basePath = lang === 'en' ? ENGLISH_AUDIO_BASE : PERSIAN_AUDIO_BASE;
    const audioPath = await findAudioFile(basePath, bookCode, chapterNum);

    if (!audioPath) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const bookInfo = BOOK_MAPPING[bookCode.toUpperCase()];
    const filename = `${bookInfo.name_en}_Chapter${chapter}_${lang === 'en' ? 'English' : 'Persian'}.mp3`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const readStream = require('fs').createReadStream(audioPath);
    readStream.pipe(res);

    readStream.on('error', (error) => {
      console.error('❌ Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download audio' });
      }
    });

  } catch (error) {
    console.error('❌ Error downloading audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download audio' });
    }
  }
});

/**
 * GET /api/wordproject-audio/search
 * Search for books by name (English or Persian)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const query = q.toLowerCase().trim();
    const results = Object.entries(BOOK_MAPPING)
      .filter(([code, info]) => {
        return (
          info.name_en.toLowerCase().includes(query) ||
          info.name_fa.includes(query) ||
          code.toLowerCase().includes(query)
        );
      })
      .map(([code, info]) => ({
        code,
        ...info
      }));

    res.json({
      success: true,
      count: results.length,
      query: q,
      results
    });
  } catch (error) {
    console.error('❌ Error searching books:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;
