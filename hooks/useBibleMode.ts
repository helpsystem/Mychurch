/**
 * Bible Mode Management Hook
 * 
 * Manages switching between Simple Mode and Flipbook Mode
 * while preserving reading state and position
 */

import { useState, useEffect, useCallback } from 'react';

export type BibleMode = 'simple' | 'flipbook';
export type Language = 'en' | 'fa';
export type DisplayMode = 'normal' | 'presentation';

interface BibleState {
  book: string;
  chapter: number;
  verse?: number;
  mode: BibleMode;
  language: Language;
  displayMode: DisplayMode;
}

interface UseBibleModeReturn {
  // Current state
  mode: BibleMode;
  language: Language;
  displayMode: DisplayMode;
  currentBook: string;
  currentChapter: number;
  currentVerse?: number;
  
  // Actions
  setMode: (mode: BibleMode) => void;
  setLanguage: (lang: Language) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  goToReference: (book: string, chapter: number, verse?: number) => void;
  nextChapter: () => void;
  previousChapter: () => void;
  
  // State management
  saveState: () => void;
  loadState: () => BibleState | null;
  resetState: () => void;
}

const DEFAULT_STATE: BibleState = {
  book: 'GEN',
  chapter: 1,
  verse: 1,
  mode: 'simple',
  language: 'fa',
  displayMode: 'normal'
};

const STORAGE_KEY = 'bible-reader-state';

export function useBibleMode(): UseBibleModeReturn {
  const [state, setState] = useState<BibleState>(() => {
    // Load from localStorage on init
    if (typeof window === 'undefined') return DEFAULT_STATE;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BibleState;
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load Bible state:', error);
    }
    
    return DEFAULT_STATE;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save Bible state:', error);
    }
  }, [state]);

  const setMode = useCallback((mode: BibleMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const setDisplayMode = useCallback((displayMode: DisplayMode) => {
    setState(prev => ({ ...prev, displayMode }));
  }, []);

  const goToReference = useCallback((book: string, chapter: number, verse?: number) => {
    setState(prev => ({
      ...prev,
      book: book.toUpperCase(),
      chapter,
      verse
    }));
  }, []);

  const nextChapter = useCallback(() => {
    setState(prev => ({
      ...prev,
      chapter: prev.chapter + 1,
      verse: 1
    }));
  }, []);

  const previousChapter = useCallback(() => {
    setState(prev => ({
      ...prev,
      chapter: Math.max(1, prev.chapter - 1),
      verse: 1
    }));
  }, []);

  const saveState = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [state]);

  const loadState = useCallback((): BibleState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as BibleState;
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
    return null;
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset state:', error);
    }
  }, []);

  return {
    // Current state
    mode: state.mode,
    language: state.language,
    displayMode: state.displayMode,
    currentBook: state.book,
    currentChapter: state.chapter,
    currentVerse: state.verse,
    
    // Actions
    setMode,
    setLanguage,
    setDisplayMode,
    goToReference,
    nextChapter,
    previousChapter,
    
    // State management
    saveState,
    loadState,
    resetState
  };
}

export default useBibleMode;
