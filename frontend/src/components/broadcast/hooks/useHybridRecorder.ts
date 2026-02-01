/**
 * 🎥 Hybrid Video Recorder Hook
 * ضبط ویدیوی مراسم با آپلود همزمان به HiDrive و دیسک محلی
 * 
 * Features:
 * - Path A: Save to local disk (File System Access API - Chromium only)
 * - Path B: Upload chunks to HiDrive cloud storage
 * - Auto-slice every 5 seconds for reliability
 * - Real-time progress tracking
 */

import { useState, useRef, useCallback } from 'react';

interface RecorderState {
  isRecording: boolean;
  recordingTime: number; // seconds
  error: string | null;
  uploadProgress: number; // 0-100
  savedUrl: string | null; // URL of saved recording
}

interface HybridRecorderOptions {
  enableCloudUpload?: boolean;
  enableLocalSave?: boolean;
  chunkIntervalMs?: number;
  title?: string;
}

export const useHybridRecorder = (
  stream: MediaStream | null,
  options: HybridRecorderOptions = {}
) => {
  const {
    enableCloudUpload = true,
    enableLocalSave = true,
    chunkIntervalMs = 5000, // 5 seconds per chunk
    title = 'church-service'
  } = options;

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    recordingTime: 0,
    error: null,
    uploadProgress: 0,
    savedUrl: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileWritableRef = useRef<any>(null); // FileSystemWritableFileStream
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const chunkCountRef = useRef<number>(0);

  /**
   * آپلود chunk به HiDrive از طریق backend
   */
  const uploadChunkToCloud = async (blob: Blob, index: number): Promise<void> => {
    if (!enableCloudUpload) return;

    try {
      const formData = new FormData();
      formData.append('chunk', blob, `chunk-${index}.webm`);
      
      const sessionId = sessionIdRef.current || `session-${Date.now()}`;
      sessionIdRef.current = sessionId;

      const response = await fetch(`/api/broadcast/upload/chunk?sessionId=${sessionId}&index=${index}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.warn('Cloud upload not available, skipping...');
        return;
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        uploadProgress: Math.round((result.totalChunks / (result.totalChunks + 1)) * 100)
      }));

      console.log(`[Cloud] ✅ Chunk #${index} uploaded (${blob.size} bytes)`);
    } catch (error) {
      console.error(`[Cloud] ❌ Chunk #${index} upload failed:`, error);
    }
  };

  /**
   * شروع ضبط
   */
  const startRecording = useCallback(async () => {
    if (!stream) {
      setState(prev => ({ ...prev, error: 'دسترسی به دوربین/میکروفون وجود ندارد' }));
      return;
    }

    try {
      let fileHandle = null;
      let writable = null;

      // Reset state
      chunksRef.current = [];
      sessionIdRef.current = `session-${Date.now()}`;

      // Path A: Save to local disk (Chromium only)
      if (enableLocalSave) {
        try {
          // @ts-ignore - File System Access API
          if (window.showSaveFilePicker) {
            const fileName = `church-service-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
            // @ts-ignore
            fileHandle = await window.showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'WebM Video',
                accept: { 'video/webm': ['.webm'] }
              }]
            });
            writable = await fileHandle.createWritable();
            fileWritableRef.current = writable;
            console.log('[Disk] ✅ Local save file selected');
          }
        } catch (err) {
          console.warn('[Disk] User cancelled or not supported:', err);
        }
      }

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      let chunkIndex = 0;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Store chunk locally
          chunksRef.current.push(event.data);

          // Path A: Write to local disk
          if (fileWritableRef.current) {
            try {
              await fileWritableRef.current.write(event.data);
            } catch (e) {
              console.error('[Disk] Write error:', e);
            }
          }

          // Path B: Upload to cloud
          uploadChunkToCloud(event.data, chunkIndex++);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Recorder] Error:', event);
        setState(prev => ({ ...prev, error: 'خطا در ضبط ویدیو' }));
      };

      // Start recording with chunk intervals
      mediaRecorder.start(chunkIntervalMs);
      mediaRecorderRef.current = mediaRecorder;

      // Timer
      timerRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);

      setState({
        isRecording: true,
        recordingTime: 0,
        error: null,
        uploadProgress: 0,
        savedUrl: null
      });

      console.log('[Recorder] ✅ Recording started');
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      console.error('[Recorder] Start failed:', err);
    }
  }, [stream, enableLocalSave, enableCloudUpload, chunkIntervalMs]);

  /**
   * توقف ضبط و ذخیره به HiDrive
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    mediaRecorderRef.current.stop();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Close local file
    if (fileWritableRef.current) {
      try {
        await fileWritableRef.current.close();
        console.log('[Disk] ✅ Local file saved');
      } catch (e) {
        console.error('[Disk] Close error:', e);
      }
      fileWritableRef.current = null;
    }

    // Complete cloud upload
    if (enableCloudUpload && sessionIdRef.current && chunkCountRef.current > 0) {
      try {
        setState(prev => ({ ...prev, uploadProgress: 95 }));
        
        const response = await fetch('/api/broadcast/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            totalChunks: chunkCountRef.current,
            timestamp: new Date().toISOString(),
            title: title
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[Cloud] ✅ Recording saved to HiDrive:', result.url);
          
          setState(prev => ({
            ...prev,
            isRecording: false,
            uploadProgress: 100,
            savedUrl: result.url || null
          }));
        } else {
          console.warn('[Cloud] Complete failed:', await response.text());
          setState(prev => ({ ...prev, isRecording: false }));
        }
      } catch (error) {
        console.warn('[Cloud] Complete notification failed:', error);
        setState(prev => ({ ...prev, isRecording: false }));
      }
    } else {
      setState(prev => ({ ...prev, isRecording: false }));
    }

    // Reset refs
    chunksRef.current = [];
    chunkCountRef.current = 0;
    sessionIdRef.current = null;
    mediaRecorderRef.current = null;

    console.log('[Recorder] ✅ Recording stopped');
  }, [state.isRecording, enableCloudUpload, title]);

  return {
    isRecording: state.isRecording,
    recordingTime: state.recordingTime,
    uploadProgress: state.uploadProgress,
    savedUrl: state.savedUrl,
    error: state.error,
    startRecording,
    stopRecording
  };
};
