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

const MAX_SESSION_ID_LENGTH = 120;
const ALLOWED_PLAY_ACTIONS = new Set(['play', 'pause', 'stop']);
const RATE_WINDOW_MS = 10_000;
const MAX_EVENTS_PER_WINDOW = 180;
const MIN_SLIDE_CHANGE_INTERVAL_MS = 100;
const MIN_PLAY_CONTROL_INTERVAL_MS = 100;

type SocketRateState = {
  windowStart: number;
  totalEvents: number;
  lastSlideChangeAt: number;
  lastPlayControlAt: number;
};

const socketRateMap = new Map<string, SocketRateState>();

function normalizeSessionId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_SESSION_ID_LENGTH) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeSlideIndex(input: unknown): number | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) return null;
  const idx = Math.floor(input);
  if (idx < 0 || idx > 5000) return null;
  return idx;
}

function getSocketRateState(socketId: string): SocketRateState {
  const now = Date.now();
  const existing = socketRateMap.get(socketId);
  if (!existing) {
    const initial: SocketRateState = {
      windowStart: now,
      totalEvents: 0,
      lastSlideChangeAt: 0,
      lastPlayControlAt: 0,
    };
    socketRateMap.set(socketId, initial);
    return initial;
  }

  if (now - existing.windowStart > RATE_WINDOW_MS) {
    existing.windowStart = now;
    existing.totalEvents = 0;
  }

  return existing;
}

function allowSocketEvent(socketId: string): boolean {
  const state = getSocketRateState(socketId);
  state.totalEvents += 1;
  return state.totalEvents <= MAX_EVENTS_PER_WINDOW;
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
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || true;
  const io = new IOServer(response.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: allowedOrigin,
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
      if (!allowSocketEvent(socket.id)) return;

      const sessionId = normalizeSessionId(data?.sessionId);
      const isLeader = Boolean(data?.isLeader);
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
      if (!allowSocketEvent(socket.id)) return;

      const sessionId = normalizeSessionId(data?.sessionId);
      const slideIndex = normalizeSlideIndex(data?.slideIndex);
      const timestamp = typeof data?.timestamp === 'number' ? data.timestamp : Date.now();
      if (!sessionId || slideIndex === null) return;

      const rateState = getSocketRateState(socket.id);
      if (Date.now() - rateState.lastSlideChangeAt < MIN_SLIDE_CHANGE_INTERVAL_MS) return;
      rateState.lastSlideChangeAt = Date.now();

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
      if (!allowSocketEvent(socket.id)) return;

      const sessionId = normalizeSessionId(data?.sessionId);
      const action = typeof data?.action === 'string' ? data.action : '';
      const timestamp = typeof data?.timestamp === 'number' ? data.timestamp : Date.now();
      if (!sessionId || !ALLOWED_PLAY_ACTIONS.has(action)) return;

      const rateState = getSocketRateState(socket.id);
      if (Date.now() - rateState.lastPlayControlAt < MIN_PLAY_CONTROL_INTERVAL_MS) return;
      rateState.lastPlayControlAt = Date.now();

      socket.to(sessionId).emit('play_control', {
        action,
        timestamp: timestamp || Date.now()
      });
    });

    /**
     * Ping/Pong for latency
     */
    socket.on('ping', (timestamp: number) => {
      if (!allowSocketEvent(socket.id)) return;
      socket.emit('pong', timestamp);
    });

    /**
     * Cleanup on disconnect
     */
    socket.on('disconnect', () => {
      console.log(`[Socket] ❌ Client disconnected: ${socket.id}`);
      socketRateMap.delete(socket.id);
      
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
