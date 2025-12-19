// hooks/useAudioTextSync.ts
// Advanced Audio-Text Synchronization Hook
// Supports word-level highlighting with millisecond precision

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  index: number;
}

export interface VerseTiming {
  verse: number;
  words: WordTiming[];
  totalDuration: number;
}

export interface TranscriptData {
  verses: VerseTiming[];
  language: 'en' | 'fa';
  metadata?: {
    book: string;
    chapter: number;
    totalVerses: number;
  };
}

export type SyncMode = 'word' | 'verse' | 'phrase';

export interface UseAudioTextSyncOptions {
  audioUrl: string;
  transcript: TranscriptData;
  mode?: SyncMode;
  onWordChange?: (word: WordTiming | null) => void;
  onVerseChange?: (verseNumber: number) => void;
  autoPlay?: boolean;
  seekToWord?: number; // Seek to specific word index
}

export interface AudioTextSyncState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Progress tracking
  currentTime: number;
  duration: number;
  progress: number; // 0-100
  
  // Word/Verse tracking
  currentWordIndex: number;
  currentWord: WordTiming | null;
  currentVerseNumber: number;
  
  // Controls
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekToWord: (wordIndex: number) => void;
  seekToVerse: (verseNumber: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  
  // Mode control
  mode: SyncMode;
  setMode: (mode: SyncMode) => void;
  
  // Audio element ref
  audioRef: RefObject<HTMLAudioElement>;
}

export const useAudioTextSync = (
  options: UseAudioTextSyncOptions
): AudioTextSyncState => {
  const {
    audioUrl,
    transcript,
    mode = 'word',
    onWordChange,
    onVerseChange,
    autoPlay = false,
    seekToWord: initialSeekToWord,
  } = options;

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentWord, setCurrentWord] = useState<WordTiming | null>(null);
  const [currentVerseNumber, setCurrentVerseNumber] = useState(1);
  
  const [syncMode, setSyncMode] = useState<SyncMode>(mode);
  
  // Animation frame ref for smooth updates
  const animationFrameRef = useRef<number>();
  
  // Flatten all words from all verses for easier lookup
  const allWords = useRef<WordTiming[]>([]);
  
  useEffect(() => {
    const words: WordTiming[] = [];
    let globalIndex = 0;
    
    transcript.verses.forEach(verse => {
      verse.words.forEach(word => {
        words.push({
          ...word,
          index: globalIndex++,
        });
      });
    });
    
    allWords.current = words;
  }, [transcript]);
  
  // Find current word based on time
  const findCurrentWord = useCallback((time: number): { word: WordTiming; index: number } | null => {
    const word = allWords.current.find(w => time >= w.start && time <= w.end);
    if (word) {
      return { word, index: word.index };
    }
    
    // If not exactly in range, find closest word
    let closestWord: WordTiming | null = null;
    let minDiff = Infinity;
    
    allWords.current.forEach(w => {
      const diff = Math.abs(w.start - time);
      if (diff < minDiff) {
        minDiff = diff;
        closestWord = w;
      }
    });
    
    return closestWord ? { word: closestWord, index: closestWord.index } : null;
  }, []);
  
  // Find current verse based on time
  const findCurrentVerse = useCallback((time: number): number => {
    for (const verse of transcript.verses) {
      if (verse.words.length > 0) {
        const firstWord = verse.words[0];
        const lastWord = verse.words[verse.words.length - 1];
        
        if (time >= firstWord.start && time <= lastWord.end) {
          return verse.verse;
        }
      }
    }
    return transcript.verses[0]?.verse || 1;
  }, [transcript]);
  
  // Update current word and verse
  const updateCurrentPosition = useCallback((time: number) => {
    setCurrentTime(time);
    
    if (duration > 0) {
      setProgress((time / duration) * 100);
    }
    
    const wordData = findCurrentWord(time);
    if (wordData) {
      if (wordData.index !== currentWordIndex) {
        setCurrentWordIndex(wordData.index);
        setCurrentWord(wordData.word);
        onWordChange?.(wordData.word);
      }
    }
    
    const verseNum = findCurrentVerse(time);
    if (verseNum !== currentVerseNumber) {
      setCurrentVerseNumber(verseNum);
      onVerseChange?.(verseNum);
    }
  }, [duration, findCurrentWord, findCurrentVerse, currentWordIndex, currentVerseNumber, onWordChange, onVerseChange]);
  
  // Animation loop for smooth updates
  const updateLoop = useCallback(() => {
    if (audioRef.current && isPlaying) {
      updateCurrentPosition(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    }
  }, [isPlaying, updateCurrentPosition]);
  
  // Start animation loop when playing
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateLoop]);
  
  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      if (autoPlay) {
        audio.play().catch(err => {
          console.error('Autoplay failed:', err);
          setError('Autoplay blocked by browser');
        });
      }
      
      if (initialSeekToWord !== undefined) {
        const word = allWords.current[initialSeekToWord];
        if (word) {
          audio.currentTime = word.start;
        }
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
      setProgress(0);
      setCurrentWordIndex(-1);
      setCurrentWord(null);
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      // Fallback for browsers that don't support requestAnimationFrame well
      if (!isPlaying) {
        updateCurrentPosition(audio.currentTime);
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [autoPlay, initialSeekToWord, isPlaying, updateCurrentPosition]);
  
  // Control functions
  const play = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setError(null);
      } catch (err) {
        console.error('Play failed:', err);
        setError('Failed to play audio');
      }
    }
  };
  
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentWordIndex(-1);
      setCurrentWord(null);
    }
  };
  
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };
  
  const seekToWordFn = (wordIndex: number) => {
    const word = allWords.current[wordIndex];
    if (word && audioRef.current) {
      audioRef.current.currentTime = word.start;
    }
  };
  
  const seekToVerseFn = (verseNumber: number) => {
    const verse = transcript.verses.find(v => v.verse === verseNumber);
    if (verse && verse.words.length > 0 && audioRef.current) {
      audioRef.current.currentTime = verse.words[0].start;
    }
  };
  
  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    }
  };
  
  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };
  
  const setMode = (newMode: SyncMode) => {
    setSyncMode(newMode);
  };
  
  return {
    isPlaying,
    isPaused,
    isLoading,
    error,
    
    currentTime,
    duration,
    progress,
    
    currentWordIndex,
    currentWord,
    currentVerseNumber,
    
    play,
    pause,
    stop,
    seek,
    seekToWord: seekToWordFn,
    seekToVerse: seekToVerseFn,
    setPlaybackRate,
    setVolume,
    
    mode: syncMode,
    setMode,
    
    audioRef,
  };
};
