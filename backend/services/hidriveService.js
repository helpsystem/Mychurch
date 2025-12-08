/**
 * 🌐 IONOS HiDrive Storage Service
 * سرویس مدیریت فایل‌های سنگین در HiDrive Storage
 * 
 * Features:
 * - آپلود فایل‌ها به HiDrive
 * - مدیریت فایل‌های موجود
 * - حذف فایل‌ها
 * - دریافت URL عمومی
 * - پشتیبانی از نام‌های فایل فارسی
 */

const Client = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class HiDriveService {
  constructor() {
    this.config = {
      host: process.env.HIDRIVE_HOST || 'sftp.hidrive.ionos.com',
      port: parseInt(process.env.HIDRIVE_PORT || '22'),
      username: process.env.HIDRIVE_USER || 'adminchurch',
      password: process.env.HIDRIVE_PASSWORD,
      basePath: process.env.HIDRIVE_BASE_PATH || '/users/adminchurch/mychurch',
      publicUrl: process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch'
    };

    // Validate config
    if (!this.config.password) {
      console.warn('⚠️  HIDRIVE_PASSWORD not set. HiDrive features will be disabled.');
    }

    this.sftp = new Client();
    this.connected = false;
  }

  /**
   * اتصال به HiDrive
   */
  async connect() {
    if (this.connected) return;

    try {
      await this.sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 30000
      });
      
      this.connected = true;
      console.log('✅ Connected to HiDrive');
    } catch (error) {
      console.error('❌ Failed to connect to HiDrive:', error.message);
      throw error;
    }
  }

  /**
   * قطع اتصال
   */
  async disconnect() {
    if (this.connected) {
      await this.sftp.end();
      this.connected = false;
      console.log('✅ Disconnected from HiDrive');
    }
  }

  /**
   * ساخت hash برای نام فایل‌های فارسی
   */
  createSafeFilename(originalName) {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    
    // اگر فقط ASCII باشد، استفاده مستقیم
    if (/^[a-zA-Z0-9_\-. ]+$/.test(nameWithoutExt)) {
      return originalName.replace(/\s+/g, '_');
    }

    // ساخت hash برای نام‌های فارسی
    const hash = crypto.createHash('md5').update(originalName).digest('hex').substring(0, 8);
    return `file_${hash}${ext}`;
  }

  /**
   * اطمینان از وجود دایرکتوری
   */
  async ensureDirectory(remotePath) {
    try {
      await this.sftp.mkdir(remotePath, true); // recursive create
    } catch (error) {
      // Ignore if already exists
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * آپلود فایل به HiDrive
   * @param {string} localPath - مسیر فایل محلی
   * @param {string} category - دسته‌بندی (bible, worship, sermons, etc)
   * @param {string} subcategory - زیر دسته (audio, images, data, etc)
   * @returns {Promise<object>} - اطلاعات فایل آپلود شده
   */
  async uploadFile(localPath, category, subcategory = '') {
    if (!this.config.password) {
      throw new Error('HiDrive password not configured');
    }

    await this.connect();

    try {
      const originalName = path.basename(localPath);
      const safeName = this.createSafeFilename(originalName);
      
      // ساخت مسیر remote
      let remotePath = `${this.config.basePath}/${category}`;
      if (subcategory) {
        remotePath += `/${subcategory}`;
      }
      remotePath += `/${safeName}`;

      // اطمینان از وجود دایرکتوری
      const remoteDir = path.dirname(remotePath);
      await this.ensureDirectory(remoteDir);

      // آپلود فایل
      await this.sftp.put(localPath, remotePath);

      // ساخت URL عمومی
      let publicPath = `/${category}`;
      if (subcategory) {
        publicPath += `/${subcategory}`;
      }
      publicPath += `/${safeName}`;
      
      const publicUrl = this.config.publicUrl + publicPath;

      console.log(`✅ Uploaded: ${originalName} → ${safeName}`);

      return {
        originalName,
        safeName,
        remotePath,
        publicUrl,
        category,
        subcategory,
        size: (await fs.stat(localPath)).size
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${localPath}:`, error.message);
      throw error;
    }
  }

  /**
   * آپلود دسته‌ای فایل‌ها
   */
  async uploadBatch(files, category, subcategory = '') {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, category, subcategory);
        results.push(result);
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * لیست فایل‌های یک دایرکتوری
   */
  async listFiles(category, subcategory = '') {
    await this.connect();

    try {
      let remotePath = `${this.config.basePath}/${category}`;
      if (subcategory) {
        remotePath += `/${subcategory}`;
      }

      const files = await this.sftp.list(remotePath);
      
      return files.map(file => ({
        name: file.name,
        size: file.size,
        modifyTime: file.modifyTime,
        type: file.type, // '-' for file, 'd' for directory
        publicUrl: `${this.config.publicUrl}/${category}${subcategory ? '/' + subcategory : ''}/${file.name}`
      }));
    } catch (error) {
      console.error(`❌ Failed to list files:`, error.message);
      throw error;
    }
  }

  /**
   * حذف فایل
   */
  async deleteFile(category, subcategory, filename) {
    await this.connect();

    try {
      let remotePath = `${this.config.basePath}/${category}`;
      if (subcategory) {
        remotePath += `/${subcategory}`;
      }
      remotePath += `/${filename}`;

      await this.sftp.delete(remotePath);
      console.log(`✅ Deleted: ${filename}`);
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to delete ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * بررسی وجود فایل
   */
  async fileExists(category, subcategory, filename) {
    await this.connect();

    try {
      let remotePath = `${this.config.basePath}/${category}`;
      if (subcategory) {
        remotePath += `/${subcategory}`;
      }
      remotePath += `/${filename}`;

      return await this.sftp.exists(remotePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * دریافت URL عمومی فایل
   */
  getPublicUrl(category, subcategory, filename) {
    let publicPath = `/${category}`;
    if (subcategory) {
      publicPath += `/${subcategory}`;
    }
    publicPath += `/${filename}`;
    
    return this.config.publicUrl + publicPath;
  }

  /**
   * انتقال فایل‌های محلی به HiDrive
   * برای migration فایل‌های موجود
   */
  async migrateLocalFiles(localDir, category, subcategory = '') {
    try {
      const files = await fs.readdir(localDir, { withFileTypes: true });
      const results = [];
      const errors = [];

      for (const file of files) {
        if (file.isFile()) {
          const localPath = path.join(localDir, file.name);
          
          try {
            const result = await this.uploadFile(localPath, category, subcategory);
            results.push(result);
          } catch (error) {
            errors.push({
              file: file.name,
              error: error.message
            });
          }
        }
      }

      return { results, errors };
    } catch (error) {
      console.error(`❌ Migration failed for ${localDir}:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
const hidriveService = new HiDriveService();

module.exports = hidriveService;
