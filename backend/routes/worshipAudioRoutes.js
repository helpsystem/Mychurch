const express = require('express');
const router = express.Router();
const db = require('../db-postgres');
const { authenticateToken } = require('../middleware/auth');

// POST /api/worship-audio/save-song
// Save or update worship song with AI-generated data
router.post('/save-song', authenticateToken, async (req, res) => {
  try {
    const {
      songId, // Optional - if updating existing song
      title,
      finglishLyrics,
      persianLyrics,
      chords,
      audioUrl,
      audioFileName,
      synchronizedData, // JSON object with word timestamps
      duration
    } = req.body;

    if (!title || !finglishLyrics || !persianLyrics) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, Finglish lyrics, and Persian lyrics are required' 
      });
    }

    let query, values;

    if (songId) {
      // Update existing song
      query = `
        UPDATE worship_songs 
        SET 
          title = $1,
          finglish_lyrics = $2,
          persian_lyrics = $3,
          chords = $4,
          audio_url = $5,
          audio_file_name = $6,
          synchronized_data = $7,
          duration = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `;
      values = [title, finglishLyrics, persianLyrics, chords, audioUrl, audioFileName, synchronizedData, duration, songId];
    } else {
      // Insert new song
      query = `
        INSERT INTO worship_songs (
          title, finglish_lyrics, persian_lyrics, chords, 
          audio_url, audio_file_name, synchronized_data, duration,
          created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      values = [title, finglishLyrics, persianLyrics, chords, audioUrl, audioFileName, synchronizedData, duration, req.user.userId];
    }

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: songId ? 'Song updated successfully' : 'Song created successfully',
      song: result.rows[0]
    });
  } catch (error) {
    console.error('Save song error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save song',
      error: error.message 
    });
  }
});

// GET /api/worship-audio/songs
// Get all worship songs with AI data
router.get('/songs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT 
        id, title, finglish_lyrics, persian_lyrics, chords,
        audio_url, audio_file_name, duration,
        created_at, updated_at
      FROM worship_songs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    res.json({
      success: true,
      songs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch songs',
      error: error.message 
    });
  }
});

// GET /api/worship-audio/songs/:id
// Get single worship song with synchronized data
router.get('/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id, title, finglish_lyrics, persian_lyrics, chords,
        audio_url, audio_file_name, synchronized_data, duration,
        created_at, updated_at
      FROM worship_songs
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Song not found' 
      });
    }

    res.json({
      success: true,
      song: result.rows[0]
    });
  } catch (error) {
    console.error('Get song error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch song',
      error: error.message 
    });
  }
});

// DELETE /api/worship-audio/songs/:id
// Delete worship song
router.delete('/songs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (admin or creator)
    const checkQuery = 'SELECT created_by FROM worship_songs WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Song not found' 
      });
    }

    const song = checkResult.rows[0];
    if (song.created_by !== req.user.userId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission denied' 
      });
    }

    const deleteQuery = 'DELETE FROM worship_songs WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Song deleted successfully'
    });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete song',
      error: error.message 
    });
  }
});

// GET /api/worship-audio/search
// Search worship songs by title or lyrics
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query required' 
      });
    }

    const query = `
      SELECT 
        id, title, finglish_lyrics, persian_lyrics, chords,
        audio_url, audio_file_name, duration,
        created_at, updated_at
      FROM worship_songs
      WHERE 
        title ILIKE $1 OR
        finglish_lyrics ILIKE $1 OR
        persian_lyrics ILIKE $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result = await db.query(query, [`%${q}%`]);

    res.json({
      success: true,
      songs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Search songs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search songs',
      error: error.message 
    });
  }
});

module.exports = router;
