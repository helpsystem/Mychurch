/**
 * 🎙️ Audio Streamer Hook
 * Captures microphone audio and streams it to the WebSocket server for AI transcription.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioStreamerOptions {
    isConnected: boolean;
    onTranscript?: (text: string) => void;
    chunkIntervalMs?: number; // Duration of each audio chunk
}

export const useAudioStreamer = (
    stream: MediaStream | null,
    options: AudioStreamerOptions
) => {
    const { isConnected, onTranscript, chunkIntervalMs = 3000 } = options;

    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // We need to access the active socket from the app, 
    // but usually it's passed down or accessible via context.
    // For now, we assume the parent component handles the actual socket connection
    // and we just need a way to send data. 
    // actually, this hook is likely used INSIDE a component that has access to the socket.
    // Let's change the design: The hook should return a `sendAudioChunk` function 
    // OR the component passes the `sendMessage` function to the hook.

    // Alternative: The hook manages the MediaRecorder and exposes data blobs,
    // prompting the parent to send them.

    // Let's go with: Parent passes `sendMessage` callback.
}

// Re-writing the hook to be simpler and purely about capture
import { useAuth } from '../../../hooks/useAuth';

export const useAudioCapture = (
    stream: MediaStream | null,
    onAudioData: (blob: Blob) => void,
    intervalMs: number = 3000
) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startCapture = useCallback(() => {
        if (!stream) {
            console.warn('No stream provided to useAudioCapture');
            return;
        }

        try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    onAudioData(event.data);
                }
            };

            recorder.start(intervalMs);
            mediaRecorderRef.current = recorder;
            setIsCapturing(true);
            console.log('🎙️ Audio capture started');
        } catch (err) {
            console.error('Failed to start audio capture:', err);
        }
    }, [stream, intervalMs, onAudioData]);

    const stopCapture = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsCapturing(false);
        console.log('🎙️ Audio capture stopped');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return { isCapturing, startCapture, stopCapture };
};
