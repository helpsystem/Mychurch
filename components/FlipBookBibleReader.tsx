import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  BookOpen, ChevronLeft, ChevronRight, Search, Play, Pause, Square, 
  Globe, Bookmark, StickyNote, Highlighter, Save, X, Volume2,
  SkipForward, SkipBack, Settings, Plus, Minus
} from 'lucide-react';
import useBibleTTS from '../hooks/useBibleTTS';
import { api } from '../lib/api';
import BibleAudioPlayer from './BibleAudioPlayer';
import './FlipBookBibleReader.css';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: { en: string; fa: string };
  highlight?: string;
  note?: string;
  bookmarked?: boolean;
}

interface WordHighlight {
  verseNumber: number;
  wordIndex: number;
  word: string;
}

interface ApiBibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament?: 'old' | 'new';
  bookNumber?: number;
}

interface BibleBooksResponse {
  success: boolean;
  books: ApiBibleBook[];
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

const FlipBookBibleReader = () => {
  const { lang } = useLanguage();
  const [books, setBooks] = useState<ApiBibleBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [selectedBookKey, setSelectedBookKey] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingLang, setReadingLang] = useState<'fa' | 'en'>('fa');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isBilingualMode, setIsBilingualMode] = useState(false);
  
  // New features
  const [highlightColor, setHighlightColor] = useState<string>('#ffeb3b');
  const [showNoteModal, setShowNoteModal] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [currentReadingWord, setCurrentReadingWord] = useState<WordHighlight | null>(null);
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  
  const bookRef = useRef<HTMLDivElement>(null);
  const versesPerPage = isBilingualMode ? 7 : 10;
  
  const {
    isPlaying,
    currentVerse,
    speakVerse,
    speakChapter,
    pauseSpeech,
    stopSpeech,
    isSupported
  } = useBibleTTS();

  // Word-by-word reading effect
  const speakVerseWithWordHighlight = async (verseText: string, verseNumber: number, language: 'fa' | 'en') => {
    if (!('speechSynthesis' in window)) {
      alert(language === 'fa' ? 'مرورگر شما از قابلیت روخوانی پشتیبانی نمی‌کند' : 'Your browser does not support text-to-speech');
      return;
    }
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const words = verseText.split(/(\s+)/);
    const utterance = new SpeechSynthesisUtterance(verseText);
    utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
    utterance.rate = readingSpeed;
    
    let currentWordIndex = 0;
    const wordsPerSecond = 2.5 * readingSpeed;
    const msPerWord = 1000 / wordsPerSecond;
    
    utterance.onstart = () => {
      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          const word = words[currentWordIndex].trim();
          if (word) {
            setCurrentReadingWord({ verseNumber, wordIndex: currentWordIndex, word });
          }
          currentWordIndex++;
        } else {
          clearInterval(interval);
          setCurrentReadingWord(null);
        }
      }, msPerWord);
      
      utterance.onend = () => {
        setCurrentReadingWord(null);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setCurrentReadingWord(null);
      };
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Play entire chapter
  const handlePlayChapter = () => {
    if (!verses || verses.length === 0) {
      alert(lang === 'fa' ? 'هیچ آیه‌ای برای خواندن وجود ندارد' : 'No verses to read');
      return;
    }
    
    const versesToRead = verses
      .filter(v => v.text[readingLang] && v.text[readingLang].trim().length > 0)
      .map(v => ({ text: v.text[readingLang], number: v.verse }));
    
    if (versesToRead.length === 0) {
      alert(lang === 'fa' ? 'متن آیات در این زبان موجود نیست' : 'Verse text not available in this language');
      return;
    }
    
    speakChapter(versesToRead, readingLang);
  };

  // Highlight management
  const toggleHighlight = (verseIndex: number, color: string) => {
    setVerses(prev => prev.map((v, i) => 
      i === verseIndex ? { ...v, highlight: v.highlight === color ? undefined : color } : v
    ));
  };

  const toggleBookmark = (verseIndex: number) => {
    setVerses(prev => prev.map((v, i) => 
      i === verseIndex ? { ...v, bookmarked: !v.bookmarked } : v
    ));
  };

  const saveNote = (verseIndex: number) => {
    setVerses(prev => prev.map((v, i) => 
      i === verseIndex ? { ...v, note: noteText || undefined } : v
    ));
    setShowNoteModal(null);
    setNoteText('');
  };

  const openNoteModal = (verseIndex: number) => {
    setShowNoteModal(verseIndex);
    setNoteText(verses[verseIndex]?.note || '');
  };

  // Load books
  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      setBooksLoading(true);
      setBooksError(null);
      try {
        const response = await api.get<BibleBooksResponse>('/api/bible/books');
        if (!response?.success) {
          throw new Error(lang === 'fa' ? 'بارگذاری فهرست کتاب‌ها ناموفق بود.' : 'Failed to load Bible books.');
        }

        if (isMounted) {
          const fetchedBooks = Array.isArray(response.books) ? response.books : [];
          setBooks(fetchedBooks);
          setSelectedBookKey(prev => prev ?? fetchedBooks[0]?.key ?? null);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load Bible books.';
          setBooksError(message);
          setBooks([]);
        }
      } finally {
        if (isMounted) {
          setBooksLoading(false);
        }
      }
    };

    loadBooks();
    return () => { isMounted = false; };
  }, [lang]);

  // Load chapter verses
  useEffect(() => {
    if (!selectedBookKey) return;
    let isMounted = true;

    const loadChapter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<BibleChapterResponse>(`/api/bible/content/${selectedBookKey}/${selectedChapter}`);

        if (!response?.success) {
          throw new Error(lang === 'fa' ? 'بارگذاری آیات با خطا مواجه شد.' : 'Failed to load chapter content.');
        }

        const versesData = response.verses ?? { en: [], fa: [] };
        const verseCount = Math.max(versesData.en?.length ?? 0, versesData.fa?.length ?? 0);

        const normalizedVerses: BibleVerse[] = Array.from({ length: verseCount }, (_, index) => ({
          book: response.book?.name?.en ?? selectedBookKey,
          chapter: response.chapter,
          verse: index + 1,
          text: {
            en: versesData.en?.[index] ?? '',
            fa: versesData.fa?.[index] ?? ''
          }
        }));

        console.log('✅ Verses loaded from API:', {
          book: selectedBookKey,
          chapter: selectedChapter,
          verseCount: normalizedVerses.length,
          firstVerseFa: normalizedVerses[0]?.text.fa,
          firstVerseEn: normalizedVerses[0]?.text.en,
          allVerses: normalizedVerses
        });

        if (isMounted) {
          setVerses(normalizedVerses);
          setCurrentPage(0);
          console.log('✅ State updated: verses set to', normalizedVerses.length, 'items');
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load chapter content.';
          setError(message);
          setVerses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChapter();
    return () => { isMounted = false; };
  }, [selectedBookKey, selectedChapter, lang]);

  const currentBook = books.find(book => book.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;

  const filteredVerses = verses.filter(verse =>
    (verse.text?.[lang] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // تقسیم به صفحات
  const pages: BibleVerse[][] = [];
  for (let i = 0; i < filteredVerses.length; i += versesPerPage) {
    pages.push(filteredVerses.slice(i, i + versesPerPage));
  }

  // صفحه جلد (0) + صفحات محتوا
  const totalPages = pages.length + 1; // +1 for cover page

  // Debug logging
  useEffect(() => {
    console.log('📚 FlipBook Debug:', {
      verses: verses.length,
      filteredVerses: filteredVerses.length,
      contentPages: pages.length,
      totalPagesWithCover: totalPages,
      currentPage,
      selectedBookKey,
      selectedChapter,
      currentPageContent: currentPage > 0 ? pages[currentPage - 1]?.length : 'COVER',
      firstVerse: verses[0]?.text
    });
  }, [verses, filteredVerses, pages.length, currentPage]);

  const flipToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages || isFlipping) return;
    setIsFlipping(true);
    setCurrentPage(pageIndex);
    setTimeout(() => setIsFlipping(false), 800);
  };

  const nextPage = () => flipToPage(currentPage + 1);
  const prevPage = () => flipToPage(currentPage - 1);

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (direction === 'next' && selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  const testamentGroups = {
    old: books.filter(book => book.testament === 'old'),
    new: books.filter(book => book.testament === 'new')
  };

  return (
    <div className="flipbook-container" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flipbook-header">
        <h1 className="flipbook-title">
          {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
        </h1>
        <p className="flipbook-subtitle">
          {lang === 'fa' 
            ? 'تجربه مطالعه کتاب مقدس به شکل کتاب واقعی با افکت برگ زدن' 
            : 'Experience the Bible like a real book with page flipping effect'
          }
        </p>
      </div>

      {/* Controls */}
      <div className="flipbook-controls">
        <div className="controls-grid">
          {/* Book Selection */}
          <div className="control-group">
            <label>{lang === 'fa' ? 'کتاب' : 'Book'}</label>
            <select
              value={selectedBookKey ?? ''}
              onChange={(e) => {
                setSelectedBookKey(e.target.value || null);
                setSelectedChapter(1);
                setCurrentPage(0);
              }}
              disabled={booksLoading}
            >
              <option value="" disabled>
                {booksLoading ? (lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...') : lang === 'fa' ? 'یک کتاب انتخاب کنید' : 'Select a book'}
              </option>
              <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                {testamentGroups.old.map(book => (
                  <option key={book.key} value={book.key}>{book.name[lang]}</option>
                ))}
              </optgroup>
              <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                {testamentGroups.new.map(book => (
                  <option key={book.key} value={book.key}>{book.name[lang]}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Chapter Selection */}
          <div className="control-group">
            <label>{lang === 'fa' ? 'فصل' : 'Chapter'}</label>
            <div className="chapter-controls">
              <button onClick={() => navigateChapter('prev')} disabled={selectedChapter <= 1}>
                <ChevronLeft className="icon" />
              </button>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(parseInt(e.target.value));
                  setCurrentPage(0);
                }}
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(chapter => (
                  <option key={chapter} value={chapter}>
                    {lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
                  </option>
                ))}
              </select>
              <button onClick={() => navigateChapter('next')} disabled={selectedChapter >= maxChapters}>
                <ChevronRight className="icon" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="control-group">
            <label>{lang === 'fa' ? 'جستجو' : 'Search'}</label>
            <div className="search-input">
              <Search className="icon" />
              <input
                type="text"
                placeholder={lang === 'fa' ? 'جستجو در آیات...' : 'Search verses...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Reading Language */}
          <div className="control-group">
            <label>{lang === 'fa' ? 'زبان روخوانی' : 'Reading Language'}</label>
            <select value={readingLang} onChange={(e) => setReadingLang(e.target.value as 'fa' | 'en')}>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Bilingual Mode Toggle */}
          <div className="control-group">
            <label>{lang === 'fa' ? 'حالت نمایش' : 'Display Mode'}</label>
            <button 
              className={`bilingual-toggle ${isBilingualMode ? 'active' : ''}`}
              onClick={() => setIsBilingualMode(!isBilingualMode)}
              title={lang === 'fa' ? 'نمایش دو زبانه (فارسی و انگلیسی)' : 'Bilingual Display (Persian & English)'}
            >
              <Globe className="icon" />
              {isBilingualMode ? (lang === 'fa' ? 'تک زبانه' : 'Single') : (lang === 'fa' ? 'دوزبانه' : 'Bilingual')}
            </button>
          </div>
        </div>

        {booksError && <div className="error-message">{booksError}</div>}
      </div>

      {/* Bible.com Style Audio Player */}
      {selectedBookKey && currentBook && (
        <BibleAudioPlayer
          book={selectedBookKey}
          chapter={selectedChapter}
          bookName={currentBook.name}
          language={lang}
          onChapterChange={navigateChapter}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3>
            <Settings className="icon" />
            {lang === 'fa' ? 'تنظیمات روخوانی' : 'Reading Settings'}
          </h3>
          <div className="setting-item">
            <span className="setting-label">{lang === 'fa' ? 'سرعت روخوانی' : 'Reading Speed'}</span>
            <div className="setting-control">
              <button onClick={() => setReadingSpeed(Math.max(0.5, readingSpeed - 0.1))}>
                <Minus className="icon" />
              </button>
              <span className="setting-value">{readingSpeed.toFixed(1)}x</span>
              <button onClick={() => setReadingSpeed(Math.min(2.0, readingSpeed + 0.1))}>
                <Plus className="icon" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TTS Controls */}
      {isSupported && verses.length > 0 && (
        <div className="tts-controls">
          <h3>
            <Volume2 className="icon" />
            {lang === 'fa' ? 'کنترل‌های صوتی' : 'Audio Controls'}
          </h3>
          <div className="tts-buttons">
            <button onClick={() => setShowSettings(!showSettings)}>
              <Settings className="icon" />
              {lang === 'fa' ? 'تنظیمات' : 'Settings'}
            </button>
            <button onClick={() => setReadingLang(readingLang === 'fa' ? 'en' : 'fa')}>
              <Globe className="icon" />
              {readingLang === 'fa' ? 'فارسی' : 'English'}
            </button>
            {!isPlaying ? (
              <button onClick={handlePlayChapter} className="play">
                <Play className="icon" /> {lang === 'fa' ? 'خواندن فصل' : 'Read Chapter'}
              </button>
            ) : (
              <button onClick={pauseSpeech} className="pause">
                <Pause className="icon" /> {lang === 'fa' ? 'مکث' : 'Pause'}
              </button>
            )}
            <button onClick={stopSpeech} className="stop">
              <Square className="icon" /> {lang === 'fa' ? 'توقف' : 'Stop'}
            </button>
          </div>
          <div className="current-book">
            {currentBook?.name?.[lang] || selectedBookKey} - {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal !== null && (
        <div className="note-modal-overlay" onClick={() => setShowNoteModal(null)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              <StickyNote className="icon" />
              {lang === 'fa' ? 'یادداشت آیه' : 'Verse Note'}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={lang === 'fa' ? 'یادداشت خود را اینجا بنویسید...' : 'Write your note here...'}
            />
            <div className="note-modal-actions">
              <button className="secondary" onClick={() => setShowNoteModal(null)}>
                <X className="icon" />
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button className="primary" onClick={() => saveNote(showNoteModal)}>
                <Save className="icon" />
                {lang === 'fa' ? 'ذخیره' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flip Book */}
      <div className="book-stage">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {!isLoading && !error && (
          <div className="book-wrapper" ref={bookRef}>
            {/* Navigation Buttons - در فارسی عکس میشن */}
            {/* Left Button */}
            <button 
              className="page-nav-btn left" 
              onClick={lang === 'fa' ? nextPage : prevPage} 
              disabled={lang === 'fa' ? (currentPage >= totalPages - 1 || isFlipping) : (currentPage <= 0 || isFlipping)}
              aria-label={lang === 'fa' ? 'صفحه بعد' : 'Previous Page'}
            >
              {lang === 'fa' ? <ChevronRight className="nav-icon" /> : <ChevronLeft className="nav-icon" />}
            </button>

            {/* The Book */}
            <div className={`book ${isFlipping ? 'flipping' : ''}`}>
              {currentPage === 0 ? (
                // Cover Page
                <div className="page cover-page">
                  <div className="cover-content">
                    <BookOpen className="cover-icon" />
                    <h2>{lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}</h2>
                    <h3>{currentBook?.name?.[lang] || selectedBookKey || (lang === 'fa' ? 'انتخاب نشده' : 'Not Selected')}</h3>
                    <p>{lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}</p>
                    <div className="ornament"></div>
                  </div>
                </div>
              ) : (
                // Content Pages
                <div className="page content-page" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                  <div className="page-inner">
                    {isBilingualMode ? (
                      // ===== BILINGUAL MODE: Two Columns Side by Side =====
                      <div className="bilingual-container">
                        {/* Persian Column (Right Side) */}
                        <div className="bilingual-column persian-column" dir="rtl">
                          <div className="page-header">
                            <span className="page-number">{currentPage}</span>
                            <span className="chapter-info">
                              {currentBook?.name?.fa || selectedBookKey} {selectedChapter}
                            </span>
                          </div>
                          
                          <div className="verses-container">
                            {pages[currentPage - 1]?.map((verse) => {
                              const verseIndex = verses.findIndex(v => v.verse === verse.verse && v.chapter === verse.chapter);
                              const isReading = currentVerse?.number === verse.verse;
                              
                              return (
                                <div 
                                  key={`fa-${verse.verse}`} 
                                  className={`verse ${isReading ? 'reading' : ''} ${verse.bookmarked ? 'bookmarked' : ''} ${verse.highlight ? `highlight-${verse.highlight}` : ''}`}
                                >
                                  <span className="verse-number">{verse.verse}</span>
                                  <p className="verse-text">{verse.text.fa}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Divider Line */}
                        <div className="bilingual-divider"></div>

                        {/* English Column (Left Side) */}
                        <div className="bilingual-column english-column" dir="ltr">
                          <div className="page-header">
                            <span className="chapter-info">
                              {currentBook?.name?.en || selectedBookKey} {selectedChapter}
                            </span>
                            <span className="page-number">{currentPage}</span>
                          </div>
                          
                          <div className="verses-container">
                            {pages[currentPage - 1]?.map((verse) => {
                              const verseIndex = verses.findIndex(v => v.verse === verse.verse && v.chapter === verse.chapter);
                              const isReading = currentVerse?.number === verse.verse;
                              
                              return (
                                <div 
                                  key={`en-${verse.verse}`} 
                                  className={`verse ${isReading ? 'reading' : ''} ${verse.bookmarked ? 'bookmarked' : ''} ${verse.highlight ? `highlight-${verse.highlight}` : ''}`}
                                >
                                  <span className="verse-number">{verse.verse}</span>
                                  <p className="verse-text">{verse.text.en}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // ===== SINGLE LANGUAGE MODE (Original) =====
                      <>
                        <div className="page-header">
                          <span className="page-number">{currentPage}</span>
                          <span className="chapter-info">
                            {currentBook?.name?.[lang] || selectedBookKey} {selectedChapter}
                          </span>
                        </div>
                        
                        <div className="verses-container">
                          {console.log('🔍 Rendering page', currentPage, 'with', pages[currentPage - 1]?.length, 'verses')}
                          {pages[currentPage - 1]?.length > 0 ? (
                            pages[currentPage - 1].map((verse, idx) => {
                          const verseIndex = verses.findIndex(v => v.verse === verse.verse && v.chapter === verse.chapter);
                          const isReading = currentVerse?.number === verse.verse;
                          const hasNote = verse.note && verse.note.length > 0;
                          
                          // Split text into words for word-by-word highlighting
                          const words = verse.text[lang].split(/(\s+)/);
                          
                          return (
                            <div 
                              key={verse.verse} 
                              className={`verse ${isReading ? 'reading' : ''} ${verse.bookmarked ? 'bookmarked' : ''} ${verse.highlight ? `highlight-${verse.highlight}` : ''}`}
                            >
                              <span className="verse-number">{verse.verse}</span>
                              <p className="verse-text">
                                {words.map((word, wordIdx) => {
                                  const isWordActive = currentReadingWord?.verseNumber === verse.verse && 
                                                      currentReadingWord?.wordIndex === wordIdx;
                                  return (
                                    <span 
                                      key={wordIdx} 
                                      className={`word ${isWordActive ? 'active' : ''}`}
                                    >
                                      {word}
                                    </span>
                                  );
                                })}
                              </p>
                              
                              {/* Verse Actions */}
                              <div className="verse-actions">
                                <button
                                  className="verse-action-btn"
                                  onClick={() => speakVerseWithWordHighlight(verse.text[readingLang], verse.verse, readingLang)}
                                  title={lang === 'fa' ? 'خواندن آیه' : 'Read verse'}
                                >
                                  <Play className="icon-sm" />
                                </button>
                                
                                <button
                                  className={`verse-action-btn ${verse.bookmarked ? 'active' : ''}`}
                                  onClick={() => toggleBookmark(verseIndex)}
                                  title={lang === 'fa' ? 'نشانک' : 'Bookmark'}
                                >
                                  <Bookmark className="icon-sm" />
                                </button>
                                
                                <button
                                  className={`verse-action-btn ${hasNote ? 'active' : ''}`}
                                  onClick={() => openNoteModal(verseIndex)}
                                  title={lang === 'fa' ? 'یادداشت' : 'Note'}
                                >
                                  <StickyNote className="icon-sm" />
                                </button>
                                
                                <button
                                  className="verse-action-btn"
                                  onClick={() => toggleHighlight(verseIndex, 'yellow')}
                                  title={lang === 'fa' ? 'هایلایت زرد' : 'Yellow highlight'}
                                >
                                  <Highlighter className="icon-sm" style={{ color: '#fbbf24' }} />
                                </button>
                                
                                <button
                                  className="verse-action-btn"
                                  onClick={() => toggleHighlight(verseIndex, 'green')}
                                  title={lang === 'fa' ? 'هایلایت سبز' : 'Green highlight'}
                                >
                                  <Highlighter className="icon-sm" style={{ color: '#10b981' }} />
                                </button>
                                
                                <button
                                  className="verse-action-btn"
                                  onClick={() => toggleHighlight(verseIndex, 'blue')}
                                  title={lang === 'fa' ? 'هایلایت آبی' : 'Blue highlight'}
                                >
                                  <Highlighter className="icon-sm" style={{ color: '#3b82f6' }} />
                                </button>
                                
                                <button
                                  className="verse-action-btn"
                                  onClick={() => toggleHighlight(verseIndex, 'pink')}
                                  title={lang === 'fa' ? 'هایلایت صورتی' : 'Pink highlight'}
                                >
                                  <Highlighter className="icon-sm" style={{ color: '#ec4899' }} />
                                </button>
                              </div>
                              
                              {/* Note Display */}
                              {hasNote && (
                                <div style={{
                                  marginTop: '0.5rem',
                                  padding: '0.75rem',
                                  background: '#fef3c7',
                                  borderLeft: '3px solid #f59e0b',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  fontStyle: 'italic'
                                }}>
                                  <strong>{lang === 'fa' ? '📝 یادداشت: ' : '📝 Note: '}</strong>
                                  {verse.note}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          <p>⚠️ No verses found for page {currentPage}</p>
                          <p>Total verses: {verses.length}</p>
                          <p>Filtered verses: {filteredVerses.length}</p>
                          <p>Content pages: {pages.length}</p>
                        </div>
                      )}
                    </div>

                    <div className="page-footer">
                      <span>{lang === 'fa' ? `صفحه ${currentPage} از ${totalPages}` : `Page ${currentPage} of ${totalPages}`}</span>
                    </div>
                  </>
                )}

                {/* Next Chapter Button - Show on last page */}
                {currentPage === totalPages - 1 && selectedChapter < maxChapters && (
                      <div className="next-chapter-btn-container">
                        <button 
                          className="next-chapter-btn"
                          onClick={() => navigateChapter('next')}
                        >
                          {lang === 'fa' ? (
                            <>
                              <span>فصل بعد ({selectedChapter + 1})</span>
                              <ChevronLeft className="icon" />
                            </>
                          ) : (
                            <>
                              <span>Next Chapter ({selectedChapter + 1})</span>
                              <ChevronRight className="icon" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Navigation Button */}
            <button 
              className="page-nav-btn right" 
              onClick={lang === 'fa' ? prevPage : nextPage} 
              disabled={lang === 'fa' ? (currentPage <= 0 || isFlipping) : (currentPage >= totalPages - 1 || isFlipping)}
              aria-label={lang === 'fa' ? 'صفحه قبل' : 'Next Page'}
            >
              {lang === 'fa' ? <ChevronLeft className="nav-icon" /> : <ChevronRight className="nav-icon" />}
            </button>
          </div>
        )}
      </div>

      {/* Page Navigation Footer */}
      <div className="navigation-footer">
        {/* در فارسی دکمه‌ها عکس میشن */}
        <button 
          onClick={lang === 'fa' ? nextPage : prevPage} 
          disabled={lang === 'fa' ? (currentPage >= totalPages - 1) : (currentPage <= 0)} 
          className="footer-btn"
        >
          {lang === 'fa' ? <ChevronRight className="icon" /> : <ChevronLeft className="icon" />}
          {lang === 'fa' ? 'صفحه بعد' : 'Previous'}
        </button>
        
        <div className="page-indicator">
          <span className="current">{currentPage === 0 ? (lang === 'fa' ? 'جلد' : 'Cover') : currentPage}</span>
          <span className="separator">/</span>
          <span className="total">{totalPages - 1}</span>
        </div>

        <button 
          onClick={lang === 'fa' ? prevPage : nextPage} 
          disabled={lang === 'fa' ? (currentPage <= 0) : (currentPage >= totalPages - 1)} 
          className="footer-btn"
        >
          {lang === 'fa' ? 'صفحه قبل' : 'Next'}
          {lang === 'fa' ? <ChevronLeft className="icon" /> : <ChevronRight className="icon" />}
        </button>
      </div>

      {/* Chapter Navigation */}
      <div className="chapter-navigation">
        <button onClick={() => navigateChapter('prev')} disabled={selectedChapter <= 1}>
          <ChevronLeft className="icon" />
          {lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
        </button>
        <div className="chapter-info-box">
          {currentBook?.name[lang]} - {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
        </div>
        <button onClick={() => navigateChapter('next')} disabled={selectedChapter >= maxChapters}>
          {lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
          <ChevronRight className="icon" />
        </button>
      </div>
    </div>
  );
};

export default FlipBookBibleReader;
