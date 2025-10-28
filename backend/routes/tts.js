/**
 * TTS API Routes
 * 
 * Endpoints for managing Google Cloud TTS operations
 */

const express = require('express');
const router = express.Router();
const { getTTSManager } = require('../services/ttsManager');

const ttsManager = getTTSManager();

/**
 * GET /api/tts/usage
 * Get current TTS usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const stats = ttsManager.getUsageStats();
    
    res.json({
      success: true,
      usage: stats
    });
  } catch (err) {
    console.error('Get usage failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tts/synthesize-verse
 * Synthesize audio for a single Bible verse
 */
router.post('/synthesize-verse', async (req, res) => {
  try {
    const { bookCode, chapter, verseNumber, textEn, textFa } = req.body;

    // Validation
    if (!bookCode || !chapter || !verseNumber || !textEn || !textFa) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookCode, chapter, verseNumber, textEn, textFa'
      });
    }

    // Generate audio
    const result = await ttsManager.generateBibleVerseAudio(
      bookCode,
      parseInt(chapter),
      parseInt(verseNumber),
      textEn,
      textFa
    );

    res.json({
      success: true,
      verse: result
    });
  } catch (err) {
    console.error('Synthesize verse failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tts/synthesize-chapter
 * Synthesize audio for entire chapter
 */
router.post('/synthesize-chapter', async (req, res) => {
  try {
    const { bookCode, chapter, verses } = req.body;

    if (!bookCode || !chapter || !verses || !Array.isArray(verses)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookCode, chapter, verses (array)'
      });
    }

    const result = await ttsManager.generateChapterAudio(
      bookCode,
      parseInt(chapter),
      verses
    );

    res.json({
      success: true,
      chapter: result
    });
  } catch (err) {
    console.error('Synthesize chapter failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tts/synthesize-song
 * Synthesize audio for worship song
 */
router.post('/synthesize-song', async (req, res) => {
  try {
    const { songId, titleEn, titleFa, lyricsEn, lyricsFa } = req.body;

    if (!songId || !titleEn || !titleFa || !lyricsEn || !lyricsFa) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: songId, titleEn, titleFa, lyricsEn, lyricsFa'
      });
    }

    const result = await ttsManager.generateSongAudio(
      songId,
      titleEn,
      titleFa,
      lyricsEn,
      lyricsFa
    );

    res.json({
      success: true,
      song: result
    });
  } catch (err) {
    console.error('Synthesize song failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/tts/audio-index
 * Get complete audio index
 */
router.get('/audio-index', async (req, res) => {
  try {
    res.json({
      success: true,
      index: ttsManager.audioIndex
    });
  } catch (err) {
    console.error('Get audio index failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/tts/verse-audio/:bookCode/:chapter/:verse
 * Get audio info for specific verse
 */
router.get('/verse-audio/:bookCode/:chapter/:verse', async (req, res) => {
  try {
    const { bookCode, chapter, verse } = req.params;
    const verseKey = `${bookCode}_${chapter}_${verse}`;
    
    const audioInfo = ttsManager.getAudioInfo('bible', verseKey);
    
    if (!audioInfo) {
      return res.status(404).json({
        success: false,
        error: 'Audio not found for this verse'
      });
    }

    res.json({
      success: true,
      audio: audioInfo
    });
  } catch (err) {
    console.error('Get verse audio failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tts/check-needs-regeneration
 * Check if verse needs audio regeneration
 */
router.post('/check-needs-regeneration', async (req, res) => {
  try {
    const { bookCode, chapter, verseNumber, textEn, textFa } = req.body;

    if (!bookCode || !chapter || !verseNumber || !textEn || !textFa) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const verseKey = `${bookCode}_${chapter}_${verseNumber}`;
    const needsRegen = await ttsManager.needsRegeneration(
      'bible',
      verseKey,
      textEn,
      textFa
    );

    res.json({
      success: true,
      needsRegeneration: needsRegen
    });
  } catch (err) {
    console.error('Check regeneration failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/tts/clear-old-versions
 * Clear old audio file versions
 */
router.delete('/clear-old-versions', async (req, res) => {
  try {
    await ttsManager.clearOldVersions();

    res.json({
      success: true,
      message: 'Old versions cleared successfully'
    });
  } catch (err) {
    console.error('Clear old versions failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/tts/test
 * Test endpoint
 */
router.get('/test', async (req, res) => {
  try {
    const { text = 'سلام دنیا', language = 'fa' } = req.query;

    const result = await ttsManager.synthesize(text, language);

    res.json({
      success: true,
      result: {
        ...result,
        audioContent: result.audioContent.substring(0, 100) + '...' // Truncate for response
      }
    });
  } catch (err) {
    console.error('TTS test failed:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tts/persian-coqui
 * Generate Persian TTS using Coqui TTS Server
 * 
 * این endpoint از مدل Coqui TTS فارسی استفاده می‌کند
 * مدل: https://github.com/karim23657/Persian-tts-coqui
 */
router.post('/persian-coqui', async (req, res) => {
  try {
    const { text, voice = 'male', format = 'mp3' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'متن الزامی است'
      });
    }

    // استفاده از سرویس Python TTS
    const { getTTSClient } = require('../services/persianTTSClient');
    const ttsClient = getTTSClient();
    
    // بررسی دسترسی به سرویس
    const health = await ttsClient.checkHealth();
    
    if (!health) {
      return res.json({
        success: false,
        fallbackToClient: true,
        message: 'سرویس TTS در دسترس نیست. از TTS مرورگر استفاده می‌شود.',
        instructions: {
          start_server: 'python scripts/tts_server.py',
          install: 'pip install -r requirements-tts.txt',
          github: 'https://github.com/karim23657/Persian-tts-coqui'
        }
      });
    }

    // تولید صدا
    const result = await ttsClient.synthesize(text, { voice, format });
    
    if (result.success) {
      // ارسال فایل صوتی
      res.setHeader('Content-Type', `audio/${format}`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 day
      res.send(result.audioBuffer);
    } else {
      res.json(result);
    }

  } catch (err) {
    console.error('Persian Coqui TTS failed:', err);
    res.status(500).json({
      success: false,
      fallbackToClient: true,
      error: err.message
    });
  }
});

module.exports = router;
