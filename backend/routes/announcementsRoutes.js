const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { translationService } = require('../services/translationService');
const { messageDispatcher } = require('../services/messageDispatcher');
const router = express.Router();

// Helper function to parse JSON safely
const parseJSON = (value, defaultValue = null) => {
  if (!value) return defaultValue;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.error('JSON Parse Error:', error);
  }
  return defaultValue;
};

// Helper function to generate reference number
const generateReferenceNumber = (type) => {
  const prefix = {
    announcement: 'ANN',
    urgent: 'URG',
    event: 'EVT',
    general: 'GEN'
  };
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix[type] || 'ANN'}-${date}-${random}`;
};

// GET /api/announcements/published - دریافت اطلاعیه‌های منتشر شده برای نمایش عمومی
router.get('/published', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM church_announcements 
      WHERE status = 'published' 
      AND (publish_date IS NULL OR publish_date <= CURRENT_TIMESTAMP)
      AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        publish_date DESC, 
        created_at DESC
    `);

    const announcements = result.rows.map(announcement => ({
      id: announcement.id,
      title: {
        en: announcement.title_en,
        fa: announcement.title_fa
      },
      content: {
        en: announcement.content_en,
        fa: announcement.content_fa
      },
      type: announcement.announcement_type,
      priority: announcement.priority,
      publishDate: announcement.publish_date,
      referenceNumber: announcement.reference_number
    }));

    res.json(announcements);
  } catch (error) {
    console.error('Fetch Published Announcements Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/announcements/:id - دریافت یک اطلاعیه
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM church_announcements WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    const announcement = result.rows[0];
    res.json({
      id: announcement.id,
      title: {
        en: announcement.title_en,
        fa: announcement.title_fa
      },
      content: {
        en: announcement.content_en,
        fa: announcement.content_fa
      },
      type: announcement.announcement_type,
      priority: announcement.priority,
      targetAudience: parseJSON(announcement.target_audience, ['all']),
      channels: parseJSON(announcement.channels, ['website']),
      autoTranslate: announcement.auto_translate,
      sourceLanguage: announcement.source_language,
      authorEmail: announcement.author_email,
      status: announcement.status,
      publishDate: announcement.publish_date,
      expiryDate: announcement.expiry_date,
      referenceNumber: announcement.reference_number,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at
    });
  } catch (error) {
    console.error('Get Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/announcements - دریافت همه اطلاعیه‌ها
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM church_announcements';
    let params = [];
    let whereConditions = [];

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (type) {
      whereConditions.push(`announcement_type = $${params.length + 1}`);
      params.push(type);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const announcements = result.rows.map(announcement => ({
      id: announcement.id,
      title: {
        en: announcement.title_en,
        fa: announcement.title_fa
      },
      content: {
        en: announcement.content_en,
        fa: announcement.content_fa
      },
      type: announcement.announcement_type,
      priority: announcement.priority,
      targetAudience: parseJSON(announcement.target_audience, ['all']),
      channels: parseJSON(announcement.channels, ['website']),
      autoTranslate: announcement.auto_translate,
      sourceLanguage: announcement.source_language,
      authorEmail: announcement.author_email,
      status: announcement.status,
      publishDate: announcement.publish_date,
      expiryDate: announcement.expiry_date,
      referenceNumber: announcement.reference_number,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM church_announcements';
    let countParams = [];
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
      countParams = params.slice(0, params.length - 2); // Remove limit and offset
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Fetch Announcements Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/announcements - ایجاد اطلاعیه جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { 
    title, 
    content, 
    type = 'general', 
    priority = 'normal',
    targetAudience = ['all'],
    channels = ['website'],
    autoTranslate = false,
    sourceLanguage = 'en',
    publishDate,
    expiryDate
  } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  // Generate reference number
  const referenceNumber = generateReferenceNumber(type);

  try {
    const result = await pool.query(
      `INSERT INTO church_announcements (
        title_en, title_fa, content_en, content_fa, announcement_type, 
        priority, target_audience, channels, auto_translate, source_language,
        author_email, publish_date, expiry_date, reference_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        sourceLanguage === 'en' ? title : null,
        sourceLanguage === 'fa' ? title : null,
        sourceLanguage === 'en' ? content : null,
        sourceLanguage === 'fa' ? content : null,
        type,
        priority,
        JSON.stringify(targetAudience),
        JSON.stringify(channels),
        autoTranslate,
        sourceLanguage,
        req.user.email,
        publishDate || null,
        expiryDate || null,
        referenceNumber
      ]
    );

    const newAnnouncement = result.rows[0];
    res.status(201).json({
      id: newAnnouncement.id,
      title: {
        en: newAnnouncement.title_en,
        fa: newAnnouncement.title_fa
      },
      content: {
        en: newAnnouncement.content_en,
        fa: newAnnouncement.content_fa
      },
      type: newAnnouncement.announcement_type,
      priority: newAnnouncement.priority,
      targetAudience: parseJSON(newAnnouncement.target_audience, ['all']),
      channels: parseJSON(newAnnouncement.channels, ['website']),
      autoTranslate: newAnnouncement.auto_translate,
      sourceLanguage: newAnnouncement.source_language,
      authorEmail: newAnnouncement.author_email,
      status: newAnnouncement.status,
      publishDate: newAnnouncement.publish_date,
      expiryDate: newAnnouncement.expiry_date,
      referenceNumber: newAnnouncement.reference_number,
      createdAt: newAnnouncement.created_at,
      updatedAt: newAnnouncement.updated_at
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/announcements/:id/translate - ترجمه خودکار اطلاعیه
router.put('/:id/translate', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { targetLanguage } = req.body;

  try {
    // First, get the announcement
    const announcementResult = await pool.query('SELECT * FROM church_announcements WHERE id = $1', [id]);
    
    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    const announcement = announcementResult.rows[0];
    const sourceLang = announcement.source_language;
    
    // Get source content
    const sourceTitle = sourceLang === 'en' ? announcement.title_en : announcement.title_fa;
    const sourceContent = sourceLang === 'en' ? announcement.content_en : announcement.content_fa;

    if (!sourceTitle || !sourceContent) {
      return res.status(400).json({ message: 'Source content not found.' });
    }

    // Translate using the translation service
    const translatedTitle = await translationService.translateText(sourceTitle, sourceLang, targetLanguage, 'announcement');
    const translatedContent = await translationService.translateText(sourceContent, sourceLang, targetLanguage, 'announcement');

    // Determine which fields to update based on target language
    const updateFields = targetLanguage === 'fa' 
      ? 'title_fa = $1, content_fa = $2'
      : 'title_en = $1, content_en = $2';

    const result = await pool.query(
      `UPDATE church_announcements SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [translatedTitle, translatedContent, id]
    );

    const updatedAnnouncement = result.rows[0];
    res.json({
      id: updatedAnnouncement.id,
      title: {
        en: updatedAnnouncement.title_en,
        fa: updatedAnnouncement.title_fa
      },
      content: {
        en: updatedAnnouncement.content_en,
        fa: updatedAnnouncement.content_fa
      },
      referenceNumber: updatedAnnouncement.reference_number,
      updatedAt: updatedAnnouncement.updated_at
    });
  } catch (error) {
    console.error('Translate Announcement Error:', error);
    res.status(500).json({ message: 'Translation failed: ' + error.message });
  }
});

// PUT /api/announcements/:id/publish - انتشار اطلاعیه با ارسال چندکاناله
router.put('/:id/publish', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { language = 'en' } = req.body; // Default language for sending

  try {
    // First get the announcement
    const announcementResult = await pool.query('SELECT * FROM church_announcements WHERE id = $1', [id]);
    
    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    const announcement = announcementResult.rows[0];
    
    // Format announcement for dispatcher
    const announcementData = {
      id: announcement.id,
      title: {
        en: announcement.title_en,
        fa: announcement.title_fa
      },
      content: {
        en: announcement.content_en,
        fa: announcement.content_fa
      },
      type: announcement.announcement_type,
      priority: announcement.priority,
      targetAudience: parseJSON(announcement.target_audience, ['all']),
      channels: parseJSON(announcement.channels, ['website']),
      referenceNumber: announcement.reference_number,
      sourceLanguage: announcement.source_language
    };

    // Dispatch to selected channels
    const dispatchResult = await messageDispatcher.dispatchAnnouncement(
      announcementData, 
      announcementData.channels,
      { language }
    );

    // Return results
    res.json({
      id: announcement.id,
      referenceNumber: announcement.reference_number,
      status: dispatchResult.success ? 'published' : 'failed',
      channels: announcementData.channels,
      dispatch: {
        success: dispatchResult.success,
        totalRecipients: dispatchResult.totalRecipients,
        results: dispatchResult.results
      },
      updatedAt: new Date().toISOString(),
      message: dispatchResult.success 
        ? `Announcement published successfully to ${dispatchResult.totalRecipients} recipients across ${dispatchResult.results.length} channels.`
        : 'Failed to publish announcement to all channels.'
    });
  } catch (error) {
    console.error('Publish Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/announcements/:id - حذف اطلاعیه
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM church_announcements WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;