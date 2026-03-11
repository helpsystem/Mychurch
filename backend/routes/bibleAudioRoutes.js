// bibleAudioRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db-postgres');
const fs = require('fs').promises;
const path = require('path');

// دریافت فایل صوتی برای یک کتاب
router.get('/book/:bookISO', async (req, res) => {
  try {
    const { bookISO } = req.params;
    const language = req.query.lang || 'fa';

    const result = await db.query(
      `SELECT * FROM bible_audio_files 
       WHERE book_iso = $1 AND language = $2 AND chapter_number IS NULL
       ORDER BY id DESC LIMIT 1`,
      [bookISO.toUpperCase(), language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Audio file not found' 
      });
    }

    res.json({
      success: true,
      audio: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching bible audio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// دریافت فایل صوتی برای یک فصل خاص
router.get('/chapter/:bookISO/:chapter', async (req, res) => {
  try {
    const { bookISO, chapter } = req.params;
    const language = req.query.lang || 'fa';

    const result = await db.query(
      `SELECT * FROM bible_audio_files 
       WHERE book_iso = $1 AND chapter_number = $2 AND language = $3
       ORDER BY id DESC LIMIT 1`,
      [bookISO.toUpperCase(), parseInt(chapter), language]
    );

    if (result.rows.length === 0) {
      // اگر فایل فصل وجود نداشت، فایل کل کتاب رو برگردون
      const bookResult = await db.query(
        `SELECT * FROM bible_audio_files 
         WHERE book_iso = $1 AND chapter_number IS NULL AND language = $2
         ORDER BY id DESC LIMIT 1`,
        [bookISO.toUpperCase(), language]
      );

      if (bookResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Audio file not found' 
        });
      }

      return res.json({
        success: true,
        audio: bookResult.rows[0],
        note: 'Returning full book audio (chapter-specific audio not available)'
      });
    }

    res.json({
      success: true,
      audio: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching chapter audio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// لیست تمام فایل‌های صوتی موجود
router.get('/list', async (req, res) => {
  try {
    const language = req.query.lang || 'fa';

    const result = await db.query(
      `SELECT 
        book_iso, 
        language, 
        COUNT(*) as file_count,
        SUM(file_size) as total_size,
        SUM(duration) as total_duration
       FROM bible_audio_files 
       WHERE language = $1
       GROUP BY book_iso, language
       ORDER BY book_iso`,
      [language]
    );

    res.json({
      success: true,
      books: result.rows,
      total_books: result.rows.length
    });

  } catch (error) {
    console.error('Error listing audio files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// دریافت آمار
router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        language,
        COUNT(*) as total_files,
        COUNT(DISTINCT book_iso) as total_books,
        SUM(file_size) as total_size,
        AVG(duration) as avg_duration
       FROM bible_audio_files
       GROUP BY language`
    );

    res.json({
      success: true,
      stats: result.rows
    });

  } catch (error) {
    console.error('Error fetching audio stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// GET YouVersion Aligned Audio Data
router.get('/youversion-alignment/:book/:chapter/:lang', async (req, res) => {
  try {
    const { book, chapter, lang } = req.params;
    const fileName = `${book.toUpperCase()}_${chapter}_${lang.toLowerCase()}_alignment.json`;
    const filePath = path.join(__dirname, '../../public/data/alignments/youversion', fileName);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ success: false, message: 'Alignment not found' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error fetching youversion alignment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
