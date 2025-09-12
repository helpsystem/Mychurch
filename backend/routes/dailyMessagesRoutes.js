const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { messageDispatcher } = require('../services/messageDispatcher');
const router = express.Router();

// GET /api/daily-messages - Get all daily messages (admin only)
router.get('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      date,
      searchTerm, 
      filterStatus = 'all',
      page = 1,
      limit = 50 
    } = req.query;

    let query = 'SELECT * FROM daily_messages';
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Date filter
    if (date) {
      conditions.push(`scheduled_date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    // Search filter
    if (searchTerm) {
      conditions.push(`(
        title->>'en' ILIKE $${paramIndex} OR
        title->>'fa' ILIKE $${paramIndex} OR
        content->>'en' ILIKE $${paramIndex} OR
        content->>'fa' ILIKE $${paramIndex} OR
        bible_verse->>'reference' ILIKE $${paramIndex}
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'published') {
        conditions.push(`is_published = true`);
      } else if (filterStatus === 'draft') {
        conditions.push(`is_published = false`);
      } else if (filterStatus === 'scheduled') {
        conditions.push(`is_published = false AND scheduled_date >= CURRENT_DATE`);
      } else if (filterStatus === 'sent') {
        conditions.push(`sent_at IS NOT NULL`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY scheduled_date DESC, scheduled_time DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM daily_messages';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Convert snake_case to camelCase for frontend
    const normalizedMessages = result.rows.map(msg => ({
      id: msg.id.toString(),
      title: msg.title,
      content: msg.content,
      bibleVerse: msg.bible_verse,
      scheduledDate: msg.scheduled_date,
      scheduledTime: msg.scheduled_time,
      channels: msg.channels,
      isPublished: msg.is_published,
      sentAt: msg.sent_at,
      recipientCount: msg.recipient_count,
      createdBy: msg.created_by,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    }));

    res.json({
      success: true,
      messages: normalizedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching daily messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily messages',
      error: error.message
    });
  }
});

// GET /api/daily-messages/public - Get today's published message (no auth required)
router.get('/public', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const result = await pool.query(
      'SELECT * FROM daily_messages WHERE scheduled_date = $1 AND is_published = true ORDER BY scheduled_time LIMIT 1',
      [date]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: null,
        note: 'No daily message found for this date'
      });
    }

    // Convert snake_case to camelCase for frontend
    const msg = result.rows[0];
    const normalizedMessage = {
      id: msg.id.toString(),
      title: msg.title,
      content: msg.content,
      bibleVerse: msg.bible_verse,
      scheduledDate: msg.scheduled_date,
      scheduledTime: msg.scheduled_time,
      channels: msg.channels,
      isPublished: msg.is_published,
      sentAt: msg.sent_at,
      recipientCount: msg.recipient_count,
      createdBy: msg.created_by,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    };

    res.json({
      success: true,
      message: normalizedMessage
    });
  } catch (error) {
    console.error('Error fetching public daily message:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily message',
      error: error.message
    });
  }
});

