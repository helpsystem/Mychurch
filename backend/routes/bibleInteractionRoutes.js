const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection (reuse existing connection if available)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:password@localhost:5432/myapp_development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware to verify JWT token (simplified version)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  // For now, just pass through - implement JWT verification as needed
  req.user = { userId: 1 }; // Mock user ID
  next();
};

// Get user highlights for a chapter
router.get('/highlights', authenticateToken, async (req, res) => {
  try {
    const { translation, book, chapter } = req.query;
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        verse_number,
        highlight_color,
        highlight_type,
        selected_text,
        selection_start,
        selection_end,
        created_at
      FROM verse_highlights 
      WHERE user_id = $1 
        AND translation_code = $2 
        AND book_code = $3 
        AND chapter_number = $4
      ORDER BY verse_number ASC
    `, [userId, translation, book, parseInt(chapter)]);

    res.json({
      success: true,
      highlights: result.rows
    });

  } catch (error) {
    console.error('Error loading highlights:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بارگذاری هایلایت‌ها'
    });
  }
});

// Create new highlight
router.post('/highlights', authenticateToken, async (req, res) => {
  try {
    const {
      translation_code,
      book_code,
      chapter_number,
      verse_number,
      highlight_color,
      highlight_type,
      selected_text,
      selection_start,
      selection_end
    } = req.body;
    const userId = req.user.userId;

    // Check if highlight already exists for this verse
    const existing = await pool.query(`
      SELECT id FROM verse_highlights 
      WHERE user_id = $1 AND translation_code = $2 AND book_code = $3 
        AND chapter_number = $4 AND verse_number = $5
    `, [userId, translation_code, book_code, chapter_number, verse_number]);

    let result;
    if (existing.rows.length > 0) {
      // Update existing highlight
      result = await pool.query(`
        UPDATE verse_highlights 
        SET highlight_color = $1, highlight_type = $2, selected_text = $3,
            selection_start = $4, selection_end = $5, updated_at = NOW()
        WHERE user_id = $6 AND translation_code = $7 AND book_code = $8 
          AND chapter_number = $9 AND verse_number = $10
        RETURNING id
      `, [
        highlight_color, highlight_type, selected_text,
        selection_start, selection_end,
        userId, translation_code, book_code, chapter_number, verse_number
      ]);
    } else {
      // Create new highlight
      result = await pool.query(`
        INSERT INTO verse_highlights (
          user_id, translation_code, book_code, chapter_number, verse_number,
          highlight_color, highlight_type, selected_text, 
          selection_start, selection_end, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id
      `, [
        userId, translation_code, book_code, chapter_number, verse_number,
        highlight_color, highlight_type, selected_text,
        selection_start, selection_end
      ]);
    }

    res.json({
      success: true,
      message: 'هایلایت ذخیره شد',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error saving highlight:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره هایلایت'
    });
  }
});

// Delete highlight
router.delete('/highlights/:id', authenticateToken, async (req, res) => {
  try {
    const highlightId = req.params.id;
    const userId = req.user.userId;

    await pool.query(`
      DELETE FROM verse_highlights 
      WHERE id = $1 AND user_id = $2
    `, [highlightId, userId]);

    res.json({
      success: true,
      message: 'هایلایت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف هایلایت'
    });
  }
});

// Get user notes for a chapter
router.get('/notes', authenticateToken, async (req, res) => {
  try {
    const { translation, book, chapter } = req.query;
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        verse_number,
        note_title,
        note_content,
        note_type,
        tags,
        created_at,
        updated_at
      FROM verse_notes 
      WHERE user_id = $1 
        AND translation_code = $2 
        AND book_code = $3 
        AND chapter_number = $4
      ORDER BY verse_number ASC, created_at ASC
    `, [userId, translation, book, parseInt(chapter)]);

    res.json({
      success: true,
      notes: result.rows
    });

  } catch (error) {
    console.error('Error loading notes:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بارگذاری یادداشت‌ها'
    });
  }
});

// Create new note
router.post('/notes', authenticateToken, async (req, res) => {
  try {
    const {
      translation_code,
      book_code,
      chapter_number,
      verse_number,
      note_title,
      note_content,
      note_type,
      tags
    } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(`
      INSERT INTO verse_notes (
        user_id, translation_code, book_code, chapter_number, verse_number,
        note_title, note_content, note_type, tags, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `, [
      userId, translation_code, book_code, chapter_number, verse_number,
      note_title, note_content, note_type, tags
    ]);

    res.json({
      success: true,
      message: 'یادداشت ذخیره شد',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره یادداشت'
    });
  }
});

// Update note
router.put('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.userId;
    const {
      note_title,
      note_content,
      note_type,
      tags
    } = req.body;

    await pool.query(`
      UPDATE verse_notes 
      SET note_title = $1, note_content = $2, note_type = $3, 
          tags = $4, updated_at = NOW()
      WHERE id = $5 AND user_id = $6
    `, [note_title, note_content, note_type, tags, noteId, userId]);

    res.json({
      success: true,
      message: 'یادداشت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی یادداشت'
    });
  }
});

// Delete note
router.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.userId;

    await pool.query(`
      DELETE FROM verse_notes 
      WHERE id = $1 AND user_id = $2
    `, [noteId, userId]);

    res.json({
      success: true,
      message: 'یادداشت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف یادداشت'
    });
  }
});

// Get user's personal collections
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        collection_name,
        description,
        is_public,
        created_at,
        (SELECT COUNT(*) FROM collection_verses WHERE collection_id = pc.id) as verse_count
      FROM personal_collections pc
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      collections: result.rows
    });

  } catch (error) {
    console.error('Error loading collections:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بارگذاری مجموعه‌ها'
    });
  }
});

// Create new collection
router.post('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { collection_name, description, is_public } = req.body;

    const result = await pool.query(`
      INSERT INTO personal_collections (
        user_id, collection_name, description, is_public, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [userId, collection_name, description, is_public || false]);

    res.json({
      success: true,
      message: 'مجموعه جدید ایجاد شد',
      id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد مجموعه'
    });
  }
});

// Add verse to collection
router.post('/collections/:id/verses', authenticateToken, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user.userId;
    const {
      translation_code,
      book_code,
      chapter_number,
      verse_number
    } = req.body;

    // Verify collection belongs to user
    const collection = await pool.query(`
      SELECT id FROM personal_collections 
      WHERE id = $1 AND user_id = $2
    `, [collectionId, userId]);

    if (collection.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'مجموعه یافت نشد'
      });
    }

    // Check if verse already in collection
    const existing = await pool.query(`
      SELECT id FROM collection_verses 
      WHERE collection_id = $1 AND translation_code = $2 
        AND book_code = $3 AND chapter_number = $4 AND verse_number = $5
    `, [collectionId, translation_code, book_code, chapter_number, verse_number]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'این آیه قبلاً به مجموعه اضافه شده است'
      });
    }

    // Add verse to collection
    await pool.query(`
      INSERT INTO collection_verses (
        collection_id, translation_code, book_code, chapter_number, verse_number, added_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [collectionId, translation_code, book_code, chapter_number, verse_number]);

    res.json({
      success: true,
      message: 'آیه به مجموعه اضافه شد'
    });

  } catch (error) {
    console.error('Error adding verse to collection:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در اضافه کردن آیه به مجموعه'
    });
  }
});

module.exports = router;