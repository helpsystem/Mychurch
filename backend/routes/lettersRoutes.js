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

// GET /api/letters - دریافت همه نامه‌های کلیسا
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM church_letters ORDER BY created_at DESC');
    const letters = result.rows.map(letter => ({
      id: letter.id,
      from: parseJSON(letter.from_field, {}),
      to: parseJSON(letter.to_field, {}),
      requestedBy: parseJSON(letter.requested_by, {}),
      body: parseJSON(letter.body, {}),
      authorEmail: letter.author_email,
      createdAt: letter.created_at,
      authorizedUsers: parseJSON(letter.authorized_users, [])
    }));
    res.json(letters);
  } catch (error) {
    console.error('Fetch Church Letters Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/letters - ایجاد نامه کلیسا جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { from, to, requestedBy, body, authorEmail, authorizedUsers } = req.body;
  
  if (!from || !to || !body || !authorEmail) {
    return res.status(400).json({ message: 'From, to, body, and authorEmail are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO church_letters (from_field, to_field, requested_by, body, author_email, authorized_users) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        JSON.stringify(from),
        JSON.stringify(to),
        JSON.stringify(requestedBy || {}),
        JSON.stringify(body),
        authorEmail,
        JSON.stringify(authorizedUsers || [])
      ]
    );

    const newLetter = result.rows[0];
    res.status(201).json({
      id: newLetter.id,
      from: parseJSON(newLetter.from_field, {}),
      to: parseJSON(newLetter.to_field, {}),
      requestedBy: parseJSON(newLetter.requested_by, {}),
      body: parseJSON(newLetter.body, {}),
      authorEmail: newLetter.author_email,
      createdAt: newLetter.created_at,
      authorizedUsers: parseJSON(newLetter.authorized_users, [])
    });
  } catch (error) {
    console.error('Create Church Letter Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/letters/:id - ویرایش نامه کلیسا
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { from, to, requestedBy, body, authorEmail, authorizedUsers } = req.body;

  try {
    const result = await pool.query(
      'UPDATE church_letters SET from_field = $1, to_field = $2, requested_by = $3, body = $4, author_email = $5, authorized_users = $6 WHERE id = $7 RETURNING *',
      [
        JSON.stringify(from),
        JSON.stringify(to),
        JSON.stringify(requestedBy || {}),
        JSON.stringify(body),
        authorEmail,
        JSON.stringify(authorizedUsers || []),
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Church letter not found.' });
    }

    const updatedLetter = result.rows[0];
    res.json({
      id: updatedLetter.id,
      from: parseJSON(updatedLetter.from_field, {}),
      to: parseJSON(updatedLetter.to_field, {}),
      requestedBy: parseJSON(updatedLetter.requested_by, {}),
      body: parseJSON(updatedLetter.body, {}),
      authorEmail: updatedLetter.author_email,
      createdAt: updatedLetter.created_at,
      authorizedUsers: parseJSON(updatedLetter.authorized_users, [])
    });
  } catch (error) {
    console.error('Update Church Letter Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/letters/:id - حذف نامه کلیسا
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM church_letters WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Church letter not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Church Letter Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;