const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/events - دریافت همه رویدادها
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date DESC');
    const events = result.rows.map(event => ({
      id: event.id,
      title: parseJSON(event.title, {}),
      date: parseJSON(event.date, ''),
      description: parseJSON(event.description, {}),
      imageUrl: event.imageurl,
      location: parseJSON(event.location, {}),
      startTime: event.starttime,
      endTime: event.endtime
    }));
    res.json(events);
  } catch (error) {
    console.error('Fetch Events Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/events - ایجاد رویداد جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, date, description, imageUrl, location, startTime, endTime } = req.body;
  
  if (!title || !date || !description) {
    return res.status(400).json({ message: 'Title, date, and description are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO events (title, date, description, imageUrl, location, startTime, endTime) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(date),
        JSON.stringify(description),
        imageUrl || null,
        JSON.stringify(location || {}),
        startTime || null,
        endTime || null
      ]
    );

    const newEvent = result.rows[0];
    res.status(201).json({
      id: newEvent.id,
      title: parseJSON(newEvent.title, {}),
      date: parseJSON(newEvent.date, ''),
      description: parseJSON(newEvent.description, {}),
      imageUrl: newEvent.imageurl,
      location: parseJSON(newEvent.location, {}),
      startTime: newEvent.starttime,
      endTime: newEvent.endtime
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/events/:id - ویرایش رویداد
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, date, description, imageUrl, location, startTime, endTime } = req.body;

  try {
    const result = await pool.query(
      'UPDATE events SET title = $1, date = $2, description = $3, imageUrl = $4, location = $5, startTime = $6, endTime = $7 WHERE id = $8 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(date),
        JSON.stringify(description),
        imageUrl,
        JSON.stringify(location || {}),
        startTime,
        endTime,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const updatedEvent = result.rows[0];
    res.json({
      id: updatedEvent.id,
      title: parseJSON(updatedEvent.title, {}),
      date: parseJSON(updatedEvent.date, ''),
      description: parseJSON(updatedEvent.description, {}),
      imageUrl: updatedEvent.imageurl,
      location: parseJSON(updatedEvent.location, {}),
      startTime: updatedEvent.starttime,
      endTime: updatedEvent.endtime
    });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/events/:id - حذف رویداد
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;