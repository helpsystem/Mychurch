/**
 * Widget Routes
 * API endpoints for managing widgets
 * Access: ADMIN, MANAGER, LEADER
 * 
 * Database: PostgreSQL (Local on Server)
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db-postgres');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware: فقط ADMIN, MANAGER, LEADER
const widgetAccess = authorize(['ADMIN', 'MANAGER', 'LEADER']);

/**
 * GET /api/widgets
 * Get all widgets (با فیلتر enabled برای public)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { enabled, position } = req.query;
        const user = req.user;

        let query = 'SELECT * FROM widgets';
        const conditions = [];
        const values = [];

        // فیلتر enabled (public users فقط enabled را می‌بینند)
        if (!user || !['ADMIN', 'MANAGER', 'LEADER'].includes(user.role)) {
            conditions.push('enabled = true');
        } else if (enabled !== undefined) {
            conditions.push(`enabled = $${values.length + 1}`);
            values.push(enabled === 'true');
        }

        // فیلتر position
        if (position) {
            conditions.push(`position = $${values.length + 1}`);
            values.push(position);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY order_index ASC';

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching widgets:', error);
        res.status(500).json({ error: 'Failed to fetch widgets' });
    }
});

/**
 * GET /api/widgets/:id
 * Get widget by ID
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM widgets WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching widget:', error);
        res.status(500).json({ error: 'Failed to fetch widget' });
    }
});

/**
 * POST /api/widgets
 * Create new widget (ADMIN, MANAGER, LEADER only)
 */
router.post('/', authenticate, widgetAccess, async (req, res) => {
    try {
        const { type, name, description, enabled, position, order_index, settings } = req.body;
        const user = req.user;

        // Validation
        if (!type || !name || !position) {
            return res.status(400).json({ error: 'Missing required fields: type, name, position' });
        }

        const result = await pool.query(
            `INSERT INTO widgets (type, name, description, enabled, position, order_index, settings, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                type,
                name,
                description || null,
                enabled !== undefined ? enabled : false,
                position,
                order_index || 0,
                JSON.stringify(settings || {}),
                user.id
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating widget:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Widget already exists in this position' });
        }
        res.status(500).json({ error: 'Failed to create widget' });
    }
});

/**
 * PUT /api/widgets/:id
 * Update widget (ADMIN, MANAGER, LEADER only)
 */
router.put('/:id', authenticate, widgetAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, name, description, enabled, position, order_index, settings } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (type !== undefined) {
            updates.push(`type = $${paramIndex++}`);
            values.push(type);
        }
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        if (enabled !== undefined) {
            updates.push(`enabled = $${paramIndex++}`);
            values.push(enabled);
        }
        if (position !== undefined) {
            updates.push(`position = $${paramIndex++}`);
            values.push(position);
        }
        if (order_index !== undefined) {
            updates.push(`order_index = $${paramIndex++}`);
            values.push(order_index);
        }
        if (settings !== undefined) {
            updates.push(`settings = $${paramIndex++}`);
            values.push(JSON.stringify(settings));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE widgets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating widget:', error);
        res.status(500).json({ error: 'Failed to update widget' });
    }
});

/**
 * PATCH /api/widgets/:id/toggle
 * Toggle widget enabled status (ADMIN, MANAGER, LEADER only)
 */
router.patch('/:id/toggle', authenticate, widgetAccess, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE widgets 
       SET enabled = NOT enabled 
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error toggling widget:', error);
        res.status(500).json({ error: 'Failed to toggle widget' });
    }
});

/**
 * DELETE /api/widgets/:id
 * Delete widget (ADMIN only)
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM widgets WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json({ message: 'Widget deleted successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting widget:', error);
        res.status(500).json({ error: 'Failed to delete widget' });
    }
});

module.exports = router;
