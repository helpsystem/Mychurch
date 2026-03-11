/**
 * 🎬 Broadcast Routes - API برای ذخیره و بارگذاری تنظیمات و اسلایدها
 * 
 * این API:
 * - تنظیمات را در فولدر /public/broadcast/configs ذخیره می‌کند
 * - پرزنتیشن‌ها را در فولدر /public/broadcast/presentations ذخیره می‌کند
 * - فایل‌های آپلودی را در فولدر /public/broadcast/uploads ذخیره می‌کند
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Base paths for broadcast data
const BROADCAST_BASE = path.join(__dirname, '../../public/broadcast');
const CONFIGS_DIR = path.join(BROADCAST_BASE, 'configs');
const PRESENTATIONS_DIR = path.join(BROADCAST_BASE, 'presentations');
const UPLOADS_DIR = path.join(BROADCAST_BASE, 'uploads');

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(BROADCAST_BASE, { recursive: true });
    await fs.mkdir(CONFIGS_DIR, { recursive: true });
    await fs.mkdir(PRESENTATIONS_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('📁 Broadcast directories ready');
  } catch (err) {
    console.error('Error creating broadcast directories:', err);
  }
};
ensureDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ==================== CONFIG (Templates) API ====================

// GET /api/broadcast/configs - List all saved configs/templates
router.get('/configs', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(CONFIGS_DIR);
    const configs = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(CONFIGS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          configs.push({
            id: data.id,
            name: data.name,
            date: data.date,
            filename: file
          });
        } catch (e) {
          console.log(`Error reading config ${file}:`, e);
        }
      }
    }

    res.json({ success: true, configs });
  } catch (err) {
    console.error('Error listing configs:', err);
    res.json({ success: true, configs: [] });
  }
});

// GET /api/broadcast/configs/:id - Load a specific config
router.get('/configs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CONFIGS_DIR, `${id}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);
    res.json({ success: true, config: data });
  } catch (err) {
    console.error('Error loading config:', err);
    res.status(404).json({ success: false, error: 'Config not found' });
  }
});

// POST /api/broadcast/configs - Save a new config/template
router.post('/configs', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { id, name, config } = req.body;
    if (!id || !name || !config) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const data = {
      id,
      name,
      date: new Date().toISOString(),
      config
    };

    const filepath = path.join(CONFIGS_DIR, `${id}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    res.json({ success: true, id, message: 'Config saved successfully' });
  } catch (err) {
    console.error('Error saving config:', err);
    res.status(500).json({ success: false, error: 'Failed to save config' });
  }
});

// DELETE /api/broadcast/configs/:id - Delete a config
router.delete('/configs/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CONFIGS_DIR, `${id}.json`);
    await fs.unlink(filepath);
    res.json({ success: true, message: 'Config deleted' });
  } catch (err) {
    console.error('Error deleting config:', err);
    res.status(404).json({ success: false, error: 'Config not found' });
  }
});

// ==================== PRESENTATIONS (Slides) API ====================

// GET /api/broadcast/presentations - List all saved presentations
router.get('/presentations', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(PRESENTATIONS_DIR);
    const presentations = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(PRESENTATIONS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          presentations.push({
            id: data.id,
            name: data.name,
            date: data.date,
            slideCount: data.slideCount || data.slides?.length || 0,
            filename: file
          });
        } catch (e) {
          console.log(`Error reading presentation ${file}:`, e);
        }
      }
    }

    res.json({ success: true, presentations });
  } catch (err) {
    console.error('Error listing presentations:', err);
    res.json({ success: true, presentations: [] });
  }
});

// GET /api/broadcast/presentations/:id - Load a specific presentation
router.get('/presentations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(PRESENTATIONS_DIR, `${id}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);
    res.json({ success: true, presentation: data });
  } catch (err) {
    console.error('Error loading presentation:', err);
    res.status(404).json({ success: false, error: 'Presentation not found' });
  }
});

// POST /api/broadcast/presentations - Save a new presentation
router.post('/presentations', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { id, name, slides } = req.body;
    if (!id || !name || !slides) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const data = {
      id,
      name,
      date: new Date().toISOString(),
      slides,
      slideCount: slides.length
    };

    const filepath = path.join(PRESENTATIONS_DIR, `${id}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    res.json({ success: true, id, message: 'Presentation saved successfully' });
  } catch (err) {
    console.error('Error saving presentation:', err);
    res.status(500).json({ success: false, error: 'Failed to save presentation' });
  }
});

// DELETE /api/broadcast/presentations/:id - Delete a presentation
router.delete('/presentations/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(PRESENTATIONS_DIR, `${id}.json`);
    await fs.unlink(filepath);
    res.json({ success: true, message: 'Presentation deleted' });
  } catch (err) {
    console.error('Error deleting presentation:', err);
    res.status(404).json({ success: false, error: 'Presentation not found' });
  }
});

// ==================== FILE UPLOADS API ====================

// POST /api/broadcast/upload - Upload a file
router.post('/upload', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Return the URL to access the file
    const fileUrl = `/broadcast/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// GET /api/broadcast/uploads - List all uploaded files
router.get('/uploads', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const uploads = [];

    for (const file of files) {
      try {
        const stats = await fs.stat(path.join(UPLOADS_DIR, file));
        uploads.push({
          filename: file,
          url: `/broadcast/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime
        });
      } catch (e) {
        // Skip files that can't be accessed
      }
    }

    res.json({ success: true, uploads });
  } catch (err) {
    console.error('Error listing uploads:', err);
    res.json({ success: true, uploads: [] });
  }
});

// DELETE /api/broadcast/uploads/:filename - Delete an uploaded file
router.delete('/uploads/:filename', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'LEADER'), async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filepath);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting upload:', err);
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

module.exports = router;
