/**
 * 🔌 Broadcast WebSocket Server
 * سرور همگام‌سازی برای Broadcast Console
 * 
 * Features:
 * - Real-time slide synchronization
 * - Session-based rooms
 * - Device tracking
 * - Play control sync
 * 
 * Usage:
 * node backend/broadcast/broadcast-server.js
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://samanabyar.online'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Track sessions and devices
const sessions = new Map();

/**
 * Get session info
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      devices: new Set(),
      leader: null,
      currentSlide: 0,
      createdAt: new Date()
    });
  }
  return sessions.get(sessionId);
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * Upload endpoints (for Hybrid Recorder)
 */
app.post('/api/broadcast/upload/init', async (req, res) => {
  try {
    const { chunkIndex, contentType, size } = req.body;
    
    // TODO: Generate signed URL for S3/GCP
    // For now, return mock URL
    const uploadUrl = `https://storage.example.com/upload/${Date.now()}-chunk-${chunkIndex}`;
    
    res.json({
      uploadUrl,
      chunkIndex,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

app.post('/api/broadcast/upload/complete', async (req, res) => {
  try {
    const { totalChunks, timestamp } = req.body;
    
    console.log(`[Upload] ✅ Recording complete: ${totalChunks} chunks at ${timestamp}`);
    
    // TODO: Merge chunks and finalize video
    
    res.json({ success: true });
  } catch (error) {
    console.error('Upload complete error:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

/**
 * Socket.IO connection handler
 */
io.on('connection', (socket) => {
  console.log(`[Socket] ✅ Client connected: ${socket.id}`);

  /**
   * Join a broadcast session
   */
  socket.on('join_session', (data) => {
    const { sessionId, isLeader, deviceInfo } = data;
    const session = getSession(sessionId);
    
    // Add device to session
    socket.join(sessionId);
    session.devices.add(socket.id);
    
    if (isLeader && !session.leader) {
      session.leader = socket.id;
    }
    
    console.log(`[Session] Device ${socket.id} joined ${sessionId} (${isLeader ? 'Leader' : 'Viewer'})`);
    console.log(`[Session] Total devices in ${sessionId}: ${session.devices.size}`);
    
    // Notify all devices in session about device count
    io.to(sessionId).emit('devices_update', {
      count: session.devices.size
    });
    
    // Send current slide to new joiner
    socket.emit('slide_change', {
      slideIndex: session.currentSlide,
      timestamp: Date.now()
    });
  });

  /**
   * Slide change (from Leader)
   */
  socket.on('slide_change', (data) => {
    const { sessionId, slideIndex, timestamp } = data;
    const session = getSession(sessionId);
    
    // Verify sender is leader
    if (session.leader !== socket.id) {
      console.warn(`[Session] Unauthorized slide change from ${socket.id}`);
      return;
    }
    
    // Update session state
    session.currentSlide = slideIndex;
    
    // Broadcast to all OTHER devices in the session
    socket.to(sessionId).emit('slide_change', {
      slideIndex,
      timestamp
    });
    
    console.log(`[Session] Slide changed to ${slideIndex} in ${sessionId}`);
  });

  /**
   * Play control (from Leader)
   */
  socket.on('play_control', (data) => {
    const { sessionId, action, timestamp } = data;
    const session = getSession(sessionId);
    
    // Verify sender is leader
    if (session.leader !== socket.id) {
      console.warn(`[Session] Unauthorized play control from ${socket.id}`);
      return;
    }
    
    // Broadcast to all OTHER devices
    socket.to(sessionId).emit('play_control', {
      action,
      timestamp
    });
    
    console.log(`[Session] Play control '${action}' in ${sessionId}`);
  });

  /**
   * Ping/Pong for latency measurement
   */
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });

  /**
   * Disconnect
   */
  socket.on('disconnect', () => {
    console.log(`[Socket] ❌ Client disconnected: ${socket.id}`);
    
    // Remove from all sessions
    sessions.forEach((session, sessionId) => {
      if (session.devices.has(socket.id)) {
        session.devices.delete(socket.id);
        
        // If leader left, promote another device
        if (session.leader === socket.id && session.devices.size > 0) {
          session.leader = Array.from(session.devices)[0];
          console.log(`[Session] New leader: ${session.leader}`);
        }
        
        // Update device count
        io.to(sessionId).emit('devices_update', {
          count: session.devices.size
        });
        
        // Delete empty sessions
        if (session.devices.size === 0) {
          sessions.delete(sessionId);
          console.log(`[Session] Removed empty session: ${sessionId}`);
        }
      }
    });
  });
});

/**
 * Start server
 */
const PORT = process.env.BROADCAST_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🎬 Broadcast Console WebSocket Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Port: ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing...');
  httpServer.close(() => {
    console.log('[Server] ✅ Closed');
    process.exit(0);
  });
});
