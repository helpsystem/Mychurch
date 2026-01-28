/**
 * 🔄 WebSocket Sync Hook
 * همگام‌سازی اسلایدها بین دستگاه‌های مختلف
 * 
 * Features:
 * - Real-time slide synchronization
 * - Session-based rooms
 * - Leader/Viewer roles
 * - Connection status tracking
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// نوع کاربر متصل
interface ConnectedUser {
  id: string;
  name: string;
  role: 'admin' | 'leader' | 'viewer';
  isOnline: boolean;
  joinedAt: number;
  avatar?: string;
}

interface SyncState {
  isConnected: boolean;
  isLeader: boolean;
  syncedDevices: number;
  sessionId: string | null;
  latency: number;
  connectedUsers: ConnectedUser[];
}

interface WebSocketSyncOptions {
  sessionId?: string;
  isLeader?: boolean;
  onSlideChange?: (slideIndex: number) => void;
  onPlayControl?: (action: 'play' | 'pause' | 'stop') => void;
  serverUrl?: string;
}

export const useWebSocketSync = (options: WebSocketSyncOptions = {}) => {
  const {
    sessionId = null,
    isLeader = true,
    onSlideChange,
    onPlayControl,
    serverUrl = 'http://localhost:3001'
  } = options;

  const [state, setState] = useState<SyncState>({
    isConnected: false,
    isLeader,
    syncedDevices: 0,
    sessionId: sessionId,
    latency: 0,
    connectedUsers: []
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);

  /**
   * اتصال به سرور WebSocket
   */
  const connect = useCallback((newSessionId?: string) => {
    const targetSessionId = newSessionId || state.sessionId || `session-${Date.now()}`;

    if (socketRef.current?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      const socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
      });

      // Connection established
      socket.on('connect', () => {
        console.log('[WebSocket] ✅ Connected to server');
        reconnectAttempts.current = 0;

        // Join session room
        socket.emit('join_session', {
          sessionId: targetSessionId,
          isLeader: state.isLeader,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        });

        setState(prev => ({
          ...prev,
          isConnected: true,
          sessionId: targetSessionId
        }));
      });

      // Connection failed
      socket.on('connect_error', (error) => {
        reconnectAttempts.current++;
        console.warn(`[WebSocket] ⚠️ Connection attempt ${reconnectAttempts.current}:`, error.message);
        setState(prev => ({ ...prev, isConnected: false }));
      });

      // Disconnected
      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] ❌ Disconnected:', reason);
        setState(prev => ({ ...prev, isConnected: false }));
      });

      // Slide change from other devices
      socket.on('slide_change', (data: { slideIndex: number; timestamp: number }) => {
        if (!state.isLeader) {
          console.log(`[WebSocket] 📊 Slide change received: ${data.slideIndex}`);
          onSlideChange?.(data.slideIndex);
        }
      });

      // Play control from leader
      socket.on('play_control', (data: { action: 'play' | 'pause' | 'stop' }) => {
        if (!state.isLeader) {
          console.log(`[WebSocket] ▶️ Play control: ${data.action}`);
          onPlayControl?.(data.action);
        }
      });

      // Synced devices count update
      socket.on('devices_update', (data: { count: number }) => {
        setState(prev => ({ ...prev, syncedDevices: data.count }));
      });

      // Latency measurement
      socket.on('pong', (timestamp: number) => {
        const latency = Date.now() - timestamp;
        setState(prev => ({ ...prev, latency }));
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }, [serverUrl, state.isLeader, state.sessionId, onSlideChange, onPlayControl]);

  /**
   * قطع اتصال
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({
        ...prev,
        isConnected: false,
        syncedDevices: 0
      }));
      console.log('[WebSocket] ✅ Disconnected');
    }
  }, []);

  /**
   * ارسال تغییر اسلاید (فقط Leader)
   */
  const sendSlideChange = useCallback((slideIndex: number) => {
    if (!socketRef.current?.connected) {
      console.warn('[WebSocket] Not connected');
      return;
    }

    if (!state.isLeader) {
      console.warn('[WebSocket] Only leader can send slide changes');
      return;
    }

    socketRef.current.emit('slide_change', {
      sessionId: state.sessionId,
      slideIndex,
      timestamp: Date.now()
    });

    console.log(`[WebSocket] 📤 Sent slide change: ${slideIndex}`);
  }, [state.isLeader, state.sessionId]);

  /**
   * ارسال کنترل پخش (فقط Leader)
   */
  const sendPlayControl = useCallback((action: 'play' | 'pause' | 'stop') => {
    if (!socketRef.current?.connected || !state.isLeader) {
      return;
    }

    socketRef.current.emit('play_control', {
      sessionId: state.sessionId,
      action,
      timestamp: Date.now()
    });

    console.log(`[WebSocket] 📤 Sent play control: ${action}`);
  }, [state.isLeader, state.sessionId]);

  /**
   * پینگ برای اندازه‌گیری latency
   */
  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping', Date.now());
    }
  }, []);

  // Auto-connect on mount if sessionId provided
  useEffect(() => {
    if (sessionId) {
      connect(sessionId);
    }

    return () => {
      disconnect();
    };
  }, []); // Only on mount/unmount

  // Periodic ping
  useEffect(() => {
    if (state.isConnected) {
      const interval = setInterval(ping, 5000);
      return () => clearInterval(interval);
    }
  }, [state.isConnected, ping]);

  return {
    state,
    connect,
    disconnect,
    sendSlideChange,
    sendPlayControl,
    ping
  };
};
