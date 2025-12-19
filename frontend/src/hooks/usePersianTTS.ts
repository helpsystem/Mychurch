/**
 * usePersianTTS Hook
 * 
 * استفاده از سرویس TTS فارسی با کیفیت بالا
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export interface TTSOptions {
  voice?: 'male' | 'female';
  format?: 'mp3' | 'wav';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export function usePersianTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * بررسی دسترسی به سرویس TTS
   */
  const checkService = useCallback(async () => {
    try {
      const response = await axios.get('/api/tts/persian-coqui', {
        timeout: 3000
      });
      setServiceAvailable(true);
      return true;
    } catch (error) {
      setServiceAvailable(false);
      return false;
    }
  }, []);

  /**
   * پخش متن با صدای فارسی
   */
  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    const {
      voice = 'male',
      format = 'mp3',
      onStart,
      onEnd,
      onError
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      // توقف صدای قبلی
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      console.log(`🎤 Requesting TTS for: ${text.substring(0, 50)}...`);

      // درخواست تولید صدا
      const response = await axios.post(
        '/api/tts/persian-coqui',
        { text, voice, format },
        {
          responseType: 'blob',
          timeout: 30000
        }
      );

      // ایجاد URL برای پخش
      const audioBlob = new Blob([response.data], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(audioBlob);

      // ایجاد Audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Event handlers
      audio.onplay = () => {
        console.log('✅ TTS playback started');
        setIsPlaying(true);
        onStart?.();
      };

      audio.onended = () => {
        console.log('✅ TTS playback ended');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = (err) => {
        console.error('❌ TTS playback error:', err);
        setIsPlaying(false);
        setError('خطا در پخش صدا');
        URL.revokeObjectURL(audioUrl);
        onError?.(new Error('Playback error'));
      };

      // شروع پخش
      await audio.play();

      setIsLoading(false);

      return {
        success: true,
        audio
      };

    } catch (err: any) {
      console.error('❌ TTS error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'خطا در تولید صدا';
      setError(errorMessage);
      setIsLoading(false);
      
      onError?.(err);

      // Fallback به Web Speech API
      if (err.response?.data?.fallbackToClient) {
        console.log('⚠️ Falling back to Web Speech API');
        return {
          success: false,
          fallback: true,
          error: errorMessage
        };
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * توقف پخش
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  /**
   * Pause/Resume
   */
  const togglePause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  return {
    speak,
    stop,
    togglePause,
    checkService,
    isLoading,
    isPlaying,
    error,
    serviceAvailable
  };
}
