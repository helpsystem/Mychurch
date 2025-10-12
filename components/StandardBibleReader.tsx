import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  BookOpen, ChevronLeft, ChevronRight, ChevronDown, Search, 
  Volume2, VolumeX, Globe, ZoomIn, ZoomOut, Settings,
  Bookmark, BookmarkPlus, Menu
} from 'lucide-react';
import { api } from '../lib/api';
import './StandardBibleReader.css';

interface ApiBibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament?: 'old' | 'new';
}

interface BibleChapterResponse {
  success: boolean;
  book: { key: string; name: { en: string; fa: string } };
  chapter: number;
  verses: {
    en: string[];
    fa: string[];
  };
}

const StandardBibleReader: React.FC = () => {
  const { lang } = useLanguage();
  
  // State
  const [books, setBooks] = useState<ApiBibleBook[]>([]);
  const [selectedBookKey, setSelectedBookKey] = useState<string>('genesis');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<{ en: string[]; fa: string[] }>({ en: [], fa: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [bilingualMode, setBilingualMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isReading, setIsReading] = useState(false);
  const [showBookMenu, setShowBookMenu] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const bookMenuRef = useRef<HTMLDivElement>(null);
  const chapterMenuRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await api.get<{ success: boolean; books: ApiBibleBook[] }>('/api/bible/books');
        if (response?.success && response.books) {
          setBooks(response.books);
        }
      } catch (err) {
        console.error('Error loading books:', err);
      }
    };
    loadBooks();
  }, []);

  // Load chapter
  useEffect(() => {
    const loadChapter = async () => {
      if (!selectedBookKey) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.get<BibleChapterResponse>(
          `/api/bible/content/${selectedBookKey}/${selectedChapter}`
        );
        
        if (response?.success && response.verses) {
          setVerses(response.verses);
        } else {
          throw new Error('Failed to load chapter');
        }
      } catch (err) {
        setError(lang === 'fa' ? 'خطا در بارگذاری فصل' : 'Error loading chapter');
        console.error('Error loading chapter:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChapter();
  }, [selectedBookKey, selectedChapter, lang]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bookMenuRef.current && !bookMenuRef.current.contains(event.target as Node)) {
        setShowBookMenu(false);
      }
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(event.target as Node)) {
        setShowChapterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentBook = books.find(book => book.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;

  const filteredBooks = books.filter(book => {
    if (!searchTerm) return true;
    const bookName = book.name[lang].toLowerCase();
    return bookName.includes(searchTerm.toLowerCase());
  });

  const handleBookSelect = (bookKey: string) => {
    setSelectedBookKey(bookKey);
    setSelectedChapter(1);
    setShowBookMenu(false);
    setSearchTerm('');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setShowChapterMenu(false);
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Go to previous book's last chapter
      const currentIndex = books.findIndex(b => b.key === selectedBookKey);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBookKey(prevBook.key);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Go to next book's first chapter
      const currentIndex = books.findIndex(b => b.key === selectedBookKey);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBookKey(nextBook.key);
        setSelectedChapter(1);
      }
    }
  };

  const handleReadAloud = () => {
    if (!speechSynthesis) return;

    if (isReading) {
      speechSynthesis.cancel();
      setIsReading(false);
    } else {
      const textToRead = verses[lang].join(' ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsReading(false);
      speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  return (
    <div className="standard-bible-reader">
      {/* Header Controls */}
      <div className="bible-header">
        <div className="bible-header-content">
          <div className="bible-title">
            <BookOpen className="bible-icon" />
            <h1>{lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}</h1>
          </div>

          {/* Book Selector */}
          <div className="selector-group" ref={bookMenuRef}>
            <button 
              className="selector-button"
              onClick={() => setShowBookMenu(!showBookMenu)}
            >
              <span>{currentBook?.name[lang] || (lang === 'fa' ? 'انتخاب کتاب' : 'Select Book')}</span>
              <ChevronDown className="selector-icon" />
            </button>
            
            {showBookMenu && (
              <div className="selector-dropdown">
                <div className="dropdown-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder={lang === 'fa' ? 'جستجوی کتاب...' : 'Search book...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="dropdown-items">
                  {filteredBooks.map(book => (
                    <button
                      key={book.key}
                      className={`dropdown-item ${selectedBookKey === book.key ? 'active' : ''}`}
                      onClick={() => handleBookSelect(book.key)}
                    >
                      {book.name[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chapter Selector */}
          <div className="selector-group" ref={chapterMenuRef}>
            <button 
              className="selector-button"
              onClick={() => setShowChapterMenu(!showChapterMenu)}
            >
              <span>{lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}</span>
              <ChevronDown className="selector-icon" />
            </button>
            
            {showChapterMenu && (
              <div className="selector-dropdown chapters">
                <div className="chapter-grid">
                  {Array.from({ length: maxChapters }, (_, i) => i + 1).map(chapter => (
                    <button
                      key={chapter}
                      className={`chapter-item ${selectedChapter === chapter ? 'active' : ''}`}
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="header-controls">
            <button
              className="control-button"
              onClick={() => setBilingualMode(!bilingualMode)}
              title={lang === 'fa' ? 'حالت دوزبانه' : 'Bilingual Mode'}
            >
              <Globe size={20} />
              {bilingualMode && <span className="active-indicator"></span>}
            </button>
            
            <button
              className="control-button"
              onClick={decreaseFontSize}
              title={lang === 'fa' ? 'کوچک‌تر' : 'Smaller'}
            >
              <ZoomOut size={20} />
            </button>
            
            <span className="font-size-display">{fontSize}</span>
            
            <button
              className="control-button"
              onClick={increaseFontSize}
              title={lang === 'fa' ? 'بزرگ‌تر' : 'Larger'}
            >
              <ZoomIn size={20} />
            </button>
            
            <button
              className="control-button"
              onClick={handleReadAloud}
              title={lang === 'fa' ? 'خواندن صوتی' : 'Read Aloud'}
            >
              {isReading ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bible-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : bilingualMode ? (
          /* Bilingual View - Two Columns */
          <div className="bilingual-view">
            <div className="bilingual-column farsi-column">
              <h2 className="column-title">فارسی</h2>
              <div className="verses-container" style={{ fontSize: `${fontSize}px` }}>
                {verses.fa.map((verse, index) => (
                  <div key={index} className="verse-item">
                    <span className="verse-number">{index + 1}</span>
                    <p className="verse-text">{verse}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bilingual-divider"></div>
            
            <div className="bilingual-column english-column">
              <h2 className="column-title">English</h2>
              <div className="verses-container" style={{ fontSize: `${fontSize}px` }}>
                {verses.en.map((verse, index) => (
                  <div key={index} className="verse-item">
                    <span className="verse-number">{index + 1}</span>
                    <p className="verse-text">{verse}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Single Language View */
          <div className="single-view">
            <div className="verses-container" style={{ fontSize: `${fontSize}px` }}>
              {verses[lang]?.map((verse, index) => (
                <div key={index} className="verse-item">
                  <span className="verse-number">{index + 1}</span>
                  <p className="verse-text">{verse}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bible-footer">
        <button 
          className="nav-button prev"
          onClick={handlePrevChapter}
          disabled={selectedBookKey === books[0]?.key && selectedChapter === 1}
        >
          <ChevronRight className="nav-icon" />
          <span>{lang === 'fa' ? 'فصل قبل' : 'Previous'}</span>
        </button>

        <div className="chapter-info">
          <p className="book-name">{currentBook?.name[lang]}</p>
          <p className="chapter-number">
            {lang === 'fa' ? `فصل ${selectedChapter} از ${maxChapters}` : `Chapter ${selectedChapter} of ${maxChapters}`}
          </p>
        </div>

        <button 
          className="nav-button next"
          onClick={handleNextChapter}
          disabled={selectedBookKey === books[books.length - 1]?.key && selectedChapter === maxChapters}
        >
          <span>{lang === 'fa' ? 'فصل بعد' : 'Next'}</span>
          <ChevronLeft className="nav-icon" />
        </button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="shortcuts-hint">
        <kbd>←</kbd> {lang === 'fa' ? 'فصل بعد' : 'Next'} | 
        <kbd>→</kbd> {lang === 'fa' ? 'فصل قبل' : 'Previous'} |
        <kbd>+</kbd> {lang === 'fa' ? 'بزرگ‌تر' : 'Zoom In'} |
        <kbd>-</kbd> {lang === 'fa' ? 'کوچک‌تر' : 'Zoom Out'}
      </div>
    </div>
  );
};

export default StandardBibleReader;
