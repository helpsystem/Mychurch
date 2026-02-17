// Broadcast WebSocket Sync Server
// Real-time synchronization for broadcast console and viewer devices

const WebSocket = require('ws');

// Session rooms - stores connected clients by sessionId
const rooms = new Map(); // sessionId -> Set<WebSocket>

// Client metadata - stores info for each connection
const clients = new Map(); // WebSocket -> { sessionId, deviceId, deviceName, role }

/**
 * Initialize WebSocket server for broadcast sync
 * @param {Server} server - HTTP server instance
 */
function initBroadcastWebSocket(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws/broadcast-sync'
  });

  console.log('🔌 Broadcast WebSocket server initialized at /ws/broadcast-sync');

  wss.on('connection', (ws, req) => {
    // Parse connection parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const deviceId = url.searchParams.get('deviceId');
    const deviceName = url.searchParams.get('deviceName') || 'Unknown Device';
    const role = url.searchParams.get('role') || 'viewer';

    if (!sessionId || !deviceId) {
      console.error('❌ WebSocket connection rejected: missing sessionId or deviceId');
      ws.close(1008, 'Missing required parameters');
      return;
    }

    console.log(`🔌 New connection: ${deviceName} (${role}) to session ${sessionId}`);

    // Store client metadata
    clients.set(ws, { sessionId, deviceId, deviceName, role });

    // Add to room
    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, new Set());
    }
    rooms.get(sessionId).add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      deviceId,
      timestamp: Date.now()
    }));

    // Broadcast device list to room
    broadcastDeviceList(sessionId);


    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Get sender info immediately
        const sender = clients.get(ws);
        if (!sender) return;

        // Handle audio chunks for AI Transcription
        if (message.type === 'audio_chunk') {
          // message.payload should be base64 audio
          if (message.payload) {
            const audioBuffer = Buffer.from(message.payload, 'base64');

            // Send to Gemini for transcription
            const { transcribeAudio } = require('./services/geminiService');

            transcribeAudio(audioBuffer, 'audio/webm', 'Transcribe this speech to text. Return only the text.')
              .then(transcript => {
                if (transcript && transcript.trim()) {
                  // Broadcast transcript to session
                  const transcriptMsg = JSON.stringify({
                    type: 'transcript',
                    payload: {
                      text: transcript.trim(),
                      isFinal: true,
                      timestamp: Date.now()
                    },
                    senderId: 'AI_TRANSCRIPTION'
                  });

                  const room = rooms.get(sender.sessionId);
                  if (room) {
                    room.forEach(client => {
                      if (client.readyState === WebSocket.OPEN) {
                        client.send(transcriptMsg);
                      }
                    });
                  }
                }
              })
              .catch(err => console.error('Transcription failed:', err));
          }
          return;
        }

        // Handle ping/pong
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }

        console.log(`📩 Message from ${sender.deviceName}:`, message.type);

        // Broadcast to all other clients in the same session
        const room = rooms.get(sender.sessionId);
        if (room) {
          const broadcast = JSON.stringify({
            ...message,
            senderId: sender.deviceId,
            senderName: sender.deviceName,
            timestamp: Date.now()
          });

          room.forEach(client => {
            // Don't send back to sender
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(broadcast);
            }
          });

          // Log important events
          if (message.type === 'slide_change') {
            console.log(`📺 Slide changed to index ${message.payload?.slideIndex} in session ${sender.sessionId}`);
          }
        }
      } catch (err) {
        console.error('❌ Error handling WebSocket message:', err);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`🔌 Disconnected: ${client.deviceName} from session ${client.sessionId}`);

        // Remove from room
        const room = rooms.get(client.sessionId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) {
            rooms.delete(client.sessionId);
            console.log(`🗑️ Session ${client.sessionId} room deleted (no clients)`);
          } else {
            // Broadcast updated device list
            broadcastDeviceList(client.sessionId);
          }
        }

        // Remove client metadata
        clients.delete(ws);
      }
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err);
    });
  });

  /**
   * Broadcast list of connected devices to all clients in a session
   */
  function broadcastDeviceList(sessionId) {
    const room = rooms.get(sessionId);
    if (!room) return;

    const devices = [];
    room.forEach(client => {
      const meta = clients.get(client);
      if (meta) {
        devices.push({
          deviceId: meta.deviceId,
          deviceName: meta.deviceName,
          role: meta.role
        });
      }
    });

    const message = JSON.stringify({
      type: 'device_list',
      payload: { devices },
      timestamp: Date.now()
    });

    room.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`📋 Broadcasted device list for session ${sessionId}: ${devices.length} devices`);
  }

  return wss;
}

module.exports = { initBroadcastWebSocket };
