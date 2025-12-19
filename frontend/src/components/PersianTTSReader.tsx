/**
 * Persian TTS Bible Reader
 * 
 * Specialized component for reading Persian Bible text with:
 * - Persian TTS engine integration
 * - Word-by-word highlighting
 * - RTL support
 * - Persian voice selection
 * - Fallback to syllable-based reading
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Settings, Mic } from 'lucide-react';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  index: number;
}

interface Verse {
  id: number;
  verseNumber: number;
  textFa: string;
  wordsFA?: WordTiming[];
}

interface PersianTTSReaderProps {
  bookName: string;
  chapterNumber: number;
  verses: Verse[];
  onVerseChange?: (verseIndex: number) => void;
}

export const PersianTTSReader: React.FC<PersianTTSReaderProps> = ({
  bookName,
  chapterNumber,
  verses,
  onVerseChange
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(0.9); // Slower for Persian
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [useWordByWord, setUseWordByWord] = useState(true);
  const [highlightDelay, setHighlightDelay] = useState(300); // ms per word
  const [silentMode, setSilentMode] = useState(false); // Visual only, no audio

  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Persian voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length, voices.map(v => ({ name: v.name, lang: v.lang })));
      setAvailableVoices(voices);

      // Priority for Persian voices
      if (!selectedVoice && voices.length > 0) {
        const persianVoice = voices.find(v => 
          v.lang.startsWith('fa') || 
          v.lang.startsWith('ar') || 
          v.name.toLowerCase().includes('persian') ||
          v.name.toLowerCase().includes('farsi')
        );
        
        // Fallback to any available voice
        const voice = persianVoice || voices[0];
        console.log('Selected voice:', voice?.name, voice?.lang);
        setSelectedVoice(voice);
      }
    };

    // Load voices immediately
    loadVoices();
    
    // Also listen for voices changed event (Chrome needs this)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
  }, []);

  // Notify parent of verse change
  useEffect(() => {
    if (onVerseChange) {
      onVerseChange(currentVerseIndex);
    }
  }, [currentVerseIndex, onVerseChange]);

  /**
   * Split Persian text into words
   * Handles Persian characters and punctuation
   */
  const splitPersianText = (text: string): string[] => {
    // Split by spaces and filter out empty strings
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.trim());
  };

  /**
   * Manual word-by-word reading with timing
   * Used when browser doesn't support boundary events for Persian
   */
  const manualWordByWordReading = useCallback((verseIndex: number) => {
    const verse = verses[verseIndex];
    if (!verse) return;

    const words = splitPersianText(verse.textFa);
    let wordIdx = 0;

    // Clear any existing interval
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
    }

    // Highlight words with timing
    wordIntervalRef.current = setInterval(() => {
      if (wordIdx >= words.length) {
        clearInterval(wordIntervalRef.current!);
        wordIntervalRef.current = null;
        
        // Move to next verse
        if (verseIndex < verses.length - 1) {
          setCurrentVerseIndex(verseIndex + 1);
          setTimeout(() => speakVerse(verseIndex + 1), 500);
        } else {
          setIsPlaying(false);
          setCurrentVerseIndex(0);
          setCurrentWordIndex(-1);
        }
        return;
      }

      setCurrentWordIndex(wordIdx);

      // Auto-scroll to current word
      const wordKey = `${verseIndex}-${wordIdx}`;
      const wordElement = wordRefs.current.get(wordKey);
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }

      wordIdx++;
    }, highlightDelay / playbackRate); // Adjust timing based on speed

  }, [verses, highlightDelay, playbackRate]);

  /**
   * Handle word boundary events
   */
  const handleBoundary = useCallback((event: SpeechSynthesisEvent) => {
    if (event.name !== 'word') return;

    const currentVerse = verses[currentVerseIndex];
    if (!currentVerse) return;

    const words = splitPersianText(currentVerse.textFa);
    
    // Estimate word index from character position
    let charCount = 0;
    let wordIdx = 0;
    
    for (let i = 0; i < words.length; i++) {
      if (charCount >= event.charIndex) {
        wordIdx = i;
        break;
      }
      charCount += words[i].length + 1;
    }

    setCurrentWordIndex(wordIdx);

    // Auto-scroll
    const wordKey = `${currentVerseIndex}-${wordIdx}`;
    const wordElement = wordRefs.current.get(wordKey);
    if (wordElement) {
      wordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentVerseIndex, verses]);

  /**
   * Speak a verse with TTS
   */
  const speakVerse = useCallback((verseIndex: number) => {
    const verse = verses[verseIndex];
    if (!verse) return;

    const text = verse.textFa;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();

    // Create utterance for TTS
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language - try fa-IR first, then ar-SA (Arabic), then default
    // Note: If no Persian voice is available, the default voice will be used
    const persianVoice = availableVoices.find(v => v.lang.startsWith('fa'));
    const arabicVoice = availableVoices.find(v => v.lang.startsWith('ar'));
    
    if (persianVoice) {
      utterance.lang = 'fa-IR';
    } else if (arabicVoice) {
      utterance.lang = arabicVoice.lang;
      console.warn('Persian voice not found, using Arabic voice:', arabicVoice.name);
    } else {
      utterance.lang = 'fa-IR'; // Try anyway
      console.warn('No Persian/Arabic voice found, using default voice');
    }
    
    utterance.rate = playbackRate;
    utterance.volume = volume;
    utterance.pitch = 1.0;
    
    // Set voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Try to use boundary events (may not work for Persian)
    utterance.onboundary = handleBoundary;
    
    utterance.onstart = () => {
      console.log('Started reading verse', verseIndex + 1);
    };

    utterance.onend = () => {
      console.log('Finished reading verse', verseIndex + 1);
      
      // Clear word-by-word interval
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }

      setCurrentWordIndex(-1);
      
      // Move to next verse
      if (verseIndex < verses.length - 1 && isPlaying) {
        setCurrentVerseIndex(verseIndex + 1);
        setTimeout(() => speakVerse(verseIndex + 1), 500);
      } else {
        setIsPlaying(false);
        setCurrentVerseIndex(0);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      
      // Clear interval on error
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
    };

    utteranceRef.current = utterance;
    
    // Speak the utterance for TTS audio (unless in silent mode)
    if (!silentMode) {
      console.log('Speaking verse with TTS:', {
        text: text.substring(0, 50) + '...',
        lang: utterance.lang,
        rate: utterance.rate,
        volume: utterance.volume,
        voice: selectedVoice?.name || 'default'
      });
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('TTS error:', error);
        console.warn('Continuing with visual-only mode');
      }
    } else {
      console.log('Silent mode: visual highlighting only');
    }
    
    // Start word-by-word highlighting separately
    if (useWordByWord) {
      manualWordByWordReading(verseIndex);
    }
  }, [verses, playbackRate, volume, selectedVoice, handleBoundary, useWordByWord, manualWordByWordReading, isPlaying, silentMode]);

  /**
   * Toggle Play/Pause
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        if (useWordByWord) {
          manualWordByWordReading(currentVerseIndex);
        }
      } else {
        speakVerse(currentVerseIndex);
      }
      setIsPlaying(true);
    }
  };

  /**
   * Stop reading
   */
  const stopReading = () => {
    window.speechSynthesis.cancel();
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  /**
   * Previous verse
   */
  const previousVerse = () => {
    stopReading();
    const newIndex = Math.max(0, currentVerseIndex - 1);
    setCurrentVerseIndex(newIndex);
  };

  /**
   * Next verse
   */
  const nextVerse = () => {
    stopReading();
    const newIndex = Math.min(verses.length - 1, currentVerseIndex + 1);
    setCurrentVerseIndex(newIndex);
  };

  /**
   * Jump to specific verse
   */
  const jumpToVerse = (verseIndex: number) => {
    stopReading();
    setCurrentVerseIndex(verseIndex);
  };

  /**
   * Render a verse
   */
  const renderVerse = (verse: Verse, index: number) => {
    const words = splitPersianText(verse.textFa);
    const isCurrentVerse = index === currentVerseIndex;

    return (
      <div
        key={verse.id}
        ref={(el) => el && verseRefs.current.set(index, el)}
        className={`
          verse-container mb-4 p-6 rounded-xl transition-all duration-300
          ${isCurrentVerse 
            ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-400 shadow-lg' 
            : 'bg-white border border-gray-200 hover:border-purple-200'
          }
        `}
        dir="rtl"
        onClick={() => jumpToVerse(index)}
      >
        <div className="flex items-start gap-3">
          <span className={`
            verse-number flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${isCurrentVerse 
              ? 'bg-purple-500 text-white animate-pulse' 
              : 'bg-gray-200 text-gray-600'
            }
          `}>
            {verse.verseNumber}
          </span>
          
          <div className="verse-text text-xl leading-relaxed font-vazir flex-1">
            {words.map((word, wordIdx) => {
              const wordKey = `${index}-${wordIdx}`;
              const isHighlighted = isCurrentVerse && wordIdx === currentWordIndex;
              
              return (
                <span
                  key={wordKey}
                  ref={(el) => el && wordRefs.current.set(wordKey, el)}
                  className={`
                    inline-block transition-all duration-200 px-1 py-0.5 mx-0.5 rounded cursor-pointer
                    ${isHighlighted 
                      ? 'bg-yellow-300 text-black font-extrabold scale-110 shadow-lg ring-2 ring-yellow-400' 
                      : 'hover:bg-purple-50'
                    }
                  `}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="persian-tts-reader max-w-4xl mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="header mb-6 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-2 font-vazir">
          {bookName} - فصل {chapterNumber}
        </h2>
        <p className="text-gray-600 font-vazir">
          {silentMode && '🔇 حالت بی‌صدا • '}
          {isPlaying ? '🎵 در حال خواندن...' : '▶️ آماده برای خواندن'} • 
          آیه {currentVerseIndex + 1} از {verses.length}
        </p>
        {availableVoices.length === 0 && (
          <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-sm">
            <p className="text-yellow-900 font-vazir">
              ⚠️ صداها در حال بارگذاری... اگر صدای فارسی ندارید، از تنظیمات "حالت بی‌صدا" را فعال کنید
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="playback-controls flex items-center gap-3">
            <button
              onClick={previousVerse}
              disabled={currentVerseIndex === 0}
              className="p-3 rounded-full bg-white hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-purple-600"
              title="آیه قبلی"
            >
              <SkipForward size={24} className="rotate-180" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              title={isPlaying ? 'توقف' : 'پخش'}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>

            <button
              onClick={nextVerse}
              disabled={currentVerseIndex === verses.length - 1}
              className="p-3 rounded-full bg-white hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-purple-600"
              title="آیه بعدی"
            >
              <SkipForward size={24} />
            </button>
          </div>

          <div className="settings-controls flex items-center gap-3 font-vazir">
            <div className="volume-control flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-gray-700">
              <Volume2 size={20} className="text-purple-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-semibold text-gray-800">{Math.round(volume * 100)}%</span>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full transition-all shadow-md ${
                showSettings 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white hover:bg-purple-100 text-purple-600'
              }`}
              title="تنظیمات"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel bg-white border-2 border-purple-200 rounded-2xl p-6 mb-6 shadow-lg" dir="rtl">
          <h3 className="font-bold text-xl mb-4 font-vazir text-purple-700">⚙️ تنظیمات</h3>
          
          <div className="space-y-4">
            <div className="setting-item">
              <label className="block text-sm font-medium mb-2 font-vazir text-gray-700">سرعت پخش</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>آهسته</span>
                <span className="font-bold text-purple-600">{playbackRate.toFixed(1)}x</span>
                <span>سریع</span>
              </div>
            </div>

            <div className="setting-item">
              <label className="block text-sm font-medium mb-2 font-vazir text-gray-700">زمان هایلایت هر کلمه (ms)</label>
              <input
                type="range"
                min="200"
                max="800"
                step="50"
                value={highlightDelay}
                onChange={(e) => setHighlightDelay(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-700 font-semibold">{highlightDelay} میلی‌ثانیه</span>
            </div>

            <div className="setting-item">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWordByWord}
                  onChange={(e) => setUseWordByWord(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-vazir text-gray-700">هایلایت کلمه به کلمه</span>
              </label>
            </div>

            <div className="setting-item bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={silentMode}
                  onChange={(e) => setSilentMode(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-vazir font-bold text-yellow-900">🔇 حالت بی‌صدا (فقط هایلایت بصری)</span>
              </label>
              <p className="text-xs text-yellow-800 mt-2 mr-7">
                ✅ اگر مرورگر شما صدای فارسی ندارد، این گزینه را فعال کنید
              </p>
            </div>

            <div className="setting-item">
              <label className="block text-sm font-medium mb-2 font-vazir text-gray-700">انتخاب صدا</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice || null);
                }}
                className="w-full border-2 border-purple-200 rounded-lg p-3 font-vazir focus:border-purple-400 focus:outline-none bg-white text-gray-800"
              >
                {availableVoices.length === 0 && (
                  <option>در حال بارگذاری صداها...</option>
                )}
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1 font-vazir">
                💡 اگر صدای فارسی در لیست نیست، از هر صدای دیگری می‌توانید استفاده کنید
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verses Display */}
      <div className="verses-container space-y-4">
        {verses.map((verse, index) => renderVerse(verse, index))}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mt-6 bg-gray-200 rounded-full h-3 shadow-inner">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 shadow-md"
          style={{ width: `${((currentVerseIndex + 1) / verses.length) * 100}%` }}
        />
      </div>

      {/* Info Box */}
      <div className="info-box mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 font-vazir text-sm" dir="rtl">
        <h4 className="font-bold mb-2 text-blue-800">📌 راهنما:</h4>
        <ul className="space-y-1 text-blue-700">
          <li>• روی هر آیه کلیک کنید تا به آن بروید</li>
          <li>• کلمات با رنگ زرد هایلایت می‌شوند</li>
          <li>• سرعت و صدا را در تنظیمات تغییر دهید</li>
          <li>• بهترین مرورگر: Chrome یا Edge</li>
        </ul>
      </div>
    </div>
  );
};

export default PersianTTSReader;
