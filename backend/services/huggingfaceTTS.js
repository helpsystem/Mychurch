/**
 * Hugging Face Persian TTS Client
 * Uses Kamtera's Persian TTS models on Hugging Face
 * Models: persian-tts-female-vits (best) and persian-tts-male1-vits (best)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Hugging Face API endpoints for Persian TTS models
const HUGGING_FACE_MODELS = {
  female: {
    name: 'Kamtera/persian-tts-female-vits',
    apiUrl: 'https://api-inference.huggingface.co/models/Kamtera/persian-tts-female-vits',
    description: 'بهترین مدل زن فارسی (VITS)'
  },
  male: {
    name: 'Kamtera/persian-tts-male1-vits',
    apiUrl: 'https://api-inference.huggingface.co/models/Kamtera/persian-tts-male1-vits',
    description: 'بهترین مدل مرد فارسی (VITS)'
  }
};

// Cache directory for generated audio files
const CACHE_DIR = path.join(__dirname, '../../cache/tts/huggingface');

/**
 * Initialize cache directory
 */
async function initCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log(`✅ Hugging Face TTS cache directory ready: ${CACHE_DIR}`);
  } catch (error) {
    console.error('❌ Failed to create cache directory:', error);
  }
}

/**
 * Generate cache key for text
 */
function getCacheKey(text, voice = 'female') {
  const hash = crypto.createHash('md5').update(`${text}_${voice}`).digest('hex');
  return `hf_${voice}_${hash}.wav`;
}

/**
 * Check if cached audio exists
 */
async function getCachedAudio(cacheKey) {
  try {
    const filePath = path.join(CACHE_DIR, cacheKey);
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

/**
 * Synthesize Persian text to speech using Hugging Face API
 * @param {string} text - Persian text to synthesize
 * @param {string} voice - Voice type: 'female' or 'male'
 * @param {string} apiToken - Hugging Face API token (optional but recommended)
 * @returns {Promise<Object>} - Audio file path and metadata
 */
async function synthesizePersianTTS(text, voice = 'female', apiToken = null) {
  try {
    // Initialize cache directory
    await initCacheDir();

    // Check cache first
    const cacheKey = getCacheKey(text, voice);
    const cachedPath = await getCachedAudio(cacheKey);
    
    if (cachedPath) {
      console.log(`✅ Found cached audio: ${cacheKey}`);
      return {
        success: true,
        audioPath: cachedPath,
        cached: true,
        voice: voice,
        model: HUGGING_FACE_MODELS[voice].name
      };
    }

    // Get model configuration
    const model = HUGGING_FACE_MODELS[voice] || HUGGING_FACE_MODELS.female;
    
    console.log(`🎤 Synthesizing with ${model.description}...`);
    console.log(`📝 Text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    // Call Hugging Face Inference API
    const response = await axios.post(
      model.apiUrl,
      { inputs: text },
      { 
        headers,
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout
      }
    );

    // Save audio to cache
    const outputPath = path.join(CACHE_DIR, cacheKey);
    await fs.writeFile(outputPath, response.data);

    console.log(`✅ Audio synthesized successfully: ${cacheKey}`);

    return {
      success: true,
      audioPath: outputPath,
      cached: false,
      voice: voice,
      model: model.name,
      size: response.data.length
    };

  } catch (error) {
    console.error('❌ Hugging Face TTS Error:', error.message);
    
    // Handle specific errors
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.error || error.message;
      
      if (status === 503) {
        return {
          success: false,
          error: 'Model is loading. Please try again in a few moments.',
          errorCode: 'MODEL_LOADING',
          details: 'مدل در حال بارگذاری است. لطفاً چند لحظه دیگر امتحان کنید.'
        };
      } else if (status === 401) {
        return {
          success: false,
          error: 'Invalid API token',
          errorCode: 'AUTH_ERROR',
          details: 'توکن API نامعتبر است'
        };
      }
      
      return {
        success: false,
        error: errorMsg,
        errorCode: 'API_ERROR',
        statusCode: status
      };
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: 'NETWORK_ERROR'
    };
  }
}

/**
 * Get information about available models
 */
function getAvailableModels() {
  return Object.entries(HUGGING_FACE_MODELS).map(([key, model]) => ({
    id: key,
    name: model.name,
    description: model.description,
    apiUrl: model.apiUrl
  }));
}

/**
 * Clean old cache files (older than 7 days)
 */
async function cleanCache(daysOld = 7) {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`🧹 Cleaned ${deletedCount} old cache files`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('❌ Cache cleaning error:', error);
    return { success: false, error: error.message };
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
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    return {
      fileCount: files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      cacheDir: CACHE_DIR
    };
    
  } catch (error) {
    return {
      fileCount: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      error: error.message
    };
  }
}

module.exports = {
  synthesizePersianTTS,
  getAvailableModels,
  cleanCache,
  getCacheStats,
  HUGGING_FACE_MODELS
};
