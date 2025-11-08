// backend/routes/audioSyncRoutes.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer configuration for audio upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/audio');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * POST /api/audio-sync/process-worship
 * Process worship song audio + text for synchronization
 * Only for SUPER_ADMIN and MANAGER
 */
router.post('/process-worship', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), upload.single('audio'), async (req, res) => {
  try {
    const { finglishText, persianText, worshipSongId } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    if (!finglishText) {
      return res.status(400).json({ error: 'Finglish text is required' });
    }

    console.log(`🎵 Processing worship song ID: ${worshipSongId}`);

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Read audio file
    const audioBuffer = await fs.readFile(audioFile.path);
    const base64Audio = audioBuffer.toString('base64');

    console.log(`✅ Audio loaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Generate word-level timestamps
    console.log('🤖 Generating word-level timestamps...');
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audioFile.mimetype,
          data: base64Audio,
        },
      },
      { 
        text: `Reference text: "${finglishText}"\n\nAnalyze this worship song audio and generate precise word-level timestamps. Return ONLY a JSON array of objects with 'word', 'startTime', and 'endTime' properties. No markdown, no explanations.` 
      },
    ]);

    let responseText = result.response.text();
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    responseText = responseText.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

    let timingData;
    try {
      timingData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      // Fallback: generate estimated timing
      timingData = generateFallbackTiming(finglishText);
    }

    // Clean up uploaded file
    await fs.unlink(audioFile.path);

    console.log(`✅ Generated ${timingData.length} word timestamps`);

    // Save timing data to database if worshipSongId is provided
    if (worshipSongId) {
      try {
        await pool.query(
          `UPDATE worship_songs 
           SET timing_data = $1, timing_updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [JSON.stringify(timingData), worshipSongId]
        );
        console.log(`✅ Saved timing to database for song ID: ${worshipSongId}`);
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: {
        timing: timingData,
        finglishText,
        persianText,
        worshipSongId,
        wordCount: timingData.length
      }
    });

  } catch (error) {
    console.error('❌ Error processing worship song:', error);
    
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }

    res.status(500).json({ 
      error: error.message || 'Failed to process worship song',
      details: error.stack
    });
  }
});

/**
 * POST /api/audio-sync/process-bible
 * Process Bible audio chapter with verse text
 * Only for SUPER_ADMIN and MANAGER
 */
