/**
 * Google Cloud TTS API Routes
 * 
 * Endpoints for generating high-quality speech with word-level timings
 */

const express = require('express');
const router = express.Router();
const googleTTSService = require('../services/googleTTS');

/**
 * POST /api/google-tts/synthesize
 * Synthesize text to speech with word timings
 * 
 * Body:
 * {
 *   "text": "در ابتدا خدا آسمان و زمین را آفرید",
 *   "language": "fa" // or "en"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "audio": "base64_encoded_audio",
 *   "wordTimings": [
 *     { "word": "در", "startTime": 0, "endTime": 200, "duration": 200 },
 *     ...
 *   ]
 * }
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, language = 'fa' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    if (!['fa', 'en'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Language must be "fa" or "en"'
      });
    }

    const result = await googleTTSService.synthesize(text, language);

    res.json({
      success: true,
      audio: result.audioContent,
      wordTimings: result.wordTimings,
      language: result.language,
      metadata: {
        textLength: text.length,
        wordCount: result.wordTimings.length,
        totalDuration: result.wordTimings.length > 0 
          ? result.wordTimings[result.wordTimings.length - 1].endTime 
          : 0,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    console.error('❌ TTS synthesis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google-tts/synthesize-verse
 * Synthesize a Bible verse in both languages
 * 
 * Body:
 * {
 *   "textEn": "In the beginning God created...",
 *   "textFa": "در ابتدا خدا آسمان و زمین...",
 *   "verseNumber": 1,
 *   "bookCode": "GEN",
 *   "chapter": 1
 * }
 */
router.post('/synthesize-verse', async (req, res) => {
  try {
    const { textEn, textFa, verseNumber, bookCode, chapter } = req.body;

    if (!textEn && !textFa) {
      return res.status(400).json({
        success: false,
        error: 'At least one text (textEn or textFa) is required'
      });
    }

    const result = await googleTTSService.synthesizeVerse({
      textEn,
      textFa,
      verseNumber,
      bookCode,
      chapter
    });

    res.json({
      success: true,
      verse: result
    });

  } catch (error) {
    console.error('❌ Verse synthesis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google-tts/synthesize-chapter
 * Synthesize entire chapter
 * 
 * Body:
 * {
 *   "verses": [
 *     { "textEn": "...", "textFa": "...", "verseNumber": 1 },
 *     ...
 *   ],
 *   "bookCode": "GEN",
 *   "chapter": 1
 * }
 */
router.post('/synthesize-chapter', async (req, res) => {
  try {
    const { verses, bookCode, chapter } = req.body;

    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Verses array is required'
      });
    }

    // Add bookCode and chapter to each verse
    const versesWithMeta = verses.map(v => ({
      ...v,
      bookCode: bookCode || v.bookCode,
      chapter: chapter || v.chapter
    }));

    const results = await googleTTSService.synthesizeChapter(versesWithMeta);

    res.json({
      success: true,
      chapter: {
        bookCode,
        chapter,
        verseCount: results.length,
        verses: results
      }
    });

  } catch (error) {
    console.error('❌ Chapter synthesis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google-tts/cache-stats
 * Get audio cache statistics
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await googleTTSService.getCacheStats();
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/google-tts/clear-cache
 * Clear audio cache
 */
router.delete('/clear-cache', async (req, res) => {
  try {
    await googleTTSService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google-tts/test
 * Test Google TTS service
 */
router.get('/test', async (req, res) => {
  try {
    const { text = 'سلام دنیا', language = 'fa' } = req.query;

    const result = await googleTTSService.synthesize(text, language);

    res.json({
      success: true,
      test: {
        input: { text, language },
        output: {
          audioSize: result.audioContent.length,
          wordCount: result.wordTimings.length,
          duration: result.wordTimings.length > 0 
            ? result.wordTimings[result.wordTimings.length - 1].endTime 
            : 0,
          firstThreeWords: result.wordTimings.slice(0, 3)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
