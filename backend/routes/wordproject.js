const express = require('express');
const router = express.Router();
const { pool } = require('../db-postgres');

// ✅ دریافت لیست کتاب‌ها
router.get('/books', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        book_number, 
        book_name_fa, 
        book_name_en, 
        testament,
        COUNT(DISTINCT chapter) as chapters_count,
        COUNT(*) as verses_count
      FROM wordproject_verses
      GROUP BY book_number, book_name_fa, book_name_en, testament
      ORDER BY book_number
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت کتاب‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ دریافت باب‌های یک کتاب
router.get('/books/:bookNumber/chapters', async (req, res) => {
  try {
    const { bookNumber } = req.params;
    
    const result = await pool.query(`
      SELECT 
        chapter,
        COUNT(*) as verses_count,
        audio_url
      FROM wordproject_verses
      WHERE book_number = $1
      GROUP BY chapter, audio_url
      ORDER BY chapter
    `, [bookNumber]);
    
    res.json({
      success: true,
      book_number: parseInt(bookNumber),
      chapters: result.rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت باب‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ دریافت آیات یک باب
router.get('/books/:bookNumber/chapters/:chapterNumber', async (req, res) => {
  try {
    const { bookNumber, chapterNumber } = req.params;
    
    const result = await pool.query(`
      SELECT 
        verse,
        text_fa,
        audio_url,
        book_name_fa,
        book_name_en
      FROM wordproject_verses
      WHERE book_number = $1 AND chapter = $2
      ORDER BY verse
    `, [bookNumber, chapterNumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'باب پیدا نشد'
      });
    }
    
    res.json({
      success: true,
      book_number: parseInt(bookNumber),
      chapter: parseInt(chapterNumber),
      book_name_fa: result.rows[0].book_name_fa,
      book_name_en: result.rows[0].book_name_en,
      audio_url: result.rows[0].audio_url,
      verses: result.rows.map(r => ({
        verse: r.verse,
        text: r.text_fa
      }))
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آیات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ جستجو در متن
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً حداقل 2 کاراکتر برای جستجو وارد کنید'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        book_number,
        book_name_fa,
        book_name_en,
        chapter,
        verse,
        text_fa
      FROM wordproject_verses
      WHERE text_fa ILIKE $1
      ORDER BY book_number, chapter, verse
      LIMIT 100
    `, [`%${q}%`]);
    
    res.json({
      success: true,
      query: q,
      count: result.rows.length,
      results: result.rows
    });
  } catch (error) {
    console.error('❌ خطا در جستجو:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ آمار کلی
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT book_number) as total_books,
        COUNT(DISTINCT CONCAT(book_number, '-', chapter)) as total_chapters,
        COUNT(*) as total_verses,
        COUNT(DISTINCT CASE WHEN testament = 'old' THEN book_number END) as old_testament_books,
        COUNT(DISTINCT CASE WHEN testament = 'new' THEN book_number END) as new_testament_books
      FROM wordproject_verses
    `);
    
    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
