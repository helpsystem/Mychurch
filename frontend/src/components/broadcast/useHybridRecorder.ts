/**
 * 🎬 useHybridRecorder - Hook for Recording + YouTube Live + Local/Cloud Sync
 * 
 * قابلیت‌ها:
 * 1. ضبط ویدیو از canvas/camera
 * 2. استریم مستقیم به YouTube Live (RTMP)
 * 3. ذخیره همزمان در لوکال
 * 4. آپلود به HiDrive/Google Drive
 * 5. همه با هم سینک شده
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Types
export interface RecordingConfig {
  videoWidth?: number;
  videoHeight?: number;
  frameRate?: number;
  videoBitrate?: number;
  audioBitrate?: number;
}

export interface YouTubeStreamConfig {
  streamKey: string;
  serverUrl?: string;
}

export interface CloudSyncConfig {
  provider: 'hidrive' | 'googledrive' | 'both';
  hidriveAccessToken?: string;
  googleAccessToken?: string;
  uploadPath?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  isUploading: boolean;
  duration: number;
  recordedBlob: Blob | null;
  localSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  cloudSyncStatus: 'idle' | 'uploading' | 'synced' | 'error';
  youtubeStatus: 'idle' | 'connecting' | 'streaming' | 'error';
  error: string | null;
}

export interface UseHybridRecorderReturn {
  state: RecordingState;
  startRecording: (canvas?: HTMLCanvasElement, audioStream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  saveLocal: (filename?: string) => Promise<void>;
  startYouTubeStream: (config: YouTubeStreamConfig) => Promise<void>;
  stopYouTubeStream: () => void;
  syncToCloud: (config: CloudSyncConfig) => Promise<void>;
  getMediaStream: () => MediaStream | null;
}

const DEFAULT_CONFIG: RecordingConfig = {
  videoWidth: 1920,
  videoHeight: 1080,
  frameRate: 30,
  videoBitrate: 4000000, // 4 Mbps
  audioBitrate: 128000,  // 128 kbps
};

export function useHybridRecorder(config: RecordingConfig = {}): UseHybridRecorderReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rtmpSocketRef = useRef<WebSocket | null>(null);
  
  // State
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isStreaming: false,
    isUploading: false,
    duration: 0,
    recordedBlob: null,
    localSaveStatus: 'idle',
    cloudSyncStatus: 'idle',
    youtubeStatus: 'idle',
    error: null,
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<RecordingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Get supported MIME type
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }, []);

  // Create combined stream from canvas and audio
  const createCombinedStream = useCallback((
    canvas?: HTMLCanvasElement, 
    audioStream?: MediaStream
  ): MediaStream | null => {
    const tracks: MediaStreamTrack[] = [];
    
    // Get canvas stream
    if (canvas) {
      const canvasStream = canvas.captureStream(finalConfig.frameRate);
      canvasStreamRef.current = canvasStream;
      tracks.push(...canvasStream.getVideoTracks());
    }
    
    // Add audio tracks
    if (audioStream) {
      audioStreamRef.current = audioStream;
      tracks.push(...audioStream.getAudioTracks());
    }
    
    if (tracks.length === 0) {
      return null;
    }
    
    const combined = new MediaStream(tracks);
    combinedStreamRef.current = combined;
    return combined;
  }, [finalConfig.frameRate]);

  // Start recording
  const startRecording = useCallback(async (
    canvas?: HTMLCanvasElement,
    audioStream?: MediaStream
  ): Promise<void> => {
    try {
      updateState({ error: null });
      
      const stream = createCombinedStream(canvas, audioStream);
      if (!stream) {
        throw new Error('No media stream available');
      }
      
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: finalConfig.videoBitrate,
        audioBitsPerSecond: finalConfig.audioBitrate,
      };
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // If streaming to YouTube, send chunk via WebSocket
          if (state.isStreaming && rtmpSocketRef.current?.readyState === WebSocket.OPEN) {
            rtmpSocketRef.current.send(event.data);
          }
        }
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        updateState({ error: 'Recording error occurred' });
      };
      
      // Start with 1 second chunks for live streaming
      recorder.start(1000);
      
      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);
      
      updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        recordedBlob: null,
        localSaveStatus: 'idle',
        cloudSyncStatus: 'idle',
      });
      
      console.log('🎬 Recording started');
    } catch (err) {
      console.error('Start recording error:', err);
      updateState({ error: (err as Error).message });
      throw err;
    }
  }, [createCombinedStream, getSupportedMimeType, finalConfig, state.isStreaming, updateState]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (!recorder || recorder.state === 'inactive') {
        updateState({ isRecording: false, isPaused: false });
        resolve(null);
        return;
      }
      
      recorder.onstop = () => {
        const mimeType = getSupportedMimeType();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        updateState({
          isRecording: false,
          isPaused: false,
          recordedBlob: blob,
        });
        
        console.log('🎬 Recording stopped, blob size:', blob.size);
        resolve(blob);
      };
      
      recorder.stop();
      
      // Stop all tracks
      combinedStreamRef.current?.getTracks().forEach(track => track.stop());
    });
  }, [getSupportedMimeType, updateState]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      updateState({ isPaused: true });
      console.log('⏸️ Recording paused');
    }
  }, [updateState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      updateState({ isPaused: false });
      console.log('▶️ Recording resumed');
    }
  }, [updateState]);

  // Save to local file
  const saveLocal = useCallback(async (filename?: string): Promise<void> => {
    try {
      updateState({ localSaveStatus: 'saving' });
      
      const blob = state.recordedBlob;
      if (!blob) {
        throw new Error('No recording to save');
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = filename || `broadcast_${timestamp}.webm`;
      
      // Use File System Access API if available
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: name,
          types: [{
            description: 'Video Files',
            accept: {
              'video/webm': ['.webm'],
              'video/mp4': ['.mp4'],
            },
          }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      updateState({ localSaveStatus: 'saved' });
      console.log('💾 Saved locally:', name);
    } catch (err) {
      console.error('Local save error:', err);
      updateState({ localSaveStatus: 'error', error: (err as Error).message });
      throw err;
    }
  }, [state.recordedBlob, updateState]);

  // Start YouTube Live stream via WebSocket to backend
  const startYouTubeStream = useCallback(async (config: YouTubeStreamConfig): Promise<void> => {
    try {
      updateState({ youtubeStatus: 'connecting' });
      
      // Connect to our backend WebSocket that will forward to YouTube
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/ws/rtmp`
        : 'ws://localhost:3001/ws/rtmp';
        
      const socket = new WebSocket(wsUrl);
      rtmpSocketRef.current = socket;
      
      socket.onopen = () => {
        // Send stream configuration
        socket.send(JSON.stringify({
          type: 'init',
          streamKey: config.streamKey,
          serverUrl: config.serverUrl || 'rtmp://a.rtmp.youtube.com/live2',
        }));
        
        updateState({ youtubeStatus: 'streaming', isStreaming: true });
        console.log('📺 YouTube Live streaming started');
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateState({ youtubeStatus: 'error', error: 'YouTube stream connection error' });
      };
      
      socket.onclose = () => {
        updateState({ youtubeStatus: 'idle', isStreaming: false });
        console.log('📺 YouTube stream ended');
      };
    } catch (err) {
      console.error('YouTube stream error:', err);
      updateState({ youtubeStatus: 'error', error: (err as Error).message });
      throw err;
    }
  }, [updateState]);

  // Stop YouTube stream
  const stopYouTubeStream = useCallback(() => {
    if (rtmpSocketRef.current) {
      rtmpSocketRef.current.close();
      rtmpSocketRef.current = null;
    }
    updateState({ youtubeStatus: 'idle', isStreaming: false });
    console.log('📺 YouTube stream stopped');
  }, [updateState]);

  // Sync to cloud (HiDrive or Google Drive)
  const syncToCloud = useCallback(async (config: CloudSyncConfig): Promise<void> => {
    try {
      updateState({ cloudSyncStatus: 'uploading', isUploading: true });
      
      const blob = state.recordedBlob;
      if (!blob) {
        throw new Error('No recording to upload');
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `broadcast_${timestamp}.webm`;
      
      // Upload to HiDrive
      if (config.provider === 'hidrive' || config.provider === 'both') {
        await uploadToHiDrive(blob, filename, config.hidriveAccessToken, config.uploadPath);
      }
      
      // Upload to Google Drive
      if (config.provider === 'googledrive' || config.provider === 'both') {
        await uploadToGoogleDrive(blob, filename, config.googleAccessToken, config.uploadPath);
      }
      
      updateState({ cloudSyncStatus: 'synced', isUploading: false });
      console.log('☁️ Cloud sync completed');
    } catch (err) {
      console.error('Cloud sync error:', err);
      updateState({ cloudSyncStatus: 'error', isUploading: false, error: (err as Error).message });
      throw err;
    }
  }, [state.recordedBlob, updateState]);

  // Get current media stream
  const getMediaStream = useCallback((): MediaStream | null => {
    return combinedStreamRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (rtmpSocketRef.current) {
        rtmpSocketRef.current.close();
      }
      combinedStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveLocal,
    startYouTubeStream,
    stopYouTubeStream,
    syncToCloud,
    getMediaStream,
  };
}

// Helper: Upload to HiDrive
async function uploadToHiDrive(
  blob: Blob,
  filename: string,
  accessToken?: string,
  uploadPath?: string
): Promise<void> {
  if (!accessToken) {
    throw new Error('HiDrive access token required');
  }
  
  const path = uploadPath || '/broadcast-recordings';
  const formData = new FormData();
  formData.append('file', blob, filename);
  
  const response = await fetch(`https://webdav.hidrive.strato.com${path}/${filename}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: blob,
  });
  
  if (!response.ok) {
    throw new Error(`HiDrive upload failed: ${response.statusText}`);
  }
  
  console.log('📁 Uploaded to HiDrive:', path + '/' + filename);
}

// Helper: Upload to Google Drive
async function uploadToGoogleDrive(
  blob: Blob,
  filename: string,
  accessToken?: string,
  folderId?: string
): Promise<void> {
  if (!accessToken) {
    throw new Error('Google Drive access token required');
  }
  
  // Create file metadata
  const metadata = {
    name: filename,
    mimeType: blob.type,
    parents: folderId ? [folderId] : undefined,
  };
  
  // Use multipart upload
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);
  
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: form,
    }
  );
  
  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log('📁 Uploaded to Google Drive:', result.id);
}

export default useHybridRecorder;