// POST /api/daily-messages - Create new daily message (admin only)
router.post('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      title,
      content,
      bibleVerse,
      scheduledDate,
      scheduledTime,
      channels = ['website'],
      isPublished = false
    } = req.body;

    // Validation
    if (!title || !title.en || !title.fa) {
      return res.status(400).json({
        success: false,
        message: 'Title in both English and Farsi is required'
      });
    }

    if (!content || !content.en || !content.fa) {
      return res.status(400).json({
        success: false,
        message: 'Content in both English and Farsi is required'
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time are required'
      });
    }

    // Check if there's already a message for this date and time
    const existingMessage = await pool.query(
      'SELECT id FROM daily_messages WHERE scheduled_date = $1 AND scheduled_time = $2',
      [scheduledDate, scheduledTime]
    );

    if (existingMessage.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A message is already scheduled for this date and time'
      });
    }

    const result = await pool.query(
      `INSERT INTO daily_messages 
       (title, content, bible_verse, scheduled_date, scheduled_time, channels, is_published, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        JSON.stringify(title),
        JSON.stringify(content),
        bibleVerse ? JSON.stringify(bibleVerse) : null,
        scheduledDate,
        scheduledTime,
        JSON.stringify(channels),
        isPublished,
        req.user.email
      ]
    );

    // Convert snake_case to camelCase for frontend
    const msg = result.rows[0];
    const normalizedMessage = {
      id: msg.id.toString(),
      title: msg.title,
      content: msg.content,
      bibleVerse: msg.bible_verse,
      scheduledDate: msg.scheduled_date,
      scheduledTime: msg.scheduled_time,
      channels: msg.channels,
      isPublished: msg.is_published,
      sentAt: msg.sent_at,
      recipientCount: msg.recipient_count,
      createdBy: msg.created_by,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    };

    res.status(201).json({
      success: true,
      message: normalizedMessage,
      note: 'Daily message created successfully'
    });
  } catch (error) {
    console.error('Error creating daily message:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating daily message',
      error: error.message
    });
  }
});

// PUT /api/daily-messages/:id - Update daily message (admin only)
router.put('/:id', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title,
      content,
      bibleVerse,
      scheduledDate,
      scheduledTime,
      channels,
      isPublished
    } = req.body;

    // Check if message exists
    const existingMessage = await pool.query(
      'SELECT * FROM daily_messages WHERE id = $1',
      [id]
    );

    if (existingMessage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily message not found'
      });
    }

    // Check for scheduling conflict with other messages
    if (scheduledDate && scheduledTime) {
      const dateConflict = await pool.query(
        'SELECT id FROM daily_messages WHERE scheduled_date = $1 AND scheduled_time = $2 AND id != $3',
        [scheduledDate, scheduledTime, id]
      );

      if (dateConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Another message is already scheduled for this date and time'
        });
      }
    }

    const result = await pool.query(
      `UPDATE daily_messages 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           bible_verse = COALESCE($3, bible_verse),
           scheduled_date = COALESCE($4, scheduled_date),
           scheduled_time = COALESCE($5, scheduled_time),
           channels = COALESCE($6, channels),
           is_published = COALESCE($7, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        title ? JSON.stringify(title) : null,
        content ? JSON.stringify(content) : null,
        bibleVerse ? JSON.stringify(bibleVerse) : null,
        scheduledDate,
        scheduledTime,
        channels ? JSON.stringify(channels) : null,
        isPublished,
        id
      ]
    );

    // Convert snake_case to camelCase for frontend
    const msg = result.rows[0];
    const normalizedMessage = {
      id: msg.id.toString(),
      title: msg.title,
      content: msg.content,
      bibleVerse: msg.bible_verse,
      scheduledDate: msg.scheduled_date,
      scheduledTime: msg.scheduled_time,
      channels: msg.channels,
      isPublished: msg.is_published,
      sentAt: msg.sent_at,
      recipientCount: msg.recipient_count,
      createdBy: msg.created_by,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    };

    res.json({
      success: true,
      message: normalizedMessage,
      note: 'Daily message updated successfully'
    });
  } catch (error) {
    console.error('Error updating daily message:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating daily message',
      error: error.message
    });
  }
});

// DELETE /api/daily-messages/:id - Delete daily message (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM daily_messages WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily message not found'
      });
    }

    res.json({
      success: true,
      message: 'Daily message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting daily message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting daily message',
      error: error.message
    });
  }
});

