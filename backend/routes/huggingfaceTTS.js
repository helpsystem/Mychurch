/**
 * Hugging Face Persian TTS API Routes
 * Provides endpoints for Persian text-to-speech using Kamtera's models
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { 
  synthesizePersianTTS, 
  getAvailableModels, 
  cleanCache,
  getCacheStats 
} = require('../services/huggingfaceTTS');

/**
 * POST /api/tts/huggingface/synthesize
 * Synthesize Persian text to speech
 * 
 * Body:
 * - text: Persian text to synthesize (required)
 * - voice: 'female' or 'male' (optional, default: 'female')
 * - apiToken: Hugging Face API token (optional)
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'female', apiToken } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        details: 'متن برای تولید صدا الزامی است'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 1000 characters)',
        details: 'متن بیش از حد طولانی است (حداکثر ۱۰۰۰ کاراکتر)'
      });
    }

    // Validate voice
    if (voice !== 'female' && voice !== 'male') {
      return res.status(400).json({
        success: false,
        error: 'Invalid voice. Use "female" or "male"',
        details: 'صدا نامعتبر است. از "female" یا "male" استفاده کنید'
      });
    }

    console.log(`🎤 TTS Request: ${text.substring(0, 50)}... (voice: ${voice})`);

    // Synthesize audio
    const result = await synthesizePersianTTS(text, voice, apiToken);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Return audio URL
    const audioFileName = path.basename(result.audioPath);
    const audioUrl = `/api/tts/huggingface/audio/${audioFileName}`;

    res.json({
      success: true,
      audioUrl,
      cached: result.cached,
      voice: result.voice,
      model: result.model,
      size: result.size
    });

  } catch (error) {
    console.error('❌ TTS Synthesis Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'خطا در تولید صدا'
    });
  }
});

/**
 * GET /api/tts/huggingface/audio/:filename
 * Serve cached audio file
 */
router.get('/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security)
    if (!/^hf_(female|male)_[a-f0-9]{32}\.wav$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const audioPath = path.join(__dirname, '../../cache/tts/huggingface', filename);
    
    res.setHeader('Content-Type', 'audio/wav');
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
 * GET /api/tts/huggingface/models
 * Get list of available models
 */
router.get('/models', (req, res) => {
  try {
    const models = getAvailableModels();
    res.json({
      success: true,
      models,
      count: models.length
    });
  } catch (error) {
    console.error('❌ Models List Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/huggingface/cache/stats
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
    console.error('❌ Cache Stats Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/tts/huggingface/cache/clean
 * Clean old cache files
 */
router.post('/cache/clean', async (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    const result = await cleanCache(daysOld);
    res.json(result);
  } catch (error) {
    console.error('❌ Cache Clean Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tts/huggingface/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Hugging Face Persian TTS',
    models: ['female', 'male'],
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
