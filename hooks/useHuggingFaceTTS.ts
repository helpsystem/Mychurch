/**
 * useHuggingFaceTTS Hook
 * React hook for using Hugging Face Persian TTS
 * Uses Kamtera's best Persian TTS models (female/male)
 */

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export interface TTSOptions {
  voice?: 'female' | 'male';
  apiToken?: string;
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  cached?: boolean;
  voice?: string;
  model?: string;
  error?: string;
  errorCode?: string;
  details?: string;
}

export interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentAudio: string | null;
}

export function useHuggingFaceTTS() {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    currentAudio: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Synthesize and play Persian text
   */
  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validate text
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (text.length > 1000) {
        throw new Error('Text is too long (maximum 1000 characters)');
      }

      // Call backend API
      const response = await axios.post<TTSResult>('/api/tts/huggingface/synthesize', {
        text: text.trim(),
        voice: options.voice || 'female',
        apiToken: options.apiToken
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'TTS synthesis failed');
      }

      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create and play new audio
      const audio = new Audio(response.data.audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      };

      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
        audioRef.current = null;
      };

      audio.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isLoading: false,
          error: 'Failed to play audio',
          currentAudio: null
        }));
        audioRef.current = null;
      };

      // Play audio
      await audio.play();

      setState(prev => ({ 
        ...prev, 
        currentAudio: response.data.audioUrl!,
        error: null
      }));

      return response.data;

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const errorDetails = error.response?.data?.details;
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: errorDetails || errorMessage
      }));

      console.error('❌ TTS Error:', errorMessage);
      throw error;
    }
  }, []);

  /**
   * Synthesize without playing (just get audio URL)
   */
  const synthesize = useCallback(async (text: string, options: TTSOptions = {}): Promise<TTSResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await axios.post<TTSResult>('/api/tts/huggingface/synthesize', {
        text: text.trim(),
        voice: options.voice || 'female',
        apiToken: options.apiToken
      });

      setState(prev => ({ ...prev, isLoading: false }));

      return response.data;

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage
      }));

      throw error;
    }
  }, []);

  /**
   * Stop current audio playback
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
  }, []);

  /**
   * Pause current audio playback
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  /**
   * Resume paused audio playback
   */
  const resume = useCallback(async () => {
    if (audioRef.current && audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }, []);

  /**
   * Get available TTS models
   */
  const getModels = useCallback(async () => {
    try {
      const response = await axios.get('/api/tts/huggingface/models');
      return response.data;
    } catch (error) {
      console.error('Failed to get models:', error);
      return { success: false, models: [], error: 'Failed to fetch models' };
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/tts/huggingface/cache/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { success: false, error: 'Failed to fetch cache stats' };
    }
  }, []);

  /**
   * Clean old cache files
   */
  const cleanCache = useCallback(async (daysOld: number = 7) => {
    try {
      const response = await axios.post('/api/tts/huggingface/cache/clean', { daysOld });
      return response.data;
    } catch (error) {
      console.error('Failed to clean cache:', error);
      return { success: false, error: 'Failed to clean cache' };
    }
  }, []);

  return {
    // State
    ...state,
    
    // Methods
    speak,
    synthesize,
    stop,
    pause,
    resume,
    getModels,
    getCacheStats,
    cleanCache
  };
}

export default useHuggingFaceTTS;
