/**
 * Enhanced Bible Flipbook with Google Cloud TTS
 * 
 * Features:
 * - High-quality Persian voice (Gemini 2.5 Flash TTS)
 * - High-quality English voice
 * - Precise word-level highlighting with real timings from Google
 * - Bilingual synchronized playback
 * - 3D page flipping
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
  Maximize,
  ChevronLeft,
  ChevronRight,
  Languages,
  Download,
  RefreshCw
} from 'lucide-react';

interface WordTiming {
  word: string;
  startTime: number; // milliseconds
  endTime: number;
  duration: number;
  markName: string;
  estimated?: boolean;
}

interface VerseAudio {
  verseNumber: number;
  persian: {
    audioContent: string;
    wordTimings: WordTiming[];
  } | null;
  english: {
    audioContent: string;
    wordTimings: WordTiming[];
  } | null;
}

interface Verse {
  id: number;
  verseNumber: number;
  textEn: string;
  textFa: string;
}

interface Props {
  bookCode: string;
  bookNameEn: string;
  bookNameFa: string;
  chapterNumber: number;
  verses: Verse[];
  onChapterChange?: (chapter: number) => void;
}

const BibleFlipbookGoogleTTS: React.FC<Props> = ({
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
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioCache, setAudioCache] = useState<Map<number, VerseAudio>>(new Map());
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(0);

  // Refs
  const flipBookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordHighlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Load audio for a verse using Google Cloud TTS
   */
  const loadVerseAudio = useCallback(async (verse: Verse): Promise<VerseAudio> => {
    // Check cache first
    const cached = audioCache.get(verse.verseNumber);
    if (cached) {
      console.log(`✅ Using cached audio for verse ${verse.verseNumber}`);
      return cached;
    }

    console.log(`🎙️ Fetching TTS for verse ${verse.verseNumber}...`);

    try {
      const response = await fetch('/api/google-tts/synthesize-verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textEn: verse.textEn,
          textFa: verse.textFa,
          verseNumber: verse.verseNumber,
          bookCode,
          chapter: chapterNumber
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'TTS synthesis failed');
      }

      const verseAudio: VerseAudio = {
        verseNumber: verse.verseNumber,
        persian: data.verse.persian,
        english: data.verse.english
      };

      // Cache the result
      setAudioCache(prev => new Map(prev).set(verse.verseNumber, verseAudio));

      return verseAudio;

    } catch (error) {
      console.error(`❌ Error loading audio for verse ${verse.verseNumber}:`, error);
      throw error;
    }
  }, [audioCache, bookCode, chapterNumber]);

  /**
   * Preload audio for all verses in chapter
   */
  const preloadChapterAudio = useCallback(async () => {
    setIsLoadingAudio(true);
    setSynthesisProgress(0);

    console.log(`📚 Preloading audio for ${verses.length} verses...`);

    try {
      for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];
        await loadVerseAudio(verse);
        
        const progress = ((i + 1) / verses.length) * 100;
        setSynthesisProgress(progress);
        
        console.log(`   ✓ Loaded ${i + 1}/${verses.length} verses`);
      }

      console.log('✅ All verse audio preloaded');
    } catch (error) {
      console.error('❌ Error preloading audio:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [verses, loadVerseAudio]);

  /**
   * Play verse with Google TTS audio and precise word highlighting
   */
  const playVerse = useCallback(async (verseIndex: number) => {
    const verse = verses[verseIndex];
    if (!verse) return;

    stopReading();

    try {
      // Load audio for this verse
      const verseAudio = await loadVerseAudio(verse);
      
      const audioData = language === 'fa' ? verseAudio.persian : verseAudio.english;
      
      if (!audioData) {
        console.warn(`No ${language} audio for verse ${verse.verseNumber}`);
        return;
      }

      setCurrentVerseIndex(verseIndex);
      setPlayingVerseIndex(verseIndex);
      setIsPlaying(true);

      // Create audio element from base64 data
      const audioBlob = base64ToBlob(audioData.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;

      // Start word highlighting with precise timings
      const wordTimings = audioData.wordTimings;
      let currentIndex = 0;

      const highlightWords = () => {
        const currentTime = audio.currentTime * 1000; // Convert to milliseconds

        // Find current word based on timing
        while (currentIndex < wordTimings.length) {
          const timing = wordTimings[currentIndex];
          
          if (currentTime >= timing.startTime && currentTime < timing.endTime) {
            setCurrentWordIndex(currentIndex);
            break;
          } else if (currentTime < timing.startTime) {
            break;
          } else {
            currentIndex++;
          }
        }

        // Continue checking every 50ms for smooth highlighting
        if (!audio.paused) {
          wordHighlightIntervalRef.current = setTimeout(highlightWords, 50);
        }
      };

      // Event listeners
      audio.onplay = () => {
        highlightWords();
      };

      audio.onended = () => {
        setCurrentWordIndex(-1);
        
        // Auto-advance to next verse
        if (verseIndex < verses.length - 1) {
          setTimeout(() => {
            if (isPlaying) {
              playVerse(verseIndex + 1);
            }
          }, 500);
        } else {
          stopReading();
        }
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        stopReading();
      };

      // Start playback
      await audio.play();

    } catch (error) {
      console.error('Error playing verse:', error);
      stopReading();
    }
  }, [verses, language, volume, isMuted, isPlaying, loadVerseAudio]);

  /**
   * Stop reading
   */
  const stopReading = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (wordHighlightIntervalRef.current) {
      clearTimeout(wordHighlightIntervalRef.current);
      wordHighlightIntervalRef.current = null;
    }

    setIsPlaying(false);
    setPlayingVerseIndex(null);
    setCurrentWordIndex(-1);
  }, []);

  /**
   * Toggle play/pause for entire chapter
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      stopReading();
    } else {
      setIsPlaying(true);
      playVerse(currentVerseIndex);
    }
  };

  /**
   * Toggle play/pause for specific verse
   */
  const toggleVersePlay = (verseIndex: number) => {
    if (playingVerseIndex === verseIndex) {
      stopReading();
    } else {
      playVerse(verseIndex);
    }
  };

  /**
   * Convert base64 to Blob
   */
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  /**
   * Render verse with word highlighting
   */
  const renderVerse = (verse: Verse, index: number, lang: 'en' | 'fa') => {
    const text = lang === 'fa' ? verse.textFa : verse.textEn;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const isActive = index === currentVerseIndex;
    const isCurrentlyPlaying = playingVerseIndex === index;

    // Get cached audio to check word timings
    const cachedAudio = audioCache.get(verse.verseNumber);
    const audioData = lang === 'fa' ? cachedAudio?.persian : cachedAudio?.english;
    const hasAccurateTimings = audioData && !audioData.wordTimings[0]?.estimated;

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
              transition: 'all 0.3s',
              position: 'relative'
            }}
            title={isCurrentlyPlaying ? 'توقف' : 'پخش'}
          >
            {isCurrentlyPlaying ? <Pause size={20} /> : <Play size={20} />}
            {hasAccurateTimings && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid white',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ✓
              </div>
            )}
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
                transition: 'all 0.15s ease-out',
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
   * Render flipbook pages
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
          <div style={{ fontSize: '1.2em', marginBottom: '20px', opacity: 0.9 }}>
            🎙️ Powered by Google Cloud TTS
          </div>
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
          <div style={{ marginTop: '40px', fontSize: '0.9em', opacity: 0.8 }}>
            ✨ Natural Voice • Word-Level Timing • Bilingual
          </div>
        </div>
      </div>
    );

    // Content pages
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
            fontFamily: 'Georgia, serif',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '0.6em' }}>🔊</span>
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
            textAlign: 'right',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexDirection: 'row-reverse'
          }}>
            <span style={{ fontSize: '0.6em' }}>🔊</span>
            {bookNameFa} - فصل {chapterNumber}
          </h2>
          {verses.map((verse, index) => renderVerse(verse, index, 'fa'))}
        </div>
      </div>
    );

    return pages;
  };

  // Preload audio on mount
  useEffect(() => {
    if (verses.length > 0) {
      preloadChapterAudio();
    }
  }, [verses, preloadChapterAudio]);

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
      {/* Loading Overlay */}
      {isLoadingAudio && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white'
        }}>
          <RefreshCw size={48} className="animate-spin" />
          <div style={{ marginTop: '20px', fontSize: '1.5em' }}>
            Loading Audio... {Math.round(synthesisProgress)}%
          </div>
          <div style={{ marginTop: '10px', fontSize: '1em', opacity: 0.8 }}>
            Google Cloud TTS is generating natural voices...
          </div>
          <div style={{ width: '300px', height: '10px', background: '#333', borderRadius: '10px', marginTop: '20px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${synthesisProgress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

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
          onClick={() => preloadChapterAudio()}
          disabled={isLoadingAudio}
          style={{
            background: 'rgba(44, 62, 80, 0.95)',
            border: 'none',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            cursor: isLoadingAudio ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            opacity: isLoadingAudio ? 0.5 : 1
          }}
          title="Reload Audio"
        >
          <RefreshCw size={24} className={isLoadingAudio ? 'animate-spin' : ''} />
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
          onClick={() => {
            stopReading();
            setCurrentVerseIndex(prev => Math.max(0, prev - 1));
          }}
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
          onClick={() => {
            stopReading();
            setCurrentVerseIndex(prev => Math.min(verses.length - 1, prev + 1));
          }}
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
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {isPlaying ? '🎵 در حال خواندن' : '▶️ آماده'} • آیه {currentVerseIndex + 1} از {verses.length}
        {audioCache.size > 0 && (
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
            • {audioCache.size}/{verses.length} cached
          </span>
        )}
      </div>
    </div>
  );
};

export default BibleFlipbookGoogleTTS;
