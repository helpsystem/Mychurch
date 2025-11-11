/**
 * HiDrive Storage Management Routes
 * API endpoints for managing files on IONOS HiDrive
 */

const express = require('express');
const router = express.Router();
const hidriveStorage = require('../services/hidriveStorage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../db-postgres');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

/**
 * GET /api/hidrive/stats
 * Get HiDrive storage statistics
 * Auth: SUPER_ADMIN, MANAGER
 */
router.get('/stats', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const stats = await hidriveStorage.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting HiDrive stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/hidrive/upload
 * Upload a file to HiDrive
 * Auth: SUPER_ADMIN, MANAGER, WORSHIP_LEADER
 */
router.post('/upload', 
  authenticateToken, 
  authorizeRoles('SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { category, filename } = req.body;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category is required'
        });
      }

      // Use original filename if not provided
      const targetFilename = filename || req.file.originalname;

      // Upload buffer to HiDrive
      const url = await hidriveStorage.uploadFile(req.file.buffer, category, targetFilename);

      res.json({
        success: true,
        url,
        filename: targetFilename,
        category,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading to HiDrive:', error);
      res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/hidrive/migrate
 * Migrate a local file to HiDrive
 * Auth: SUPER_ADMIN, MANAGER
 */
router.post('/migrate', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { localPath, category } = req.body;

    if (!localPath || !category) {
      return res.status(400).json({
        success: false,
        error: 'localPath and category are required'
      });
    }

    const url = await hidriveStorage.migrateLocalFile(localPath, category);

    res.json({
      success: true,
      originalPath: localPath,
      newUrl: url,
      category
    });
  } catch (error) {
    console.error('Error migrating file:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

/**
 * POST /api/hidrive/migrate-worship-songs
 * Migrate all worship song audio files to HiDrive
 * Auth: SUPER_ADMIN, MANAGER
 */
router.post('/migrate-worship-songs', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Get all worship songs with local audio URLs
    const result = await pool.query(
      `SELECT id, title, audiourl FROM worship_songs 
       WHERE audiourl IS NOT NULL 
       AND audiourl NOT LIKE 'http%'
       AND audiourl NOT LIKE 'https%'
       ORDER BY id`
    );

    const songs = result.rows;
    const migrationResults = [];
    let successCount = 0;
    let failCount = 0;

    for (const song of songs) {
      try {
        console.log(`Migrating song ${song.id}: ${song.title?.fa || song.title?.en || 'Untitled'}`);
        
        // Migrate file
        const newUrl = await hidriveStorage.migrateLocalFile(song.audiourl, 'worship-audio');

        // Update database
        await pool.query(
          'UPDATE worship_songs SET audiourl = $1 WHERE id = $2',
          [newUrl, song.id]
        );

        migrationResults.push({
          id: song.id,
          title: song.title,
          oldUrl: song.audiourl,
          newUrl,
          status: 'success'
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to migrate song ${song.id}:`, error.message);
        migrationResults.push({
          id: song.id,
          title: song.title,
          oldUrl: song.audiourl,
          status: 'failed',
          error: error.message
        });
        failCount++;
      }
    }

    res.json({
      success: true,
      total: songs.length,
      migrated: successCount,
      failed: failCount,
      results: migrationResults
    });
  } catch (error) {
    console.error('Error migrating worship songs:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/hidrive/file
 * Delete a file from HiDrive
 * Auth: SUPER_ADMIN, MANAGER
 */
router.delete('/file', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { category, filename } = req.body;

    if (!category || !filename) {
      return res.status(400).json({
        success: false,
        error: 'category and filename are required'
      });
    }

    const deleted = await hidriveStorage.deleteFile(category, filename);

    res.json({
      success: deleted,
      category,
      filename
    });
  } catch (error) {
    console.error('Error deleting from HiDrive:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: error.message
    });
  }
});

/**
 * POST /api/hidrive/check-exists
 * Check if a file exists on HiDrive
 * Auth: Any authenticated user
 */
router.post('/check-exists', authenticateToken, async (req, res) => {
  try {
    const { category, filename } = req.body;

    if (!category || !filename) {
      return res.status(400).json({
        success: false,
        error: 'category and filename are required'
      });
    }

    const exists = await hidriveStorage.fileExists(category, filename);

    res.json({
      success: true,
      exists,
      category,
      filename
    });
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).json({
      success: false,
      error: 'Check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/hidrive/stream/*
 * Stream any file from HiDrive by full path
 * Example: /api/hidrive/stream/worship/audio/kalameh/song.mp3
 * Public access (no auth required)
 */
router.get('/stream/*', async (req, res) => {
  try {
    // Get the full path after /stream/
    const filePath = req.params[0]; // e.g., "worship/audio/kalameh/song.mp3"
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    console.log(`🔄 Streaming file from HiDrive: ${filePath}`);

    // Set content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Get file stream from HiDrive using full path
    // ssh2-sftp-client returns a readable stream wrapped in a promise
    await hidriveStorage.streamToResponse(filePath, res);

    console.log(`✅ Successfully streamed: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Error streaming file from HiDrive:', error);
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        message: error.message,
        path: req.params[0]
      });
    }
  }
});

/**
 * GET /api/hidrive/proxy/:category/:filename
 * Proxy/stream a file from HiDrive (legacy endpoint)
 * Public access (no auth required)
 */
router.get('/proxy/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;

    // Get file stream from HiDrive
    const stream = await hidriveStorage.getFileStream(category, filename);

    // Set content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream file to response
    stream.pipe(res);

  } catch (error) {
    console.error('Error proxying file from HiDrive:', error);
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: error.message
    });
  }
});

/**
 * POST /api/hidrive/batch-migrate
 * Batch migrate multiple files based on database table
 * Auth: SUPER_ADMIN
 */
router.post('/batch-migrate', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { table, column, category, filter } = req.body;

    if (!table || !column || !category) {
      return res.status(400).json({
        success: false,
        error: 'table, column, and category are required'
      });
    }

    // Build query
    let query = `SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL`;
    
    // Only migrate local URLs (not http/https)
    query += ` AND ${column} NOT LIKE 'http%' AND ${column} NOT LIKE 'https%'`;
    
    if (filter) {
      query += ` AND ${filter}`;
    }

    const result = await pool.query(query);
    const rows = result.rows;
    
    const migrationResults = [];
    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
      const oldUrl = row[column];
      
      try {
        // Migrate file
        const newUrl = await hidriveStorage.migrateLocalFile(oldUrl, category);

        // Update database
        await pool.query(
          `UPDATE ${table} SET ${column} = $1 WHERE id = $2`,
          [newUrl, row.id]
        );

        migrationResults.push({
          id: row.id,
          oldUrl,
          newUrl,
          status: 'success'
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to migrate row ${row.id}:`, error.message);
        migrationResults.push({
          id: row.id,
          oldUrl,
          status: 'failed',
          error: error.message
        });
        failCount++;
      }
    }

    res.json({
      success: true,
      table,
      column,
      category,
      total: rows.length,
      migrated: successCount,
      failed: failCount,
      results: migrationResults
    });
  } catch (error) {
    console.error('Error in batch migration:', error);
    res.status(500).json({
      success: false,
      error: 'Batch migration failed',
      message: error.message
    });
  }
});

module.exports = router;
