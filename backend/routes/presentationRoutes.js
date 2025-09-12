const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/presentations - Get all presentations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM presentations ORDER BY created_at DESC'
    );
    
    const presentations = result.rows.map(presentation => ({
      id: presentation.id,
      title: presentation.title,
      slides: parseJSON(presentation.slides, []),
      createdBy: presentation.created_by,
      createdAt: presentation.created_at,
      updatedAt: presentation.updated_at
    }));
    
    res.json({
      success: true,
      presentations: presentations
    });
  } catch (error) {
    console.error('Fetch Presentations Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch presentations',
      error: error.message 
    });
  }
});

// GET /api/presentations/:id - Get specific presentation
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM presentations WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found'
      });
    }
    
    const presentation = result.rows[0];
    
    res.json({
      success: true,
      presentation: {
        id: presentation.id,
        title: presentation.title,
        slides: parseJSON(presentation.slides, []),
        createdBy: presentation.created_by,
        createdAt: presentation.created_at,
        updatedAt: presentation.updated_at
      }
    });
  } catch (error) {
    console.error('Fetch Presentation Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch presentation',
      error: error.message 
    });
  }
});

// POST /api/presentations - Create new presentation
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, slides, createdBy } = req.body;
  
  if (!title || !slides || !createdBy) {
    return res.status(400).json({ 
      success: false,
      message: 'Title, slides, and createdBy are required' 
    });
  }

  if (!Array.isArray(slides)) {
    return res.status(400).json({ 
      success: false,
      message: 'Slides must be an array' 
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO presentations (title, slides, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, JSON.stringify(slides), createdBy]
    );

    const newPresentation = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Presentation created successfully',
      presentation: {
        id: newPresentation.id,
        title: newPresentation.title,
        slides: parseJSON(newPresentation.slides, []),
        createdBy: newPresentation.created_by,
        createdAt: newPresentation.created_at,
        updatedAt: newPresentation.updated_at
      }
    });
  } catch (error) {
    console.error('Create Presentation Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create presentation',
      error: error.message 
    });
  }
});

// PUT /api/presentations/:id - Update presentation
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, slides } = req.body;

  try {
    const result = await pool.query(
      'UPDATE presentations SET title = $1, slides = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [title, JSON.stringify(slides), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found'
      });
    }

    const updatedPresentation = result.rows[0];
    
    res.json({
      success: true,
      message: 'Presentation updated successfully',
      presentation: {
        id: updatedPresentation.id,
        title: updatedPresentation.title,
        slides: parseJSON(updatedPresentation.slides, []),
        createdBy: updatedPresentation.created_by,
        createdAt: updatedPresentation.created_at,
        updatedAt: updatedPresentation.updated_at
      }
    });
  } catch (error) {
    console.error('Update Presentation Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update presentation',
      error: error.message 
    });
  }
});

// DELETE /api/presentations/:id - Delete presentation
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM presentations WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found'
      });
    }

    res.json({
      success: true,
      message: 'Presentation deleted successfully'
    });
  } catch (error) {
    console.error('Delete Presentation Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete presentation',
      error: error.message 
    });
  }
});

module.exports = router;