router.post('/process-bible', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { audioUrl, bookName, bookCode, chapter, verses, translation } = req.body;

    if (!audioUrl || !verses || !Array.isArray(verses)) {
      return res.status(400).json({ 
        error: 'Missing required fields: audioUrl, verses' 
      });
    }

    console.log(`📖 Processing Bible: ${bookName} Chapter ${chapter} (${translation})`);

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Fetch audio file
    console.log(`📥 Fetching audio from: ${audioUrl}`);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const base64Audio = audioBuffer.toString('base64');

    console.log(`✅ Audio fetched: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

    const prompt = `Listen to this Bible chapter audio and generate precise verse-level and word-level timestamps.

Book: ${bookName || 'Bible'} Chapter ${chapter || '1'}
Translation: ${translation || 'Unknown'}

Verses:
${versesText}

Return ONLY valid JSON in this exact format (no markdown, no trailing commas):
{
  "chapter": ${chapter || 1},
  "verses": [
    {
      "verse_number": 1,
      "text": "exact verse text",
      "start_time": 0.5,
      "end_time": 5.2,
      "word_segments": [
        {"word": "first", "start_time": 0.5, "end_time": 0.8},
        {"word": "second", "start_time": 0.9, "end_time": 1.2}
      ]
    }
  ]
}`;

    console.log('🤖 Sending to Gemini AI...');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/mpeg',
          data: base64Audio,
        },
      },
      { text: prompt },
    ]);

    let responseText = result.response.text();
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    responseText = responseText.replace(/,(\s*[}\]])/g, '$1');

    let timingData;
    try {
      timingData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      // Fallback
      timingData = generateBibleFallbackTiming(verses, chapter);
    }

    console.log(`✅ Generated timing for ${timingData.verses?.length || 0} verses`);

    // Save timing data to database
    if (bookCode && chapter && translation) {
      try {
        // Check if timing record exists
        const existingRecord = await pool.query(
          `SELECT id FROM bible_audio_timing 
           WHERE book_code = $1 AND chapter = $2 AND translation = $3`,
          [bookCode, chapter, translation]
        );

        if (existingRecord.rows.length > 0) {
          // Update existing
          await pool.query(
            `UPDATE bible_audio_timing 
             SET timing_data = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE book_code = $2 AND chapter = $3 AND translation = $4`,
            [JSON.stringify(timingData), bookCode, chapter, translation]
          );
        } else {
          // Insert new
          await pool.query(
            `INSERT INTO bible_audio_timing (book_code, chapter, translation, timing_data) 
             VALUES ($1, $2, $3, $4)`,
            [bookCode, chapter, translation, JSON.stringify(timingData)]
          );
        }
        
        console.log(`✅ Saved Bible timing to database: ${bookCode} ${chapter} (${translation})`);
      } catch (dbError) {
        console.error('⚠️ Failed to save Bible timing to database:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: timingData
    });

  } catch (error) {
    console.error('❌ Error processing Bible audio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process Bible audio',
      details: error.stack
    });
  }
});

/**
 * GET /api/audio-sync/timing/worship/:id
 * Get timing data for worship song
 */
router.get('/timing/worship/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT timing_data, timing_updated_at FROM worship_songs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Worship song not found' 
      });
    }

    const song = result.rows[0];

    if (!song.timing_data) {
      return res.status(404).json({ 
        error: 'Timing data not available for this song' 
      });
    }

    res.json({
      success: true,
      data: {
        timing: typeof song.timing_data === 'string' 
          ? JSON.parse(song.timing_data) 
          : song.timing_data,
        updatedAt: song.timing_updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error loading worship timing:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to load timing data'
    });
  }
});

/**
 * GET /api/audio-sync/timing/bible/:bookCode/:chapter/:translation
 * Get timing data for Bible chapter
 */
router.get('/timing/bible/:bookCode/:chapter/:translation', authenticateToken, async (req, res) => {
  try {
    const { bookCode, chapter, translation } = req.params;

    const result = await pool.query(
      `SELECT timing_data, updated_at 
       FROM bible_audio_timing 
       WHERE book_code = $1 AND chapter = $2 AND translation = $3`,
      [bookCode, parseInt(chapter), translation]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Bible timing data not found' 
      });
    }

    const timing = result.rows[0];

    res.json({
      success: true,
      data: {
        timing: typeof timing.timing_data === 'string' 
          ? JSON.parse(timing.timing_data) 
          : timing.timing_data,
        updatedAt: timing.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error loading Bible timing:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to load timing data'
    });
  }
});

// Helper functions
function generateFallbackTiming(text) {
  const words = text.split(/\s+/);
  const SECONDS_PER_WORD = 0.5;
  
  return words.map((word, index) => ({
    word: word,
    startTime: index * SECONDS_PER_WORD,
    endTime: (index + 1) * SECONDS_PER_WORD
  }));
}

function generateBibleFallbackTiming(verses, chapter) {
  const SECONDS_PER_VERSE = 5;
  
  const verseSegments = verses.map((verse, index) => {
    const startTime = index * SECONDS_PER_VERSE;
    const endTime = (index + 1) * SECONDS_PER_VERSE;
    const words = verse.text.split(/\s+/);
    const secondsPerWord = SECONDS_PER_VERSE / words.length;
    
    const wordSegments = words.map((word, wordIndex) => ({
      word: word,
      start_time: startTime + (wordIndex * secondsPerWord),
      end_time: startTime + ((wordIndex + 1) * secondsPerWord)
    }));
    
    return {
      verse_number: verse.verse,
      text: verse.text,
      start_time: startTime,
      end_time: endTime,
      word_segments: wordSegments
    };
  });
  
  return {
    chapter: chapter || 1,
    verses: verseSegments
  };
}

module.exports = router;
