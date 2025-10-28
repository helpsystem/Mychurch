/**
 * Google Gemini TTS API Routes
 * Using Google AI Studio (Free Tier)
 * 
 * Features:
 * - Persian text-to-speech
 * - Male and female voices
 * - Automatic caching
 * - Rate limiting (10 req/min)
 * - FREE - No cost!
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { 
  synthesizeWithGemini, 
  getCacheStats, 
  cleanCache, 
  getRateLimitInfo,
  PERSIAN_VOICES
} = require('../services/geminiTTS');

/**
 * POST /api/tts/gemini/synthesize
 * Synthesize Persian text to speech
 * 
 * Body:
 * - text: Persian text (required, max 5000 chars)
 * - voice: 'female' or 'male' (optional, default: 'female')
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'female' } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        details: 'متن برای تولید صدا الزامی است'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 5000 characters)',
        details: 'متن بیش از حد طولانی است (حداکثر ۵۰۰۰ کاراکتر)'
      });
    }

    // Validate voice
    if (voice !== 'female' && voice !== 'male') {
      return res.status(400).json({
        success: false,
        error: 'Invalid voice. Use "female" or "male"',
        details: 'صدا نامعتبر است'
      });
    }

    console.log(`🎤 Gemini TTS Request: ${text.substring(0, 50)}... (voice: ${voice})`);

    // Synthesize audio
    const result = await synthesizeWithGemini(text, voice);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Return audio URL
    const audioFileName = result.cacheKey;
    const audioUrl = `/api/tts/gemini/audio/${audioFileName}`;

    res.json({
      success: true,
      audioUrl,
      cached: result.cached,
      voice: result.voice,
      size: result.size,
      provider: 'Google Gemini (Free)',
      rateLimit: getRateLimitInfo()
    });

  } catch (error) {
    console.error('❌ Gemini TTS Error:', error);
    
    // Check if it's a rate limit error
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({
        success: false,
        error: error.message,
        details: 'تعداد درخواست‌ها بیش از حد است. لطفاً کمی صبر کنید.',
        rateLimit: getRateLimitInfo()
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      details: 'خطا در تولید صدا'
    });
  }
});

/**
 * GET /api/tts/gemini/audio/:filename
 * Serve cached audio file
 */
router.get('/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security)
    if (!/^gemini_(female|male)_[a-f0-9]{32}\.mp3$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const audioPath = path.join(__dirname, '../../cache/tts/gemini', filename);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(audioPath, (err) => {
      if (err) {
        console.error('❌ Audio file not found:', filename);
        res.status(404).json({
          success: false,
          error: 'Audio file not found'
        });
      }
    });

  } catch (error) {
    console.error('❌ Audio Serve Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/gemini/voices
 * Get available voice configurations
 */
router.get('/voices', (req, res) => {
  try {
    res.json({
      success: true,
      voices: {
        female: {
          id: 'female',
          name: 'صدای زن',
          languageCode: PERSIAN_VOICES.female.languageCode,
          gender: 'FEMALE'
        },
        male: {
          id: 'male',
          name: 'صدای مرد',
          languageCode: PERSIAN_VOICES.male.languageCode,
          gender: 'MALE'
        }
      },
      default: 'female'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/gemini/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/tts/gemini/cache/clean
 * Clean old cache files
 */
router.post('/cache/clean', async (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    const result = await cleanCache(daysOld);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/gemini/rate-limit
 * Get current rate limit status
 */
router.get('/rate-limit', (req, res) => {
  try {
    const info = getRateLimitInfo();
    res.json({
      success: true,
      ...info,
      maxPerDay: 1500,
      message: info.remaining > 0 
        ? `${info.remaining} درخواست باقی مانده` 
        : `لطفاً ${info.resetIn} ثانیه صبر کنید`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/gemini/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const rateLimit = getRateLimitInfo();
  res.json({
    success: true,
    service: 'Google Gemini TTS (Free)',
    provider: 'Google AI Studio',
    cost: 'FREE',
    voices: ['female', 'male'],
    language: 'Persian (fa-IR)',
    status: 'operational',
    rateLimit: {
      remaining: rateLimit.remaining,
      resetIn: rateLimit.resetIn
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
