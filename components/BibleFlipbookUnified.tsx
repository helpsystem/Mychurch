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
  const [dimensions, setDimensions] = useState({ width: 600, height: 850 });

  // Update dimensions based on screen size - LARGER for professional look
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let width, height;
      
      if (displayMode === 'presentation') {
        // Presentation mode: Full screen
        width = screenWidth * 0.48;
        height = screenHeight * 0.9;
      } else if (screenWidth > 1400) {
        // Large desktop: Big book
        width = 650;
        height = 900;
      } else if (screenWidth > 1024) {
        // Medium desktop
        width = 550;
        height = 800;
      } else if (screenWidth > 768) {
        // Tablet landscape
        width = 400;
        height = 650;
      } else {
        // Mobile
        width = screenWidth * 0.45;
        height = screenHeight * 0.75;
      }
      
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [displayMode]);

  /**
   * Create pages from verses
   * Each spread contains: Left page (English) + Right page (Persian)
   */
  const versesPerPage = displayMode === 'presentation' ? 3 : 8;
  const pages: Verse[][] = [];
  
  // Create page pairs (English left, Persian right with same verses)
  for (let i = 0; i < chapter.verses.length; i += versesPerPage) {
    const pageVerses = chapter.verses.slice(i, i + versesPerPage);
    // Push same verses twice: once for English (left), once for Persian (right)
    pages.push(pageVerses); // English page
    pages.push(pageVerses); // Persian page (same content, different language)
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
        className={`verse mb-5 flex items-start gap-3 ${isActive ? 'verse-active' : ''}`}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Verse Number - Smaller and elegant */}
        <span
          className={`verse-number flex-shrink-0 inline-flex items-center justify-center ${
            displayMode === 'presentation' ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm'
          } rounded-full font-bold ${
            isActive
              ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg ring-2 ring-rose-200'
              : 'bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-md'
          }`}
        >
          {verse.number}
        </span>

        {/* Verse Text - Readable size with better fonts */}
        <span 
          className={`verse-text flex-1 leading-relaxed ${
            displayMode === 'presentation' 
              ? 'text-2xl md:text-3xl font-medium' 
              : 'text-base md:text-lg font-normal'
          }`}
          style={{
            fontFamily: isRTL 
              ? '"Vazirmatn", "Segoe UI", Tahoma, sans-serif'
              : '"Crimson Text", "Georgia", "Times New Roman", serif',
            lineHeight: '1.8'
          }}
        >
          {words.map((word, wordIndex) => {
            const isHighlighted = isActive && tts.currentWordIndex === wordIndex;
            
            return (
              <span
                key={`word-${wordIndex}`}
                className={`word inline transition-all duration-200 ${
                  isHighlighted
                    ? 'bg-gradient-to-r from-yellow-300 to-amber-300 text-gray-900 font-semibold px-1 rounded shadow-sm'
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
          className={`page-content h-full flex flex-col ${
            displayMode === 'presentation' ? 'p-12' : 'p-10'
          } bg-gradient-to-br from-slate-50 via-white to-blue-50`}
          style={{
            fontFamily: isRTL 
              ? '"Vazirmatn", "Segoe UI", Tahoma, sans-serif' 
              : '"Crimson Text", "Georgia", "Times New Roman", serif',
            direction: isRTL ? 'rtl' : 'ltr',
            backgroundColor: '#fefefe'
          }}
        >
          {/* Page Header - Clean and elegant */}
          <header className="page-header mb-8 pb-4 border-b-2 border-slate-200">
            <h2 
              className={`${
                displayMode === 'presentation' ? 'text-3xl' : 'text-2xl'
              } font-bold text-slate-800 tracking-tight`}
              style={{
                fontFamily: isRTL 
                  ? '"Vazirmatn", sans-serif' 
                  : '"Playfair Display", Georgia, serif'
              }}
            >
              {chapter.book.names[lang]} {chapter.chapterNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {lang === 'fa' ? 'صفحه' : 'Page'} {Math.floor(pageIndex / 2) + 1}
            </p>
          </header>

          {/* Verses */}
          <div className="page-verses flex-1 overflow-hidden">
            {pageVerses.map(verse => renderVerse(verse, lang))}
          </div>

          {/* Page Footer */}
          <footer className="page-footer mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="text-base text-slate-300">
              ✦
            </div>
          </footer>

          {/* Page number - subtle */}
          <div 
            className={`page-number absolute bottom-4 ${
              side === 'left' ? 'left-4' : 'right-4'
            } text-xs font-medium text-slate-400`}
          >
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
    <div className="bible-flipbook-container relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 p-8">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 30% 30%, rgba(148, 163, 184, 0.1) 0%, transparent 50%),
                         radial-gradient(circle at 70% 70%, rgba(191, 219, 254, 0.1) 0%, transparent 50%)`,
      }}></div>
      
      {/* Flipbook wrapper with enhanced 3D effect */}
      <div className="flipbook-wrapper relative z-10" style={{ perspective: '2500px' }}>
        <HTMLFlipBook
          ref={flipbookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="stretch"
          minWidth={350}
          maxWidth={800}
          minHeight={500}
          maxHeight={1100}
          drawShadow={true}
          flippingTime={600}
          usePortrait={true}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.6}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="flipbook"
          style={{
            margin: '0 auto',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(71, 85, 105, 0.15)',
            borderRadius: '10px',
            filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.12))'
          }}
        >
          {/* Cover Page - Elegant and Readable */}
          <div className="page cover-page" data-density="hard">
            <div className="h-full relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center text-white p-12 overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1px, transparent 1px),
                                 radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
              
              {/* Ornamental top border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              
              {/* Large icon with glow */}
              <div className="text-8xl mb-8 filter drop-shadow-2xl">
                📖
              </div>
              
              {/* Main title - English */}
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-center tracking-wide" 
                  style={{ 
                    fontFamily: '"Playfair Display", Georgia, serif', 
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#f8fafc'
                  }}>
                Holy Bible
              </h1>
              
              {/* Main title - Persian */}
              <h2 className="text-5xl md:text-6xl mb-10 text-center font-bold" 
                  style={{ 
                    fontFamily: '"Vazirmatn", Tahoma, sans-serif', 
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#f8fafc'
                  }}>
                کتاب مقدس
              </h2>
              
              {/* Decorative divider */}
              <div className="w-64 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent mb-10 rounded-full shadow-lg"></div>
              
              {/* Book and chapter info - Clean box */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-12 py-8 border border-white/20 shadow-2xl">
                <p className="text-3xl font-bold mb-2 text-blue-100" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {chapter.book.names.en}
                </p>
                <p className="text-3xl font-bold mb-4 text-blue-100" style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
                  {chapter.book.names.fa}
                </p>
                <p className="text-2xl text-slate-200 font-semibold">
                  Chapter {chapter.chapterNumber}
                </p>
              </div>
              
              {/* Bottom instruction with icon */}
              <div className="absolute bottom-12 left-0 right-0 text-center">
                <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full border border-white/20">
                  <p className="text-base opacity-90 flex items-center gap-3">
                    <span>Swipe or Click to Begin</span>
                    <span className="text-xl animate-bounce">→</span>
                  </p>
                </div>
              </div>
              
              {/* Ornamental bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
          </div>

          {/* Content Pages */}
          {pages.map((pageVerses, pageIndex) => {
            // Determine if this is an even page (left side - English) or odd page (right side - Persian)
            const isLeftPage = pageIndex % 2 === 0;
            const lang = isLeftPage ? 'en' : 'fa';
            const side = isLeftPage ? 'left' : 'right';
            
            return renderPage(pageVerses, pageIndex, side);
          })}

          {/* Back Cover - Clean and Elegant */}
          <div className="page back-cover" data-density="hard">
            <div className="h-full relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center text-white p-12 overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 1px, transparent 1px),
                                 radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
              
              {/* Top border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              
              {/* Icon with glow */}
              <div className="text-7xl mb-8 filter drop-shadow-2xl">
                ✝
              </div>
              
              {/* End message */}
              <h2 className="text-4xl font-bold mb-6 text-center text-slate-100" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                End of Chapter
              </h2>
              
              {/* Decorative line */}
              <div className="w-48 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent mb-8 rounded-full shadow-lg"></div>
              
              {/* Chapter info box */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-10 py-6 border border-white/20 shadow-xl">
                <p className="text-2xl font-semibold text-blue-100 mb-2">
                  {chapter.book.names.en} {chapter.chapterNumber}
                </p>
                <p className="text-2xl font-semibold text-blue-100">
                  {chapter.book.names.fa} {chapter.chapterNumber}
                </p>
              </div>
              
              {/* Quote or verse count */}
              <div className="mt-12 text-center opacity-75">
                <p className="text-base italic text-slate-300">
                  {chapter.verses.length} verses completed
                </p>
              </div>
              
              {/* Bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls - Clean & Modern */}
      {displayMode !== 'presentation' && (
        <div className="flipbook-controls fixed bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-white backdrop-blur-md rounded-full px-8 py-4 shadow-2xl border border-slate-200 z-50">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="group flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:scale-100"
            title="Previous Page"
          >
            <span className="text-xl font-bold group-hover:-translate-x-0.5 transition-transform">←</span>
          </button>
          
          <div className="flex items-center gap-2 px-3">
            <span className="text-xl font-bold text-slate-800">
              {Math.floor(currentPage / 2)}
            </span>
            <span className="text-lg text-slate-400">/</span>
            <span className="text-xl font-semibold text-slate-600">
              {Math.floor(pages.length / 2)}
            </span>
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage >= pages.length + 1}
            className="group flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:scale-100"
            title="Next Page"
          >
            <span className="text-xl font-bold group-hover:translate-x-0.5 transition-transform">→</span>
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
