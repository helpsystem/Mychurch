const express = require('express');
const router = express.Router();
const db = require('../db-postgres');

// POST /api/events/record-session - Save recorded church event session
router.post('/record-session', async (req, res) => {
  try {
    const {
      title,
      type,
      date,
      duration_seconds,
      transcript,
      summary,
      speaker_count,
      word_count
    } = req.body;

    // Validate required fields
    if (!title || !type || !transcript) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, transcript'
      });
    }

    // Insert into events table
    const result = await db.query(
      `INSERT INTO events 
       (title, description, event_date, event_type, duration_minutes, transcript, speaker_count, word_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, title, event_date, event_type`,
      [
        title,
        summary || `Recorded ${type} session`,
        date || new Date().toISOString(),
        type,
        Math.floor(duration_seconds / 60) || 0,
        transcript,
        speaker_count || 0,
        word_count || 0
      ]
    );

    const savedEvent = result.rows[0];

    console.log(`✅ Church event recorded: ${savedEvent.title} (ID: ${savedEvent.id})`);

    res.status(201).json({
      success: true,
      message: 'Event session recorded successfully',
      id: savedEvent.id,
      event: savedEvent
    });

  } catch (error) {
    console.error('❌ Error recording event session:', error);
    res.status(500).json({
      error: 'Failed to record event session',
      details: error.message
    });
  }
});

// GET /api/events/recorded-sessions - Get all recorded sessions
router.get('/recorded-sessions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, event_date, event_type, duration_minutes, speaker_count, word_count, created_at
       FROM events
       WHERE transcript IS NOT NULL
       ORDER BY event_date DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      count: result.rows.length,
      sessions: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching recorded sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch recorded sessions',
      details: error.message
    });
  }
});

// GET /api/events/recorded-sessions/:id - Get specific session with transcript
router.get('/recorded-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT *
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      session: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      details: error.message
    });
  }
});

module.exports = router;
