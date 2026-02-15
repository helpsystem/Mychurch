/**
 * 🔌 WebSocket Sync Hook
 * 
 * سینک چند دستگاه در real-time برای Broadcast Console
 * - اسلایدها
 * - Lower Thirds  
 * - کنترل پخش
 * - چت تیم
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Slide, AppLanguage } from './types';

// Types
export interface SyncMessage {
  type: 'slide_change' | 'overlay_toggle' | 'lower_third' | 'play_control' | 'chat' | 'sync_request' | 'sync_response' | 'device_join' | 'device_leave' | 'audio_chunk' | 'transcript';
  payload: any;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  role: 'controller' | 'viewer' | 'backup';
  connectedAt: number;
  lastSeen: number;
}

export interface SyncState {
  isConnected: boolean;
  sessionId: string | null;
  myDeviceId: string;
  connectedDevices: ConnectedDevice[];
  lastMessage: SyncMessage | null;
  error: string | null;
}

export interface UseWebSocketSyncOptions {
  sessionId?: string;
  deviceName?: string;
  role?: 'controller' | 'viewer' | 'backup';
  autoConnect?: boolean;
  isLeader?: boolean;
  onSlideChange?: (slideIndex: number) => void;
}

export interface UseWebSocketSyncReturn {
  state: SyncState;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  createSession: () => string;
  sendSlideChange: (slideIndex: number, slide: Slide) => void;
  sendOverlayToggle: (overlayType: string, visible: boolean, data?: any) => void;
  sendLowerThird: (name: string, title: string, visible: boolean) => void;
  sendPlayControl: (action: 'play' | 'pause' | 'stop' | 'seek', time?: number) => void;
  sendChatMessage: (message: string) => void;
  requestSync: () => void;
  sendAudioChunk: (blob: Blob) => void;
}

// Generate unique device ID
const generateDeviceId = () => {
  const stored = localStorage.getItem('broadcast_device_id');
  if (stored) return stored;

  const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('broadcast_device_id', newId);
  return newId;
};

// Generate session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

export function useWebSocketSync(options: UseWebSocketSyncOptions = {}): UseWebSocketSyncReturn {
  const {
    sessionId: initialSessionId,
    deviceName = 'Device',
    role = 'viewer',
    autoConnect = false,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const deviceId = useRef(generateDeviceId());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<SyncState>({
    isConnected: false,
    sessionId: initialSessionId || null,
    myDeviceId: deviceId.current,
    connectedDevices: [],
    lastMessage: null,
    error: null,
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<SyncState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: Omit<SyncMessage, 'senderId' | 'senderName' | 'timestamp'>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: SyncMessage = {
        ...message,
        senderId: deviceId.current,
        senderName: deviceName,
        timestamp: Date.now(),
      };

      socketRef.current.send(JSON.stringify(fullMessage));
    }
  }, [deviceName]);

  // Connect to WebSocket
  const connect = useCallback((sessionId: string) => {
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    updateState({ sessionId, error: null });

    // Build WebSocket URL
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/ws/broadcast-sync`
      : 'ws://localhost:3001/ws/broadcast-sync';

    const urlWithParams = `${wsUrl}?sessionId=${sessionId}&deviceId=${deviceId.current}&deviceName=${encodeURIComponent(deviceName)}&role=${role}`;

    try {
      const socket = new WebSocket(urlWithParams);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('🔌 WebSocket connected');
        updateState({ isConnected: true, error: null });

        // Send join message
        sendMessage({
          type: 'device_join',
          payload: { deviceName, role },
        });

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);

          // Handle different message types
          switch (message.type) {
            case 'device_join':
              setState(prev => ({
                ...prev,
                connectedDevices: [
                  ...prev.connectedDevices.filter(d => d.id !== message.senderId),
                  {
                    id: message.senderId,
                    name: message.senderName,
                    role: message.payload.role,
                    connectedAt: message.timestamp,
                    lastSeen: Date.now(),
                  }
                ],
                lastMessage: message,
              }));
              break;

            case 'device_leave':
              setState(prev => ({
                ...prev,
                connectedDevices: prev.connectedDevices.filter(d => d.id !== message.senderId),
                lastMessage: message,
              }));
              break;

            case 'sync_response':
              // Full state sync received
              updateState({ lastMessage: message });
              break;

            default:
              updateState({ lastMessage: message });
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        updateState({ error: 'Connection error' });
      };

      socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        updateState({ isConnected: false });

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (state.sessionId) {
            connect(state.sessionId);
          }
        }, 5000);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      updateState({ error: (err as Error).message });
    }
  }, [deviceName, role, sendMessage, state.sessionId, updateState]);

  // Disconnect
  const disconnect = useCallback(() => {
    // Send leave message
    sendMessage({
      type: 'device_leave',
      payload: {},
    });

    // Close socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Clear intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    updateState({
      isConnected: false,
      sessionId: null,
      connectedDevices: [],
    });
  }, [sendMessage, updateState]);

  // Create new session
  const createSession = useCallback((): string => {
    const newSessionId = generateSessionId();
    connect(newSessionId);
    return newSessionId;
  }, [connect]);

  // Send slide change
  const sendSlideChange = useCallback((slideIndex: number, slide: Slide) => {
    sendMessage({
      type: 'slide_change',
      payload: { slideIndex, slide },
    });
  }, [sendMessage]);

  // Send overlay toggle
  const sendOverlayToggle = useCallback((overlayType: string, visible: boolean, data?: any) => {
    sendMessage({
      type: 'overlay_toggle',
      payload: { overlayType, visible, data },
    });
  }, [sendMessage]);

  // Send Lower Third
  const sendLowerThird = useCallback((name: string, title: string, visible: boolean) => {
    sendMessage({
      type: 'lower_third',
      payload: { name, title, visible },
    });
  }, [sendMessage]);

  // Send play control
  const sendPlayControl = useCallback((action: 'play' | 'pause' | 'stop' | 'seek', time?: number) => {
    sendMessage({
      type: 'play_control',
      payload: { action, time },
    });
  }, [sendMessage]);

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat',
      payload: { message },
    });
  }, [sendMessage]);

  // Request full sync from controller
  const requestSync = useCallback(() => {
    sendMessage({
      type: 'sync_request',
      payload: {},
    });
  }, [sendMessage]);

  // Send Audio Chunk (Convert Blob to Base64)
  const sendAudioChunk = useCallback((blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      sendMessage({
        type: 'audio_chunk',
        payload: base64data // Send base64 string
      });
    };
    reader.readAsDataURL(blob);
  }, [sendMessage]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && initialSessionId) {
      connect(initialSessionId);
    }

    return () => {
      disconnect();
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    createSession,
    sendSlideChange,
    sendOverlayToggle,
    sendLowerThird,
    sendPlayControl,
    sendChatMessage,
    requestSync,
    sendAudioChunk
  };
}

export default useWebSocketSync;
