/**
 * File Watcher for Auto-Regeneration
 * 
 * Watches Bible, Songs, and Readings directories for changes
 * Automatically regenerates audio when text files are updated
 */

const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { getTTSManager } = require('../services/ttsManager');

class AudioFileWatcher {
  constructor() {
    this.ttsManager = getTTSManager();
    this.watchers = [];
    
    this.config = {
      watchPaths: {
        bible: process.env.WATCH_BIBLE_PATH || './data/bible',
        songs: process.env.WATCH_SONGS_PATH || './data/songs',
        readings: process.env.WATCH_READINGS_PATH || './data/readings'
      },
      
      // Chokidar options
      watchOptions: {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      }
    };

    this.processingQueue = new Set();
  }

  /**
   * Start watching all configured directories
   */
  async startWatching() {
    console.log('\n👀 Starting file watchers...\n');

    // Watch Bible directory
    this.watchBibleDirectory();

    // Watch Songs directory
    this.watchSongsDirectory();

    // Watch Readings directory
    this.watchReadingsDirectory();

    console.log('✅ All watchers started\n');
  }

  /**
   * Stop all watchers
   */
  async stopWatching() {
    console.log('\n🛑 Stopping file watchers...');
    
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    
    this.watchers = [];
    console.log('✅ All watchers stopped\n');
  }

  /**
   * Watch Bible directory for changes
   */
  watchBibleDirectory() {
    const biblePath = this.config.watchPaths.bible;
    
    console.log(`📖 Watching Bible directory: ${biblePath}`);

    const watcher = chokidar.watch(
      path.join(biblePath, '**/*.json'),
      this.config.watchOptions
    );

    watcher
      .on('add', filepath => this.handleBibleFileChange(filepath, 'added'))
      .on('change', filepath => this.handleBibleFileChange(filepath, 'changed'))
      .on('error', error => console.error('Bible watcher error:', error));

    this.watchers.push(watcher);
  }

  /**
   * Watch Songs directory for changes
   */
  watchSongsDirectory() {
    const songsPath = this.config.watchPaths.songs;
    
    console.log(`🎵 Watching Songs directory: ${songsPath}`);

    const watcher = chokidar.watch(
      path.join(songsPath, '**/*.json'),
      this.config.watchOptions
    );

    watcher
      .on('add', filepath => this.handleSongFileChange(filepath, 'added'))
      .on('change', filepath => this.handleSongFileChange(filepath, 'changed'))
      .on('error', error => console.error('Songs watcher error:', error));

    this.watchers.push(watcher);
  }

  /**
   * Watch Readings directory for changes
   */
  watchReadingsDirectory() {
    const readingsPath = this.config.watchPaths.readings;
    
    console.log(`📰 Watching Readings directory: ${readingsPath}`);

    const watcher = chokidar.watch(
      path.join(readingsPath, '**/*.json'),
      this.config.watchOptions
    );

    watcher
      .on('add', filepath => this.handleReadingFileChange(filepath, 'added'))
      .on('change', filepath => this.handleReadingFileChange(filepath, 'changed'))
      .on('error', error => console.error('Readings watcher error:', error));

    this.watchers.push(watcher);
  }

