/**
 * Simplified Bible TTS Hook - Standalone Mode
 * 
 * Uses browser's built-in Web Speech API (no backend required)
 * Supports Persian and English text-to-speech
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Language } from './useBibleMode';

interface WordTiming {
  word: string;
  startTime: number;
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
    en?: string;
    fa?: string;
  };
  timings: {
    en?: WordTiming[];
    fa?: WordTiming[];
  };
}

interface UseTTSOptions {
  autoPreload?: boolean;
  preloadCount?: number;
  cacheAudio?: boolean;
}

interface UseTTSReturn {
  isPlaying: boolean;
  isLoading: boolean;
  currentVerse: number | null;
  currentWordIndex: number;
  currentLanguage: Language | null;
  error: string | null;
  audioProgress: number;
  
  playVerse: (verseNumber: number, language: Language, verseData: VerseTTSData) => Promise<void>;
  playChapter: (verses: VerseTTSData[], language: Language) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seek: (seconds: number) => void;
  
  preloadVerses: (verses: VerseTTSData[], language: Language) => Promise<void>;
  getCurrentWord: () => string | null;
  getTimings: (verseNumber: number, language: Language) => WordTiming[] | null;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const versesQueueRef = useRef<{ verse: VerseTTSData; language: Language }[]>([]);

  /**
   * Check if browser supports Web Speech API
   */
  const checkSpeechSupport = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-Speech not supported in this browser');
      return false;
    }
    return true;
  }, []);

  /**
   * Get appropriate voice for language
   */
  const getVoice = useCallback((language: Language): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    if (language === 'fa') {
      // Try to find Persian voice
      const persianVoice = voices.find(v => v.lang.startsWith('fa'));
      if (persianVoice) return persianVoice;
      
      // Fallback to any available voice
      return voices[0] || null;
    } else {
      // English voice
      const englishVoice = voices.find(v => v.lang.startsWith('en-US')) ||
                          voices.find(v => v.lang.startsWith('en'));
      return englishVoice || voices[0] || null;
    }
  }, []);

  /**
   * Play single verse using Web Speech API
   */
  const playVerse = useCallback(async (
    verseNumber: number,
    language: Language,
    verseData: VerseTTSData
  ) => {
    if (!checkSpeechSupport()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Stop any current speech
      window.speechSynthesis.cancel();

      const text = verseData.text[language];
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.volume = volume;
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      
      // Set voice
      const voice = getVoice(language);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentVerse(verseNumber);
        setCurrentLanguage(language);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setAudioProgress(100);
        
        // Auto-play next verse if in queue
        if (versesQueueRef.current.length > 0) {
          const next = versesQueueRef.current.shift();
          if (next) {
            setTimeout(() => playVerse(next.verse.verseNumber, next.language, next.verse), 500);
          }
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError('Speech playback failed');
        setIsPlaying(false);
        setIsLoading(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      // Boundary events for word highlighting (limited support)
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setCurrentWordIndex(prev => prev + 1);
          
          // Estimate progress
          const textLength = text.length;
          const charIndex = event.charIndex || 0;
          const progress = (charIndex / textLength) * 100;
          setAudioProgress(Math.min(progress, 95)); // Cap at 95% until end
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Error playing verse:', err);
      setError(err instanceof Error ? err.message : 'Playback failed');
      setIsLoading(false);
    }
  }, [checkSpeechSupport, getVoice, volume]);

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
  }, [playVerse]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  /**
   * Stop playback completely
   */
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentVerse(null);
    setCurrentWordIndex(-1);
    setAudioProgress(0);
    versesQueueRef.current = [];
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (isPaused) {
      resume();
    } else if (isPlaying) {
      pause();
    }
  }, [isPlaying, isPaused, pause, resume]);

  /**
   * Set volume (0.0 - 1.0)
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (utteranceRef.current) {
      utteranceRef.current.volume = clampedVolume;
    }
  }, []);

  /**
   * Seek not supported in Web Speech API
   */
  const seek = useCallback((seconds: number) => {
    console.warn('Seek not supported in Web Speech API');
  }, []);

  /**
   * Preload not needed for Web Speech API
   */
  const preloadVerses = useCallback(async (
    verses: VerseTTSData[],
    language: Language
  ) => {
    // Web Speech API doesn't require preloading
    return Promise.resolve();
  }, []);

  /**
   * Get current word (limited in Web Speech API)
   */
  const getCurrentWord = useCallback((): string | null => {
    return null; // Word-level timing not available in basic Web Speech API
  }, []);

  /**
   * Get timings (not available in Web Speech API)
   */
  const getTimings = useCallback((
    verseNumber: number,
    language: Language
  ): WordTiming[] | null => {
    return null;
  }, []);

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices (some browsers require this)
      window.speechSynthesis.getVoices();
      
      // Listen for voices changed event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    isLoading,
    currentVerse,
    currentWordIndex,
    currentLanguage,
    error,
    audioProgress,
    
    playVerse,
    playChapter,
    pause,
    resume,
    stop,
    togglePlayPause,
    setVolume,
    seek,
    
    preloadVerses,
    getCurrentWord,
    getTimings
  };
}

export default useTTS;
