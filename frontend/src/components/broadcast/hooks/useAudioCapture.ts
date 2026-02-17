
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioCaptureReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    error: string | null;
    audioLevel: number; // 0-100 for visualization
}

export const useAudioCapture = (
    deviceId: string,
    onAudioChunk: (blob: Blob) => void
): UseAudioCaptureReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const requestFrameRef = useRef<number | null>(null);

    // Start Recording
    const startRecording = useCallback(async () => {
        try {
            setError(null);

            const constraints = {
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    channelCount: 1,
                    sampleRate: 16000, // Optimize for speech
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            // Initialize MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    onAudioChunk(event.data);
                }
            };

            // Send chunks every 3 seconds
            mediaRecorder.start(3000);
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);

            // Audio Visualization
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setAudioLevel(average); // 0-255 roughly

                if (mediaRecorder.state === 'recording') {
                    requestFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError((err as Error).message);
        }
    }, [deviceId, onAudioChunk]);

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (requestFrameRef.current) {
            cancelAnimationFrame(requestFrameRef.current);
        }

        setIsRecording(false);
        setAudioLevel(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        startRecording,
        stopRecording,
        error,
        audioLevel
    };
};