  /**
   * Handle Bible file change
   * Expected format: /data/bible/{bookCode}/{chapter}.json
   */
  async handleBibleFileChange(filepath, eventType) {
    if (this.processingQueue.has(filepath)) {
      console.log(`⏭️  Skipping ${filepath} (already processing)`);
      return;
    }

    this.processingQueue.add(filepath);

    try {
      console.log(`\n📖 Bible file ${eventType}: ${filepath}`);

      // Parse filepath to extract book and chapter
      const match = filepath.match(/([A-Z]{3})[\\/](\d+)\.json$/);
      if (!match) {
        console.warn(`⚠️  Invalid Bible file format: ${filepath}`);
        return;
      }

      const [, bookCode, chapter] = match;

      // Load file content
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);

      // Validate structure
      if (!data.verses || !Array.isArray(data.verses)) {
        console.warn(`⚠️  Invalid Bible JSON structure: ${filepath}`);
        return;
      }

      // Check if regeneration needed
      console.log(`🔍 Checking ${data.verses.length} verses for changes...`);

      const versesToProcess = [];

      for (const verse of data.verses) {
        if (!verse.textEn || !verse.textFa || !verse.verseNumber) {
          console.warn(`⚠️  Invalid verse data in ${filepath}:`, verse);
          continue;
        }

        const needsRegen = await this.ttsManager.needsRegeneration(
          'bible',
          `${bookCode}_${chapter}_${verse.verseNumber}`,
          verse.textEn,
          verse.textFa
        );

        if (needsRegen) {
          versesToProcess.push(verse);
        }
      }

      if (versesToProcess.length === 0) {
        console.log(`✅ No changes detected in ${bookCode} ${chapter}`);
        return;
      }

      console.log(`🎙️  Regenerating ${versesToProcess.length} verses...`);

      // Generate audio for changed verses
      const result = await this.ttsManager.generateChapterAudio(
        bookCode,
        parseInt(chapter),
        versesToProcess
      );

      console.log(`✅ Regeneration complete: ${result.successCount}/${result.totalVerses} succeeded`);

      // Trigger sync if enabled
      if (process.env.SYNC_ON_CHANGE === 'true') {
        console.log('🔄 Triggering audio sync...');
        // This will be implemented in sync script
        this.triggerSync();
      }

    } catch (err) {
      console.error(`❌ Error processing Bible file ${filepath}:`, err);
    } finally {
      this.processingQueue.delete(filepath);
    }
  }

  /**
   * Handle Song file change
   * Expected format: /data/songs/{songId}.json
   */
  async handleSongFileChange(filepath, eventType) {
    if (this.processingQueue.has(filepath)) return;

    this.processingQueue.add(filepath);

    try {
      console.log(`\n🎵 Song file ${eventType}: ${filepath}`);

      // Extract song ID from filename
      const songId = path.basename(filepath, '.json');

      // Load file content
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);

      // Validate structure
      if (!data.titleEn || !data.titleFa || !data.lyricsEn || !data.lyricsFa) {
        console.warn(`⚠️  Invalid song JSON structure: ${filepath}`);
        return;
      }

      // Check if regeneration needed
      const needsRegen = await this.ttsManager.needsRegeneration(
        'songs',
        songId,
        data.lyricsEn,
        data.lyricsFa
      );

      if (!needsRegen) {
        console.log(`✅ No changes detected in song: ${songId}`);
        return;
      }

      console.log(`🎙️  Regenerating song audio: ${data.titleEn} / ${data.titleFa}`);

      // Generate audio
      await this.ttsManager.generateSongAudio(
        songId,
        data.titleEn,
        data.titleFa,
        data.lyricsEn,
        data.lyricsFa
      );

      console.log(`✅ Song audio regenerated: ${songId}`);

      if (process.env.SYNC_ON_CHANGE === 'true') {
        this.triggerSync();
      }

    } catch (err) {
      console.error(`❌ Error processing song file ${filepath}:`, err);
    } finally {
      this.processingQueue.delete(filepath);
    }
  }

  /**
   * Handle Reading file change
   */
  async handleReadingFileChange(filepath, eventType) {
    if (this.processingQueue.has(filepath)) return;

    this.processingQueue.add(filepath);

    try {
      console.log(`\n📰 Reading file ${eventType}: ${filepath}`);

      const readingId = path.basename(filepath, '.json');
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.textEn || !data.textFa) {
        console.warn(`⚠️  Invalid reading JSON structure: ${filepath}`);
        return;
      }

      const needsRegen = await this.ttsManager.needsRegeneration(
        'readings',
        readingId,
        data.textEn,
        data.textFa
      );

      if (!needsRegen) {
        console.log(`✅ No changes detected in reading: ${readingId}`);
        return;
      }

      console.log(`🎙️  Regenerating reading audio: ${readingId}`);

      // Generate audio (similar to song)
      const results = await Promise.all([
        this.ttsManager.synthesize(data.textFa, 'fa'),
        this.ttsManager.synthesize(data.textEn, 'en')
      ]);

      console.log(`✅ Reading audio regenerated: ${readingId}`);

      if (process.env.SYNC_ON_CHANGE === 'true') {
        this.triggerSync();
      }

    } catch (err) {
      console.error(`❌ Error processing reading file ${filepath}:`, err);
    } finally {
      this.processingQueue.delete(filepath);
    }
  }

  /**
   * Trigger audio sync to server
   */
  triggerSync() {
    // Import and execute sync script
    try {
      const { syncAudioToServer } = require('../../scripts/sync_audio_to_server');
      syncAudioToServer().catch(err => {
        console.error('Sync failed:', err);
      });
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    }
  }

  /**
   * Get watcher statistics
   */
  getStats() {
    return {
      watchersActive: this.watchers.length,
      processingQueue: this.processingQueue.size,
      watchPaths: this.config.watchPaths
    };
  }
}

// Export singleton instance
let watcherInstance = null;

function getAudioFileWatcher() {
  if (!watcherInstance) {
    watcherInstance = new AudioFileWatcher();
  }
  return watcherInstance;
}

module.exports = {
  AudioFileWatcher,
  getAudioFileWatcher
};

// Start watching if executed directly
if (require.main === module) {
  const watcher = getAudioFileWatcher();
  watcher.startWatching();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT, shutting down gracefully...');
    await watcher.stopWatching();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\nReceived SIGTERM, shutting down gracefully...');
    await watcher.stopWatching();
    process.exit(0);
  });

  console.log('\nFile watcher is running. Press Ctrl+C to stop.\n');
}
