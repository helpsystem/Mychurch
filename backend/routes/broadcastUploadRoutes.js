/**
 * 🎥 Broadcast Video Upload Routes
 * آپلود ویدیوهای ضبط‌شده مراسم به HiDrive
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// HiDrive Storage Service
let hidriveStorage;
try {
  hidriveStorage = require('../services/hidriveStorage');
} catch (error) {
  console.warn('⚠️  HiDrive storage not available:', error.message);
  hidriveStorage = null;
}

// Auth middleware (optional for local dev)
let authenticateToken, authorizeRoles;
try {
  const auth = require('../middleware/auth');
  authenticateToken = auth.authenticateToken;
  authorizeRoles = auth.authorizeRoles;
} catch (error) {
  console.warn('⚠️  Auth middleware not available');
  authenticateToken = (req, res, next) => next();
  authorizeRoles = () => (req, res, next) => next();
}

// Configure multer for video uploads (memory storage for streaming to HiDrive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max per chunk
  }
});

// Active recording sessions
const activeSessions = new Map();

/**
 * POST /api/broadcast/upload/init
 * Initialize a recording session and get upload info
 */
router.post('/init', async (req, res) => {
  try {
    const { chunkIndex, contentType, size } = req.body;
    
    // Generate session ID if not exists
    const sessionId = req.headers['x-session-id'] || `session-${Date.now()}`;
    
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, {
        id: sessionId,
        startedAt: new Date(),
        chunks: [],
        totalSize: 0
      });
    }
    
    const session = activeSessions.get(sessionId);
    
    // For now, we'll accept chunks directly (no signed URL needed)
    res.json({
      success: true,
      sessionId,
      chunkIndex,
      uploadUrl: `/api/broadcast/upload/chunk?sessionId=${sessionId}&index=${chunkIndex}`,
      message: 'Ready to receive chunk'
    });
  } catch (error) {
    console.error('❌ Upload init error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize upload',
      message: error.message
    });
  }
});

/**
 * POST /api/broadcast/upload/chunk
 * Upload a video chunk
 */
router.post('/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { sessionId, index } = req.query;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No chunk data received'
      });
    }
    
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId || `session-${Date.now()}`,
        startedAt: new Date(),
        chunks: [],
        totalSize: 0
      };
      activeSessions.set(session.id, session);
    }
    
    // Store chunk info
    session.chunks.push({
      index: parseInt(index) || session.chunks.length,
      size: req.file.size,
      buffer: req.file.buffer
    });
    session.totalSize += req.file.size;
    
    console.log(`✅ Received chunk #${index} (${req.file.size} bytes) for session ${sessionId}`);
    
    res.json({
      success: true,
      sessionId: session.id,
      chunkIndex: index,
      receivedSize: req.file.size,
      totalChunks: session.chunks.length,
      totalSize: session.totalSize
    });
  } catch (error) {
    console.error('❌ Chunk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload chunk',
      message: error.message
    });
  }
});

