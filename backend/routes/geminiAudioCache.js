/**
 * Gemini TTS Audio Cache API Routes
 * Store and retrieve generated Bible chapter audio
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { GoogleGenAI, Modality } = require("@google/genai");

// API Configuration - Load from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCTzZgnzvWcxd6KirJbc2sbaryFr14TrKg';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in .env, using hardcoded key (not recommended for production)');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Cache directory for Bible chapters
const CACHE_DIR = path.join(__dirname, '../../cache/bible-audio');

// Voice options
const VOICES = {
  kore: 'Kore',
  puck: 'Puck',
  charon: 'Charon',
  fenrir: 'Fenrir',
  zephyr: 'Zephyr'
};

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log('📁 Created Bible audio cache directory');
  }
}

ensureCacheDir();

/**
 * Generate cache key for chapter
 */
function getCacheKey(bookCode, chapter, voice) {
  const hash = crypto.createHash('md5')
    .update(`${bookCode}_${chapter}_${voice}`)
    .digest('hex');
  return `${bookCode}_ch${chapter}_${voice}_${hash}.mp3`;
}

/**
 * Check if chapter audio exists in cache
 */
async function checkCache(bookCode, chapter, voice) {
  const cacheKey = getCacheKey(bookCode, chapter, voice);
  const cachePath = path.join(CACHE_DIR, cacheKey);

  try {
    await fs.access(cachePath);
    const stats = await fs.stat(cachePath);
    return {
      exists: true,
      path: cachePath,
      filename: cacheKey,
      size: stats.size,
      created: stats.birthtime
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Generate speech from text using Gemini TTS
 */
async function generateSpeech(text, voice = 'Zephyr') {
  try {
    const prompt = `Say: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini API");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}

/**
 * Convert base64 to MP3 buffer
 */
function base64ToBuffer(base64Audio) {
  return Buffer.from(base64Audio, 'base64');
}

/**
 * POST /api/bible-audio/generate
 * Generate and cache Bible chapter audio
 */
router.post('/generate', async (req, res) => {
  try {
    const { bookCode, chapter, text, voice = 'Zephyr' } = req.body;

    if (!bookCode || !chapter || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookCode, chapter, text'
      });
    }

    if (!VOICES[voice.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        error: `Invalid voice. Available: ${Object.keys(VOICES).join(', ')}`
      });
    }

    // Check if already cached
    const cached = await checkCache(bookCode, chapter, voice);
    if (cached.exists) {
      console.log(`✅ Using cached audio: ${cached.filename}`);
      return res.json({
        success: true,
        cached: true,
        filename: cached.filename,
        size: cached.size,
        created: cached.created,
        url: `/api/bible-audio/play/${cached.filename}`
      });
    }

    console.log(`🎤 Generating audio for ${bookCode} Chapter ${chapter} with ${voice} voice...`);

    // Generate audio with Gemini TTS
    const base64Audio = await generateSpeech(text, VOICES[voice.toLowerCase()]);
    
    // Convert to buffer and save
    const audioBuffer = base64ToBuffer(base64Audio);
    const cacheKey = getCacheKey(bookCode, chapter, voice);
    const cachePath = path.join(CACHE_DIR, cacheKey);

    await fs.writeFile(cachePath, audioBuffer);

    const stats = await fs.stat(cachePath);

    console.log(`✅ Audio generated and cached: ${cacheKey} (${(stats.size / 1024).toFixed(2)} KB)`);

    res.json({
      success: true,
      cached: false,
      filename: cacheKey,
      size: stats.size,
      url: `/api/bible-audio/play/${cacheKey}`,
      message: 'Audio generated and cached successfully'
    });

  } catch (error) {
    console.error('Error generating Bible audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate audio'
    });
  }
});

/**
 * GET /api/bible-audio/play/:filename
 * Stream cached audio file
 */
router.get('/play/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(CACHE_DIR, filename);

    // Check if file exists
    await fs.access(audioPath);

    // Set headers for audio streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });

    // Stream the file
    const audioBuffer = await fs.readFile(audioPath);
    res.send(audioBuffer);

  } catch (error) {
    console.error('Error playing audio:', error);
    res.status(404).json({
      success: false,
      error: 'Audio file not found'
    });
  }
});

/**
 * GET /api/bible-audio/check/:bookCode/:chapter/:voice
 * Check if chapter audio exists
 */
router.get('/check/:bookCode/:chapter/:voice', async (req, res) => {
  try {
    const { bookCode, chapter, voice } = req.params;

    if (!VOICES[voice.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        error: `Invalid voice. Available: ${Object.keys(VOICES).join(', ')}`
      });
    }

    const cached = await checkCache(bookCode, chapter, voice);

    res.json({
      success: true,
      exists: cached.exists,
      ...(cached.exists && {
        filename: cached.filename,
        size: cached.size,
        created: cached.created,
        url: `/api/bible-audio/play/${cached.filename}`
      })
    });

  } catch (error) {
    console.error('Error checking cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-audio/list
 * List all cached audio files
 */
router.get('/list', async (req, res) => {
  try {
    const files = await fs.readdir(CACHE_DIR);
    
    const audioFiles = await Promise.all(
      files
        .filter(f => f.endsWith('.mp3'))
        .map(async (filename) => {
          const filePath = path.join(CACHE_DIR, filename);
          const stats = await fs.stat(filePath);
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            url: `/api/bible-audio/play/${filename}`
          };
        })
    );

    res.json({
      success: true,
      count: audioFiles.length,
      files: audioFiles.sort((a, b) => b.created - a.created)
    });

  } catch (error) {
    console.error('Error listing audio files:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/bible-audio/clear
 * Clear all cached audio
 */
router.delete('/clear', async (req, res) => {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));

    await Promise.all(
      mp3Files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );

    res.json({
      success: true,
      message: `Cleared ${mp3Files.length} audio files`,
      deletedCount: mp3Files.length
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-audio/voices
 * Get available voices
 */
router.get('/voices', (req, res) => {
  res.json({
    success: true,
    voices: Object.keys(VOICES).map(key => ({
      id: key,
      name: VOICES[key],
      displayName: VOICES[key]
    }))
  });
});

module.exports = router;
