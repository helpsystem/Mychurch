const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/worship-songs - دریافت همه آهنگ‌های پرستشی
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM worship_songs ORDER BY created_at DESC');
    const worshipSongs = result.rows.map(song => ({
      id: song.id,
      title: parseJSON(song.title, {}),
      artist: song.artist,
      youtubeId: song.youtubeid,
      lyrics: parseJSON(song.lyrics, {}),
      audioUrl: song.audiourl,
      videoUrl: song.videourl
    }));
    res.json(worshipSongs);
  } catch (error) {
    console.error('Fetch Worship Songs Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/worship-songs - ایجاد آهنگ پرستشی جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, artist, youtubeId, lyrics, audioUrl, videoUrl } = req.body;
  
  if (!title || !artist || !youtubeId) {
    return res.status(400).json({ message: 'Title, artist, and youtubeId are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO worship_songs (title, artist, youtubeId, lyrics, audioUrl, videoUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        JSON.stringify(title),
        artist,
        youtubeId,
        JSON.stringify(lyrics || {}),
        audioUrl || null,
        videoUrl || null
      ]
    );

    const newSong = result.rows[0];
    res.status(201).json({
      id: newSong.id,
      title: parseJSON(newSong.title, {}),
      artist: newSong.artist,
      youtubeId: newSong.youtubeid,
      lyrics: parseJSON(newSong.lyrics, {}),
      audioUrl: newSong.audiourl,
      videoUrl: newSong.videourl
    });
  } catch (error) {
    console.error('Create Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/worship-songs/:id - ویرایش آهنگ پرستشی
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, artist, youtubeId, lyrics, audioUrl, videoUrl } = req.body;

  try {
    const result = await pool.query(
      'UPDATE worship_songs SET title = $1, artist = $2, youtubeId = $3, lyrics = $4, audioUrl = $5, videoUrl = $6 WHERE id = $7 RETURNING *',
      [
        JSON.stringify(title),
        artist,
        youtubeId,
        JSON.stringify(lyrics || {}),
        audioUrl,
        videoUrl,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Worship song not found.' });
    }

    const updatedSong = result.rows[0];
    res.json({
      id: updatedSong.id,
      title: parseJSON(updatedSong.title, {}),
      artist: updatedSong.artist,
      youtubeId: updatedSong.youtubeid,
      lyrics: parseJSON(updatedSong.lyrics, {}),
      audioUrl: updatedSong.audiourl,
      videoUrl: updatedSong.videourl
    });
  } catch (error) {
    console.error('Update Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/worship-songs/:id - حذف آهنگ پرستشی
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM worship_songs WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Worship song not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;