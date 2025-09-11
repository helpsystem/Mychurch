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

// GET /api/testimonials - دریافت همه شهادت‌ها
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    const testimonials = result.rows.map(testimonial => ({
      id: testimonial.id,
      title: parseJSON(testimonial.title, {}),
      content: parseJSON(testimonial.content, {}),
      author: testimonial.author,
      status: testimonial.status
    }));
    res.json(testimonials);
  } catch (error) {
    console.error('Fetch Testimonials Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/testimonials - ایجاد شهادت جدید
router.post('/', async (req, res) => {
  const { title, content, author } = req.body;
  
  if (!title || !content || !author) {
    return res.status(400).json({ message: 'Title, content, and author are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO testimonials (title, content, author, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(content),
        author,
        'pending'
      ]
    );

    const newTestimonial = result.rows[0];
    res.status(201).json({
      id: newTestimonial.id,
      title: parseJSON(newTestimonial.title, {}),
      content: parseJSON(newTestimonial.content, {}),
      author: newTestimonial.author,
      status: newTestimonial.status
    });
  } catch (error) {
    console.error('Create Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/testimonials/:id - ویرایش شهادت
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, content, author, status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE testimonials SET title = $1, content = $2, author = $3, status = $4 WHERE id = $5 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(content),
        author,
        status || 'pending',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    const updatedTestimonial = result.rows[0];
    res.json({
      id: updatedTestimonial.id,
      title: parseJSON(updatedTestimonial.title, {}),
      content: parseJSON(updatedTestimonial.content, {}),
      author: updatedTestimonial.author,
      status: updatedTestimonial.status
    });
  } catch (error) {
    console.error('Update Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/testimonials/:id/status - تغییر وضعیت شهادت
router.patch('/:id/status', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected.' });
  }

  try {
    const result = await pool.query(
      'UPDATE testimonials SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    const updatedTestimonial = result.rows[0];
    res.json({
      id: updatedTestimonial.id,
      title: parseJSON(updatedTestimonial.title, {}),
      content: parseJSON(updatedTestimonial.content, {}),
      author: updatedTestimonial.author,
      status: updatedTestimonial.status
    });
  } catch (error) {
    console.error('Update Testimonial Status Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/testimonials/:id - حذف شهادت
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;