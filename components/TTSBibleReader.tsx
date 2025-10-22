/**
 * TTSBibleReader Component
 * 
 * Advanced Bible reader with Text-to-Speech capabilities featuring:
 * - Word-by-word highlighting synchronized with audio
 * - Bilingual display (English/Persian/Arabic)
 * - Play/Pause controls with navigation
 * - Auto-scroll to keep current word visible
 * - Voice selection and speed control
 * - Verse-by-verse or continuous reading
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Settings } from 'lucide-react';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  index: number;
}

interface Verse {
  id: number;
  verseNumber: number;
  textEn: string;
  textFa: string;
  wordsEn?: WordTiming[];
  wordsFa?: WordTiming[];
}

interface TTSBibleReaderProps {
  bookCode: string;
  chapterNumber: number;
  verses: Verse[];
  language?: 'en' | 'fa';
  showBilingual?: boolean;
}

export const TTSBibleReader: React.FC<TTSBibleReaderProps> = ({
  bookCode,
  chapterNumber,
  verses,
  language = 'en',
  showBilingual = true
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const boundaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Auto-select appropriate voice based on language
      if (!selectedVoice) {
        const defaultVoice = voices.find(v => 
          language === 'en' 
            ? v.lang.startsWith('en') 
            : v.lang.startsWith('fa') || v.lang.startsWith('ar')
        );
        setSelectedVoice(defaultVoice || voices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language, selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (boundaryTimeoutRef.current) {
        clearTimeout(boundaryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Split text into words and track their positions
   */
  const splitIntoWords = (text: string): string[] => {
    // Handle both RTL (Persian/Arabic) and LTR (English) text
    return text.match(/[\w\u0600-\u06FF]+|[^\w\s\u0600-\u06FF]/g) || [];
  };

  /**
   * Handle word boundary events during speech
   */
  const handleBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name !== 'word') return;

    const currentVerse = verses[currentVerseIndex];
    if (!currentVerse) return;

    const text = language === 'en' ? currentVerse.textEn : currentVerse.textFa;
    const words = splitIntoWords(text);
    
    // Find word index by character position
    let charCount = 0;
    let wordIdx = 0;
    
    for (let i = 0; i < words.length; i++) {
      if (charCount >= event.charIndex) {
        wordIdx = i;
        break;
      }
      charCount += words[i].length + 1; // +1 for space
    }

    setCurrentWordIndex(wordIdx);

    // Auto-scroll to current word
    const wordKey = `${currentVerseIndex}-${wordIdx}`;
    const wordElement = wordRefs.current.get(wordKey);
    if (wordElement) {
      wordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentVerseIndex, verses, language]);

  /**
   * Speak a single verse
   */
  const speakVerse = useCallback((verseIndex: number) => {
    const verse = verses[verseIndex];
    if (!verse) return;

    const text = language === 'en' ? verse.textEn : verse.textFa;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'fa-IR';
    utterance.rate = playbackRate;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onboundary = handleBoundary;
    
    utterance.onend = () => {
      setCurrentWordIndex(-1);
      
      // Move to next verse
      if (verseIndex < verses.length - 1) {
        setCurrentVerseIndex(verseIndex + 1);
        speakVerse(verseIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentVerseIndex(0);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [verses, language, playbackRate, volume, selectedVoice, handleBoundary]);

  /**
   * Play/Pause toggle
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        speakVerse(currentVerseIndex);
      }
      setIsPlaying(true);
    }
  };

  /**
   * Stop playback
   */
  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  /**
   * Navigate to previous verse
   */
  const previousVerse = () => {
    stop();
    const newIndex = Math.max(0, currentVerseIndex - 1);
    setCurrentVerseIndex(newIndex);
    
    // Auto-play if was playing
    if (isPlaying) {
      setTimeout(() => speakVerse(newIndex), 100);
    }
  };

  /**
   * Navigate to next verse
   */
  const nextVerse = () => {
    stop();
    const newIndex = Math.min(verses.length - 1, currentVerseIndex + 1);
    setCurrentVerseIndex(newIndex);
    
    // Auto-play if was playing
    if (isPlaying) {
      setTimeout(() => speakVerse(newIndex), 100);
    }
  };

  /**
   * Jump to specific verse
   */
  const jumpToVerse = (verseIndex: number) => {
    stop();
    setCurrentVerseIndex(verseIndex);
  };

  /**
   * Render a verse with word-level highlighting
   */
  const renderVerse = (verse: Verse, index: number, lang: 'en' | 'fa') => {
    const text = lang === 'en' ? verse.textEn : verse.textFa;
    const words = splitIntoWords(text);
    const isCurrentVerse = index === currentVerseIndex;
    const isRTL = lang === 'fa';

    return (
      <div
        key={`${verse.id}-${lang}`}
        ref={(el) => el && verseRefs.current.set(index, el)}
        className={`
          verse-container mb-4 p-4 rounded-lg transition-all duration-300
          ${isCurrentVerse ? 'bg-blue-50 border-2 border-blue-400' : 'bg-white border border-gray-200'}
          ${isRTL ? 'text-right' : 'text-left'}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <span className="verse-number font-bold text-gray-500 mr-2">
          {verse.verseNumber}
        </span>
        
        <span className={`verse-text text-lg ${isRTL ? 'font-vazir' : ''}`}>
          {words.map((word, wordIdx) => {
            const wordKey = `${index}-${wordIdx}`;
            const isHighlighted = isCurrentVerse && wordIdx === currentWordIndex;
            
            return (
              <span
                key={wordKey}
                ref={(el) => el && wordRefs.current.set(wordKey, el)}
                className={`
                  inline-block transition-all duration-200
                  ${isHighlighted 
                    ? 'bg-yellow-300 text-black font-bold scale-110 shadow-lg' 
                    : 'hover:bg-gray-100'
                  }
                  px-1 rounded cursor-pointer
                `}
                onClick={() => jumpToVerse(index)}
              >
                {word}{' '}
              </span>
            );
          })}
        </span>
      </div>
    );
  };

  return (
    <div className="tts-bible-reader max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="header mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {bookCode} Chapter {chapterNumber}
        </h2>
        <p className="text-gray-600">
          {isPlaying ? 'Now Reading...' : 'Ready to Read'} • 
          Verse {currentVerseIndex + 1} of {verses.length}
        </p>
      </div>

      {/* Controls */}
      <div className="controls bg-gray-100 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="playback-controls flex items-center gap-3">
          <button
            onClick={previousVerse}
            disabled={currentVerseIndex === 0}
            className="p-3 rounded-full bg-white hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700"
            title="Previous Verse"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>

          <button
            onClick={nextVerse}
            disabled={currentVerseIndex === verses.length - 1}
            className="p-3 rounded-full bg-white hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700"
            title="Next Verse"
          >
            <SkipForward size={24} />
          </button>
        </div>

        <div className="settings-controls flex items-center gap-3">
          <div className="volume-control flex items-center gap-2 text-gray-700">
            <Volume2 size={20} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm font-semibold">{Math.round(volume * 100)}%</span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-white hover:bg-gray-200 transition-colors text-gray-700"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel bg-white border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-3 text-gray-800">Settings</h3>
          
          <div className="setting-item mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-700">Playback Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{playbackRate.toFixed(1)}x</span>
          </div>

          <div className="setting-item">
            <label className="block text-sm font-medium mb-1">Voice</label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.name === e.target.value);
                setSelectedVoice(voice || null);
              }}
              className="w-full border border-gray-300 rounded p-2"
            >
              {availableVoices
                .filter(v => language === 'en' 
                  ? v.lang.startsWith('en') 
                  : v.lang.startsWith('fa') || v.lang.startsWith('ar')
                )
                .map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Verses Display */}
      <div className="verses-container space-y-4">
        {showBilingual ? (
          <>
            <div className="english-column">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">English</h3>
              {verses.map((verse, index) => renderVerse(verse, index, 'en'))}
            </div>
            
            <div className="persian-column mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">فارسی</h3>
              {verses.map((verse, index) => renderVerse(verse, index, 'fa'))}
            </div>
          </>
        ) : (
          <div className="single-column">
            {verses.map((verse, index) => renderVerse(verse, index, language as 'en' | 'fa'))}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="progress-bar mt-6">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentVerseIndex + 1) / verses.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TTSBibleReader;
