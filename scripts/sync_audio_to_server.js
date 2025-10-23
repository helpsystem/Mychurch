/**
 * Audio Sync Script
 * 
 * Syncs generated audio files from local machine to production server
 * Uses SSH/SFTP for secure file transfer
 */

const { Client } = require('ssh2-sftp-client');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class AudioSyncManager {
  constructor() {
    this.config = {
      server: {
        host: process.env.SERVER_HOST || 'samanabyar.online',
        port: parseInt(process.env.SERVER_PORT || '22'),
        username: process.env.SERVER_USER || 'root',
        privateKey: process.env.SERVER_SSH_KEY_PATH 
          ? fsSync.readFileSync(path.resolve(process.env.SERVER_SSH_KEY_PATH))
          : undefined,
        password: process.env.SERVER_PASS || undefined
      },
      
      localAudioDir: path.join(__dirname, '../../public/audio'),
      remoteAudioPath: process.env.SERVER_AUDIO_PATH || '/var/www/html/audio',
      
      indexFile: path.join(__dirname, '../../public/audio_index.json'),
      remoteIndexPath: '/var/www/html/audio_index.json',
      
      syncLogFile: path.join(__dirname, '../../logs/sync.log'),
      lastSyncFile: path.join(__dirname, '../../cache/last_sync.json')
    };

    this.sftp = new Client();
    this.stats = {
      filesUploaded: 0,
      filesSkipped: 0,
      bytesTransferred: 0,
      errors: []
    };
  }

  /**
   * Calculate file hash
   */
  async calculateFileHash(filepath) {
    const content = await fs.readFile(filepath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Load last sync info
   */
  async loadLastSync() {
    try {
      if (fsSync.existsSync(this.config.lastSyncFile)) {
        const data = await fs.readFile(this.config.lastSyncFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Failed to load last sync info:', err.message);
    }
    return { files: {}, timestamp: null };
  }

  /**
   * Save sync info
   */
  async saveLastSync(syncInfo) {
    try {
      await fs.writeFile(
        this.config.lastSyncFile,
        JSON.stringify(syncInfo, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save sync info:', err);
    }
  }

  /**
   * Get all audio files recursively
   */
  async getAudioFiles(dir, baseDir = dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAudioFiles(fullPath, baseDir);
          files.push(...subFiles);
        } else if (entry.name.endsWith('.mp3')) {
          const relativePath = path.relative(baseDir, fullPath);
          files.push({
            localPath: fullPath,
            relativePath: relativePath.replace(/\\/g, '/'),
            remotePath: path.posix.join(this.config.remoteAudioPath, relativePath.replace(/\\/g, '/'))
          });
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
    
    return files;
  }

  /**
   * Connect to server via SFTP
   */
  async connect() {
    console.log(`🔌 Connecting to ${this.config.server.host}:${this.config.server.port}...`);
    
    try {
      await this.sftp.connect(this.config.server);
      console.log('✅ Connected to server');
      return true;
    } catch (err) {
      console.error('❌ Connection failed:', err);
      throw err;
    }
  }

  /**
   * Disconnect from server
   */
  async disconnect() {
    try {
      await this.sftp.end();
      console.log('✅ Disconnected from server');
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }

  /**
   * Ensure remote directory exists
   */
  async ensureRemoteDir(remotePath) {
    try {
      await this.sftp.mkdir(remotePath, true);
    } catch (err) {
      // Directory might already exist, ignore
      if (err.code !== 4) { // SSH2_FX_FAILURE
        throw err;
      }
    }
  }

  /**
   * Upload single file
   */
  async uploadFile(localPath, remotePath) {
    try {
      // Ensure remote directory exists
      const remoteDir = path.posix.dirname(remotePath);
      await this.ensureRemoteDir(remoteDir);

      // Upload file
      await this.sftp.put(localPath, remotePath);

      const stats = await fs.stat(localPath);
      this.stats.filesUploaded++;
      this.stats.bytesTransferred += stats.size;

      return true;
    } catch (err) {
      console.error(`Failed to upload ${localPath}:`, err);
      this.stats.errors.push({ file: localPath, error: err.message });
      return false;
    }
  }

  /**
   * Check if file needs upload
   */
  async needsUpload(file, lastSync) {
    const syncInfo = lastSync.files[file.relativePath];
    
    if (!syncInfo) {
      return true; // New file
    }

    try {
      // Check if file changed
      const currentHash = await this.calculateFileHash(file.localPath);
      return currentHash !== syncInfo.hash;
    } catch (err) {
      console.warn(`Failed to check file ${file.relativePath}:`, err.message);
      return true; // Upload on error
    }
  }

  /**
   * Sync all audio files
   */
  async syncAudioFiles() {
    console.log('\n🔄 Starting audio sync...\n');

    const startTime = Date.now();

    try {
      // Load last sync info
      const lastSync = await this.loadLastSync();
      console.log(`📊 Last sync: ${lastSync.timestamp || 'Never'}`);

      // Get all audio files
      console.log(`📂 Scanning local audio directory: ${this.config.localAudioDir}`);
      const files = await this.getAudioFiles(this.config.localAudioDir);
      console.log(`📁 Found ${files.length} audio files\n`);

      if (files.length === 0) {
        console.log('⚠️  No audio files to sync');
        return;
      }

      // Connect to server
      await this.connect();

      // Upload files
      const newSyncInfo = {
        files: {},
        timestamp: new Date().toISOString()
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = `[${i + 1}/${files.length}]`;

        // Check if upload needed
        const needsUpload = await this.needsUpload(file, lastSync);

        if (!needsUpload) {
          console.log(`${progress} ⏭️  Skipped (unchanged): ${file.relativePath}`);
          this.stats.filesSkipped++;
          
          // Keep existing sync info
          newSyncInfo.files[file.relativePath] = lastSync.files[file.relativePath];
          continue;
        }

        console.log(`${progress} ⬆️  Uploading: ${file.relativePath}`);

        const success = await this.uploadFile(file.localPath, file.remotePath);

        if (success) {
          console.log(`${progress} ✅ Uploaded: ${file.relativePath}`);
          
          // Update sync info
          const hash = await this.calculateFileHash(file.localPath);
          newSyncInfo.files[file.relativePath] = {
            hash,
            size: (await fs.stat(file.localPath)).size,
            uploaded: new Date().toISOString()
          };
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Upload audio index
      console.log('\n📋 Uploading audio index...');
      await this.uploadFile(this.config.indexFile, this.config.remoteIndexPath);
      console.log('✅ Audio index uploaded\n');

      // Save sync info
      await this.saveLastSync(newSyncInfo);

      // Disconnect
      await this.disconnect();

      // Print summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const sizeKB = (this.stats.bytesTransferred / 1024).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log('📊 SYNC SUMMARY');
      console.log('='.repeat(60));
      console.log(`✅ Files uploaded: ${this.stats.filesUploaded}`);
      console.log(`⏭️  Files skipped: ${this.stats.filesSkipped}`);
      console.log(`📦 Data transferred: ${sizeKB} KB`);
      console.log(`⏱️  Duration: ${duration}s`);
      
      if (this.stats.errors.length > 0) {
        console.log(`❌ Errors: ${this.stats.errors.length}`);
        this.stats.errors.forEach(err => {
          console.log(`   - ${err.file}: ${err.error}`);
        });
      }
      
      console.log('='.repeat(60) + '\n');

      // Log to file
      await this.logSync();

    } catch (err) {
      console.error('\n❌ Sync failed:', err);
      throw err;
    }
  }

  /**
   * Log sync to file
   */
  async logSync() {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        stats: this.stats,
        server: this.config.server.host
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.config.syncLogFile, logLine);
    } catch (err) {
      console.error('Failed to write sync log:', err);
    }
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Main sync function
 */
async function syncAudioToServer() {
  const syncManager = new AudioSyncManager();
  
  try {
    await syncManager.syncAudioFiles();
    return syncManager.getStats();
  } catch (err) {
    console.error('Sync error:', err);
    throw err;
  }
}

module.exports = {
  AudioSyncManager,
  syncAudioToServer
};

// Run sync if executed directly
if (require.main === module) {
  syncAudioToServer()
    .then(() => {
      console.log('✅ Sync completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Sync failed:', err);
      process.exit(1);
    });
}
