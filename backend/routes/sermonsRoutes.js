const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/sermons/live - دریافت پخش زنده فعلی (Public or Auth?)
// We will secure it with authenticateToken so only logged-in users can see
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sermons WHERE is_live = true LIMIT 1');
    if (result.rows.length === 0) {
      return res.json(null);
    }
    const sermon = result.rows[0];
    res.json({
      id: sermon.id,
      title: typeof sermon.title === 'string' && sermon.title.startsWith('{') ? parseJSON(sermon.title, {}) : sermon.title,
      speaker: sermon.speaker || sermon.preacher, // Support both column names if schema varies
      date: sermon.date,
      youtube_id: sermon.youtube_id,
      is_live: sermon.is_live, // Should be true
      description: sermon.description
    });
  } catch (error) {
    console.error('Fetch Live Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/sermons - دریافت همه خطبات
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sermons ORDER BY date DESC');
    const sermons = result.rows.map(sermon => ({
      id: sermon.id,
      title: typeof sermon.title === 'string' && sermon.title.startsWith('{') ? parseJSON(sermon.title, {}) : sermon.title,
      speaker: sermon.speaker || sermon.preacher,
      date: sermon.date,
      youtube_id: sermon.youtube_id,
      audioUrl: sermon.audiourl,
      series: parseJSON(sermon.series, {}),
      notesUrl: sermon.notesurl,
      is_live: sermon.is_live,
      description: sermon.description
    }));
    res.json(sermons);
  } catch (error) {
    console.error('Fetch Sermons Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/sermons - ایجاد خطبه جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, speaker, date, youtube_id, description, is_live, audioUrl, series, notesUrl } = req.body;

  if (!title || !youtube_id) {
    return res.status(400).json({ message: 'Title and YouTube ID are required.' });
  }

  // If setting this to live, unset others
  if (is_live) {
    await pool.query('UPDATE sermons SET is_live = false');
  }

  try {
    const result = await pool.query(
      'INSERT INTO sermons (title, speaker, date, youtube_id, description, is_live, audioUrl, series, notesUrl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        typeof title === 'object' ? JSON.stringify(title) : title,
        speaker,
        date,
        youtube_id,
        description,
        is_live || false,
        audioUrl,
        JSON.stringify(series || {}),
        notesUrl
      ]
    );

    const newSermon = result.rows[0];
    res.status(201).json(newSermon);
  } catch (error) {
    console.error('Create Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/sermons/:id - ویرایش خطبه
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, speaker, date, youtube_id, description, is_live, audioUrl, series, notesUrl } = req.body;

  // If setting this to live, unset others
  if (is_live) {
    await pool.query('UPDATE sermons SET is_live = false WHERE id != $1', [id]);
  }

  try {
    const result = await pool.query(
      `UPDATE sermons SET 
        title = $1, 
        speaker = $2, 
        date = $3, 
        youtube_id = $4, 
        description = $5,
        is_live = $6,
        audioUrl = $7, 
        series = $8, 
        notesUrl = $9 
       WHERE id = $10 RETURNING *`,
      [
        typeof title === 'object' ? JSON.stringify(title) : title,
        speaker,
        date,
        youtube_id,
        description,
        is_live || false,
        audioUrl,
        JSON.stringify(series || {}),
        notesUrl,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sermon not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/sermons/:id - حذف خطبه
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM sermons WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Sermon not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;