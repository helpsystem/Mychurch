/**
 * BibleFlipbook3D Component
 * 
 * Advanced 3D Bible Flipbook Reader with:
 * - 3D page flipping animation using react-pageflip
 * - Bilingual display (English left page, Persian right page)
 * - Word-by-word TTS highlighting
 * - Persian RTL support
 * - Individual verse play/pause controls
 * - Auto page turn on chapter end
 * - Realistic book styling with shadows
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Settings,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Languages
} from 'lucide-react';

interface Verse {
  id: number;
  verseNumber: number;
  textEn: string;
  textFa: string;
}

interface BibleFlipbook3DProps {
  bookCode: string;
  bookNameEn: string;
  bookNameFa: string;
  chapterNumber: number;
  verses: Verse[];
  onChapterChange?: (chapter: number) => void;
}

const BibleFlipbook3D: React.FC<BibleFlipbook3DProps> = ({
  bookCode,
  bookNameEn,
  bookNameFa,
  chapterNumber,
  verses,
  onChapterChange
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playingVerseIndex, setPlayingVerseIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState<'en' | 'fa'>('fa');
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [wordDelay, setWordDelay] = useState(350); // ms per word
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Refs
  const flipBookRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Split text into words for highlighting
   */
  const splitIntoWords = (text: string): string[] => {
    return text.split(/\s+/).filter(word => word.length > 0);
  };

  /**
   * Stop current reading
   */
  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    setIsPlaying(false);
    setPlayingVerseIndex(null);
    setCurrentWordIndex(-1);
  }, []);

  /**
   * Speak a single verse with word-by-word highlighting
   */
  const speakVerse = useCallback((verseIndex: number) => {
    const verse = verses[verseIndex];
    if (!verse) return;

    const text = language === 'fa' ? verse.textFa : verse.textEn;
    const words = splitIntoWords(text);

    // Cancel any existing speech
    window.speechSynthesis.cancel();
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
    }

    // Set current verse
    setCurrentVerseIndex(verseIndex);
    setPlayingVerseIndex(verseIndex);

    // Word-by-word highlighting
    let wordIdx = 0;
    const delay = wordDelay / playbackRate;

    wordIntervalRef.current = setInterval(() => {
      if (wordIdx >= words.length) {
        clearInterval(wordIntervalRef.current!);
        wordIntervalRef.current = null;
        setCurrentWordIndex(-1);

        // Auto-advance to next verse
        if (verseIndex < verses.length - 1) {
          setTimeout(() => {
            if (isPlaying) {
              speakVerse(verseIndex + 1);
            }
          }, 500);
        } else {
          // Chapter finished
          stopReading();
        }
        return;
      }

      setCurrentWordIndex(wordIdx++);
    }, delay);

    // Try TTS (may not work for Persian in all browsers)
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = playbackRate;
      utterance.volume = isMuted ? 0 : volume;

      // Select appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => 
        language === 'fa' 
          ? v.lang.startsWith('fa') || v.lang.startsWith('ar')
          : v.lang.startsWith('en')
      );
      if (voice) utterance.voice = voice;

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('TTS not available, using timing only');
    }
  }, [verses, language, wordDelay, playbackRate, volume, isMuted, isPlaying, stopReading]);

  /**
   * Toggle play/pause for entire chapter
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      stopReading();
    } else {
      setIsPlaying(true);
      speakVerse(currentVerseIndex);
    }
  };

  /**
   * Toggle play/pause for specific verse
   */
  const toggleVersePlay = (verseIndex: number) => {
    if (playingVerseIndex === verseIndex) {
      stopReading();
    } else {
      stopReading();
      setIsPlaying(true);
      speakVerse(verseIndex);
    }
  };

  /**
   * Navigate to previous verse
   */
  const previousVerse = () => {
    stopReading();
    setCurrentVerseIndex(prev => Math.max(0, prev - 1));
  };

  /**
   * Navigate to next verse
   */
  const nextVerse = () => {
    stopReading();
    setCurrentVerseIndex(prev => Math.min(verses.length - 1, prev + 1));
  };

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /**
   * Render a single verse with word highlighting
   */
  const renderVerse = (verse: Verse, index: number, lang: 'en' | 'fa') => {
    const text = lang === 'fa' ? verse.textFa : verse.textEn;
    const words = splitIntoWords(text);
    const isActive = index === currentVerseIndex;
    const isCurrentlyPlaying = playingVerseIndex === index;

    return (
      <div
        key={`${verse.id}-${lang}`}
        className={`verse-container ${isActive ? 'active' : ''} ${lang === 'fa' ? 'rtl' : 'ltr'}`}
        style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '12px',
          border: isActive ? '3px solid #667eea' : '2px solid #e2e8f0',
          background: isActive ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : 'white',
          transition: 'all 0.3s',
          display: 'flex',
          gap: '10px',
          direction: lang === 'fa' ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => toggleVersePlay(index)}
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: 'none',
              background: isCurrentlyPlaying 
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '1.2em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s'
            }}
            title={isCurrentlyPlaying ? 'توقف' : 'پخش'}
          >
            {isCurrentlyPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: isActive 
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : 'linear-gradient(135deg, #e2e8f0, #cbd5e0)',
              color: isActive ? 'white' : '#4a5568',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2em',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '3px solid white'
            }}
          >
            {verse.verseNumber}
          </div>
        </div>
        <div style={{ flex: 1, fontSize: '1.3em', lineHeight: '2', color: '#2d3748' }}>
          {words.map((word, wordIdx) => (
            <span
              key={`${index}-${wordIdx}`}
              style={{
                display: 'inline-block',
                padding: '4px 6px',
                margin: '0 3px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                background: isActive && wordIdx === currentWordIndex
                  ? '#ffd700'
                  : 'transparent',
                color: isActive && wordIdx === currentWordIndex
                  ? '#000'
                  : 'inherit',
                fontWeight: isActive && wordIdx === currentWordIndex
                  ? 'bold'
                  : 'normal',
                transform: isActive && wordIdx === currentWordIndex
                  ? 'scale(1.1)'
                  : 'scale(1)',
                boxShadow: isActive && wordIdx === currentWordIndex
                  ? '0 4px 15px rgba(255, 215, 0, 0.6)'
                  : 'none'
              }}
            >
              {word}{' '}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render book pages
   */
  const renderPages = () => {
    const pages = [];

    // Cover page
    pages.push(
      <div key="cover" className="page cover-page" data-density="hard">
        <div style={{
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '3em', marginBottom: '20px', fontFamily: 'Georgia, serif' }}>
            Holy Bible
          </h1>
          <h2 style={{ fontSize: '2.5em', fontFamily: 'Tahoma, Arial', direction: 'rtl' }}>
            کتاب مقدس
          </h2>
          <div style={{ marginTop: '40px', fontSize: '1.5em' }}>
            <div>{bookNameEn}</div>
            <div style={{ fontFamily: 'Tahoma', direction: 'rtl', marginTop: '10px' }}>
              {bookNameFa}
            </div>
            <div style={{ marginTop: '20px', fontSize: '0.8em' }}>
              Chapter {chapterNumber} | فصل {chapterNumber}
            </div>
          </div>
        </div>
      </div>
    );

    // Content pages (English left, Persian right)
    pages.push(
      <div key="content-en" className="page" data-density="soft">
        <div style={{ 
          padding: '40px 30px', 
          height: '100%', 
          overflowY: 'auto',
          background: 'linear-gradient(to right, #fefefe 0%, #f8f8f8 100%)'
        }}>
          <h2 style={{ 
            fontSize: '1.8em', 
            marginBottom: '25px', 
            paddingBottom: '15px',
            borderBottom: '3px solid #8b4513',
            color: '#2c3e50',
            fontFamily: 'Georgia, serif'
          }}>
            {bookNameEn} - Chapter {chapterNumber}
          </h2>
          {verses.map((verse, index) => renderVerse(verse, index, 'en'))}
        </div>
      </div>
    );

    pages.push(
      <div key="content-fa" className="page" data-density="soft">
        <div style={{ 
          padding: '40px 30px', 
          height: '100%', 
          overflowY: 'auto',
          background: 'linear-gradient(to left, #fefefe 0%, #f8f8f8 100%)',
          direction: 'rtl',
          fontFamily: 'Tahoma, Arial, sans-serif'
        }}>
          <h2 style={{ 
            fontSize: '1.8em', 
            marginBottom: '25px', 
            paddingBottom: '15px',
            borderBottom: '3px solid #8b4513',
            color: '#2c3e50',
            textAlign: 'right'
          }}>
            {bookNameFa} - فصل {chapterNumber}
          </h2>
          {verses.map((verse, index) => renderVerse(verse, index, 'fa'))}
        </div>
      </div>
    );

    return pages;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
  }, [stopReading]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Top Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={toggleFullscreen}
          style={{
            background: 'rgba(44, 62, 80, 0.95)',
            border: 'none',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Maximize size={24} />
        </button>

        <button
          onClick={() => setLanguage(lang => lang === 'en' ? 'fa' : 'en')}
          style={{
            background: 'rgba(44, 62, 80, 0.95)',
            border: '2px solid white',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            fontWeight: 'bold'
          }}
        >
          <Languages size={20} />
          {language === 'en' ? 'English' : 'فارسی'}
        </button>
      </div>

      {/* Flipbook Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        marginTop: '80px'
      }}>
        <HTMLFlipBook
          ref={flipBookRef}
          width={500}
          height={700}
          size="stretch"
          minWidth={300}
          maxWidth={800}
          minHeight={400}
          maxHeight={1000}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={false}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e) => setCurrentPage(e.data)}
          className="bible-flipbook"
          style={{
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
            borderRadius: '10px'
          }}
        >
          {renderPages()}
        </HTMLFlipBook>
      </div>

      {/* Bottom Controls */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '15px',
        background: 'rgba(44, 62, 80, 0.95)',
        padding: '20px 30px',
        borderRadius: '50px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        alignItems: 'center'
      }}>
        <button
          onClick={previousVerse}
          disabled={currentVerseIndex === 0}
          style={{
            background: 'transparent',
            border: '2px solid white',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            opacity: currentVerseIndex === 0 ? 0.3 : 1
          }}
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={togglePlayPause}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? 'توقف' : 'پخش'}
        </button>

        <button
          onClick={nextVerse}
          disabled={currentVerseIndex === verses.length - 1}
          style={{
            background: 'transparent',
            border: '2px solid white',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            opacity: currentVerseIndex === verses.length - 1 ? 0.3 : 1
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'transparent',
            border: '2px solid white',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex'
          }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Status Display */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(44, 62, 80, 0.95)',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        fontSize: '1.1em',
        fontWeight: '600',
        zIndex: 1000
      }}>
        {isPlaying ? '🎵 در حال خواندن' : '▶️ آماده'} • آیه {currentVerseIndex + 1} از {verses.length}
      </div>
    </div>
  );
};

export default BibleFlipbook3D;
