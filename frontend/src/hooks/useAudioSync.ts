/**
 * useAudioSync Hook
 * 
 * React hook for managing audio playback with:
 * - Preloading next verses
 * - Caching audio data
 * - Automatic fallback
 * - Integration with Bible Flipbook
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioMetadata {
  text: string;
  language: string;
  voice: string;
  characterCount: number;
  hash: string;
  timestamp: string;
}

interface VerseAudio {
  verseNumber: number;
  audio: {
    fa: string | null; // Web path to audio file
    en: string | null;
  };
  metadata: {
    fa: AudioMetadata | null;
    en: AudioMetadata | null;
  };
  version: string;
  hash: string;
  loaded?: boolean;
}

interface AudioIndex {
  bible: Record<string, VerseAudio>;
  songs: Record<string, any>;
  readings: Record<string, any>;
  lastUpdated: string;
}

interface UseAudioSyncOptions {
  preloadCount?: number; // Number of verses to preload ahead
  enableAutoPreload?: boolean;
  language?: 'fa' | 'en';
}

interface UseAudioSyncReturn {
  // State
  audioIndex: AudioIndex | null;
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  playVerse: (bookCode: string, chapter: number, verseNumber: number, language?: 'fa' | 'en') => Promise<void>;
  playSong: (songId: string, language?: 'fa' | 'en') => Promise<void>;
  pause: () => void;
  stop: () => void;
  preloadVerse: (bookCode: string, chapter: number, verseNumber: number) => Promise<void>;
  
  // Utilities
  getVerseAudio: (bookCode: string, chapter: number, verseNumber: number) => VerseAudio | null;
  refreshIndex: () => Promise<void>;
}

export function useAudioSync(options: UseAudioSyncOptions = {}): UseAudioSyncReturn {
  const {
    preloadCount = 3,
    enableAutoPreload = true,
    language: defaultLanguage = 'fa'
  } = options;

  // State
  const [audioIndex, setAudioIndex] = useState<AudioIndex | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const preloadQueue = useRef<Set<string>>(new Set());

  /**
   * Load audio index from server
   */
  const loadAudioIndex = useCallback(async () => {
    try {
      const response = await fetch('/audio_index.json');
      if (!response.ok) {
        throw new Error('Failed to load audio index');
      }
      const data = await response.json();
      setAudioIndex(data);
      return data;
    } catch (err) {
      console.error('Failed to load audio index:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audio index');
      return null;
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    loadAudioIndex();
  }, [loadAudioIndex]);

  /**
   * Get verse audio info from index
   */
  const getVerseAudio = useCallback((
    bookCode: string,
    chapter: number,
    verseNumber: number
  ): VerseAudio | null => {
    if (!audioIndex) return null;
    
    const key = `${bookCode}_${chapter}_${verseNumber}`;
    return audioIndex.bible[key] || null;
  }, [audioIndex]);

  /**
   * Create audio element from URL
   */
  const createAudioElement = useCallback((url: string): HTMLAudioElement => {
    const audio = new Audio(url);
    
    // Event listeners
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    });
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setError('Audio playback failed');
      setIsPlaying(false);
    });

    return audio;
  }, []);

  /**
   * Load audio file (with caching)
   */
  const loadAudio = useCallback(async (
    url: string,
    cacheKey: string
  ): Promise<HTMLAudioElement> => {
    // Check cache first
    if (audioCache.current.has(cacheKey)) {
      const cached = audioCache.current.get(cacheKey)!;
      return cached;
    }

    // Create new audio element
    const audio = createAudioElement(url);

    // Wait for audio to be ready
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', reject, { once: true });
      
      // Trigger loading
      audio.load();
    });

    // Cache it
    audioCache.current.set(cacheKey, audio);

    return audio;
  }, [createAudioElement]);

  /**
   * Preload verse audio
   */
  const preloadVerse = useCallback(async (
    bookCode: string,
    chapter: number,
    verseNumber: number
  ): Promise<void> => {
    const verseAudio = getVerseAudio(bookCode, chapter, verseNumber);
    if (!verseAudio) {
      console.warn(`No audio found for ${bookCode} ${chapter}:${verseNumber}`);
      return;
    }

    const cacheKeyFa = `${bookCode}_${chapter}_${verseNumber}_fa`;
    const cacheKeyEn = `${bookCode}_${chapter}_${verseNumber}_en`;

    // Skip if already preloading
    if (preloadQueue.current.has(cacheKeyFa)) return;

    preloadQueue.current.add(cacheKeyFa);
    preloadQueue.current.add(cacheKeyEn);

    try {
      // Preload both languages
      const promises: Promise<any>[] = [];

      if (verseAudio.audio.fa && !audioCache.current.has(cacheKeyFa)) {
        promises.push(loadAudio(verseAudio.audio.fa, cacheKeyFa));
      }

      if (verseAudio.audio.en && !audioCache.current.has(cacheKeyEn)) {
        promises.push(loadAudio(verseAudio.audio.en, cacheKeyEn));
      }

      await Promise.all(promises);
      
      console.log(`✅ Preloaded: ${bookCode} ${chapter}:${verseNumber}`);
    } catch (err) {
      console.error(`Failed to preload ${bookCode} ${chapter}:${verseNumber}:`, err);
    } finally {
      preloadQueue.current.delete(cacheKeyFa);
      preloadQueue.current.delete(cacheKeyEn);
    }
  }, [getVerseAudio, loadAudio]);

  /**
   * Preload next N verses
   */
  const preloadNextVerses = useCallback(async (
    bookCode: string,
    chapter: number,
    startVerse: number,
    count: number = preloadCount
  ): Promise<void> => {
    const promises: Promise<void>[] = [];

    for (let i = 1; i <= count; i++) {
      promises.push(preloadVerse(bookCode, chapter, startVerse + i));
    }

    await Promise.allSettled(promises);
  }, [preloadVerse, preloadCount]);

  /**
   * Play verse audio
   */
  const playVerse = useCallback(async (
    bookCode: string,
    chapter: number,
    verseNumber: number,
    language: 'fa' | 'en' = defaultLanguage
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop current audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Get verse audio info
      const verseAudio = getVerseAudio(bookCode, chapter, verseNumber);
      if (!verseAudio) {
        throw new Error(`No audio found for ${bookCode} ${chapter}:${verseNumber}`);
      }

      const audioUrl = verseAudio.audio[language];
      if (!audioUrl) {
        throw new Error(`No ${language} audio for ${bookCode} ${chapter}:${verseNumber}`);
      }

      // Load and play
      const cacheKey = `${bookCode}_${chapter}_${verseNumber}_${language}`;
      const audio = await loadAudio(audioUrl, cacheKey);

      setCurrentAudio(audio);
      await audio.play();

      // Auto-preload next verses
      if (enableAutoPreload) {
        preloadNextVerses(bookCode, chapter, verseNumber, preloadCount).catch(err => {
          console.warn('Preload failed:', err);
        });
      }

    } catch (err) {
      console.error('Play verse failed:', err);
      setError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentAudio,
    defaultLanguage,
    getVerseAudio,
    loadAudio,
    enableAutoPreload,
    preloadNextVerses,
    preloadCount
  ]);

  /**
   * Play song audio
   */
  const playSong = useCallback(async (
    songId: string,
    language: 'fa' | 'en' = defaultLanguage
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      if (!audioIndex || !audioIndex.songs[songId]) {
        throw new Error(`No audio found for song: ${songId}`);
      }

      const songAudio = audioIndex.songs[songId];
      const audioUrl = songAudio.audio[language];

      if (!audioUrl) {
        throw new Error(`No ${language} audio for song: ${songId}`);
      }

      const cacheKey = `song_${songId}_${language}`;
      const audio = await loadAudio(audioUrl, cacheKey);

      setCurrentAudio(audio);
      await audio.play();

    } catch (err) {
      console.error('Play song failed:', err);
      setError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setIsLoading(false);
    }
  }, [currentAudio, defaultLanguage, audioIndex, loadAudio]);

  /**
   * Pause current audio
   */
  const pause = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
    }
  }, [currentAudio]);

  /**
   * Stop current audio
   */
  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  }, [currentAudio]);

  /**
   * Refresh audio index
   */
  const refreshIndex = useCallback(async () => {
    await loadAudioIndex();
  }, [loadAudioIndex]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Pause current audio
      if (currentAudio) {
        currentAudio.pause();
      }

      // Clear cache
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, [currentAudio]);

  return {
    // State
    audioIndex,
    currentAudio,
    isPlaying,
    isLoading,
    error,

    // Actions
    playVerse,
    playSong,
    pause,
    stop,
    preloadVerse,

    // Utilities
    getVerseAudio,
    refreshIndex
  };
}

export default useAudioSync;
