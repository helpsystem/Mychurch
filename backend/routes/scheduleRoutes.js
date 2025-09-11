const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/schedule-events - دریافت همه رویدادهای برنامه
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schedule_events ORDER BY date DESC, startTime ASC');
    const scheduleEvents = result.rows.map(event => ({
      id: event.id,
      title: parseJSON(event.title, {}),
      description: parseJSON(event.description, {}),
      leader: event.leader,
      date: event.date,
      startTime: event.starttime,
      endTime: event.endtime,
      type: event.type,
      location: event.location
    }));
    res.json(scheduleEvents);
  } catch (error) {
    console.error('Fetch Schedule Events Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/schedule-events - ایجاد رویداد برنامه جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, description, leader, date, startTime, endTime, type, location } = req.body;
  
  if (!title || !description || !leader || !date || !startTime || !endTime || !type) {
    return res.status(400).json({ message: 'Title, description, leader, date, start/end time, and type are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO schedule_events (title, description, leader, date, startTime, endTime, type, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description),
        leader,
        date,
        startTime,
        endTime,
        type,
        location || ''
      ]
    );

    const newEvent = result.rows[0];
    res.status(201).json({
      id: newEvent.id,
      title: parseJSON(newEvent.title, {}),
      description: parseJSON(newEvent.description, {}),
      leader: newEvent.leader,
      date: newEvent.date,
      startTime: newEvent.starttime,
      endTime: newEvent.endtime,
      type: newEvent.type,
      location: newEvent.location
    });
  } catch (error) {
    console.error('Create Schedule Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/schedule-events/:id - ویرایش رویداد برنامه
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, description, leader, date, startTime, endTime, type, location } = req.body;

  try {
    const result = await pool.query(
      'UPDATE schedule_events SET title = $1, description = $2, leader = $3, date = $4, startTime = $5, endTime = $6, type = $7, location = $8 WHERE id = $9 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(description),
        leader,
        date,
        startTime,
        endTime,
        type,
        location,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Schedule event not found.' });
    }

    const updatedEvent = result.rows[0];
    res.json({
      id: updatedEvent.id,
      title: parseJSON(updatedEvent.title, {}),
      description: parseJSON(updatedEvent.description, {}),
      leader: updatedEvent.leader,
      date: updatedEvent.date,
      startTime: updatedEvent.starttime,
      endTime: updatedEvent.endtime,
      type: updatedEvent.type,
      location: updatedEvent.location
    });
  } catch (error) {
    console.error('Update Schedule Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/schedule-events/:id - حذف رویداد برنامه
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM schedule_events WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Schedule event not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Schedule Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;