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

// GET /api/galleries - دریافت همه گالری‌ها
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM galleries ORDER BY created_at DESC');
    const galleries = result.rows.map(gallery => ({
      id: gallery.id,
      title: parseJSON(gallery.title, {}),
      description: parseJSON(gallery.description, {}),
      images: parseJSON(gallery.images, []),
      coverImage: gallery.coverimage
    }));
    res.json(galleries);
  } catch (error) {
    console.error('Fetch Galleries Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/galleries - ایجاد گالری جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, description, images, coverImage } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO galleries (title, description, images, coverImage) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description || {}),
        JSON.stringify(images || []),
        coverImage || null
      ]
    );

    const newGallery = result.rows[0];
    res.status(201).json({
      id: newGallery.id,
      title: parseJSON(newGallery.title, {}),
      description: parseJSON(newGallery.description, {}),
      images: parseJSON(newGallery.images, []),
      coverImage: newGallery.coverimage
    });
  } catch (error) {
    console.error('Create Gallery Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/galleries/:id - ویرایش گالری
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, description, images, coverImage } = req.body;

  try {
    const result = await pool.query(
      'UPDATE galleries SET title = $1, description = $2, images = $3, coverImage = $4 WHERE id = $5 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description || {}),
        JSON.stringify(images || []),
        coverImage,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gallery not found.' });
    }

    const updatedGallery = result.rows[0];
    res.json({
      id: updatedGallery.id,
      title: parseJSON(updatedGallery.title, {}),
      description: parseJSON(updatedGallery.description, {}),
      images: parseJSON(updatedGallery.images, []),
      coverImage: updatedGallery.coverimage
    });
  } catch (error) {
    console.error('Update Gallery Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/galleries/:id - حذف گالری
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM galleries WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Gallery not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Gallery Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;