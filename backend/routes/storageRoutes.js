/**
 * Storage Management API Routes
 * مدیریت فایل‌های storage از داخل admin panel
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = require('../services/storageService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB
  }
});

/**
 * GET /api/storage/buckets
 * لیست تمام buckets
 */
router.get('/buckets', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const buckets = Object.entries(storage.BUCKETS).map(([key, name]) => ({
      key,
      name,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${name}`
    }));

    res.json({
      success: true,
      buckets
    });
  } catch (error) {
    console.error('Error listing buckets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list buckets'
    });
  }
});

/**
 * GET /api/storage/list/:bucket
 * لیست فایل‌های یک bucket
 */
router.get('/list/:bucket', authenticateToken, async (req, res) => {
  try {
    const { bucket } = req.params;
    const { folder = '' } = req.query;

    const result = await storage.listFiles(bucket, folder);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      bucket,
      folder,
      files: result.files
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
});

/**
 * POST /api/storage/upload
 * آپلود فایل جدید
 */
router.post('/upload', 
  authenticateToken, 
  authorizeRoles('SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { bucket, path: filePath } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      if (!bucket || !filePath) {
        return res.status(400).json({
          success: false,
          message: 'Bucket and path are required'
        });
      }

      // آپلود از buffer
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
      );

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      const publicUrl = storage.getPublicUrl(bucket, filePath);

      res.json({
        success: true,
        file: {
          name: file.originalname,
          path: filePath,
          bucket,
          url: publicUrl,
          size: file.size,
          type: file.mimetype
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed'
      });
    }
  }
);

/**
 * DELETE /api/storage/delete/:bucket/*
 * حذف فایل
 */
router.delete('/delete/:bucket/*', 
  authenticateToken, 
  authorizeRoles('SUPER_ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const { bucket } = req.params;
      const filePath = req.params[0];

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        });
      }

      const result = await storage.deleteFile(bucket, filePath);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Delete failed'
      });
    }
  }
);

/**
 * GET /api/storage/url/:bucket/*
 * گرفتن URL فایل
 */
router.get('/url/:bucket/*', async (req, res) => {
  try {
    const { bucket } = req.params;
    const filePath = req.params[0];
    const { signed = false, expiresIn = 3600 } = req.query;

    if (signed === 'true') {
      const result = await storage.getSignedUrl(bucket, filePath, parseInt(expiresIn));
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        url: result.url,
        expiresIn: parseInt(expiresIn)
      });
    } else {
      const url = storage.getPublicUrl(bucket, filePath);
      
      res.json({
        success: true,
        url
      });
    }
  } catch (error) {
    console.error('Error getting URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get URL'
    });
  }
});

/**
 * POST /api/storage/migrate
 * تریگر migration (فقط برای development/admin)
 */
router.post('/migrate',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { type = 'worship' } = req.body;

      // این باید async background job باشه
      res.json({
        success: true,
        message: 'Migration started in background',
        type,
        note: 'Use the migrate-to-storage.cjs script directly for actual migration'
      });
    } catch (error) {
      console.error('Error starting migration:', error);
      res.status(500).json({
        success: false,
        message: 'Migration failed to start'
      });
    }
  }
);

module.exports = router;
