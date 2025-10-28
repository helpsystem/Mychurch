const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to get file paths
const getSongsFilePath = () => path.join(__dirname, '../../public/worship/data/worship_songs.json');
const getTimingsDir = () => path.join(__dirname, '../../public/worship/data/timings');
const getTimingFilePath = (songId) => path.join(getTimingsDir(), `song_${songId}_timing.json`);

// POST /api/songs/save-json - Save worship songs JSON
router.post('/save-json', async (req, res) => {
  try {
    const { songs } = req.body;
    
    if (!songs || !Array.isArray(songs)) {
      return res.status(400).json({ error: 'Invalid songs data' });
    }

    const filePath = getSongsFilePath();
    await fs.writeFile(filePath, JSON.stringify(songs, null, 2), 'utf8');

    res.json({ success: true, message: 'Songs saved successfully' });
  } catch (error) {
    console.error('Error saving songs:', error);
    res.status(500).json({ error: 'Failed to save songs', details: error.message });
  }
});

// POST /api/songs/save-timing - Save timing data for a song
router.post('/save-timing', async (req, res) => {
  try {
    const { songId, timingData } = req.body;
    
    if (!songId || !timingData) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Ensure timings directory exists
    const timingsDir = getTimingsDir();
    try {
      await fs.access(timingsDir);
    } catch {
      await fs.mkdir(timingsDir, { recursive: true });
    }

    const filePath = getTimingFilePath(songId);
    await fs.writeFile(filePath, JSON.stringify(timingData, null, 2), 'utf8');

    res.json({ success: true, message: 'Timing data saved successfully' });
  } catch (error) {
    console.error('Error saving timing data:', error);
    res.status(500).json({ error: 'Failed to save timing data', details: error.message });
  }
});

// POST /api/songs/upload-audio - Upload audio file
router.post('/upload-audio', async (req, res) => {
  try {
    // TODO: Implement actual file upload with multer
    // For now, just return a mock URL
    const mockUrl = '/worship/audio/uploaded_song.mp3';
    res.json({ success: true, audioUrl: mockUrl });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio', details: error.message });
  }
});

// GET /api/songs/list - Get all songs
router.get('/list', async (req, res) => {
  try {
    const filePath = getSongsFilePath();
    const data = await fs.readFile(filePath, 'utf8');
    const songs = JSON.parse(data);
    res.json(songs);
  } catch (error) {
    console.error('Error loading songs:', error);
    res.status(500).json({ error: 'Failed to load songs', details: error.message });
  }
});

// GET /api/songs/timing/:songId - Get timing data for a song
router.get('/timing/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const filePath = getTimingFilePath(songId);
    const data = await fs.readFile(filePath, 'utf8');
    const timingData = JSON.parse(data);
    res.json(timingData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Timing data not found' });
    }
    console.error('Error loading timing data:', error);
    res.status(500).json({ error: 'Failed to load timing data', details: error.message });
  }
});

module.exports = router;
