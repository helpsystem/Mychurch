/**
 * Google Cloud Text-to-Speech Service
 * 
 * Features:
 * - High-quality Persian voice (Gemini 2.5 Flash TTS - Achernar)
 * - High-quality English voice
 * - Word-level timing for precise highlighting
 * - Audio caching for performance
 * - Bilingual support
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Google Cloud TTS API Configuration
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || '';
const GOOGLE_TTS_API_URL = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize';

// Cache directory for audio files
const AUDIO_CACHE_DIR = path.join(__dirname, '../cache/audio');

/**
 * Voice configurations for different languages
 */
const VOICE_CONFIGS = {
  fa: {
    languageCode: 'fa-IR',
    modelName: 'gemini-2.5-flash-tts',
    name: 'Achernar', // Natural Persian voice from Gemini
    ssmlGender: 'FEMALE',
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 0,
      speakingRate: 0.9,
      volumeGainDb: 0
    }
  },
  en: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-F', // Natural English voice
    ssmlGender: 'FEMALE',
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 0,
      speakingRate: 0.95,
      volumeGainDb: 0
    }
  }
};

class GoogleTTSService {
  constructor() {
    this.apiKey = GOOGLE_TTS_API_KEY;
    this.cacheDir = AUDIO_CACHE_DIR;
    this.initializeCache();
  }

  /**
   * Initialize audio cache directory
   */
  async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('✅ Audio cache directory initialized:', this.cacheDir);
    } catch (error) {
      console.error('❌ Error creating cache directory:', error);
    }
  }

  /**
   * Generate unique cache key for text
   */
  getCacheKey(text, language) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${language}:${text}`).digest('hex');
    return `${language}_${hash}.json`;
  }

  /**
   * Get cached audio data
   */
  async getCachedAudio(cacheKey) {
    try {
      const cachePath = path.join(this.cacheDir, cacheKey);
      const data = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save audio data to cache
   */
  async saveCachedAudio(cacheKey, data) {
    try {
      const cachePath = path.join(this.cacheDir, cacheKey);
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
      console.log('💾 Cached audio data:', cacheKey);
    } catch (error) {
      console.error('❌ Error caching audio:', error);
    }
  }

  /**
   * Synthesize speech with Google Cloud TTS
   * Returns audio data and word timings
   */
  async synthesize(text, language = 'fa') {
    if (!this.apiKey) {
      throw new Error('Google Cloud TTS API key not configured');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, language);
    const cached = await this.getCachedAudio(cacheKey);
    if (cached) {
      console.log('✅ Using cached audio:', cacheKey);
      return cached;
    }

    console.log(`🎙️ Synthesizing speech (${language}):`, text.substring(0, 50) + '...');

    const voiceConfig = VOICE_CONFIGS[language] || VOICE_CONFIGS.en;

    try {
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
          ...voiceConfig.audioConfig,
          effectsProfileId: ['small-bluetooth-speaker-class-device']
        },
        enableTimePointing: ['WORD'] // Request word-level timings
      };

      // Add modelName for Persian (Gemini TTS)
      if (language === 'fa') {
        requestBody.voice.modelName = voiceConfig.modelName;
      }

      const response = await axios.post(
        `${GOOGLE_TTS_API_URL}?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = {
        audioContent: response.data.audioContent, // Base64 encoded audio
        timepoints: response.data.timepoints || [], // Word timings
        language: language,
        text: text,
        timestamp: new Date().toISOString()
      };

      // Process timepoints to create word-timing mapping
      result.wordTimings = this.processWordTimings(text, result.timepoints);

      // Cache the result
      await this.saveCachedAudio(cacheKey, result);

      console.log('✅ Speech synthesized successfully');
      console.log(`   - Audio size: ${result.audioContent.length} bytes (base64)`);
      console.log(`   - Word timings: ${result.wordTimings.length} words`);

      return result;

    } catch (error) {
      console.error('❌ Google TTS API Error:', error.response?.data || error.message);
      throw new Error(`TTS synthesis failed: ${error.message}`);
    }
  }

  /**
   * Process word timings from Google TTS response
   * Returns array of {word, startTime, endTime, duration}
   */
  processWordTimings(text, timepoints) {
    if (!timepoints || timepoints.length === 0) {
      // Fallback: estimate timings based on word count
      return this.estimateWordTimings(text);
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordTimings = [];

    timepoints.forEach((tp, index) => {
      const startTime = parseFloat(tp.timeSeconds || 0);
      const endTime = index < timepoints.length - 1 
        ? parseFloat(timepoints[index + 1].timeSeconds || 0)
        : startTime + 0.5; // Estimate last word duration

      if (index < words.length) {
        wordTimings.push({
          word: words[index],
          startTime: startTime * 1000, // Convert to milliseconds
          endTime: endTime * 1000,
          duration: (endTime - startTime) * 1000,
          markName: tp.markName || `word_${index}`
        });
      }
    });

    return wordTimings;
  }

  /**
   * Estimate word timings when timepoints are not available
   * Fallback method
   */
  estimateWordTimings(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordDuration = 400; // 400ms per word (adjustable)
    
    return words.map((word, index) => ({
      word: word,
      startTime: index * avgWordDuration,
      endTime: (index + 1) * avgWordDuration,
      duration: avgWordDuration,
      markName: `word_${index}`,
      estimated: true
    }));
  }

  /**
   * Synthesize an entire Bible verse with bilingual support
   * Returns both Persian and English audio with timings
   */
  async synthesizeVerse(verseData) {
    const { textEn, textFa, verseNumber, bookCode, chapter } = verseData;

    console.log(`\n📖 Synthesizing verse ${bookCode} ${chapter}:${verseNumber}`);

    try {
      const [persianAudio, englishAudio] = await Promise.all([
        textFa ? this.synthesize(textFa, 'fa') : null,
        textEn ? this.synthesize(textEn, 'en') : null
      ]);

      return {
        verseNumber,
        bookCode,
        chapter,
        persian: persianAudio,
        english: englishAudio,
        metadata: {
          generatedAt: new Date().toISOString(),
          service: 'Google Cloud TTS',
          model: {
            fa: 'gemini-2.5-flash-tts (Achernar)',
            en: 'en-US-Neural2-F'
          }
        }
      };
    } catch (error) {
      console.error(`❌ Error synthesizing verse ${verseNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Synthesize entire chapter
   * Returns array of verse audio data
   */
  async synthesizeChapter(verses) {
    console.log(`\n📚 Synthesizing chapter with ${verses.length} verses...`);

    const results = [];
    
    for (let i = 0; i < verses.length; i++) {
      const verse = verses[i];
      console.log(`   Processing verse ${i + 1}/${verses.length}...`);
      
      try {
        const audio = await this.synthesizeVerse(verse);
        results.push(audio);
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ⚠️ Failed to synthesize verse ${verse.verseNumber}`);
        results.push({
          verseNumber: verse.verseNumber,
          error: error.message
        });
      }
    }

    console.log(`✅ Chapter synthesis complete: ${results.length} verses`);
    return results;
  }

  /**
   * Clear audio cache
   */
  async clearCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        await fs.unlink(path.join(this.cacheDir, file));
      }
      console.log('🗑️ Audio cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const stats = {
        totalFiles: files.length,
        languages: {
          fa: files.filter(f => f.startsWith('fa_')).length,
          en: files.filter(f => f.startsWith('en_')).length
        },
        cacheDir: this.cacheDir
      };
      
      let totalSize = 0;
      for (const file of files) {
        const stat = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stat.size;
      }
      stats.totalSizeKB = Math.round(totalSize / 1024);
      
      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Export singleton instance
