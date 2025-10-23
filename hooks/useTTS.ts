/**
 * Enhanced Bible TTS Hook
 * 
 * Integrates with Google Cloud TTS for word-level highlighting
 * Supports both Persian (fa-IR-Wavenet-D) and English (en-US-Neural2-F)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Language } from './useBibleMode';

interface WordTiming {
  word: string;
  startTime: number; // milliseconds
  endTime: number;
  duration: number;
  index: number;
}

interface VerseTTSData {
  verseNumber: number;
  text: {
    en: string;
    fa: string;
  };
  audio: {
    en?: string; // URL or base64
    fa?: string;
  };
  timings: {
    en?: WordTiming[];
    fa?: WordTiming[];
  };
}

interface UseTTSOptions {
  autoPreload?: boolean;
  preloadCount?: number; // Number of verses to preload ahead
  cacheAudio?: boolean;
}

interface UseTTSReturn {
  // State
  isPlaying: boolean;
  isLoading: boolean;
  currentVerse: number | null;
  currentWordIndex: number;
  currentLanguage: Language | null;
  error: string | null;
  audioProgress: number; // 0-100
  
  // Actions
  playVerse: (verseNumber: number, language: Language, verseData: VerseTTSData) => Promise<void>;
  playChapter: (verses: VerseTTSData[], language: Language) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seek: (seconds: number) => void;
  
  // Helpers
  preloadVerses: (verses: VerseTTSData[], language: Language) => Promise<void>;
  getCurrentWord: () => string | null;
  getTimings: (verseNumber: number, language: Language) => WordTiming[] | null;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    autoPreload = true,
    preloadCount = 3,
    cacheAudio = true
  } = options;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [volume, setVolumeState] = useState(1.0);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTimingsRef = useRef<WordTiming[]>([]);
  const animationFrameRef = useRef<number>();
  const versesQueueRef = useRef<{ verse: VerseTTSData; language: Language }[]>([]);
  const audioCache = useRef<Map<string, string>>(new Map());

  /**
   * Update word highlight based on current playback time
   */
  const updateWordHighlight = useCallback(() => {
    if (!audioRef.current || !currentTimingsRef.current.length) return;

    const currentTime = audioRef.current.currentTime * 1000; // Convert to milliseconds
    const timings = currentTimingsRef.current;

    // Find current word based on timing
    const wordIndex = timings.findIndex((timing, index) => {
      const nextTiming = timings[index + 1];
      return currentTime >= timing.startTime && 
             (!nextTiming || currentTime < nextTiming.startTime);
    });

    if (wordIndex !== -1 && wordIndex !== currentWordIndex) {
      setCurrentWordIndex(wordIndex);
    }

    // Update progress
    if (audioRef.current.duration) {
      setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }

    // Continue animation loop
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateWordHighlight);
    }
  }, [currentWordIndex, isPlaying]);

  /**
   * Generate audio URL from TTS API or cache
   */
  const getAudioURL = useCallback(async (
    text: string,
    language: Language,
    verseNumber: number
  ): Promise<{ url: string; timings: WordTiming[] }> => {
    const cacheKey = `${language}-${verseNumber}`;

    // Check cache
    if (cacheAudio && audioCache.current.has(cacheKey)) {
      const cached = audioCache.current.get(cacheKey)!;
      // TODO: Return cached timings as well
      return { url: cached, timings: [] };
    }

    // Call TTS API
    try {
      const response = await fetch('/api/tts/synthesize-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          verseNumber
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Create audio URL from base64 or URL
      const audioURL = data.audioContent.startsWith('data:') || data.audioContent.startsWith('http')
        ? data.audioContent
        : `data:audio/mp3;base64,${data.audioContent}`;

      // Extract word timings
      const timings: WordTiming[] = data.wordTimings || [];

      // Cache the URL
      if (cacheAudio) {
        audioCache.current.set(cacheKey, audioURL);
      }

      return { url: audioURL, timings };
    } catch (err) {
      console.error('TTS generation failed:', err);
      throw err;
    }
  }, [cacheAudio]);

  /**
   * Play single verse with highlighting
   */
  const playVerse = useCallback(async (
    verseNumber: number,
    language: Language,
    verseData: VerseTTSData
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Get audio URL and timings
      const text = verseData.text[language];
      const { url, timings } = verseData.audio[language] && verseData.timings[language]
        ? { url: verseData.audio[language]!, timings: verseData.timings[language]! }
        : await getAudioURL(text, language, verseNumber);

      // Create audio element
      const audio = new Audio(url);
      audio.volume = volume;
      audioRef.current = audio;
      currentTimingsRef.current = timings;

      // Set up event listeners
      audio.onplay = () => {
        setIsPlaying(true);
        setCurrentVerse(verseNumber);
        setCurrentLanguage(language);
        setCurrentWordIndex(-1);
        
        // Start animation loop for word highlighting
        animationFrameRef.current = requestAnimationFrame(updateWordHighlight);
      };

      audio.onpause = () => {
        setIsPlaying(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        
        // Auto-play next verse if in queue
        if (versesQueueRef.current.length > 0) {
          const next = versesQueueRef.current.shift();
          if (next) {
            setTimeout(() => playVerse(next.verse.verseNumber, next.language, next.verse), 500);
          }
        }
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Audio playback failed');
        setIsPlaying(false);
      };

      // Start playback
      await audio.play();
      setIsLoading(false);
    } catch (err) {
      console.error('Error playing verse:', err);
      setError(err instanceof Error ? err.message : 'Playback failed');
      setIsLoading(false);
    }
  }, [getAudioURL, updateWordHighlight, volume]);

  /**
   * Play entire chapter
   */
  const playChapter = useCallback(async (
    verses: VerseTTSData[],
    language: Language
  ) => {
    if (verses.length === 0) return;

    // Queue all verses except first
    versesQueueRef.current = verses.slice(1).map(v => ({ verse: v, language }));

    // Play first verse
    await playVerse(verses[0].verseNumber, language, verses[0]);

    // Preload next verses if enabled
    if (autoPreload) {
      const toPreload = verses.slice(1, Math.min(verses.length, preloadCount + 1));
      preloadVerses(toPreload, language).catch(console.error);
    }
  }, [playVerse, autoPreload, preloadCount]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  /**
   * Stop playback completely
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentVerse(null);
    setCurrentWordIndex(-1);
    setAudioProgress(0);
    versesQueueRef.current = [];
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  /**
   * Set volume (0.0 - 1.0)
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  /**
   * Seek to specific time in seconds
   */
  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  }, []);

  /**
   * Preload audio for multiple verses
   */
  const preloadVerses = useCallback(async (
    verses: VerseTTSData[],
    language: Language
  ) => {
    const promises = verses.map(verse => 
      getAudioURL(verse.text[language], language, verse.verseNumber)
        .catch(err => {
          console.warn(`Failed to preload verse ${verse.verseNumber}:`, err);
          return null;
        })
    );

    await Promise.allSettled(promises);
  }, [getAudioURL]);

  /**
   * Get current highlighted word
   */
  const getCurrentWord = useCallback((): string | null => {
    if (currentWordIndex === -1 || !currentTimingsRef.current.length) {
      return null;
    }
    
    const timing = currentTimingsRef.current[currentWordIndex];
    return timing ? timing.word : null;
  }, [currentWordIndex]);

  /**
   * Get timings for a specific verse
   */
  const getTimings = useCallback((
    verseNumber: number,
    language: Language
  ): WordTiming[] | null => {
    // This would need to fetch from cache or API
    // For now, return current timings if they match
    if (verseNumber === currentVerse && language === currentLanguage) {
      return currentTimingsRef.current;
    }
    return null;
  }, [currentVerse, currentLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      audioCache.current.clear();
    };
  }, [stop]);

  return {
    // State
    isPlaying,
    isLoading,
    currentVerse,
    currentWordIndex,
    currentLanguage,
    error,
    audioProgress,
    
    // Actions
    playVerse,
    playChapter,
    pause,
    resume,
    stop,
    togglePlayPause,
    setVolume,
    seek,
    
    // Helpers
    preloadVerses,
    getCurrentWord,
    getTimings
  };
}

export default useTTS;
