// 🔌 Broadcast WebSocket Server (Socket.IO version)
// Real-time synchronization for broadcast console and viewer devices

const { Server } = require('socket.io');

// Track sessions and devices
const sessions = new Map();

/**
 * Get or create session info
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
 * Initialize Socket.IO for broadcast sync
 * @param {Server} server - HTTP server instance
 */
function initBroadcastWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  console.log('🔌 Broadcast Socket.IO server initialized');

  io.on('connection', (socket) => {
    console.log(`[Socket] ✅ Client connected: ${socket.id}`);

    /**
     * Join a broadcast session
     */
    socket.on('join_session', (data) => {
      const { sessionId, isLeader, deviceInfo, deviceId } = data;
      if (!sessionId) {
        console.error('❌ join_session missing sessionId');
        return;
      }

      const session = getSession(sessionId);
      
      // Add device to session
      socket.join(sessionId);
      session.devices.add(socket.id);
      
      // If specified as leader, try to take the lead
      if (isLeader && !session.leader) {
        session.leader = socket.id;
      }
      
      console.log(`[Session] Device ${socket.id} joined ${sessionId} (${isLeader ? 'Leader' : 'Viewer'})`);
      
      // Notify all devices in session about device count
      io.to(sessionId).emit('devices_update', {
        count: session.devices.size
      });
      
      // Send current slide to new joiner
      socket.emit('slide_change', {
        slideIndex: session.currentSlide,
        timestamp: Date.now()
      });

      // Broadcast device list for backward compatibility with some components
      broadcastDeviceList(io, sessionId);
    });

    /**
     * Slide change (from Leader)
     */
    socket.on('slide_change', (data) => {
      const { sessionId, slideIndex, timestamp } = data;
      const session = getSession(sessionId);
      
      // If no leader is assigned yet, the first one to send a slide change becomes leader
      if (!session.leader) {
        session.leader = socket.id;
      }

      // Verify sender is leader (optional, depends on security preference)
      // if (session.leader !== socket.id) {
      //   console.warn(`[Session] Unauthorized slide change from ${socket.id}`);
      //   return;
      // }
      
      // Update session state
      session.currentSlide = slideIndex;
      
      // Broadcast to all OTHER devices in the session
      socket.to(sessionId).emit('slide_change', {
        slideIndex,
        timestamp: timestamp || Date.now()
      });
      
      console.log(`[Session] Slide changed to ${slideIndex} in ${sessionId}`);
    });

    /**
     * Play control (from Leader)
     */
    socket.on('play_control', (data) => {
      const { sessionId, action, timestamp } = data;
      const session = getSession(sessionId);
      
      // Broadcast to all OTHER devices
      socket.to(sessionId).emit('play_control', {
        action,
        timestamp: timestamp || Date.now()
      });
      
      console.log(`[Session] Play control '${action}' in ${sessionId}`);
    });

    /**
     * Handle audio chunks for AI Transcription
     */
    socket.on('audio_chunk', (data) => {
      const { sessionId, payload } = data;
      if (!payload) return;

      const audioBuffer = Buffer.from(payload, 'base64');

      // Send to Gemini for transcription
      try {
        const { transcribeAudio } = require('./services/geminiService');
        transcribeAudio(audioBuffer, 'audio/webm', 'Transcribe this speech to text. Return only the text.')
          .then(transcript => {
            if (transcript && transcript.trim()) {
              io.to(sessionId).emit('transcript', {
                text: transcript.trim(),
                isFinal: true,
                timestamp: Date.now(),
                senderId: 'AI_TRANSCRIPTION'
              });
            }
          })
          .catch(err => console.error('Transcription failed:', err));
      } catch (err) {
        console.error('Gemini service not available:', err.message);
      }
    });

    /**
     * Ping/Pong
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
          
          // If leader left, promote another device or clear leader
          if (session.leader === socket.id) {
            session.leader = session.devices.size > 0 ? Array.from(session.devices)[0] : null;
            if (session.leader) console.log(`[Session] New leader for ${sessionId}: ${session.leader}`);
          }
          
          // Update device count
          io.to(sessionId).emit('devices_update', {
            count: session.devices.size
          });

          // Broadcast device list
          broadcastDeviceList(io, sessionId);
          
          // Delete empty sessions after some time
          if (session.devices.size === 0) {
            setTimeout(() => {
              if (session.devices.size === 0) {
                sessions.delete(sessionId);
                console.log(`[Session] Removed empty session: ${sessionId}`);
              }
            }, 60000); // Wait 1 minute before cleanup
          }
        }
      });
    });
  });

  return io;
}

/**
 * Broadcast list of connected devices (Shim for compatibility)
 */
function broadcastDeviceList(io, sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const devices = Array.from(session.devices).map(id => ({
    deviceId: id,
    deviceName: 'Socket Device',
    role: session.leader === id ? 'leader' : 'viewer'
  }));

  io.to(sessionId).emit('device_list', {
    devices,
    timestamp: Date.now()
  });
}

module.exports = { initBroadcastWebSocket };

module.exports = { initBroadcastWebSocket };
