/**
 * Persian TTS Service Client
 * 
 * این ماژول به سرویس Python TTS متصل می‌شود
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PersianTTSClient {
  constructor(baseURL = process.env.TTS_SERVICE_URL || 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.cacheDir = path.join(__dirname, '../cache/tts');
    
    // ایجاد دایرکتوری cache
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * بررسی سلامت سرویس TTS
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('❌ TTS Service not available:', error.message);
      return null;
    }
  }

  /**
   * تولید صدا از متن فارسی
   */
  async synthesize(text, options = {}) {
    const {
      voice = 'male',
      format = 'mp3',
      cache = true
    } = options;

    try {
      console.log(`🎤 Synthesizing Persian TTS: ${text.substring(0, 50)}...`);

      const response = await axios.post(
        `${this.baseURL}/api/tts/synthesize`,
        {
          text,
          voice,
          format
        },
        {
          responseType: 'arraybuffer',
          timeout: 30000 // 30 seconds
        }
      );

      const audioBuffer = Buffer.from(response.data);
      
      // ذخیره در cache
      if (cache) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(text).digest('hex');
        const filename = `${hash}.${format}`;
        const filepath = path.join(this.cacheDir, filename);
        
        fs.writeFileSync(filepath, audioBuffer);
        console.log(`✅ TTS cached: ${filename}`);
        
        return {
          success: true,
          audioBuffer,
          filepath,
          filename,
          url: `/api/tts/audio/${filename}`
        };
      }

      return {
        success: true,
        audioBuffer
      };

    } catch (error) {
      console.error('❌ TTS Synthesis failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        fallbackToClient: true
      };
    }
  }

  /**
   * دریافت اطلاعات cache
   */
  async getCacheInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tts/cache/info`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * پاک کردن cache
   */
  async clearCache() {
    try {
      const response = await axios.post(`${this.baseURL}/api/tts/cache/clear`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let ttsClientInstance = null;

function getTTSClient() {
  if (!ttsClientInstance) {
    ttsClientInstance = new PersianTTSClient();
  }
  return ttsClientInstance;
}

module.exports = {
  PersianTTSClient,
  getTTSClient
};