/**
 * POST /api/broadcast/upload/complete
 * Complete recording and save to HiDrive
 */
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, totalChunks, timestamp, title } = req.body;
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Sort chunks by index
    session.chunks.sort((a, b) => a.index - b.index);
    
    // Combine all chunks into single buffer
    const buffers = session.chunks.map(c => c.buffer);
    const combinedBuffer = Buffer.concat(buffers);
    
    console.log(`📦 Combined ${session.chunks.length} chunks: ${combinedBuffer.length} bytes`);
    
    // Generate filename
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const safeTitle = (title || 'recording').replace(/[^a-zA-Z0-9\u0600-\u06FF-_]/g, '_');
    const filename = `${dateStr}_${timeStr}_${safeTitle}.webm`;
    
    // Upload to HiDrive
    if (hidriveStorage) {
      try {
        // Add broadcast category to HiDrive config if not exists
        const category = 'broadcast-recordings';
        
        // Upload to HiDrive
        const url = await hidriveStorage.uploadFile(
          combinedBuffer,
          'worship-videos', // Using existing category
          `broadcasts/${filename}`
        );
        
        console.log(`✅ Recording saved to HiDrive: ${url}`);
        
        // Cleanup session
        activeSessions.delete(sessionId);
        
        res.json({
          success: true,
          message: 'Recording saved successfully',
          url,
          filename,
          totalSize: combinedBuffer.length,
          duration: Math.round((Date.now() - session.startedAt.getTime()) / 1000),
          storage: 'hidrive'
        });
      } catch (uploadError) {
        console.error('❌ HiDrive upload failed:', uploadError);
        res.status(500).json({
          success: false,
          error: 'Failed to save to HiDrive',
          message: uploadError.message
        });
      }
    } else {
      // Save locally if HiDrive not available
      const fs = require('fs');
      const localPath = path.join(__dirname, '../../recordings', filename);
      
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, combinedBuffer);
      
      console.log(`✅ Recording saved locally: ${localPath}`);
      
      // Cleanup session
      activeSessions.delete(sessionId);
      
      res.json({
        success: true,
        message: 'Recording saved locally (HiDrive not available)',
        localPath,
        filename,
        totalSize: combinedBuffer.length,
        storage: 'local'
      });
    }
  } catch (error) {
    console.error('❌ Complete upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete recording',
      message: error.message
    });
  }
});

/**
 * GET /api/broadcast/upload/status/:sessionId
 * Get current upload status
 */
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  res.json({
    success: true,
    sessionId,
    totalChunks: session.chunks.length,
    totalSize: session.totalSize,
    startedAt: session.startedAt,
    elapsedSeconds: Math.round((Date.now() - session.startedAt.getTime()) / 1000)
  });
});

/**
 * DELETE /api/broadcast/upload/cancel/:sessionId
 * Cancel an active recording session
 */
router.delete('/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    res.json({
      success: true,
      message: 'Session cancelled'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

/**
 * GET /api/broadcast/upload/recordings
 * List saved recordings (from HiDrive)
 */
router.get('/recordings', async (req, res) => {
  try {
    if (hidriveStorage && hidriveStorage.sftpClient) {
      try {
        await hidriveStorage.connect();
        const remotePath = '/users/adminchurch/mychurch/worship/videos/broadcasts';
        const exists = await hidriveStorage.sftpClient.exists(remotePath);
        
        if (exists) {
          const files = await hidriveStorage.sftpClient.list(remotePath);
          const recordings = files
            .filter(f => f.type === '-' && f.name.endsWith('.webm'))
            .map(f => ({
              name: f.name,
              url: `https://webdav.hidrive.ionos.com${remotePath}/${f.name}`,
              size: f.size,
              modifiedAt: f.modifyTime
            }));
          
          return res.json({
            success: true,
            recordings,
            storage: 'hidrive'
          });
        } else {
          return res.json({
            success: true,
            recordings: [],
            storage: 'hidrive',
            message: 'Broadcasts folder does not exist yet'
          });
        }
      } catch (sftpError) {
        console.error('❌ HiDrive SFTP error:', sftpError);
      }
    }
    
    // Fallback: List local recordings
    const fs = require('fs');
    const recordingsDir = path.join(__dirname, '../../recordings');
    
    if (!fs.existsSync(recordingsDir)) {
      return res.json({
        success: true,
        recordings: [],
        storage: 'local'
      });
    }
    
    const files = fs.readdirSync(recordingsDir)
      .filter(f => f.endsWith('.webm'))
      .map(f => ({
        name: f,
        path: `/recordings/${f}`,
        size: fs.statSync(path.join(recordingsDir, f)).size
      }));
    
    res.json({
      success: true,
      recordings: files,
      storage: 'local'
    });
  } catch (error) {
    console.error('❌ List recordings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list recordings',
      message: error.message
    });
  }
});

module.exports = router;
