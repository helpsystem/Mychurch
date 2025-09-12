const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Helper function to parse JSON safely
const parseJSON = (value, defaultValue = {}) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return defaultValue;
    }
  }
  return value || defaultValue;
};

// GET /api/prayer-requests - Get all prayer requests
router.get('/', async (req, res) => {
  try {
    const { public_only } = req.query;
    let query = 'SELECT * FROM prayer_requests ORDER BY created_at DESC';
    
    if (public_only === 'true') {
      query = 'SELECT * FROM prayer_requests WHERE is_public = true ORDER BY created_at DESC';
    }
    
    const result = await pool.query(query);
    const prayerRequests = result.rows.map(prayer => ({
      id: prayer.id,
      text: prayer.text,
      category: prayer.category,
      isAnonymous: prayer.is_anonymous,
      authorName: prayer.author_name,
      authorEmail: prayer.author_email,
      authorPhone: prayer.author_phone,
      prayerCount: prayer.prayer_count || 0,
      urgency: prayer.urgency,
      isPublic: prayer.is_public,
      createdAt: prayer.created_at
    }));
    res.json(prayerRequests);
  } catch (error) {
    console.error('Fetch Prayer Requests Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/prayer-requests - Create new prayer request
router.post('/', async (req, res) => {
  const { 
    text, 
    category = 'other', 
    isAnonymous = false, 
    authorName, 
    authorEmail, 
    authorPhone,
    urgency = 'normal',
    isPublic = false
  } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Prayer request text is required.' });
  }

  // Validate category
  const validCategories = ['thanksgiving', 'healing', 'guidance', 'family', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category.' });
  }

  // Validate urgency
  const validUrgencies = ['low', 'normal', 'high', 'urgent'];
  if (!validUrgencies.includes(urgency)) {
    return res.status(400).json({ message: 'Invalid urgency level.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO prayer_requests 
       (text, category, is_anonymous, author_name, author_email, author_phone, urgency, is_public, prayer_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        text,
        category,
        isAnonymous,
        authorName || null,
        authorEmail || null,
        authorPhone || null,
        urgency,
        isPublic,
        0
      ]
    );

    const newPrayer = result.rows[0];
    res.status(201).json({
      id: newPrayer.id,
      text: newPrayer.text,
      category: newPrayer.category,
      isAnonymous: newPrayer.is_anonymous,
      authorName: newPrayer.author_name,
      authorEmail: newPrayer.author_email,
      authorPhone: newPrayer.author_phone,
      prayerCount: newPrayer.prayer_count,
      urgency: newPrayer.urgency,
      isPublic: newPrayer.is_public,
      createdAt: newPrayer.created_at
    });
  } catch (error) {
    console.error('Create Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/prayer-requests/:id - Update prayer request
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { text, category, isAnonymous, authorName, authorEmail, authorPhone, urgency, isPublic } = req.body;

  try {
    const result = await pool.query(
      `UPDATE prayer_requests SET 
       text = $1, category = $2, is_anonymous = $3, author_name = $4, 
       author_email = $5, author_phone = $6, urgency = $7, is_public = $8 
       WHERE id = $9 RETURNING *`,
      [
        text,
        category,
        isAnonymous,
        authorName,
        authorEmail,
        authorPhone,
        urgency,
        isPublic,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      text: updatedPrayer.text,
      category: updatedPrayer.category,
      isAnonymous: updatedPrayer.is_anonymous,
      authorName: updatedPrayer.author_name,
      authorEmail: updatedPrayer.author_email,
      authorPhone: updatedPrayer.author_phone,
      prayerCount: updatedPrayer.prayer_count,
      urgency: updatedPrayer.urgency,
      isPublic: updatedPrayer.is_public,
      createdAt: updatedPrayer.created_at
    });
  } catch (error) {
    console.error('Update Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/prayer-requests/:id/pray - Increment prayer count
router.patch('/:id/pray', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      text: updatedPrayer.text,
      category: updatedPrayer.category,
      isAnonymous: updatedPrayer.is_anonymous,
      authorName: updatedPrayer.author_name,
      prayerCount: updatedPrayer.prayer_count,
      urgency: updatedPrayer.urgency,
      isPublic: updatedPrayer.is_public,
      createdAt: updatedPrayer.created_at
    });
  } catch (error) {
    console.error('Update Prayer Count Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/prayer-requests/:id - Delete prayer request
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM prayer_requests WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;