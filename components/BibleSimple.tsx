/**
 * Bible Simple Mode Component
 * 
 * Clean scroll-based reading interface
 * Features:
 * - Verse-by-verse display
 * - RTL/LTR support
 * - Word-level highlighting during TTS playback
 * - Smooth animations
 * - Responsive design
 */

import React, { useRef, useEffect } from 'react';
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

interface BibleSimpleProps {
  chapter: Chapter;
  language: Language;
  displayMode: DisplayMode;
  tts: TTSState & {
    playVerse: (verseNumber: number, language: Language, verseData: any) => Promise<void>;
  };
  onVerseClick?: (verseNumber: number) => void;
}

const BibleSimple: React.FC<BibleSimpleProps> = ({
  chapter,
  language,
  displayMode,
  tts,
  onVerseClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeVerseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active verse
  useEffect(() => {
    if (tts.currentVerse && activeVerseRef.current) {
      activeVerseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [tts.currentVerse]);

  // Determine text direction
  const isRTL = language === 'fa';

  /**
   * Render single verse with word highlighting
   */
  const renderVerse = (verse: Verse) => {
    const isActive = tts.currentVerse === verse.number;
    const text = verse.text[language];
    const words = text.split(/\s+/).filter(w => w.length > 0);

    return (
      <div
        key={verse.id}
        ref={isActive ? activeVerseRef : null}
        className={`verse-item group mb-6 transition-all duration-300 ${
          isActive ? 'verse-active' : ''
        }`}
        onClick={() => onVerseClick?.(verse.number)}
      >
        {/* Verse Number */}
        <div className="flex gap-4 items-start">
          <div
            className={`verse-number flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 cursor-pointer ${
              isActive
                ? displayMode === 'presentation'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                  : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                : displayMode === 'presentation'
                ? 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
                : 'bg-gradient-to-br from-amber-100 to-stone-200 text-gray-700 group-hover:from-amber-200 group-hover:to-stone-300'
            }`}
          >
            {verse.number}
          </div>

          {/* Verse Text with Word Highlighting */}
          <div
            className={`verse-text flex-1 ${
              displayMode === 'presentation'
                ? 'text-white text-4xl md:text-5xl lg:text-7xl leading-tight font-semibold'
                : 'text-gray-800 text-lg md:text-xl lg:text-2xl leading-relaxed'
            }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {words.map((word, wordIndex) => {
              const isHighlighted = isActive && tts.currentWordIndex === wordIndex;
              
              return (
                <span
                  key={`${verse.id}-word-${wordIndex}`}
                  className={`word inline-block transition-all duration-150 px-1 py-0.5 rounded ${
                    isHighlighted
                      ? language === 'fa'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-900 font-bold scale-110 shadow-md'
                        : 'bg-gradient-to-r from-blue-400 to-cyan-300 text-gray-900 font-bold scale-110 shadow-md'
                      : 'hover:bg-gray-100/50'
                  }`}
                  style={{
                    animationDelay: `${wordIndex * 50}ms`
                  }}
                >
                  {word}{' '}
                </span>
              );
            })}
          </div>
        </div>

        {/* Hover Play Button */}
        {!isActive && displayMode !== 'presentation' && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerseClick?.(verse.number);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span>▶</span>
              <span>{language === 'fa' ? 'پخش آیه' : 'Play Verse'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Container classes based on display mode
  const containerClasses = [
    'bible-simple-container',
    'w-full',
    'min-h-screen',
    displayMode === 'presentation'
      ? 'p-8 md:p-16 lg:p-24'
      : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'
  ].join(' ');

  const contentClasses = [
    'bible-simple-content',
    'rounded-2xl',
    'p-6 md:p-8 lg:p-12',
    displayMode === 'presentation'
      ? 'bg-transparent'
      : 'bg-white/80 backdrop-blur-sm shadow-2xl border border-amber-200/50',
    'transition-all duration-300'
  ].join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      <div className={contentClasses}>
        {/* Chapter Header */}
        {displayMode !== 'presentation' && (
          <header className="mb-8 pb-6 border-b-2 border-gradient-to-r from-amber-200 to-stone-200">
            <h1
              className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${
                language === 'fa'
                  ? 'font-vazir text-right'
                  : 'font-playfair'
              }`}
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {chapter.book.names[language]} {chapter.chapterNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {chapter.verses.length} {language === 'fa' ? 'آیه' : 'verses'}
            </p>
          </header>
        )}

        {/* Verses */}
        <div className="verses-container space-y-4">
          {chapter.verses.map(renderVerse)}
        </div>

        {/* Chapter Footer (Navigation hint) */}
        {displayMode !== 'presentation' && (
          <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className={language === 'fa' ? 'font-vazir' : ''}>
              {language === 'fa'
                ? 'برای رفتن به فصل بعد/قبل از کلیدهای جهت‌دار استفاده کنید'
                : 'Use arrow keys to navigate between chapters'}
            </p>
          </footer>
        )}
      </div>

      {/* Parchment texture overlay (subtle) */}
      {displayMode !== 'presentation' && (
        <div
          className="fixed inset-0 pointer-events-none opacity-5 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />
      )}
    </div>
  );
};

export default BibleSimple;
