/**
 * Google Gemini TTS Service
 * Using Google AI Studio API (Free Tier)
 * 
 * Rate Limits (Free):
 * - 15 requests per minute
 * - 1500 requests per day
 * - 1 million tokens per day
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// API Configuration
const GEMINI_API_KEY = 'AIzaSyCTzZgnzvWcxd6KirJbc2sbaryFr14TrKg';
const GEMINI_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Cache directory
const CACHE_DIR = path.join(__dirname, '../../cache/tts/gemini');

// Rate limiting
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 10; // کمتر از limit برای اطمینان

// Voice configurations for Persian
const PERSIAN_VOICES = {
  female: {
    languageCode: 'fa-IR',
    name: 'fa-IR-Standard-A', // Female voice
    ssmlGender: 'FEMALE'
  },
  male: {
    languageCode: 'fa-IR',
    name: 'fa-IR-Standard-B', // Male voice (if available)
    ssmlGender: 'MALE'
  }
};

/**
 * Initialize cache directory
 */
async function initCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log('✅ Gemini TTS cache directory ready');
  } catch (error) {
    console.error('❌ Failed to create cache directory:', error);
  }
}

/**
 * Check rate limit
 */
function checkRateLimit() {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;

  // Reset counter every minute
  if (timeSinceReset > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - timeSinceReset;
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
  }

  requestCount++;
}

/**
 * Generate cache key
 */
function getCacheKey(text, voice) {
  const hash = crypto.createHash('md5')
    .update(`${text}_${voice}`)
    .digest('hex');
  return `gemini_${voice}_${hash}.mp3`;
}

/**
 * Get cached audio
 */
async function getCachedAudio(text, voice) {
  const cacheKey = getCacheKey(text, voice);
  const cachePath = path.join(CACHE_DIR, cacheKey);

  try {
    await fs.access(cachePath);
    const stats = await fs.stat(cachePath);
    
    return {
      cached: true,
      audioPath: cachePath,
      size: stats.size,
      cacheKey
    };
  } catch {
    return null;
  }
}

/**
 * Synthesize text to speech using Google Cloud TTS
 */
async function synthesizeWithGemini(text, voice = 'female') {
  try {
    // Check cache first
    const cached = await getCachedAudio(text, voice);
    if (cached) {
      console.log('✅ Using cached audio');
      return {
        success: true,
        ...cached,
        voice
      };
    }

    // Check rate limit
    checkRateLimit();

    // Get voice config
    const voiceConfig = PERSIAN_VOICES[voice] || PERSIAN_VOICES.female;

    // Prepare request
    const requestBody = {
      input: {
        text: text
      },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    console.log(`🎤 Synthesizing with Gemini: ${text.substring(0, 50)}...`);

    // Make API request
    const response = await axios.post(
      `${GEMINI_TTS_ENDPOINT}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (!response.data || !response.data.audioContent) {
      throw new Error('No audio content in response');
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(response.data.audioContent, 'base64');

    // Save to cache
    const cacheKey = getCacheKey(text, voice);
    const cachePath = path.join(CACHE_DIR, cacheKey);
    await fs.writeFile(cachePath, audioBuffer);

    console.log(`✅ Audio synthesized and cached: ${cacheKey}`);

    return {
      success: true,
      cached: false,
      audioPath: cachePath,
      size: audioBuffer.length,
      voice,
      cacheKey
    };

  } catch (error) {
    console.error('❌ Gemini TTS Error:', error.message);
    
    // Provide helpful error messages
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      if (status === 400) {
        throw new Error('Invalid request: ' + message);
      } else if (status === 403) {
        throw new Error('API key invalid or quota exceeded');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      } else {
        throw new Error(`API error (${status}): ${message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      if (file.startsWith('gemini_')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      cacheDir: CACHE_DIR
    };
  } catch (error) {
    return {
      fileCount: 0,
      totalSize: 0,
      error: error.message
    };
  }
}

/**
 * Clean old cache files
 */
async function cleanCache(daysOld = 7) {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith('gemini_')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} old cache files`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get rate limit info
 */
function getRateLimitInfo() {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;
  const remainingTime = 60000 - timeSinceReset;
  
  return {
    requestCount,
    maxRequests: MAX_REQUESTS_PER_MINUTE,
    remaining: MAX_REQUESTS_PER_MINUTE - requestCount,
    resetIn: Math.ceil(remainingTime / 1000)
  };
}

// Initialize on module load
initCache();

module.exports = {
  synthesizeWithGemini,
  getCacheStats,
  cleanCache,
  getRateLimitInfo,
  PERSIAN_VOICES
};
