const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/analytics/overview - آمار کلی داشبورد
router.get('/overview', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    // آمار کلی اطلاعیه‌ها
    const announcementsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_announcements,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_announcements,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_announcements,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as announcements_last_30_days
      FROM church_announcements
    `);

    // آمار کانال‌های ارسال
    const channelStats = await pool.query(`
      SELECT 
        channel,
        COUNT(*) as message_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sends,
        AVG(CASE WHEN status = 'sent' AND metadata->>'recipientCount' IS NOT NULL 
            THEN (metadata->>'recipientCount')::integer ELSE 0 END) as avg_recipients
      FROM message_logs 
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY channel
      ORDER BY message_count DESC
    `);

    // آمار روزانه ارسال پیام‌ها در 30 روز گذشته
    const dailyMessageStats = await pool.query(`
      SELECT 
        DATE(sent_at) as date,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_messages,
        SUM(CASE WHEN metadata->>'recipientCount' IS NOT NULL 
            THEN (metadata->>'recipientCount')::integer ELSE 0 END) as total_recipients
      FROM message_logs
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `);

    // آمار زبان‌ها
    const languageStats = await pool.query(`
      SELECT 
        language,
        COUNT(*) as usage_count
      FROM message_logs
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY language
      ORDER BY usage_count DESC
    `);

    // آمار وضعیت ارسال
    const deliveryStats = await pool.query(`
      SELECT 
        delivery_status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM message_logs
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY delivery_status
      ORDER BY count DESC
    `);

    res.json({
      announcements: announcementsStats.rows[0],
      channels: channelStats.rows,
      dailyStats: dailyMessageStats.rows,
      languages: languageStats.rows,
      delivery: deliveryStats.rows,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics Overview Error:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار کلی' });
  }
});

// GET /api/analytics/announcements/:id - آمار یک اطلاعیه خاص
router.get('/announcements/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    // اطلاعات اطلاعیه
    const announcement = await pool.query(`
      SELECT id, reference_number, title_en, title_fa, 
             announcement_type, priority, status, created_at, 
             publish_date, channels, target_audience
      FROM church_announcements 
      WHERE id = $1
    `, [id]);

    if (announcement.rows.length === 0) {
      return res.status(404).json({ message: 'اطلاعیه یافت نشد' });
    }

    // آمار ارسال این اطلاعیه
    const messageStats = await pool.query(`
      SELECT 
        channel,
        status,
        delivery_status,
        language,
        sent_at,
        error_message,
        metadata
      FROM message_logs
      WHERE reference_id = $1 AND reference_type = 'announcement'
      ORDER BY sent_at DESC
    `, [id]);

    // خلاصه آمار
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_sends,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_sends,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_sends,
        COUNT(DISTINCT channel) as channels_used,
        SUM(CASE WHEN metadata->>'recipientCount' IS NOT NULL 
            THEN (metadata->>'recipientCount')::integer ELSE 0 END) as total_recipients
      FROM message_logs
      WHERE reference_id = $1 AND reference_type = 'announcement'
    `, [id]);

    res.json({
      announcement: announcement.rows[0],
      messages: messageStats.rows,
      summary: summary.rows[0],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Announcement Analytics Error:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار اطلاعیه' });
  }
});

// GET /api/analytics/performance - آمار عملکرد سیستم
router.get('/performance', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // آمار عملکرد کانال‌ها
    const channelPerformance = await pool.query(`
      SELECT 
        channel,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_sends,
        ROUND((COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / COUNT(*)), 2) as success_rate,
        AVG(CASE WHEN metadata->>'recipientCount' IS NOT NULL 
            THEN (metadata->>'recipientCount')::integer ELSE 0 END) as avg_recipients_per_send,
        COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
      FROM message_logs
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY channel
      ORDER BY success_rate DESC
    `);

    // آمار خطاهای رایج
    const commonErrors = await pool.query(`
      SELECT 
        error_message,
        COUNT(*) as occurrence_count,
        MAX(sent_at) as last_occurrence
      FROM message_logs
      WHERE error_message IS NOT NULL
        AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY error_message
      ORDER BY occurrence_count DESC
      LIMIT 10
    `);

    // آمار استفاده در ساعات مختلف
    const hourlyUsage = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM sent_at) as hour,
        COUNT(*) as message_count
      FROM message_logs
      WHERE reference_type = 'announcement'
        AND sent_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM sent_at)
      ORDER BY hour
    `);

    res.json({
      channelPerformance: channelPerformance.rows,
      commonErrors: commonErrors.rows,
      hourlyUsage: hourlyUsage.rows,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance Analytics Error:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار عملکرد' });
  }
});

module.exports = router;