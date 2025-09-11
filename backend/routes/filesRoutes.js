const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/files - دریافت همه فایل‌ها
router.get('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM files ORDER BY created_at DESC');
    const files = result.rows.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      url: file.url,
      size: file.size,
      type: file.type,
      created_at: file.created_at
    }));
    res.json(files);
  } catch (error) {
    console.error('Fetch Files Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/files - ثبت اطلاعات فایل جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id, name, path, url, size, type } = req.body;
  
  if (!id || !name || !path || !url || !size || !type) {
    return res.status(400).json({ message: 'All file fields are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO files (id, name, path, url, size, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, path, url, size, type]
    );

    const newFile = result.rows[0];
    res.status(201).json({
      id: newFile.id,
      name: newFile.name,
      path: newFile.path,
      url: newFile.url,
      size: newFile.size,
      type: newFile.type,
      created_at: newFile.created_at
    });
  } catch (error) {
    console.error('Create File Record Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/files/:id - بروزرسانی اطلاعات فایل
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { name, path, url, size, type } = req.body;

  try {
    const result = await pool.query(
      'UPDATE files SET name = $1, path = $2, url = $3, size = $4, type = $5 WHERE id = $6 RETURNING *',
      [name, path, url, size, type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const updatedFile = result.rows[0];
    res.json({
      id: updatedFile.id,
      name: updatedFile.name,
      path: updatedFile.path,
      url: updatedFile.url,
      size: updatedFile.size,
      type: updatedFile.type,
      created_at: updatedFile.created_at
    });
  } catch (error) {
    console.error('Update File Record Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/files/:id - حذف ضبط فایل از دیتابیس
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM files WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'File record not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete File Record Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/files/:id - دریافت اطلاعات فایل خاص
router.get('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const file = result.rows[0];
    res.json({
      id: file.id,
      name: file.name,
      path: file.path,
      url: file.url,
      size: file.size,
      type: file.type,
      created_at: file.created_at
    });
  } catch (error) {
    console.error('Fetch File Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;