const googleTTSService = new GoogleTTSService();
module.exports = googleTTSService;

// Test function
async function testGoogleTTS() {
  console.log('\n=== Google Cloud TTS Test ===\n');

  if (!process.env.GOOGLE_TTS_API_KEY) {
    console.error('❌ GOOGLE_TTS_API_KEY not set in environment');
    console.log('\nTo test:');
    console.log('1. Get API key from: https://console.cloud.google.com/apis/credentials');
    console.log('2. Set in .env: GOOGLE_TTS_API_KEY=your_api_key_here');
    return;
  }

  try {
    // Test Persian
    console.log('\n📝 Testing Persian synthesis...');
    const persianResult = await googleTTSService.synthesize(
      'در ابتدا خدا آسمان و زمین را آفرید.',
      'fa'
    );
    console.log('✅ Persian synthesis successful');
    console.log(`   Words: ${persianResult.wordTimings.length}`);
    console.log('   First 3 word timings:', persianResult.wordTimings.slice(0, 3));

    // Test English
    console.log('\n📝 Testing English synthesis...');
    const englishResult = await googleTTSService.synthesize(
      'In the beginning God created the heaven and the earth.',
      'en'
    );
    console.log('✅ English synthesis successful');
    console.log(`   Words: ${englishResult.wordTimings.length}`);
    console.log('   First 3 word timings:', englishResult.wordTimings.slice(0, 3));

    // Cache stats
    const stats = await googleTTSService.getCacheStats();
    console.log('\n📊 Cache statistics:', stats);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run test if executed directly
if (require.main === module) {
  testGoogleTTS();
}
