/**
 * 💾 Broadcast Session Routes
 * 
 * API endpoints برای ذخیره و بازیابی session ها
 */

const express = require('express');
const router = express.Router();

// Database connection
const db = require('../db-postgres');

/**
 * GET /api/broadcast-sessions
 * لیست session ها
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, isTemplate, tags, search } = req.query;
    
    let query = `
      SELECT 
        id, name, description, 
        json_array_length(slides::json) as slide_count,
        created_by, created_at, updated_at,
        is_template, tags
      FROM broadcast_sessions
      WHERE 1=1
    `;
    const params = [];
    
    if (isTemplate !== undefined) {
      params.push(isTemplate === 'true');
      query += ` AND is_template = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    if (tags) {
      params.push(tags.split(','));
      query += ` AND tags && $${params.length}`;
    }
    
    query += ` ORDER BY updated_at DESC`;
    
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM broadcast_sessions');
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      sessions: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        slideCount: row.slide_count,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isTemplate: row.is_template,
        tags: row.tags
      })),
      total
    });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

/**
 * GET /api/broadcast-sessions/:id
 * دریافت یک session
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM broadcast_sessions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      slides: row.slides,
      settings: row.settings,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isTemplate: row.is_template,
      tags: row.tags
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * POST /api/broadcast-sessions
 * ایجاد session جدید
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, slides, settings, createdBy, isTemplate, tags } = req.body;
    
    if (!name || !slides) {
      return res.status(400).json({ error: 'Name and slides are required' });
    }
    
    const result = await db.query(
      `INSERT INTO broadcast_sessions 
        (name, description, slides, settings, created_by, is_template, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description || null,
        JSON.stringify(slides),
        settings ? JSON.stringify(settings) : '{}',
        createdBy || 'anonymous',
        isTemplate || false,
        tags || []
      ]
    );
    
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      description: row.description,
      slides: row.slides,
      settings: row.settings,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isTemplate: row.is_template,
      tags: row.tags
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * PATCH /api/broadcast-sessions/:id
 * بروزرسانی session
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build update query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.slides !== undefined) {
      fields.push(`slides = $${paramIndex++}`);
      values.push(JSON.stringify(updates.slides));
    }
    if (updates.settings !== undefined) {
      fields.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.isTemplate !== undefined) {
      fields.push(`is_template = $${paramIndex++}`);
      values.push(updates.isTemplate);
    }
    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      values.push(updates.tags);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE broadcast_sessions 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      slides: row.slides,
      settings: row.settings,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isTemplate: row.is_template,
      tags: row.tags
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /api/broadcast-sessions/:id
 * حذف session
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM broadcast_sessions WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * POST /api/broadcast-sessions/:id/duplicate
 * کپی session
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Get original session
    const original = await db.query(
      'SELECT * FROM broadcast_sessions WHERE id = $1',
      [id]
    );
    
    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const row = original.rows[0];
    
    // Create duplicate
    const result = await db.query(
      `INSERT INTO broadcast_sessions 
        (name, description, slides, settings, created_by, is_template, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name || `${row.name} (Copy)`,
        row.description,
        row.slides,
        row.settings,
        row.created_by,
        false, // Duplicates are not templates
        row.tags
      ]
    );
    
    const newRow = result.rows[0];
    res.status(201).json({
      id: newRow.id,
      name: newRow.name,
      description: newRow.description,
      slides: newRow.slides,
      settings: newRow.settings,
      createdBy: newRow.created_by,
      createdAt: newRow.created_at,
      updatedAt: newRow.updated_at,
      isTemplate: newRow.is_template,
      tags: newRow.tags
    });
  } catch (error) {
    console.error('Duplicate session error:', error);
    res.status(500).json({ error: 'Failed to duplicate session' });
  }
});

module.exports = router;
