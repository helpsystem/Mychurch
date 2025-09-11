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

// GET /api/pages - دریافت همه صفحات
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pages ORDER BY created_at DESC');
    const pages = result.rows.map(page => ({
      id: page.id,
      slug: page.slug,
      title: parseJSON(page.title, {}),
      content: parseJSON(page.content, {}),
      status: page.status,
      created_at: page.created_at,
      updated_at: page.updated_at
    }));
    res.json(pages);
  } catch (error) {
    console.error('Fetch Pages Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/pages/:slug - دریافت صفحه بر اساس slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Page not found.' });
    }

    const page = result.rows[0];
    res.json({
      id: page.id,
      slug: page.slug,
      title: parseJSON(page.title, {}),
      content: parseJSON(page.content, {}),
      status: page.status,
      created_at: page.created_at,
      updated_at: page.updated_at
    });
  } catch (error) {
    console.error('Fetch Page Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/pages - ایجاد صفحه جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { slug, title, content, status } = req.body;
  
  if (!slug || !title || !content) {
    return res.status(400).json({ message: 'Slug, title, and content are required.' });
  }

  try {
    // Check if slug already exists
    const existingPage = await pool.query('SELECT id FROM pages WHERE slug = $1', [slug]);
    if (existingPage.rows.length > 0) {
      return res.status(400).json({ message: 'A page with this slug already exists.' });
    }

    const result = await pool.query(
      'INSERT INTO pages (slug, title, content, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        slug,
        JSON.stringify(title),
        JSON.stringify(content),
        status || 'draft'
      ]
    );

    const newPage = result.rows[0];
    res.status(201).json({
      id: newPage.id,
      slug: newPage.slug,
      title: parseJSON(newPage.title, {}),
      content: parseJSON(newPage.content, {}),
      status: newPage.status,
      created_at: newPage.created_at,
      updated_at: newPage.updated_at
    });
  } catch (error) {
    console.error('Create Page Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/pages/:id - ویرایش صفحه
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { slug, title, content, status } = req.body;

  try {
    // Check if slug exists for other pages
    if (slug) {
      const existingPage = await pool.query('SELECT id FROM pages WHERE slug = $1 AND id != $2', [slug, id]);
      if (existingPage.rows.length > 0) {
        return res.status(400).json({ message: 'A page with this slug already exists.' });
      }
    }

    const result = await pool.query(
      'UPDATE pages SET slug = $1, title = $2, content = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [
        slug,
        JSON.stringify(title),
        JSON.stringify(content),
        status || 'draft',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Page not found.' });
    }

    const updatedPage = result.rows[0];
    res.json({
      id: updatedPage.id,
      slug: updatedPage.slug,
      title: parseJSON(updatedPage.title, {}),
      content: parseJSON(updatedPage.content, {}),
      status: updatedPage.status,
      created_at: updatedPage.created_at,
      updated_at: updatedPage.updated_at
    });
  } catch (error) {
    console.error('Update Page Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/pages/:id - حذف صفحه
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM pages WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Page not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Page Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;