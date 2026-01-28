/**
 * 🎥 Hybrid Video Recorder Hook
 * ضبط ویدیوی مراسم با آپلود همزمان به Cloud و دیسک محلی
 * 
 * Features:
 * - Path A: Save to local disk (File System Access API - Chromium only)
 * - Path B: Upload chunks to cloud (S3/Google Cloud)
 * - Auto-slice every 1 second for reliability
 * - Real-time progress tracking
 */

import { useState, useRef, useCallback } from 'react';

interface RecorderState {
  isRecording: boolean;
  recordingTime: number; // seconds
  error: string | null;
  uploadProgress: number; // 0-100
}

interface HybridRecorderOptions {
  enableCloudUpload?: boolean;
  enableLocalSave?: boolean;
  chunkIntervalMs?: number;
}

export const useHybridRecorder = (
  stream: MediaStream | null,
  options: HybridRecorderOptions = {}
) => {
  const {
    enableCloudUpload = true,
    enableLocalSave = true,
    chunkIntervalMs = 1000
  } = options;

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    recordingTime: 0,
    error: null,
    uploadProgress: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileWritableRef = useRef<any>(null); // FileSystemWritableFileStream
  const timerRef = useRef<number | null>(null);
  const chunksUploadedRef = useRef<number>(0);
  const totalChunksRef = useRef<number>(0);

  /**
   * آپلود chunk به cloud
   * در صورت عدم وجود backend، فقط شبیه‌سازی می‌کند
   */
  const uploadChunkToCloud = async (blob: Blob, index: number): Promise<void> => {
    if (!enableCloudUpload) return;

    try {
      // درخواست signed URL از backend
      const initResponse = await fetch('/api/broadcast/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkIndex: index,
          contentType: blob.type,
          size: blob.size
        })
      });

      if (!initResponse.ok) {
        console.warn('Cloud upload not available, skipping...');
        return;
      }

      const { uploadUrl } = await initResponse.json();

      // آپلود مستقیم به S3/GCP
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type
        }
      });

      chunksUploadedRef.current++;
      setState(prev => ({
        ...prev,
        uploadProgress: Math.round((chunksUploadedRef.current / totalChunksRef.current) * 100)
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
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      let chunkIndex = 0;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          totalChunksRef.current++;

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

      setState(prev => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        error: null,
        uploadProgress: 0
      }));

      console.log('[Recorder] ✅ Recording started');
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      console.error('[Recorder] Start failed:', err);
    }
  }, [stream, enableLocalSave, enableCloudUpload, chunkIntervalMs]);

  /**
   * توقف ضبط
   */
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && state.isRecording) {
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

      setState(prev => ({ ...prev, isRecording: false }));

      // Notify backend that recording is complete
      if (enableCloudUpload && totalChunksRef.current > 0) {
        try {
          await fetch('/api/broadcast/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              totalChunks: totalChunksRef.current,
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.warn('[Cloud] Complete notification failed:', error);
        }
      }

      chunksUploadedRef.current = 0;
      totalChunksRef.current = 0;

      console.log('[Recorder] ✅ Recording stopped');
    }
  }, [state.isRecording, enableCloudUpload]);

  return {
    isRecording: state.isRecording,
    recordingTime: state.recordingTime,
    uploadProgress: state.uploadProgress,
    error: state.error,
    startRecording,
    stopRecording
  };
};
