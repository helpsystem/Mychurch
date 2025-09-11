const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/sermons - دریافت همه خطبات
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sermons ORDER BY date DESC');
    const sermons = result.rows.map(sermon => ({
      id: sermon.id,
      title: parseJSON(sermon.title, {}),
      speaker: sermon.speaker,
      date: sermon.date,
      audioUrl: sermon.audiourl,
      series: parseJSON(sermon.series, {}),
      notesUrl: sermon.notesurl
    }));
    res.json(sermons);
  } catch (error) {
    console.error('Fetch Sermons Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/sermons - ایجاد خطبه جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, speaker, date, audioUrl, series, notesUrl } = req.body;
  
  if (!title || !speaker || !date || !audioUrl) {
    return res.status(400).json({ message: 'Title, speaker, date, and audioUrl are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO sermons (title, speaker, date, audioUrl, series, notesUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        JSON.stringify(title),
        speaker,
        date,
        audioUrl,
        JSON.stringify(series || {}),
        notesUrl || null
      ]
    );

    const newSermon = result.rows[0];
    res.status(201).json({
      id: newSermon.id,
      title: parseJSON(newSermon.title, {}),
      speaker: newSermon.speaker,
      date: newSermon.date,
      audioUrl: newSermon.audiourl,
      series: parseJSON(newSermon.series, {}),
      notesUrl: newSermon.notesurl
    });
  } catch (error) {
    console.error('Create Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/sermons/:id - ویرایش خطبه
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, speaker, date, audioUrl, series, notesUrl } = req.body;

  try {
    const result = await pool.query(
      'UPDATE sermons SET title = $1, speaker = $2, date = $3, audioUrl = $4, series = $5, notesUrl = $6 WHERE id = $7 RETURNING *',
      [
        JSON.stringify(title),
        speaker,
        date,
        audioUrl,
        JSON.stringify(series || {}),
        notesUrl,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sermon not found.' });
    }

    const updatedSermon = result.rows[0];
    res.json({
      id: updatedSermon.id,
      title: parseJSON(updatedSermon.title, {}),
      speaker: updatedSermon.speaker,
      date: updatedSermon.date,
      audioUrl: updatedSermon.audiourl,
      series: parseJSON(updatedSermon.series, {}),
      notesUrl: updatedSermon.notesurl
    });
  } catch (error) {
    console.error('Update Sermon Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/sermons/:id - حذف خطبه
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
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