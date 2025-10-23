/**
 * Unified Bible Viewer - Main Page Component
 * 
 * Merges Simple Mode and Flipbook Mode into one interface
 * Features:
 * - Dual display modes (Simple scroll / 3D Flipbook)
 * - Bilingual support (English/Persian)
 * - Google Cloud TTS with word-level highlighting
 * - Presentation mode for projectors
 * - Responsive design (mobile to widescreen)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBibleMode } from '../hooks/useBibleMode';
import { useTTS } from '../hooks/useTTS';
import BibleToolbar from '../components/BibleToolbar';
import BibleSimple from '../components/BibleSimple';
import BibleFlipbookUnified from '../components/BibleFlipbookUnified';
import LoadingSpinner from '../components/LoadingSpinner';
import { loadBibleBooks, loadBibleChapter, preloadNextChapter } from '../services/bibleDataService';

interface Verse {
  number: number;
  text: {
    en: string;
    fa: string;
  };
  id: string;
}

interface Chapter {
  book: {
    code: string;
    number: number;
    names: {
      en: string;
      fa: string;
    };
  };
  chapterNumber: number;
  verseCount: number;
  verses: Verse[];
}

interface BookInfo {
  code: string;
  number: number;
  testament: string;
  names: {
    en: string;
    fa: string;
  };
  chapterCount: number;
}

const BibleViewer: React.FC = () => {
  // Custom hooks
  const {
    mode,
    language,
    displayMode,
    currentBook,
    currentChapter,
    setMode,
    setLanguage,
    setDisplayMode,
    goToReference,
    nextChapter,
    previousChapter
  } = useBibleMode();

  const tts = useTTS({
    autoPreload: true,
    preloadCount: 3,
    cacheAudio: true
  });

  // State
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [bilingualMode, setBilingualMode] = useState(true); // Toggle bilingual/monolingual

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch all books on mount
   */
  useEffect(() => {
    fetchBooks();
  }, []);

  /**
   * Fetch chapter data when book/chapter changes
   */
  useEffect(() => {
    if (currentBook && currentChapter) {
      fetchChapter(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter]);

  /**
   * Fetch books list using bibleDataService
   */
  const fetchBooks = async () => {
    try {
      const booksData = await loadBibleBooks();
      setBooks(booksData);
    } catch (err) {
      console.error('Error loading Bible data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Bible data');
    }
  };

  /**
   * Fetch chapter data using bibleDataService
   */
  const fetchChapter = async (book: string, chapter: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const chapterData = await loadBibleChapter(book, chapter);
      setChapterData(chapterData);
      
      // Preload next chapter in background
      const currentBookInfo = books.find(b => b.code === book);
      if (currentBookInfo) {
        preloadNextChapter(book, chapter, currentBookInfo.chapterCount);
      }
    } catch (err) {
      console.error('Error fetching chapter:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chapter');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search
   */
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/bible-unified/search?q=${encodeURIComponent(query)}&lang=both&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  /**
   * Handle navigation to specific reference
   */
  const handleGoToReference = useCallback((book: string, chapter: number, verse?: number) => {
    goToReference(book, chapter, verse);
    setShowSearch(false);
    setSearchResults([]);
  }, [goToReference]);

  /**
   * Handle fullscreen toggle
   */
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (language === 'fa') {
            nextChapter();
          } else {
            previousChapter();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (language === 'fa') {
            previousChapter();
          } else {
            nextChapter();
          }
          break;
        case ' ':
          e.preventDefault();
          tts.togglePlayPause();
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSearch(true);
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          if (showSearch) {
            setShowSearch(false);
          }
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          // Toggle mode (Simple ↔ Flipbook)
          setMode(mode === 'simple' ? 'flipbook' : 'simple');
          break;
        case 'l':
          // Toggle language
          setLanguage(language === 'en' ? 'fa' : 'en');
          break;
        case 'b':
          // Toggle bilingual/monolingual mode
          setBilingualMode(!bilingualMode);
          break;
        case 'p':
          // Toggle presentation mode
          setDisplayMode(displayMode === 'presentation' ? 'normal' : 'presentation');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    language,
    mode,
    isFullscreen,
    showSearch,
    nextChapter,
    previousChapter,
    setMode,
    setLanguage,
    tts,
    toggleFullscreen
  ]);

  /**
   * Handle fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * Get current book info
   */
  const currentBookInfo = books.find(b => b.code === currentBook);

  // Render loading state
  if (isLoading && !chapterData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
        <LoadingSpinner size="large" text="Loading Bible..." />
      </div>
    );
  }

  // Render error state
  if (error && !chapterData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Bible</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchChapter(currentBook, currentChapter)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Determine classes based on display mode
  const containerClasses = [
    'bible-viewer-container',
    'min-h-screen',
    'transition-all',
    'duration-300',
    displayMode === 'presentation' ? 'bg-black' : 'bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100'
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Toolbar (hidden in presentation mode) */}
      {displayMode !== 'presentation' && (
        <BibleToolbar
          mode={mode}
          language={language}
          displayMode={displayMode}
          isPlaying={tts.isPlaying}
          isLoading={isLoading}
          currentBook={currentBook}
          currentChapter={currentChapter}
          onModeToggle={() => setMode(mode === 'simple' ? 'flipbook' : 'simple')}
          onLanguageToggle={() => setLanguage(language === 'en' ? 'fa' : 'en')}
          onDisplayModeChange={setDisplayMode}
          onSearch={handleSearch}
          onPlayPause={tts.togglePlayPause}
          onPreviousChapter={previousChapter}
          onNextChapter={nextChapter}
          onFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          bookName={currentBookInfo?.names[language]}
        />
      )}

      {/* Main Content Area */}
      <main className="bible-content">
        {chapterData && (
          <>
            {mode === 'simple' ? (
              <BibleSimple
                chapter={chapterData}
                language={language}
                displayMode={displayMode}
                tts={tts}
                onVerseClick={(verseNumber) => {
                  // Play clicked verse
                  const verse = chapterData.verses.find(v => v.number === verseNumber);
                  if (verse) {
                    tts.playVerse(verseNumber, language, {
                      verseNumber,
                      text: verse.text,
                      audio: {},
                      timings: {}
                    });
                  }
                }}
              />
            ) : (
              <BibleFlipbookUnified
                chapter={chapterData}
                language={language}
                displayMode={displayMode}
                tts={tts}
                bilingualMode={bilingualMode}
                onPageChange={(pageNumber) => {
                  // Handle page change if needed
                  console.log('Page changed:', pageNumber);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Control Menu - Always accessible with hotkey or hover */}
      <div 
        className={`
          fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50
          transition-all duration-300
          ${displayMode === 'presentation' 
            ? 'opacity-0 hover:opacity-100 focus-within:opacity-100' 
            : 'opacity-90 hover:opacity-100'
          }
        `}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = displayMode === 'presentation' ? '0' : '0.9'}
      >
        <div className={`
          flex items-center gap-3 rounded-2xl shadow-2xl backdrop-blur-md border-2
          ${displayMode === 'presentation'
            ? 'bg-black/90 border-amber-500/30 px-8 py-4'
            : 'bg-gradient-to-r from-blue-900/95 via-purple-900/95 to-blue-900/95 border-blue-500/30 px-6 py-3'
          }
        `}>
          {/* Mode Toggle */}
          <button
            onClick={() => setMode(mode === 'simple' ? 'flipbook' : 'simple')}
            className={`
              px-4 py-2 rounded-xl font-semibold transition-all duration-200
              ${displayMode === 'presentation'
                ? 'bg-amber-600 hover:bg-amber-500 text-black'
                : 'bg-purple-700 hover:bg-purple-600 text-white'
              }
            `}
            title={mode === 'simple' ? 'Switch to Flipbook (M)' : 'Switch to Simple (M)'}
          >
            {mode === 'simple' ? '📖 Flipbook' : '📜 Simple'}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
            className={`
              px-4 py-2 rounded-xl font-semibold transition-all duration-200
              ${displayMode === 'presentation'
                ? 'bg-amber-600 hover:bg-amber-500 text-black'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
              }
            `}
            title={language === 'en' ? 'Switch to Persian (L)' : 'Switch to English (L)'}
          >
            {language === 'en' ? 'EN' : 'FA'}
          </button>

          {/* Bilingual Mode Toggle */}
          <button
            onClick={() => setBilingualMode(!bilingualMode)}
            className={`
              px-4 py-2 rounded-xl font-semibold transition-all duration-200
              ${displayMode === 'presentation'
                ? 'bg-amber-600 hover:bg-amber-500 text-black'
                : bilingualMode
                  ? 'bg-green-700 hover:bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }
            `}
            title={bilingualMode ? 'Switch to Single Language (B)' : 'Switch to Dual Language (B)'}
          >
            {bilingualMode ? '🌐 Dual' : '🔤 Single'}
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 bg-black/30 rounded-xl px-2 py-1">
            <button
              onClick={previousChapter}
              className="p-2 hover:bg-white/20 rounded-lg text-white transition-all"
              title="Previous Chapter (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={tts.togglePlayPause}
              disabled={isLoading}
              className={`
                p-3 rounded-lg transition-all text-white
                ${isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : tts.isPlaying 
                    ? 'bg-red-600 hover:bg-red-500 animate-pulse' 
                    : 'bg-green-600 hover:bg-green-500'
                }
              `}
              title={tts.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : tts.isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={nextChapter}
              className="p-2 hover:bg-white/20 rounded-lg text-white transition-all"
              title="Next Chapter (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Display Mode Selector */}
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as any)}
            className={`
              px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all
              ${displayMode === 'presentation'
                ? 'bg-amber-600 hover:bg-amber-500 text-black'
                : 'bg-indigo-700 hover:bg-indigo-600 text-white'
              }
            `}
            title="Display Mode (P)"
          >
            <option value="normal">🖥️ Normal</option>
            <option value="presentation">🎬 Presentation</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`
              p-2 rounded-xl transition-all
              ${displayMode === 'presentation'
                ? 'bg-amber-600/50 hover:bg-amber-500 text-white'
                : 'bg-blue-700/50 hover:bg-blue-600 text-white'
              }
            `}
            title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Exit Presentation Mode (only visible in presentation) */}
          {displayMode === 'presentation' && (
            <button
              onClick={() => setDisplayMode('normal')}
              className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white transition-all ml-2"
              title="Exit Presentation (Esc)"
            >
              ✕ Exit
            </button>
          )}
        </div>

        {/* Quick Tips */}
        <div className={`
          mt-2 text-center text-xs font-medium
          ${displayMode === 'presentation' ? 'text-amber-400' : 'text-blue-200'}
        `}>
          <kbd className="px-2 py-1 bg-black/30 rounded">M</kbd> Mode · 
          <kbd className="px-2 py-1 bg-black/30 rounded mx-1">L</kbd> Language · 
          <kbd className="px-2 py-1 bg-black/30 rounded">P</kbd> Presentation · 
          <kbd className="px-2 py-1 bg-black/30 rounded mx-1">Space</kbd> Play · 
          <kbd className="px-2 py-1 bg-black/30 rounded">F11</kbd> Fullscreen
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && chapterData && (
        <div className="fixed top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-700">Loading chapter...</span>
        </div>
      )}

      {/* Keyboard Shortcuts Help (Press ?) */}
      {/* Can be added later */}
    </div>
  );
};

export default BibleViewer;
