import React, { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useBibleReader } from '../hooks/useBibleReader';
import { BibleVerse, BibleBook } from '../types/bible';
import '../styles/flipbook.css';

interface BibleFlipbookProps {
  language?: 'en' | 'fa';
  initialBook?: string;
  initialChapter?: number;
  onLanguageChange?: (lang: 'en' | 'fa') => void;
}

export const BibleFlipbook: React.FC<BibleFlipbookProps> = ({
  language = 'en',
  initialBook = 'GEN',
  initialChapter = 1,
  onLanguageChange
}) => {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    books,
    verses,
    currentVerse,
    isPlaying,
    loadChapter,
    play,
    pause,
    stop,
    setLanguage,
    highlightedWordIndex
  } = useBibleReader();

  // Load initial chapter
  useEffect(() => {
    loadChapter(selectedBook, selectedChapter, language);
  }, [selectedBook, selectedChapter, language]);

  // Auto flip page when chapter changes
  useEffect(() => {
    if (bookRef.current) {
      const pageIndex = Math.floor(currentVerse / 2); // 2 verses per page spread
      bookRef.current.pageFlip().flip(pageIndex);
    }
  }, [currentVerse]);

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const handleBookChange = (bookCode: string) => {
    setSelectedBook(bookCode);
    setSelectedChapter(1);
    stop();
  };

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    stop();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fa' : 'en';
    setLanguage(newLang);
    onLanguageChange?.(newLang);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Split verses into page pairs (left: English, right: Persian)
  const pages = [];
  
  // Cover page
  pages.push(
    <div key="cover" className="bible-page cover-page">
      <div className="cover-content">
        <h1 className="cover-title-en">Holy Bible</h1>
        <h1 className="cover-title-fa">کتاب مقدس</h1>
        <div className="cover-ornament">✟</div>
      </div>
    </div>
  );

  // Content pages
  const versesPerPage = language === 'en' ? 10 : 8; // Persian needs more space
  for (let i = 0; i < verses.length; i += versesPerPage) {
    const pageVerses = verses.slice(i, i + versesPerPage);
    
    pages.push(
      <div key={`page-${i}`} className={`bible-page ${language === 'fa' ? 'rtl' : 'ltr'}`}>
        <div className="page-header">
          <span className="book-name">
            {books.find(b => b.code === selectedBook)?.name[language]}
          </span>
          <span className="chapter-number">
            {language === 'fa' ? 'فصل' : 'Chapter'} {selectedChapter}
          </span>
        </div>
        <div className="verses-container">
          {pageVerses.map((verse, idx) => (
            <div
              key={verse.id}
              className={`verse ${currentVerse === verse.verse_number ? 'active' : ''}`}
            >
              <sup className="verse-number">{verse.verse_number}</sup>
              <span className="verse-text">
                {verse.verse_text.split(' ').map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className={`word ${
                      currentVerse === verse.verse_number && 
                      wordIdx === highlightedWordIndex
                        ? 'highlighted'
                        : ''
                    }`}
                  >
                    {word}{' '}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="page-number">{Math.floor(i / versesPerPage) + 1}</div>
      </div>
    );
  }

  return (
    <div className={`bible-flipbook-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Control Bar */}
      <div className="bible-controls">
        <div className="controls-left">
          <select
            value={selectedBook}
            onChange={(e) => handleBookChange(e.target.value)}
            className="book-selector"
          >
            {books.map((book) => (
              <option key={book.code} value={book.code}>
                {book.name[language]}
              </option>
            ))}
          </select>

          <select
            value={selectedChapter}
            onChange={(e) => handleChapterChange(parseInt(e.target.value))}
            className="chapter-selector"
          >
            {Array.from(
              { length: books.find(b => b.code === selectedBook)?.chapters || 1 },
              (_, i) => i + 1
            ).map((ch) => (
              <option key={ch} value={ch}>
                {language === 'fa' ? `فصل ${ch}` : `Ch. ${ch}`}
              </option>
            ))}
          </select>
        </div>

        <div className="controls-center">
          <button onClick={togglePlayPause} className="btn-play-pause">
            {isPlaying ? (
              <span className="icon">⏸</span>
            ) : (
              <span className="icon">▶</span>
            )}
          </button>
          <button onClick={stop} className="btn-stop">
            <span className="icon">⏹</span>
          </button>
        </div>

        <div className="controls-right">
          <button onClick={toggleLanguage} className="btn-language">
            {language === 'en' ? 'فارسی' : 'English'}
          </button>
          <button onClick={toggleFullscreen} className="btn-fullscreen">
            <span className="icon">{isFullscreen ? '⛶' : '⛶'}</span>
          </button>
        </div>
      </div>

      {/* Flipbook */}
      <div className="bible-book-wrapper">
        <HTMLFlipBook
          ref={bookRef}
          width={450}
          height={650}
          size="stretch"
          minWidth={300}
          maxWidth={500}
          minHeight={400}
          maxHeight={700}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="bible-flipbook"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((page) => page)}
        </HTMLFlipBook>
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="playback-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentVerse / verses.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            {language === 'fa' ? 'آیه' : 'Verse'} {currentVerse} / {verses.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleFlipbook;
