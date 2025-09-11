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
    const result = await pool.query('SELECT * FROM church_letters ORDER BY date DESC');
    const letters = result.rows.map(letter => ({
      id: letter.id,
      title: parseJSON(letter.title, {}),
      content: parseJSON(letter.content, {}),
      date: letter.date,
      author: letter.author,
      pdfUrl: letter.pdfurl,
      status: letter.status
    }));
    res.json(letters);
  } catch (error) {
    console.error('Fetch Church Letters Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/letters - ایجاد نامه کلیسا جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, content, date, author, pdfUrl, status } = req.body;
  
  if (!title || !content || !date || !author) {
    return res.status(400).json({ message: 'Title, content, date, and author are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO church_letters (title, content, date, author, pdfUrl, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(content),
        date,
        author,
        pdfUrl || null,
        status || 'draft'
      ]
    );

    const newLetter = result.rows[0];
    res.status(201).json({
      id: newLetter.id,
      title: parseJSON(newLetter.title, {}),
      content: parseJSON(newLetter.content, {}),
      date: newLetter.date,
      author: newLetter.author,
      pdfUrl: newLetter.pdfurl,
      status: newLetter.status
    });
  } catch (error) {
    console.error('Create Church Letter Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/letters/:id - ویرایش نامه کلیسا
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, content, date, author, pdfUrl, status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE church_letters SET title = $1, content = $2, date = $3, author = $4, pdfUrl = $5, status = $6 WHERE id = $7 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(content),
        date,
        author,
        pdfUrl,
        status || 'draft',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Church letter not found.' });
    }

    const updatedLetter = result.rows[0];
    res.json({
      id: updatedLetter.id,
      title: parseJSON(updatedLetter.title, {}),
      content: parseJSON(updatedLetter.content, {}),
      date: updatedLetter.date,
      author: updatedLetter.author,
      pdfUrl: updatedLetter.pdfurl,
      status: updatedLetter.status
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