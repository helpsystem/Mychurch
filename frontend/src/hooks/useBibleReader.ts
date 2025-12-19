import { useState, useEffect, useRef, useCallback } from 'react';
import { BibleVerse, BibleBook, TTSConfig, ReadingState } from '../types/bible';

export const useBibleReader = () => {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fa'>('en');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Bible books list
  useEffect(() => {
    fetch('/api/bible/books')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooks(data.books);
        }
      })
      .catch((err) => console.error('Failed to load Bible books:', err));
  }, []);

  // Load chapter verses
  const loadChapter = useCallback(
    async (bookCode: string, chapter: number, lang: 'en' | 'fa') => {
      try {
        const response = await fetch(
          `/api/bible/content/${bookCode}/${chapter}?translation=${
            lang === 'fa' ? 'qadim' : 'eng'
          }`
        );
        const data = await response.json();
        
        if (data.success && data.verses) {
          const versesArray: BibleVerse[] = [];
          const verseTexts = data.verses[lang] || [];
          
          verseTexts.forEach((text: string, index: number) => {
            versesArray.push({
              id: index + 1,
              testament: bookCode.charCodeAt(0) < 77 ? 'OT' : 'NT',
              book: bookCode,
              chapter,
              verse_number: index + 1,
              verse_text: text,
              language: lang
            });
          });
          
          setVerses(versesArray);
          setCurrentVerse(0);
          setHighlightedWordIndex(0);
        }
      } catch (error) {
        console.error('Failed to load chapter:', error);
      }
    },
    []
  );

  // Get available TTS voices
  const getVoice = useCallback((lang: 'en' | 'fa'): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    if (lang === 'fa') {
      // Try to find Persian voice
      return (
        voices.find((v) => v.lang.startsWith('fa')) ||
        voices.find((v) => v.lang.startsWith('ar')) ||
        voices[0]
      );
    } else {
      // Try to find English voice
      return (
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]
      );
    }
  }, []);

  // Speak single verse with word-by-word highlighting
  const speakVerse = useCallback(
    (verse: BibleVerse) => {
      if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(verse.verse_text);
      const voice = getVoice(verse.language);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = verse.language === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Word-by-word highlighting simulation
      const words = verse.verse_text.split(' ');
      let wordIndex = 0;
      const avgWordDuration = (utterance.text.length / words.length) * 100;

      const highlightWords = () => {
        if (wordIndex < words.length && isPlaying) {
          setHighlightedWordIndex(wordIndex);
          wordIndex++;
          timeoutRef.current = setTimeout(highlightWords, avgWordDuration);
        } else {
          setHighlightedWordIndex(0);
        }
      };

      utterance.onstart = () => {
        highlightWords();
      };

      utterance.onend = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setHighlightedWordIndex(0);
        
        // Move to next verse
        if (currentVerse < verses.length - 1) {
          setCurrentVerse((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [currentVerse, verses, isPlaying, getVoice]
  );

  // Play reading
  const play = useCallback(() => {
    if (verses.length === 0) return;

    setIsPlaying(true);
    setIsPaused(false);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      speakVerse(verses[currentVerse]);
    }
  }, [verses, currentVerse, speakVerse]);

  // Pause reading
  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    window.speechSynthesis.pause();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Stop reading
  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentVerse(0);
    setHighlightedWordIndex(0);
    window.speechSynthesis.cancel();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Auto-play next verse
  useEffect(() => {
    if (isPlaying && currentVerse < verses.length) {
      speakVerse(verses[currentVerse]);
    }
  }, [currentVerse, isPlaying, verses, speakVerse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    books,
    verses,
    currentVerse,
    highlightedWordIndex,
    isPlaying,
    isPaused,
    language,
    loadChapter,
    play,
    pause,
    stop,
    setLanguage,
    setCurrentVerse
  };
};
