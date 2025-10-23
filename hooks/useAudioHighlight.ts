/**
 * Custom Hook for Audio Word-Level Highlighting
 * Synchronizes audio playback with text highlighting
 */

import { useEffect, useState, useRef, useCallback, RefObject } from 'react';

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  index: number;
}

export interface AudioHighlightOptions {
  audioRef: RefObject<HTMLAudioElement>;
  text: string;
  duration: number;
  playbackRate?: number;
  splitPattern?: RegExp;
}

export function useAudioHighlight({
  audioRef,
  text,
  duration,
  playbackRate = 1.0,
  splitPattern = /[\s،؛.!؟]+/
}: AudioHighlightOptions) {
  const [tokens, setTokens] = useState<string[]>([]);
  const [timings, setTimings] = useState<WordTiming[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number>();

  // Tokenize text
  useEffect(() => {
    if (!text) {
      setTokens([]);
      setTimings([]);
      return;
    }

    const words = text.split(splitPattern).filter(Boolean);
    setTokens(words);

    // Calculate estimated timings
    if (duration > 0 && words.length > 0) {
      const timePerWord = duration / words.length;
      const wordTimings: WordTiming[] = words.map((word, index) => ({
        word,
        startTime: index * timePerWord,
        endTime: (index + 1) * timePerWord,
        index
      }));
      setTimings(wordTimings);
    }
  }, [text, duration, splitPattern]);

  // Update current word based on playback position
  const updateHighlight = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || timings.length === 0) return;

    const currentTime = audio.currentTime;
    
    // Find current word
    const index = timings.findIndex(
      t => currentTime >= t.startTime && currentTime < t.endTime
    );

    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }

    // Continue animation loop if playing
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [audioRef, timings, currentIndex]);

  // Handle play/pause events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      audio.playbackRate = playbackRate;
      rafRef.current = requestAnimationFrame(updateHighlight);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentIndex(-1);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    const handleSeeked = () => {
      updateHighlight();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeked', handleSeeked);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [audioRef, playbackRate, updateHighlight]);

  // Update playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [audioRef, playbackRate]);

  // Seek to specific word
  const seekToWord = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || !timings[index]) return;

    audio.currentTime = timings[index].startTime;
    setCurrentIndex(index);
  }, [audioRef, timings]);

  return {
    tokens,
    timings,
    currentIndex,
    isPlaying,
    seekToWord
  };
}
