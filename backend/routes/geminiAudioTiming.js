// backend/routes/geminiAudioTiming.js
// Updated to use Gemini 2.5 Flash with JSON Schema

const express = require('express');
const router = express.Router();
const PrecisionTimingService = require('../services/precisionTimingService');

let timingService = null;

// Initialize timing service
function getTimingService() {
  if (!timingService) {
    try {
      timingService = new PrecisionTimingService();
    } catch (error) {
      console.error('❌ Failed to initialize timing service:', error.message);
      return null;
    }
  }
  return timingService;
}

/**
 * POST /api/gemini-timing/generate
 * Generate word-level timing for Bible audio using Gemini AI
 */
router.post('/generate', async (req, res) => {
  try {
    const { audioUrl, bookCode, bookName, chapter, verses, language, translation } = req.body;

    if (!audioUrl || !verses || !Array.isArray(verses)) {
      return res.status(400).json({
        error: 'Missing required fields: audioUrl, verses'
      });
    }

    const service = getTimingService();
    if (!service) {
      return res.status(500).json({
        error: 'Timing service not available. Check GEMINI_API_KEY.'
      });
    }

    console.log(`🎵 Generating timing for ${bookName || bookCode} Chapter ${chapter} (${language})`);

    const result = await service.generateBibleTiming({
      translation: translation || 'TPV',
      bookCode: bookCode || 'GEN',
      chapter: chapter || 1,
      verses: verses,
      audioUrl: audioUrl
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.timing,
        outputPath: result.outputPath
      });
    } else {
      // Fallback to simple estimated timing
      console.log('⚠️ Using fallback timing estimation');
      const fallbackTiming = generateFallbackTiming(verses, chapter);
      res.json({
        success: true,
        data: fallbackTiming,
        warning: 'Using estimated timing (Gemini failed)'
      });
    }

  } catch (error) {
    console.error('❌ Error generating timing:', error);

    // Fallback timing
    const { verses, chapter } = req.body;
    const fallbackTiming = generateFallbackTiming(verses || [], chapter);

    return res.json({
      success: true,
      data: fallbackTiming,
      warning: `Using estimated timing: ${error.message}`
    });
  }
});

/**
 * POST /api/gemini-timing/worship
 * Generate word-level timing for worship songs
 */
router.post('/worship', async (req, res) => {
  try {
    const { songId, audioUrl, lyrics } = req.body;

    if (!songId || !audioUrl || !lyrics) {
      return res.status(400).json({
        error: 'Missing required fields: songId, audioUrl, lyrics'
      });
    }

    const service = getTimingService();
    if (!service) {
      return res.status(500).json({
        error: 'Timing service not available. Check GEMINI_API_KEY.'
      });
    }

    console.log(`🎵 Generating timing for worship song ${songId}`);

    const result = await service.generateWorshipTiming({
      songId,
      audioUrl,
      lyrics
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Error generating worship timing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gemini-timing/status
 * Check timing service status
 */
router.get('/status', (req, res) => {
  const service = getTimingService();
  res.json({
    available: !!service,
    model: 'gemini-2.5-flash',
    schema: 'json-schema',
    version: '3.0'
  });
});

/**
 * Generate simple fallback timing when Gemini fails
 * Estimates ~5 seconds per verse with word-level splits
 */
function generateFallbackTiming(verses, chapter) {
  const SECONDS_PER_VERSE = 5;

  const lines = verses.map((verse, index) => {
    const startTime = index * SECONDS_PER_VERSE;
    const endTime = (index + 1) * SECONDS_PER_VERSE;
    const words = (verse.text || '').split(/\s+/);
    const secondsPerWord = SECONDS_PER_VERSE / Math.max(words.length, 1);

    const wordSegments = words.map((word, wordIndex) => ({
      word: word,
      start: parseFloat((startTime + (wordIndex * secondsPerWord)).toFixed(2)),
      end: parseFloat((startTime + ((wordIndex + 1) * secondsPerWord)).toFixed(2))
    }));

    return {
      line: verse.text,
      label: String(verse.verse),
      start: startTime,
      end: endTime,
      words: wordSegments
    };
  });

  return {
    chapter: chapter || 1,
    lines: lines,
    total_duration: verses.length * SECONDS_PER_VERSE
  };
}

module.exports = router;