// POST /api/daily-messages/:id/publish - Publish and send daily message (admin only)
router.post('/:id/publish', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { channels, sendNow = false } = req.body;

    // Get the message
    const messageResult = await pool.query(
      'SELECT * FROM daily_messages WHERE id = $1',
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily message not found'
      });
    }

    const message = messageResult.rows[0];

    // Check if already sent
    if (message.sent_at) {
      return res.status(400).json({
        success: false,
        message: 'Message has already been sent'
      });
    }

    // Update message as published
    await pool.query(
      'UPDATE daily_messages SET is_published = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    let dispatchResult = null;
    let recipientCount = 0;

    // If sendNow is true or it's the scheduled time, dispatch the message
    if (sendNow || (new Date().toISOString().split('T')[0] >= message.scheduled_date)) {
      try {
        // Format message for dispatcher
        const announcementFormat = {
          id: message.id,
          referenceNumber: `DM-${message.id}`,
          title: JSON.parse(message.title),
          content: JSON.parse(message.content),
          targetAudience: ['all'], // Daily messages go to all members
          bibleVerse: message.bible_verse ? JSON.parse(message.bible_verse) : null
        };

        const channelsToSend = channels || JSON.parse(message.channels);
        
        // Dispatch using the message dispatcher service
        dispatchResult = await messageDispatcher.dispatchAnnouncement(
          announcementFormat, 
          channelsToSend,
          { 
            language: 'both', // Send both languages
            messageType: 'daily_message'
          }
        );

        recipientCount = dispatchResult.totalRecipients || 0;

        // Update message with sent info
        await pool.query(
          'UPDATE daily_messages SET sent_at = CURRENT_TIMESTAMP, recipient_count = $1 WHERE id = $2',
          [recipientCount, id]
        );

      } catch (dispatchError) {
        console.error('Error dispatching daily message:', dispatchError);
        // Don't fail the publish if dispatch fails
        dispatchResult = { success: false, error: dispatchError.message };
      }
    }

    res.json({
      success: true,
      message: 'Daily message published successfully',
      published: true,
      sent: !!dispatchResult?.success,
      recipientCount,
      dispatchResult
    });

  } catch (error) {
    console.error('Error publishing daily message:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing daily message',
      error: error.message
    });
  }
});

// GET /api/daily-messages/scheduled - Get messages scheduled for today (admin only)
router.get('/scheduled', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT * FROM daily_messages 
       WHERE scheduled_date = $1 AND is_published = true AND sent_at IS NULL
       ORDER BY scheduled_time`,
      [today]
    );

    res.json({
      success: true,
      messages: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduled messages',
      error: error.message
    });
  }
});

// POST /api/daily-messages/send-scheduled - Send all scheduled messages for today (admin only)
router.post('/send-scheduled', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // Get all messages scheduled for today that haven't been sent yet
    const result = await pool.query(
      `SELECT * FROM daily_messages 
       WHERE scheduled_date = $1 AND is_published = true AND sent_at IS NULL AND scheduled_time <= $2
       ORDER BY scheduled_time`,
      [today, currentTime]
    );

    const messagesToSend = result.rows;
    const sendResults = [];

    for (const message of messagesToSend) {
      try {
        // Format message for dispatcher
        const announcementFormat = {
          id: message.id,
          referenceNumber: `DM-${message.id}`,
          title: JSON.parse(message.title),
          content: JSON.parse(message.content),
          targetAudience: ['all'],
          bibleVerse: message.bible_verse ? JSON.parse(message.bible_verse) : null
        };

        const channels = JSON.parse(message.channels);
        
        // Dispatch the message
        const dispatchResult = await messageDispatcher.dispatchAnnouncement(
          announcementFormat, 
          channels,
          { 
            language: 'both',
            messageType: 'daily_message'
          }
        );

        // Update message with sent info
        await pool.query(
          'UPDATE daily_messages SET sent_at = CURRENT_TIMESTAMP, recipient_count = $1 WHERE id = $2',
          [dispatchResult.totalRecipients || 0, message.id]
        );

        sendResults.push({
          messageId: message.id,
          success: dispatchResult.success,
          recipientCount: dispatchResult.totalRecipients || 0,
          channels: channels
        });

      } catch (error) {
        console.error(`Error sending message ${message.id}:`, error);
        sendResults.push({
          messageId: message.id,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${messagesToSend.length} scheduled messages`,
      results: sendResults,
      totalSent: sendResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Error sending scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending scheduled messages',
      error: error.message
    });
  }
});

module.exports = router;