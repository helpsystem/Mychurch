/**
 * Bible Flipbook Unified Component
 * 
 * 3D animated page-flip interface for unified Bible viewer
 * Features:
 * - Realistic book simulation using react-pageflip
 * - Dual-language layout (Left: English, Right: Persian)
 * - Page shadows and depth effects
 * - Word-level highlighting during TTS
 * - Touch gestures for mobile
 */

import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { DisplayMode, Language } from '../hooks/useBibleMode';

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
    names: {
      en: string;
      fa: string;
    };
  };
  chapterNumber: number;
  verses: Verse[];
}

interface TTSState {
  isPlaying: boolean;
  currentVerse: number | null;
  currentWordIndex: number;
}

interface BibleFlipbookUnifiedProps {
  chapter: Chapter;
  language: Language;
  displayMode: DisplayMode;
  tts: TTSState;
  onPageChange?: (pageNumber: number) => void;
}

const BibleFlipbookUnified: React.FC<BibleFlipbookUnifiedProps> = ({
  chapter,
  language,
  displayMode,
  tts,
  onPageChange
}) => {
  const flipbookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 500, height: 700 });

  // Update dimensions based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(window.innerWidth * 0.9, 900);
      const height = Math.min(window.innerHeight * 0.85, 1200);
      setDimensions({ width: width / 2, height }); // Divided by 2 for each page
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /**
   * Create pages from verses (split into groups)
   * Presentation mode: 2 verses per page for larger text
   */
  const versesPerPage = displayMode === 'presentation' ? 2 : 5;
  const pages: Verse[][] = [];
  
  for (let i = 0; i < chapter.verses.length; i += versesPerPage) {
    pages.push(chapter.verses.slice(i, i + versesPerPage));
  }

  /**
   * Render verse with word highlighting
   */
  const renderVerse = (verse: Verse, lang: Language) => {
    const isActive = tts.currentVerse === verse.number;
    const text = verse.text[lang];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const isRTL = lang === 'fa';

    return (
      <div
        key={`${verse.id}-${lang}`}
        className={`verse mb-4 ${isActive ? 'verse-active' : ''}`}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Verse Number */}
        <span
          className={`verse-number inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-2 ${
            isActive
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-900 shadow-lg'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {verse.number}
        </span>

        {/* Verse Text */}
        <span className={`verse-text ${displayMode === 'presentation' ? 'text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight' : 'text-base'}`}>
          {words.map((word, wordIndex) => {
            const isHighlighted = isActive && tts.currentWordIndex === wordIndex;
            
            return (
              <span
                key={`word-${wordIndex}`}
                className={`word inline-block transition-all duration-150 px-0.5 ${
                  isHighlighted
                    ? lang === 'fa'
                      ? 'bg-gradient-to-r from-amber-300 to-yellow-200 text-gray-900 font-bold scale-105'
                      : 'bg-gradient-to-r from-blue-300 to-cyan-200 text-gray-900 font-bold scale-105'
                    : ''
                }`}
              >
                {word}{' '}
              </span>
            );
          })}
        </span>
      </div>
    );
  };

  /**
   * Render single page
   */
  const renderPage = (pageVerses: Verse[], pageIndex: number, side: 'left' | 'right') => {
    const lang = side === 'left' ? 'en' : 'fa';
    const isRTL = lang === 'fa';

    return (
      <div
        key={`page-${pageIndex}-${side}`}
        className="page"
        data-density="soft"
      >
        <div
          className={`page-content h-full flex flex-col p-8 ${
            side === 'left' ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-l from-amber-50 to-white'
          }`}
          style={{
            fontFamily: isRTL ? 'Vazir, Tahoma, Arial' : 'Playfair Display, Georgia, serif',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
        >
          {/* Page Header */}
          <header className="page-header mb-6 pb-3 border-b-2 border-amber-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {chapter.book.names[lang]} {chapter.chapterNumber}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'fa' ? 'صفحه' : 'Page'} {Math.floor(pageIndex / 2) + 1}
            </p>
          </header>

          {/* Verses */}
          <div className="page-verses flex-1 overflow-hidden">
            {pageVerses.map(verse => renderVerse(verse, lang))}
          </div>

          {/* Page Footer */}
          <footer className="page-footer mt-4 pt-3 border-t border-gray-200 text-center">
            <div className="text-xs text-gray-400">
              {lang === 'fa' ? '✦' : '✦'}
            </div>
          </footer>

          {/* Page number at bottom */}
          <div className={`page-number absolute bottom-4 ${side === 'left' ? 'left-4' : 'right-4'} text-sm text-gray-400`}>
            {pageIndex + 1}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Handle page flip
   */
  const handleFlip = (e: any) => {
    setCurrentPage(e.data);
    onPageChange?.(e.data);
  };

  // Navigation controls
  const goToNextPage = () => {
    flipbookRef.current?.pageFlip().flipNext();
  };

  const goToPreviousPage = () => {
    flipbookRef.current?.pageFlip().flipPrev();
  };

  return (
    <div className="bible-flipbook-container relative flex items-center justify-center min-h-screen p-4">
      {/* Cover Page */}
      <div className="flipbook-wrapper" style={{ perspective: '2000px' }}>
        <HTMLFlipBook
          ref={flipbookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={900}
          drawShadow={true}
          flippingTime={800}
          usePortrait={true}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="flipbook"
          style={{
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            borderRadius: '8px'
          }}
        >
          {/* Cover Page */}
          <div className="page cover-page" data-density="hard">
            <div className="h-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex flex-col items-center justify-center text-white p-8">
              <div className="text-6xl mb-6">📖</div>
              <h1 className="text-4xl font-bold mb-4 text-center font-playfair">
                Holy Bible
              </h1>
              <h2 className="text-3xl mb-6 text-center font-vazir">
                کتاب مقدس
              </h2>
              <div className="mt-8 text-center">
                <p className="text-xl font-semibold">{chapter.book.names.en}</p>
                <p className="text-xl font-vazir">{chapter.book.names.fa}</p>
                <p className="text-lg mt-2">Chapter {chapter.chapterNumber}</p>
              </div>
              <div className="mt-12 text-sm opacity-75">
                Swipe or click to begin →
              </div>
            </div>
          </div>

          {/* Content Pages (English on left, Persian on right) */}
          {pages.map((pageVerses, pageIndex) => (
            <React.Fragment key={`spread-${pageIndex}`}>
              {renderPage(pageVerses, pageIndex * 2, 'left')}
              {renderPage(pageVerses, pageIndex * 2 + 1, 'right')}
            </React.Fragment>
          ))}

          {/* Back Cover */}
          <div className="page back-cover" data-density="hard">
            <div className="h-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex flex-col items-center justify-center text-white p-8">
              <div className="text-5xl mb-6">✝</div>
              <h2 className="text-2xl font-bold mb-4">End of Chapter</h2>
              <p className="text-lg opacity-75">
                {chapter.book.names.en} {chapter.chapterNumber}
              </p>
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls */}
      {displayMode !== 'presentation' && (
        <div className="flipbook-controls fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="px-4 py-2 text-gray-700 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
            title="Previous Page"
          >
            ←
          </button>
          <span className="px-4 py-2 text-gray-600 font-semibold">
            {currentPage} / {pages.length * 2 + 2}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= pages.length * 2 + 1}
            className="px-4 py-2 text-gray-700 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
            title="Next Page"
          >
            →
          </button>
        </div>
      )}

      {/* Page flip sound effect (optional) */}
      <audio id="page-flip-sound" preload="auto">
        <source src="/sounds/page-flip.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default BibleFlipbookUnified;
