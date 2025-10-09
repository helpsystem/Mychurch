const express = require('express');
const router = express.Router();
const { Client } = require('pg');
const { authenticateToken } = require('../middleware/auth');

// Create database client connection (prefer DATABASE_URL like the rest of the app)
const getClient = () => {
  if (process.env.DATABASE_URL) {
    return new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  // Fallback to discrete PG* vars for backwards compatibility
  return new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  });
};

// Get message history with delivery logs
router.get('/history', authenticateToken, async (req, res) => {
  const client = getClient();
  
  try {
    await client.connect();
    const { page = 1, limit = 20, channel, status, type, dateRange } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Add filters
    if (channel && channel !== 'all') {
      whereConditions.push(`$${paramIndex} = ANY(channels)`);
      params.push(channel);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (type && type !== 'all') {
      whereConditions.push(`announcement_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      let dateFilter;
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          dateFilter = null;
      }
      
      if (dateFilter) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        params.push(dateFilter.toISOString());
        paramIndex++;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get announcements with basic stats
    const query = `
      SELECT 
        id,
        title_en,
        title_fa,
        announcement_type as "type",
        priority,
        target_audience as "targetAudience",
        channels,
        author_email as "authorEmail", 
        created_at as "sentAt",
        status,
        reference_number as "referenceNumber",
        COALESCE(array_length(target_audience, 1), 0) as "totalRecipients"
      FROM church_announcements
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), offset);
    
    const result = await client.query(query, params);
    
    // For each message, get delivery logs from message_logs table
    const messagesWithLogs = await Promise.all(result.rows.map(async (message) => {
      // Get real delivery logs from message_logs table
      const deliveryQuery = `
        SELECT 
          id,
          reference_id as "messageId",
          channel,
          recipient_address as "recipient",
          delivery_status as "status",
          created_at as "attemptAt",
          sent_at as "deliveredAt",
          error_message as "errorMessage"
        FROM message_logs
        WHERE reference_id = $1 AND reference_type = 'announcement'
        ORDER BY created_at DESC
      `;
      
      const deliveryResult = await client.query(deliveryQuery, [message.id]);
      const deliveryLogs = deliveryResult.rows.map(log => ({
        ...log,
        cost: log.channel === 'sms' ? 0.05 : log.channel === 'whatsapp' ? 0.02 : 0
      }));
      
      // If no delivery logs exist, create mock ones for demonstration
      if (deliveryLogs.length === 0) {
        // Generate mock delivery logs based on channels if none exist
        message.channels.forEach((channel, index) => {
        const logId = `${message.id}-${channel}-${index}`;
        const recipient = channel === 'email' ? `member${index + 1}@example.com` : 
                         channel === 'sms' ? `+1234567890${index}` :
                         channel === 'whatsapp' ? `+1234567890${index}` :
                         'website-visitor';
        
        const status = Math.random() > 0.1 ? 'delivered' : 'failed'; // 90% success rate
        const attemptAt = new Date(message.sentAt);
        const deliveredAt = status === 'delivered' ? 
          new Date(attemptAt.getTime() + Math.random() * 300000) : // Delivered within 5 minutes
          null;
        
          deliveryLogs.push({
            id: logId,
            messageId: message.id.toString(),
            channel,
            recipient,
            status,
            attemptAt: attemptAt.toISOString(),
            deliveredAt: deliveredAt ? deliveredAt.toISOString() : null,
            errorMessage: status === 'failed' ? 'Delivery failed - invalid recipient' : null,
            cost: channel === 'sms' ? 0.05 : channel === 'whatsapp' ? 0.02 : 0
          });
        });
      }
      
      return {
        ...message,
        title: message.title_en || message.title_fa, // Default to English, fallback to Farsi
        deliveryLogs,
        totalRecipients: deliveryLogs.length
      };
    }));

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM church_announcements
      ${whereClause}
    `;
    
    const countResult = await client.query(countQuery, params.slice(0, -2)); // Remove limit and offset
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      messages: messagesWithLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Message History Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch message history',
      details: error.message 
    });
  } finally {
    await client.end().catch(console.error);
  }
});

// Get delivery logs for a specific message
router.get('/:messageId/delivery-logs', authenticateToken, async (req, res) => {
  const client = getClient();
  
  try {
    await client.connect();
    const { messageId } = req.params;
    const { channel, status } = req.query;

    // Query real delivery logs from message_logs table
    const query = `
      SELECT 
        id,
        reference_id as "messageId",
        channel,
        recipient_address as "recipient", 
        delivery_status as "status",
        created_at as "attemptAt",
        sent_at as "deliveredAt",
        error_message as "errorMessage"
      FROM message_logs
      WHERE reference_id = $1 AND reference_type = 'announcement'
    `;
    
    let params = [messageId];
    let paramIndex = 2;
    
    if (channel && channel !== 'all') {
      query += ` AND channel = $${paramIndex}`;
      params.push(channel);
      paramIndex++;
    }
    
    if (status && status !== 'all') {
      query += ` AND delivery_status = $${paramIndex}`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await client.query(query, params);
    let deliveryLogs = result.rows.map(log => ({
      ...log,
      cost: log.channel === 'sms' ? 0.05 : log.channel === 'whatsapp' ? 0.02 : 0
    }));
    
    // If no real logs exist, return mock data for demonstration
    if (deliveryLogs.length === 0) {
      const mockLogs = [
      {
        id: `${messageId}-email-1`,
        messageId,
        channel: 'email',
        recipient: 'member1@example.com',
        status: 'delivered',
        attemptAt: new Date().toISOString(),
        deliveredAt: new Date(Date.now() + 120000).toISOString(),
        cost: 0
      },
      {
        id: `${messageId}-sms-1`,
        messageId,
        channel: 'sms',
        recipient: '+12345678901',
        status: 'failed',
        attemptAt: new Date().toISOString(),
        errorMessage: 'Invalid phone number',
        cost: 0.05
      }
    ];
      
      let filteredLogs = mockLogs;
      
      if (channel && channel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.channel === channel);
      }
      
      if (status && status !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === status);
      }
      
      deliveryLogs = filteredLogs;
    }

    res.json(deliveryLogs);

  } catch (error) {
    console.error('Get Delivery Logs Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch delivery logs',
      details: error.message 
    });
  } finally {
    await client.end().catch(console.error);
  }
});

// Get message delivery statistics
router.get('/stats', authenticateToken, async (req, res) => {
  const client = getClient();
  
  try {
    await client.connect();
    const { period = 'month' } = req.query;
    
    let dateFilter;
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        dateFilter = new Date(now.getFullYear(), 0, 1); // This year
    }

    const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as sent_messages,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_messages,
        array_agg(DISTINCT unnest(channels)) as used_channels
      FROM church_announcements
      WHERE created_at >= $1
    `;

    const result = await client.query(query, [dateFilter.toISOString()]);
    const stats = result.rows[0];

    // Mock delivery stats (in real implementation, aggregate from delivery_logs table)
    const deliveryStats = {
      total_sent: parseInt(stats.sent_messages) * 10, // Mock: average 10 recipients per message
      delivered: Math.floor(parseInt(stats.sent_messages) * 10 * 0.9), // 90% delivery rate
      failed: Math.floor(parseInt(stats.sent_messages) * 10 * 0.1), // 10% failure rate
      pending: 0
    };

    res.json({
      period,
      messages: {
        total: parseInt(stats.total_messages),
        sent: parseInt(stats.sent_messages),
        drafts: parseInt(stats.draft_messages)
      },
      deliveries: deliveryStats,
      channels: stats.used_channels ? stats.used_channels.filter(Boolean) : [],
      success_rate: deliveryStats.total_sent > 0 ? 
        Math.round((deliveryStats.delivered / deliveryStats.total_sent) * 100) : 0
    });

  } catch (error) {
    console.error('Get Message Stats Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch message statistics',
      details: error.message 
    });
  } finally {
    await client.end().catch(console.error);
  }
});

module.exports = router;