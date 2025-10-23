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
        className={`verse mb-6 ${isActive ? 'verse-active' : ''}`}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Verse Number */}
        <span
          className={`verse-number inline-flex items-center justify-center ${
            displayMode === 'presentation' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'
          } rounded-full font-bold ${isRTL ? 'ml-3' : 'mr-3'} ${
            isActive
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl ring-4 ring-amber-200'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 shadow-md'
          }`}
          style={{ flexShrink: 0 }}
        >
          {verse.number}
        </span>

        {/* Verse Text */}
        <span className={`verse-text inline leading-relaxed ${
          displayMode === 'presentation' 
            ? 'text-4xl md:text-5xl lg:text-6xl font-semibold' 
            : 'text-xl md:text-2xl font-normal'
        }`}>
          {words.map((word, wordIndex) => {
            const isHighlighted = isActive && tts.currentWordIndex === wordIndex;
            
            return (
              <span
                key={`word-${wordIndex}`}
                className={`word inline-block transition-all duration-200 px-1 ${
                  isHighlighted
                    ? lang === 'fa'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-900 font-bold scale-110 shadow-lg rounded px-2'
                      : 'bg-gradient-to-r from-blue-400 to-cyan-300 text-gray-900 font-bold scale-110 shadow-lg rounded px-2'
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
          } ${
            side === 'left' 
              ? 'bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20' 
              : 'bg-gradient-to-bl from-white via-amber-50/30 to-orange-50/20'
          } shadow-inner`}
          style={{
            fontFamily: isRTL 
              ? 'Vazir, "Segoe UI", Tahoma, Arial, sans-serif' 
              : '"Playfair Display", "Georgia", "Times New Roman", serif',
            direction: isRTL ? 'rtl' : 'ltr',
            backgroundImage: `
              linear-gradient(to bottom, rgba(251, 191, 36, 0.03) 1px, transparent 1px),
              linear-gradient(to right, rgba(251, 191, 36, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Page Header */}
          <header className="page-header mb-8 pb-4 border-b-2 border-gradient-to-r from-amber-300 via-orange-400 to-amber-300">
            <h2 className={`${
              displayMode === 'presentation' ? 'text-4xl' : 'text-3xl'
            } font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent`}>
              {chapter.book.names[lang]} {chapter.chapterNumber}
            </h2>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              {lang === 'fa' ? '📖 صفحه' : '📖 Page'} {Math.floor(pageIndex / 2) + 1}
            </p>
          </header>

          {/* Verses */}
          <div className="page-verses flex-1 overflow-hidden space-y-4">
            {pageVerses.map(verse => renderVerse(verse, lang))}
          </div>

          {/* Page Footer */}
          <footer className="page-footer mt-6 pt-4 border-t-2 border-amber-200/50 text-center">
            <div className="text-lg text-amber-600/40">
              ✦ ✦ ✦
            </div>
          </footer>

          {/* Page number at bottom - elegant */}
          <div 
            className={`page-number absolute bottom-6 ${
              side === 'left' ? 'left-6' : 'right-6'
            } text-base font-semibold text-amber-700/60 bg-white/50 px-3 py-1 rounded-full shadow-sm`}
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
    <div className="bible-flipbook-container relative flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 p-8">
      {/* Ambient background pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.15) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)`,
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
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 15px 40px rgba(251, 146, 60, 0.2)',
            borderRadius: '12px',
            filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))'
          }}
        >
          {/* Cover Page - Professional & Beautiful */}
          <div className="page cover-page" data-density="hard">
            <div className="h-full relative bg-gradient-to-br from-amber-900 via-orange-800 to-amber-900 flex flex-col items-center justify-center text-white p-12 overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 1px, transparent 1px),
                                 radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
              
              {/* Ornamental top border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              
              {/* Large icon with glow */}
              <div className="text-8xl mb-8 filter drop-shadow-2xl animate-pulse-slow">
                📖
              </div>
              
              {/* Main title - English */}
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-center tracking-wide" 
                  style={{ fontFamily: '"Playfair Display", Georgia, serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                Holy Bible
              </h1>
              
              {/* Main title - Persian */}
              <h2 className="text-5xl md:text-6xl mb-10 text-center font-bold" 
                  style={{ fontFamily: 'Vazir, Tahoma, sans-serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                کتاب مقدس
              </h2>
              
              {/* Decorative divider */}
              <div className="w-64 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-10 rounded-full"></div>
              
              {/* Book and chapter info - Elegant box */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-12 py-8 border-2 border-amber-400/30 shadow-2xl">
                <p className="text-3xl font-bold mb-2 text-amber-100" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {chapter.book.names.en}
                </p>
                <p className="text-3xl font-bold mb-4 text-amber-100" style={{ fontFamily: 'Vazir, sans-serif' }}>
                  {chapter.book.names.fa}
                </p>
                <p className="text-2xl text-amber-200 font-semibold">
                  Chapter {chapter.chapterNumber}
                </p>
              </div>
              
              {/* Bottom instruction with icon */}
              <div className="absolute bottom-12 left-0 right-0 text-center">
                <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full border border-white/20">
                  <p className="text-lg opacity-90 flex items-center gap-3">
                    <span>Swipe or Click to Begin</span>
                    <span className="text-2xl animate-bounce">→</span>
                  </p>
                </div>
              </div>
              
              {/* Ornamental bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
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

          {/* Back Cover - Professional */}
          <div className="page back-cover" data-density="hard">
            <div className="h-full relative bg-gradient-to-br from-amber-900 via-orange-800 to-amber-900 flex flex-col items-center justify-center text-white p-12 overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 1px, transparent 1px),
                                 radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
              
              {/* Top border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              
              {/* Icon with glow */}
              <div className="text-7xl mb-8 filter drop-shadow-2xl">
                ✝
              </div>
              
              {/* End message */}
              <h2 className="text-4xl font-bold mb-6 text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                End of Chapter
              </h2>
              
              {/* Decorative line */}
              <div className="w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-8 rounded-full"></div>
              
              {/* Chapter info box */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-10 py-6 border border-amber-400/30 shadow-xl">
                <p className="text-2xl font-semibold text-amber-100 mb-2">
                  {chapter.book.names.en} {chapter.chapterNumber}
                </p>
                <p className="text-2xl font-semibold text-amber-100">
                  {chapter.book.names.fa} {chapter.chapterNumber}
                </p>
              </div>
              
              {/* Quote or verse count */}
              <div className="mt-12 text-center opacity-75">
                <p className="text-lg italic">
                  {chapter.verses.length} verses completed
                </p>
              </div>
              
              {/* Bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls - Professional & Beautiful */}
      {displayMode !== 'presentation' && (
        <div className="flipbook-controls fixed bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-gradient-to-r from-amber-50 via-white to-amber-50 backdrop-blur-md rounded-full px-8 py-4 shadow-2xl border-2 border-amber-200/50 z-50">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:scale-100"
            title="Previous Page"
          >
            <span className="text-2xl font-bold group-hover:-translate-x-1 transition-transform">←</span>
          </button>
          
          <div className="flex items-center gap-3 px-4">
            <span className="text-2xl font-bold text-amber-700">
              {Math.floor(currentPage / 2)}
            </span>
            <span className="text-xl text-gray-400">/</span>
            <span className="text-2xl font-semibold text-gray-600">
              {Math.floor(pages.length / 2)}
            </span>
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage >= pages.length + 1}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:scale-100"
            title="Next Page"
          >
            <span className="text-2xl font-bold group-hover:translate-x-1 transition-transform">→</span>
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
