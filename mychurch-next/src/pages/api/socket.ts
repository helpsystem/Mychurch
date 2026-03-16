import { NextApiRequest } from 'next';
import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket {
  socket: SocketWithIO;
  status: (code: number) => NextApiResponseWithSocket;
  json: (data: any) => void;
  end: () => void;
}

// Track sessions and devices in memory (Global variable for this module)
const sessions = new Map<string, any>();

function getOrCreateSession(sessionId: string) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      devices: new Set<string>(),
      leader: null,
      currentSlide: 0,
      createdAt: new Date()
    });
  }
  return sessions.get(sessionId);
}

export default function handler(req: NextApiRequest, res: any) {
  const response = res as NextApiResponseWithSocket;

  if (response.socket.server.io) {
    console.log('[SocketIO] Server already running');
    response.end();
    return;
  }

  console.log('[SocketIO] Initializing server...');
  const io = new IOServer(response.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  response.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] ✅ Client connected: ${socket.id}`);

    /**
     * Join a broadcast session
     */
    socket.on('join_session', (data: { sessionId: string; isLeader: boolean }) => {
      const { sessionId, isLeader } = data;
      if (!sessionId) return;

      const session = getOrCreateSession(sessionId);
      
      socket.join(sessionId);
      session.devices.add(socket.id);
      
      if (isLeader && !session.leader) {
        session.leader = socket.id;
      }
      
      console.log(`[Socket] Device ${socket.id} joined ${sessionId} (${isLeader ? 'Leader' : 'Viewer'})`);
      
      // Update device count
      io.to(sessionId).emit('devices_update', {
        count: session.devices.size
      });
      
      // Send current state to new joiner
      socket.emit('slide_change', {
        slideIndex: session.currentSlide,
        timestamp: Date.now()
      });
    });

    /**
     * Slide change (from Leader)
     */
    socket.on('slide_change', (data: { sessionId: string; slideIndex: number; timestamp: number }) => {
      const { sessionId, slideIndex, timestamp } = data;
      const session = getOrCreateSession(sessionId);
      
      session.currentSlide = slideIndex;
      if (!session.leader) session.leader = socket.id;

      // Broadcast to others in the room
      socket.to(sessionId).emit('slide_change', {
        slideIndex,
        timestamp: timestamp || Date.now()
      });
      
      console.log(`[Socket] Slide -> ${slideIndex} in ${sessionId}`);
    });

    /**
     * Play control
     */
    socket.on('play_control', (data: { sessionId: string; action: string; timestamp: number }) => {
      const { sessionId, action, timestamp } = data;
      socket.to(sessionId).emit('play_control', {
        action,
        timestamp: timestamp || Date.now()
      });
    });

    /**
     * Ping/Pong for latency
     */
    socket.on('ping', (timestamp: number) => {
      socket.emit('pong', timestamp);
    });

    /**
     * Cleanup on disconnect
     */
    socket.on('disconnect', () => {
      console.log(`[Socket] ❌ Client disconnected: ${socket.id}`);
      
      sessions.forEach((session, sessionId) => {
        if (session.devices.has(socket.id)) {
          session.devices.delete(socket.id);
          
          if (session.leader === socket.id) {
            session.leader = session.devices.size > 0 ? Array.from(session.devices)[0] : null;
          }
          
          io.to(sessionId).emit('devices_update', {
            count: session.devices.size
          });

          // Cleanup empty sessions
          if (session.devices.size === 0) {
            sessions.delete(sessionId);
          }
        }
      });
    });
  });

  response.end();
}
