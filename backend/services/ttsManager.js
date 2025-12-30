/**
 * Google Cloud TTS Manager
 * 
 * Features:
 * - Automatic change detection using MD5 hash
 * - Dual-language audio generation (Persian fa-IR + English en-US)
 * - Free-tier quota tracking (500k chars/month WaveNet)
 * - Local caching with versioning
 * - Batch processing with rate limiting
 * - Audio index generation for frontend
 */

// Optional dependency - may not be installed in all environments
let textToSpeech;
try {
  textToSpeech = require('@google-cloud/text-to-speech');
} catch (e) {
  console.warn('⚠️  @google-cloud/text-to-speech not installed - TTS features disabled');
  textToSpeech = null;
}

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class TTSManager {
  constructor() {
    // Initialize Google Cloud TTS client (if available)
    if (textToSpeech && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.client = new textToSpeech.TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    } else {
      this.client = null;
      console.warn('⚠️  Google Cloud TTS client not initialized');
    }

    // Configuration
    this.config = {
      cacheDir: path.join(__dirname, '../../cache/tts'),
      audioDir: path.join(__dirname, '../../public/audio'),
      indexFile: path.join(__dirname, '../../public/audio_index.json'),
      usageFile: path.join(__dirname, '../../cache/tts/usage.json'),
      
      // Free tier limit (WaveNet)
      freeTierLimit: parseInt(process.env.TTS_FREE_TIER_LIMIT || '500000'),
      
      // Voice settings
      voices: {
        fa: {
          languageCode: 'fa-IR',
          name: process.env.TTS_DEFAULT_VOICE_FA || 'fa-IR-Wavenet-D',
          ssmlGender: 'FEMALE'
        },
        en: {
          languageCode: 'en-US',
          name: process.env.TTS_DEFAULT_VOICE_EN || 'en-US-Neural2-F',
          ssmlGender: 'FEMALE'
        }
      },

      // Audio configuration
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: parseFloat(process.env.TTS_SPEAKING_RATE || '0.9'),
        pitch: parseFloat(process.env.TTS_PITCH || '0'),
        volumeGainDb: 0.0,
        effectsProfileId: ['small-bluetooth-speaker-class-device']
      }
    };

    this.initDirectories();
    this.audioIndex = this.loadAudioIndex();
    this.usage = this.loadUsage();
  }

  /**
   * Initialize required directories
   */
  async initDirectories() {
    const dirs = [
      this.config.cacheDir,
      this.config.audioDir,
      path.join(this.config.audioDir, 'bible/fa'),
      path.join(this.config.audioDir, 'bible/en'),
      path.join(this.config.audioDir, 'songs/fa'),
      path.join(this.config.audioDir, 'songs/en'),
      path.join(this.config.audioDir, 'readings/fa'),
      path.join(this.config.audioDir, 'readings/en'),
      path.join(__dirname, '../../logs')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') {
          console.error(`Failed to create directory ${dir}:`, err);
        }
      }
    }
  }

  /**
   * Load audio index from JSON file
   */
  loadAudioIndex() {
    try {
      if (fsSync.existsSync(this.config.indexFile)) {
        const data = fsSync.readFileSync(this.config.indexFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Failed to load audio index, creating new one:', err.message);
    }
    
    return {
      bible: {},
      songs: {},
      readings: {},
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save audio index to JSON file
   */
  async saveAudioIndex() {
    try {
      this.audioIndex.lastUpdated = new Date().toISOString();
      await fs.writeFile(
        this.config.indexFile,
        JSON.stringify(this.audioIndex, null, 2),
        'utf-8'
      );
      console.log('✅ Audio index saved');
    } catch (err) {
      console.error('❌ Failed to save audio index:', err);
    }
  }

  /**
   * Load usage statistics
   */
  loadUsage() {
    try {
      if (fsSync.existsSync(this.config.usageFile)) {
        const data = fsSync.readFileSync(this.config.usageFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Failed to load usage data, creating new one');
    }

    return {
      currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
      charactersUsed: 0,
      requestCount: 0,
      lastReset: new Date().toISOString(),
      history: []
    };
  }

  /**
   * Save usage statistics
   */
  async saveUsage() {
    try {
      await fs.writeFile(
        this.config.usageFile,
        JSON.stringify(this.usage, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save usage data:', err);
    }
  }

  /**
   * Check and reset usage if new month
   */
  checkAndResetUsage() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (this.usage.currentMonth !== currentMonth) {
      // Save last month to history
      this.usage.history.push({
        month: this.usage.currentMonth,
        charactersUsed: this.usage.charactersUsed,
        requestCount: this.usage.requestCount
      });

      // Keep only last 12 months
      if (this.usage.history.length > 12) {
        this.usage.history = this.usage.history.slice(-12);
      }

      // Reset for new month
      this.usage.currentMonth = currentMonth;
      this.usage.charactersUsed = 0;
      this.usage.requestCount = 0;
      this.usage.lastReset = new Date().toISOString();

      this.saveUsage();
      console.log(`📅 Usage reset for new month: ${currentMonth}`);
    }
  }

  /**
   * Track API usage
   */
  async trackUsage(characterCount) {
    this.checkAndResetUsage();
    
    this.usage.charactersUsed += characterCount;
    this.usage.requestCount += 1;
    
    await this.saveUsage();

    const remaining = this.config.freeTierLimit - this.usage.charactersUsed;
    const percentage = ((this.usage.charactersUsed / this.config.freeTierLimit) * 100).toFixed(2);

    console.log(`📊 Usage: ${this.usage.charactersUsed}/${this.config.freeTierLimit} chars (${percentage}%) | Remaining: ${remaining}`);

    if (remaining < 50000) {
      console.warn(`⚠️  WARNING: Only ${remaining} characters remaining in free tier!`);
    }

    if (remaining <= 0) {
      throw new Error('Free tier quota exceeded! Wait until next month or upgrade.');
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    this.checkAndResetUsage();
    
    return {
      currentMonth: this.usage.currentMonth,
      charactersUsed: this.usage.charactersUsed,
      requestCount: this.usage.requestCount,
      limit: this.config.freeTierLimit,
      remaining: this.config.freeTierLimit - this.usage.charactersUsed,
      percentageUsed: ((this.usage.charactersUsed / this.config.freeTierLimit) * 100).toFixed(2),
      lastReset: this.usage.lastReset,
      history: this.usage.history
    };
  }

  /**
   * Calculate MD5 hash of text
   */
  calculateHash(text) {
    return crypto.createHash('md5').update(text, 'utf-8').digest('hex');
  }

  /**
   * Get cache key for text
   */
  getCacheKey(text, language) {
    const hash = this.calculateHash(text);
    return `${language}_${hash}`;
  }

  /**
   * Check if cached audio exists and is valid
   */
  async getCachedAudio(text, language) {
    const cacheKey = this.getCacheKey(text, language);
    const metaFile = path.join(this.config.cacheDir, `${cacheKey}.json`);
    const audioFile = path.join(this.config.cacheDir, `${cacheKey}.mp3`);

    try {
      const [metaExists, audioExists] = await Promise.all([
        fs.access(metaFile).then(() => true).catch(() => false),
        fs.access(audioFile).then(() => true).catch(() => false)
      ]);

      if (metaExists && audioExists) {
        const metadata = JSON.parse(await fs.readFile(metaFile, 'utf-8'));
        const audioContent = await fs.readFile(audioFile);

        return {
          audioContent: audioContent.toString('base64'),
          metadata,
          cached: true
        };
      }
    } catch (err) {
      console.log(`Cache miss for ${cacheKey}`);
    }

    return null;
  }

  /**
   * Save audio to cache
   */
  async saveCachedAudio(text, language, audioContent, metadata) {
    const cacheKey = this.getCacheKey(text, language);
    const metaFile = path.join(this.config.cacheDir, `${cacheKey}.json`);
    const audioFile = path.join(this.config.cacheDir, `${cacheKey}.mp3`);

    try {
      await Promise.all([
        fs.writeFile(metaFile, JSON.stringify(metadata, null, 2)),
        fs.writeFile(audioFile, Buffer.from(audioContent, 'base64'))
      ]);
      
      console.log(`💾 Cached audio: ${cacheKey}`);
    } catch (err) {
      console.error(`Failed to cache audio ${cacheKey}:`, err);
    }
  }

  /**
   * Synthesize text to speech using Google Cloud TTS
   */
  async synthesize(text, language = 'fa') {
    console.log(`🎙️  Synthesizing speech (${language}): ${text.substring(0, 50)}...`);

    // Check cache first
    const cached = await this.getCachedAudio(text, language);
    if (cached) {
      console.log(`✅ Using cached audio (${language})`);
      return cached;
    }

    // Check quota
    const characterCount = text.length;
    await this.trackUsage(characterCount);

    // Prepare request
    const voice = this.config.voices[language];
    if (!voice) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const request = {
      input: { text },
      voice,
      audioConfig: this.config.audioConfig
    };

    try {
      // Call Google Cloud TTS API
      const [response] = await this.client.synthesizeSpeech(request);

      const metadata = {
        text,
        language,
        voice: voice.name,
        characterCount,
        hash: this.calculateHash(text),
        timestamp: new Date().toISOString(),
        audioEncoding: this.config.audioConfig.audioEncoding,
        speakingRate: this.config.audioConfig.speakingRate
      };

      // Cache the result
      await this.saveCachedAudio(text, language, response.audioContent, metadata);

      console.log(`✅ Speech synthesized successfully (${language})`);

      return {
        audioContent: response.audioContent.toString('base64'),
        metadata,
        cached: false
      };
    } catch (err) {
      console.error(`❌ TTS synthesis failed (${language}):`, err);
      throw err;
    }
  }

  /**
   * Generate audio for Bible verse (both languages)
   */
  async generateBibleVerseAudio(bookCode, chapter, verseNumber, textEn, textFa) {
    console.log(`\n📖 Generating Bible audio: ${bookCode} ${chapter}:${verseNumber}`);

    const results = await Promise.all([
      this.synthesize(textFa, 'fa'),
      this.synthesize(textEn, 'en')
    ]);

    const [faResult, enResult] = results;

    // Save audio files
    const baseFilename = `${bookCode.toLowerCase()}_${chapter}_${verseNumber}`;
    const hash = this.calculateHash(textFa + textEn).substring(0, 8);
    const version = `v${hash}`;
    
    const faPaths = {
      filename: `${baseFilename}_${version}.mp3`,
      fullPath: path.join(this.config.audioDir, 'bible/fa', `${baseFilename}_${version}.mp3`),
      webPath: `/audio/bible/fa/${baseFilename}_${version}.mp3`
    };

    const enPaths = {
      filename: `${baseFilename}_${version}.mp3`,
      fullPath: path.join(this.config.audioDir, 'bible/en', `${baseFilename}_${version}.mp3`),
      webPath: `/audio/bible/en/${baseFilename}_${version}.mp3`
    };

    // Write audio files
    await Promise.all([
      fs.writeFile(faPaths.fullPath, Buffer.from(faResult.audioContent, 'base64')),
      fs.writeFile(enPaths.fullPath, Buffer.from(enResult.audioContent, 'base64'))
    ]);

    // Update audio index
    const verseKey = `${bookCode}_${chapter}_${verseNumber}`;
    this.audioIndex.bible[verseKey] = {
      bookCode,
      chapter,
      verseNumber,
      textEn,
      textFa,
      version,
      hash,
      audio: {
        fa: faPaths.webPath,
        en: enPaths.webPath
      },
      metadata: {
        fa: faResult.metadata,
        en: enResult.metadata
      },
      updated: new Date().toISOString()
    };

    await this.saveAudioIndex();

    console.log(`✅ Bible verse audio generated: ${verseKey}`);
    console.log(`   FA: ${faPaths.webPath}`);
    console.log(`   EN: ${enPaths.webPath}`);

    return this.audioIndex.bible[verseKey];
  }

  /**
   * Generate audio for entire chapter (batch)
   */
  async generateChapterAudio(bookCode, chapter, verses) {
    console.log(`\n📚 Generating chapter audio: ${bookCode} ${chapter} (${verses.length} verses)`);

    const results = [];
    
    for (let i = 0; i < verses.length; i++) {
      const verse = verses[i];
      
      try {
        const result = await this.generateBibleVerseAudio(
          bookCode,
          chapter,
          verse.verseNumber,
          verse.textEn,
          verse.textFa
        );
        
        results.push(result);

        // Rate limiting: 100ms between verses
        if (i < verses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`Failed to generate verse ${verse.verseNumber}:`, err);
        results.push({ error: err.message, verseNumber: verse.verseNumber });
      }
    }

    console.log(`✅ Chapter audio generation complete: ${results.length}/${verses.length} verses`);

    return {
      bookCode,
      chapter,
      totalVerses: verses.length,
      successCount: results.filter(r => !r.error).length,
      failureCount: results.filter(r => r.error).length,
      verses: results
    };
  }

  /**
   * Generate audio for worship song
   */
  async generateSongAudio(songId, titleEn, titleFa, lyricsEn, lyricsFa) {
    console.log(`\n🎵 Generating song audio: ${titleEn} / ${titleFa}`);

    const results = await Promise.all([
      this.synthesize(lyricsFa, 'fa'),
      this.synthesize(lyricsEn, 'en')
    ]);

    const [faResult, enResult] = results;

    const baseFilename = songId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const hash = this.calculateHash(lyricsFa + lyricsEn).substring(0, 8);
    const version = `v${hash}`;

    const faPaths = {
      filename: `${baseFilename}_${version}.mp3`,
      fullPath: path.join(this.config.audioDir, 'songs/fa', `${baseFilename}_${version}.mp3`),
      webPath: `/audio/songs/fa/${baseFilename}_${version}.mp3`
    };

    const enPaths = {
      filename: `${baseFilename}_${version}.mp3`,
      fullPath: path.join(this.config.audioDir, 'songs/en', `${baseFilename}_${version}.mp3`),
      webPath: `/audio/songs/en/${baseFilename}_${version}.mp3`
    };

    await Promise.all([
      fs.writeFile(faPaths.fullPath, Buffer.from(faResult.audioContent, 'base64')),
      fs.writeFile(enPaths.fullPath, Buffer.from(enResult.audioContent, 'base64'))
    ]);

    this.audioIndex.songs[songId] = {
      songId,
      titleEn,
      titleFa,
      version,
      hash,
      audio: {
        fa: faPaths.webPath,
        en: enPaths.webPath
      },
      metadata: {
        fa: faResult.metadata,
        en: enResult.metadata
      },
      updated: new Date().toISOString()
    };

    await this.saveAudioIndex();

    console.log(`✅ Song audio generated: ${songId}`);
    return this.audioIndex.songs[songId];
  }

  /**
   * Check if text has changed and needs regeneration
   */
  async needsRegeneration(category, id, textEn, textFa) {
    const index = this.audioIndex[category];
    if (!index || !index[id]) {
      return true; // New item, needs generation
    }

    const existing = index[id];
    const currentHash = this.calculateHash(textEn + textFa);

    return existing.hash !== currentHash;
  }

  /**
   * Get audio info from index
   */
  getAudioInfo(category, id) {
    const index = this.audioIndex[category];
    return index && index[id] ? index[id] : null;
  }

  /**
   * Clear old audio versions
   */
  async clearOldVersions() {
    console.log('\n🧹 Clearing old audio versions...');
    
    const categories = ['bible', 'songs', 'readings'];
    let totalDeleted = 0;

    for (const category of categories) {
      const faDir = path.join(this.config.audioDir, category, 'fa');
      const enDir = path.join(this.config.audioDir, category, 'en');

      for (const dir of [faDir, enDir]) {
        try {
          const files = await fs.readdir(dir);
          const currentFiles = new Set();

          // Collect current versions from index
          Object.values(this.audioIndex[category] || {}).forEach(item => {
            if (item.audio) {
              Object.values(item.audio).forEach(audioPath => {
                currentFiles.add(path.basename(audioPath));
              });
            }
          });

          // Delete old versions
          for (const file of files) {
            if (file.endsWith('.mp3') && !currentFiles.has(file)) {
              await fs.unlink(path.join(dir, file));
              totalDeleted++;
              console.log(`  🗑️  Deleted: ${file}`);
            }
          }
        } catch (err) {
          console.error(`Error cleaning ${dir}:`, err.message);
        }
      }
    }

    console.log(`✅ Cleanup complete: ${totalDeleted} old files deleted`);
  }
}

// Export singleton instance
let instance = null;

function getTTSManager() {
  if (!instance) {
    instance = new TTSManager();
  }
  return instance;
}

module.exports = {
  TTSManager,
  getTTSManager
};

// Test function
async function testTTSManager() {
  console.log('=== TTS Manager Test ===\n');

  const manager = getTTSManager();

  // Test usage stats
  console.log('📊 Current usage:', manager.getUsageStats());

  // Test Bible verse generation
  try {
    const result = await manager.generateBibleVerseAudio(
      'GEN',
      1,
      1,
      'In the beginning God created the heaven and the earth.',
      'در ابتدا خدا آسمان و زمین را آفرید.'
    );

    console.log('\n✅ Test successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run test if executed directly
if (require.main === module) {
  testTTSManager();
}
