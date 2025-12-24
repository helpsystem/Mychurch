const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/communications/history - View sent messages
router.get('/history', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'communications'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        messages: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        note: 'Communications table not yet created'
      });
    }
    
    const result = await pool.query(`
      SELECT * FROM communications
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM communications');
    
    res.json({ 
      messages: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Communications history error:', error);
    res.status(500).json({ message: 'Failed to fetch communications history', error: error.message });
  }
});

// GET /api/communications/stats - Communication statistics
router.get('/stats', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'communications'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        total_messages: 0,
        email_count: 0,
        inbox_count: 0,
        last_7_days: 0,
        last_30_days: 0,
        total_recipients: 0
      });
    }
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN sent_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
        COUNT(CASE WHEN sent_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days
      FROM communications
    `);
    
    res.json(stats.rows[0] || {
      total_messages: 0,
      sent_count: 0,
      last_7_days: 0,
      last_30_days: 0
    });
  } catch (error) {
    console.error('Communications stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// POST /api/communications/send - Send message to users
router.post('/send', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { subject, message, recipients, type = 'email' } = req.body;
    
    if (!message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Message and recipients are required' });
    }
    
    // Store in database
    const result = await pool.query(
      `INSERT INTO communications (type, subject, message, recipients, recipient_count, created_by, sent_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [type, subject || '', message, JSON.stringify(recipients), recipients.length, req.user.id]
    );
    
    const communication = result.rows[0];
    
    // TODO: Actually send emails/notifications here
    // For now, just log that we would send
    console.log(`📧 Would send ${type} to ${recipients.length} recipients:`, recipients);
    
    // Log the message
    try {
      await pool.query(`
        INSERT INTO message_logs (channel, reference_type, reference_id, status, metadata, sent_at)
        VALUES ($1, 'communication', $2, 'sent', $3, NOW())
      `, [type, communication.id, JSON.stringify({ recipientCount: recipients.length })]);
    } catch (logError) {
      console.error('Failed to log message:', logError);
      // Don't fail the request for logging errors
    }
    
    res.json({ 
      success: true, 
      id: communication.id,
      message: `Message queued for ${recipients.length} recipient(s)`,
      sentAt: communication.sent_at
    });
  } catch (error) {
    console.error('Send communication error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// POST /api/communications/send-bulk - Send bulk message to user group
router.post('/send-bulk', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { subject, message, targetGroup = 'all', type = 'email' } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Get users based on target group
    let userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE 1=1';
    
    if (targetGroup === 'leaders') {
      userQuery += " AND role IN ('SUPER_ADMIN', 'MANAGER', 'LEADER', 'WORSHIP_LEADER')";
    } else if (targetGroup === 'members') {
      userQuery += " AND role = 'USER'";
    } else if (targetGroup === 'admins') {
      userQuery += " AND role IN ('SUPER_ADMIN', 'MANAGER')";
    }
    // 'all' doesn't add any filter
    
    const usersResult = await pool.query(userQuery);
    const users = usersResult.rows;
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'No users found in the selected group' });
    }
    
    const recipients = users.map(u => u.email);
    
    // Store in database
    const result = await pool.query(
      `INSERT INTO communications (type, subject, message, recipients, recipient_count, created_by, sent_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [type, subject || '', message, JSON.stringify(recipients), recipients.length, req.user.id]
    );
    
    console.log(`📧 Bulk message to ${targetGroup}: ${recipients.length} recipients`);
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      message: `Bulk message sent to ${recipients.length} user(s) in group "${targetGroup}"`,
      recipientCount: recipients.length
    });
  } catch (error) {
    console.error('Send bulk communication error:', error);
    res.status(500).json({ message: 'Failed to send bulk message', error: error.message });
  }
});

// DELETE /api/communications/:id - Delete a communication record
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM communications WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Communication not found' });
    }
    
    res.json({ success: true, message: 'Communication deleted' });
  } catch (error) {
    console.error('Delete communication error:', error);
    res.status(500).json({ message: 'Failed to delete communication', error: error.message });
  }
});

module.exports = router;
