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

// GET /api/prayer-requests - دریافت همه درخواست‌های دعا
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prayers ORDER BY created_at DESC');
    const prayers = result.rows.map(prayer => ({
      id: prayer.id,
      title: parseJSON(prayer.title, {}),
      description: parseJSON(prayer.description, {}),
      author: prayer.author,
      status: prayer.status
    }));
    res.json(prayers);
  } catch (error) {
    console.error('Fetch Prayer Requests Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/prayer-requests - ایجاد درخواست دعا جدید
router.post('/', async (req, res) => {
  const { title, description, author } = req.body;
  
  if (!title || !description || !author) {
    return res.status(400).json({ message: 'Title, description, and author are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO prayers (title, description, author, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description),
        author,
        'pending'
      ]
    );

    const newPrayer = result.rows[0];
    res.status(201).json({
      id: newPrayer.id,
      title: parseJSON(newPrayer.title, {}),
      description: parseJSON(newPrayer.description, {}),
      author: newPrayer.author,
      status: newPrayer.status
    });
  } catch (error) {
    console.error('Create Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/prayer-requests/:id - ویرایش درخواست دعا
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, description, author, status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE prayers SET title = $1, description = $2, author = $3, status = $4 WHERE id = $5 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description),
        author,
        status || 'pending',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      title: parseJSON(updatedPrayer.title, {}),
      description: parseJSON(updatedPrayer.description, {}),
      author: updatedPrayer.author,
      status: updatedPrayer.status
    });
  } catch (error) {
    console.error('Update Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/prayer-requests/:id/status - تغییر وضعیت درخواست دعا
router.patch('/:id/status', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected.' });
  }

  try {
    const result = await pool.query(
      'UPDATE prayers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      title: parseJSON(updatedPrayer.title, {}),
      description: parseJSON(updatedPrayer.description, {}),
      author: updatedPrayer.author,
      status: updatedPrayer.status
    });
  } catch (error) {
    console.error('Update Prayer Request Status Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/prayer-requests/:id - حذف درخواست دعا
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM prayers WHERE id = $1', [id]);
    
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