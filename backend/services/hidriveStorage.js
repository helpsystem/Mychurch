/**
 * IONOS HiDrive Storage Service
 * Handles file uploads/downloads to/from HiDrive cloud storage
 * Replaces local file storage for heavy media files
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Configuration from environment variables
const HIDRIVE_CONFIG = {
  // SFTP credentials
  host: process.env.HIDRIVE_HOST || 'sftp.hidrive.ionos.com',
  port: parseInt(process.env.HIDRIVE_PORT || '22'),
  user: process.env.HIDRIVE_USER || 'adminchurch',
  password: process.env.HIDRIVE_PASSWORD,

  // WebDAV public URL base
  publicUrl: process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch',

  // Remote base path
  basePath: process.env.HIDRIVE_BASE_PATH || '/users/adminchurch/mychurch',

  // File categories and their remote paths
  categories: {
    'worship-audio': '/worship/audio',
    'worship-videos': '/worship/videos',
    'sermon-audio': '/sermons/audio',
    'event-images': '/events/images',
    'church-photos': '/church/photos',
    'ai-generated': '/ai/generated',
    'bible-audio': '/bible/audio',
    'documents': '/documents',
    'worship-sheets': '/worship/sheets',
    'worship-presentations': '/worship/presentations'
  }
};

class HiDriveStorage {
  constructor() {
    this.config = HIDRIVE_CONFIG;
    this.sftpClient = null;
    this.connected = false;
  }

  /**
   * Initialize SFTP connection (lazy loading)
   */
  async connect() {
    if (this.connected && this.sftpClient) {
      return this.sftpClient;
    }

    // Only require ssh2-sftp-client when needed
    const SftpClient = require('ssh2-sftp-client');
    this.sftpClient = new SftpClient();

    try {
      await this.sftpClient.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.user,
        password: this.config.password,
        readyTimeout: 10000,
        retries: 2,
        algorithms: {
          serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521']
        },
        // debug: (info) => console.log('🔍 SFTP Debug:', info)
      });

      this.connected = true;
      console.log('✅ Connected to IONOS HiDrive SFTP');
      return this.sftpClient;
    } catch (error) {
      console.error('❌ HiDrive SFTP connection failed:', error.message);
      this.connected = false;
      throw new Error(`Failed to connect to HiDrive: ${error.message}`);
    }
  }

  /**
   * Disconnect SFTP client
   */
  async disconnect() {
    if (this.sftpClient && this.connected) {
      await this.sftpClient.end();
      this.connected = false;
      console.log('🔌 Disconnected from HiDrive');
    }
  }

  /**
   * Upload a file to HiDrive
   * @param {string|Buffer} localPathOrBuffer - Local file path or Buffer
   * @param {string} category - File category (e.g., 'worship-audio')
   * @param {string} filename - Destination filename
   * @returns {Promise<string>} Public URL of uploaded file
   */
  async uploadFile(localPathOrBuffer, category, filename) {
    try {
      await this.connect();

      // Get remote path for category
      const categoryPath = this.config.categories[category];
      if (!categoryPath) {
        throw new Error(`Invalid category: ${category}`);
      }

      const remotePath = path.posix.join(this.config.basePath, categoryPath, filename);
      const remoteDir = path.posix.dirname(remotePath);

      // Ensure remote directory exists
      await this.ensureRemoteDir(remoteDir);

      // Upload file
      if (Buffer.isBuffer(localPathOrBuffer)) {
        // Upload from buffer
        await this.sftpClient.put(localPathOrBuffer, remotePath);
      } else {
        // Upload from file path
        await this.sftpClient.fastPut(localPathOrBuffer, remotePath);
      }

      console.log(`✅ Uploaded to HiDrive: ${remotePath}`);

      // Return public URL
      return this.getPublicUrl(category, filename);
    } catch (error) {
      console.error('❌ HiDrive upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Download a file from HiDrive
   * @param {string} category - File category
   * @param {string} filename - Remote filename
   * @param {string} localPath - Local destination path
   * @returns {Promise<string>} Local file path
   */
  async downloadFile(category, filename, localPath) {
    try {
      await this.connect();

      const categoryPath = this.config.categories[category];
      if (!categoryPath) {
        throw new Error(`Invalid category: ${category}`);
      }

      const remotePath = path.posix.join(this.config.basePath, categoryPath, filename);

      // Ensure local directory exists
      const localDir = path.dirname(localPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // Download file
      await this.sftpClient.fastGet(remotePath, localPath);

      console.log(`✅ Downloaded from HiDrive: ${remotePath} -> ${localPath}`);
      return localPath;
    } catch (error) {
      console.error('❌ HiDrive download failed:', error.message);
      throw error;
    }
  }

  /**
   * Stream a file directly to HTTP response
   * @param {string} filePath - Full file path (e.g., "worship/audio/kalameh/song.mp3")
   * @param {Response} res - Express response object
   */
  async streamToResponse(filePath, res) {
    try {
      await this.connect();

      // Construct full remote path
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const remotePath = path.posix.join(this.config.basePath, cleanPath);

      console.log(`📡 Streaming from HiDrive: ${remotePath}`);

      // Check if file exists first
      const exists = await this.sftpClient.exists(remotePath);
      if (!exists) {
        throw new Error(`File not found on HiDrive: ${remotePath}`);
      }

      // Get file as stream and pipe to response
      await this.sftpClient.get(remotePath, res);

      console.log(`✅ Stream completed for: ${remotePath}`);

    } catch (error) {
      console.error('❌ HiDrive stream failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a file stream from HiDrive by full path
   * @param {string} filePath - Full file path (e.g., "worship/audio/kalameh/song.mp3")
   * @returns {Promise<Stream>}
   */
  async getFileByPath(filePath) {
    try {
      await this.connect();

      // Construct full remote path
      // If filePath starts with /, remove it
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const remotePath = path.posix.join(this.config.basePath, cleanPath);

      console.log(`📡 Fetching from HiDrive: ${remotePath}`);

      // Check if file exists first
      const exists = await this.sftpClient.exists(remotePath);
      if (!exists) {
        throw new Error(`File not found on HiDrive: ${remotePath}`);
      }

      // Get file as stream
      const stream = await this.sftpClient.get(remotePath);

      console.log(`✅ Stream created for: ${remotePath}`);
      return stream;

    } catch (error) {
      console.error('❌ HiDrive stream failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a readable stream for a file
   * @param {string} category - File category
   * @param {string} filename - Remote filename
   * @returns {Promise<ReadableStream>}
   */
  async getFileStream(category, filename) {
    try {
      await this.connect();

      const categoryPath = this.config.categories[category];
      if (!categoryPath) {
        throw new Error(`Invalid category: ${category}`);
      }

      const remotePath = path.posix.join(this.config.basePath, categoryPath, filename);
      return await this.sftpClient.get(remotePath);
    } catch (error) {
      console.error('❌ HiDrive stream failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if a file exists on HiDrive
   * @param {string} category - File category
   * @param {string} filename - Remote filename
   * @returns {Promise<boolean>}
   */
  async fileExists(category, filename) {
    try {
      await this.connect();

      const categoryPath = this.config.categories[category];
      if (!categoryPath) {
        return false;
      }

      const remotePath = path.posix.join(this.config.basePath, categoryPath, filename);
      return await this.sftpClient.exists(remotePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a file from HiDrive
   * @param {string} category - File category
   * @param {string} filename - Remote filename
   * @returns {Promise<boolean>}
   */
  async deleteFile(category, filename) {
    try {
      await this.connect();

      const categoryPath = this.config.categories[category];
      if (!categoryPath) {
        throw new Error(`Invalid category: ${category}`);
      }

      const remotePath = path.posix.join(this.config.basePath, categoryPath, filename);
      await this.sftpClient.delete(remotePath);

      console.log(`🗑️ Deleted from HiDrive: ${remotePath}`);
      return true;
    } catch (error) {
      console.error('❌ HiDrive delete failed:', error.message);
      return false;
    }
  }

  /**
   * Ensure remote directory exists
   * @param {string} remotePath - Remote directory path
   */
  async ensureRemoteDir(remotePath) {
    try {
      const exists = await this.sftpClient.exists(remotePath);
      if (!exists) {
        await this.sftpClient.mkdir(remotePath, true); // recursive
        console.log(`📁 Created remote directory: ${remotePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param {string} category - File category
   * @param {string} filename - Filename
   * @returns {string} Public URL
   */
  getPublicUrl(category, filename) {
    const categoryPath = this.config.categories[category];
    if (!categoryPath) {
      throw new Error(`Invalid category: ${category}`);
    }

    return `${this.config.publicUrl}${categoryPath}/${filename}`;
  }

  /**
   * Parse HiDrive URL to get category and filename
   * @param {string} url - HiDrive URL
   * @returns {object|null} {category, filename} or null
   */
  parseHiDriveUrl(url) {
    if (!url || !url.startsWith(this.config.publicUrl)) {
      return null;
    }

    const relativePath = url.replace(this.config.publicUrl, '');

    // Find matching category
    for (const [category, categoryPath] of Object.entries(this.config.categories)) {
      if (relativePath.startsWith(categoryPath)) {
        const filename = relativePath.replace(categoryPath + '/', '');
        return { category, filename };
      }
    }

    return null;
  }

  /**
   * Check if URL is a HiDrive URL
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isHiDriveUrl(url) {
    return url && url.startsWith(this.config.publicUrl);
  }

  /**
   * Migrate local file to HiDrive
   * @param {string} localPath - Local file path (relative to public/)
   * @param {string} category - Target category
   * @returns {Promise<string>} New HiDrive URL
   */
  async migrateLocalFile(localPath, category) {
    try {
      // Convert relative path to absolute
      const absolutePath = path.join(__dirname, '../../public', localPath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Local file not found: ${absolutePath}`);
      }

      // Get filename
      const filename = path.basename(localPath);

      // Upload to HiDrive
      const hidriveUrl = await this.uploadFile(absolutePath, category, filename);

      console.log(`🔄 Migrated: ${localPath} -> ${hidriveUrl}`);
      return hidriveUrl;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Stream file from HiDrive WebDAV to response
   * @param {string} filePath - File path relative to mychurch folder (e.g., 'worship/audio/kalameh/song.mp3')
   * @param {object} res - Express response object
   */
  /**
   * Stream file from HiDrive WebDAV to response
   * @param {string} filePath - File path relative to mychurch folder
   * @param {object} res - Express response object
   * @param {string} [range] - Range header from original request
   */
  async streamToResponse(filePath, res, range) {
    const axios = require('axios');

    try {
      // Build full WebDAV URL
      const webdavUrl = `${this.config.publicUrl}/${filePath}`;

      console.log(`🔄 Streaming from WebDAV: ${webdavUrl} ${range ? `(Range: ${range})` : ''}`);

      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.config.user}:${this.config.password}`).toString('base64')}`
      };

      if (range) {
        headers['Range'] = range;
      }

      // Make authenticated request to WebDAV
      const response = await axios({
        method: 'get',
        url: webdavUrl,
        headers,
        responseType: 'stream',
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });

      if (response.status === 404) {
        throw new Error('File not found on HiDrive');
      }

      // Forward status code (200 or 206)
      res.status(response.status);

      // Set headers from HiDrive response
      const headersToForward = [
        'content-length',
        'content-type',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag'
      ];

      headersToForward.forEach(header => {
        if (response.headers[header]) {
          res.setHeader(header.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'), response.headers[header]);
        }
      });

      // Pipe stream to response
      await pipeline(response.data, res);

      console.log(`✅ Stream completed for: ${filePath}`);

    } catch (error) {
      console.error(`❌ WebDAV streaming failed for ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<object>} Storage stats
   */
  async getStats() {
    try {
      await this.connect();

      const stats = {
        connected: this.connected,
        categories: {},
        totalFiles: 0,
        totalSize: 0
      };

      for (const [category, categoryPath] of Object.entries(this.config.categories)) {
        try {
          const remotePath = path.posix.join(this.config.basePath, categoryPath);
          const exists = await this.sftpClient.exists(remotePath);

          if (exists) {
            const files = await this.sftpClient.list(remotePath);
            const fileCount = files.filter(f => f.type === '-').length;
            const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

            stats.categories[category] = {
              files: fileCount,
              sizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
            };

            stats.totalFiles += fileCount;
            stats.totalSize += totalSize;
          }
        } catch (error) {
          console.error(`⚠ Failed to get stats for ${category}:`, error.message);
        }
      }

      stats.totalSizeMB = Math.round(stats.totalSize / 1024 / 1024 * 100) / 100;
      stats.totalSizeGB = Math.round(stats.totalSize / 1024 / 1024 / 1024 * 100) / 100;

      return stats;
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const hidriveStorage = new HiDriveStorage();

// Graceful shutdown
process.on('SIGINT', async () => {
  await hidriveStorage.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await hidriveStorage.disconnect();
  process.exit(0);
});

module.exports = hidriveStorage;
