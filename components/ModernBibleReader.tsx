import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Volume2, VolumeX, Globe, Bookmark, StickyNote, X, ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import './ModernBibleReader.css';

interface ApiBibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament?: 'old' | 'new';
  bookNumber?: number;
}

interface BibleVerse {
  verse: number;
  text: { en: string; fa: string };
}

const ModernBibleReader = () => {
  const { lang } = useLanguage();
  
  // States
  const [books, setBooks] = useState<ApiBibleBook[]>([]);
  const [selectedBookKey, setSelectedBookKey] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isBilingual, setIsBilingual] = useState(true); // Start with bilingual mode
  const [readingLang, setReadingLang] = useState<'fa' | 'en'>('fa');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Load books
  useEffect(() => {
    loadBooks();
  }, []);
  
  // Load chapter when book/chapter changes
  useEffect(() => {
    if (selectedBookKey && selectedChapter) {
      loadChapter();
    }
  }, [selectedBookKey, selectedChapter]);
  
  const loadBooks = async () => {
    try {
      const response = await api.get('/api/bible/books');
      console.log('📖 Books API Response:', response);
      if (response?.success && response.books && response.books.length > 0) {
        console.log('📚 First book sample:', response.books[0]);
        console.log('📊 Total books:', response.books.length);
        setBooks(response.books);
        // Auto-select first book if none selected
        if (!selectedBookKey || selectedBookKey === '') {
          const firstBook = response.books[0];
          setSelectedBookKey(firstBook.key);
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };
  
  const loadChapter = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/bible/content/${selectedBookKey}/${selectedChapter}`);
      if (response?.success) {
        const versesData: BibleVerse[] = response.verses.fa.map((faText: string, index: number) => ({
          verse: index + 1,
          text: {
            fa: faText,
            en: response.verses.en[index] || ''
          }
        }));
        setVerses(versesData);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentBook = books.find(b => b.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;
  
  const goToNextChapter = () => {
    if (selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const increaseFontSize = () => setFontSize(Math.min(fontSize + 2, 32));
  const decreaseFontSize = () => setFontSize(Math.max(fontSize - 2, 14));
  
  const speakChapter = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const text = verses.map(v => `${v.verse}. ${v.text[readingLang]}`).join(' ');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = readingLang === 'fa' ? 'fa-IR' : 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };
  
  return (
    <div className="modern-bible-reader">
      {/* Header */}
      <div className="bible-header">
        <div className="bible-header-content">
          <div className="bible-title">
            <BookOpen className="bible-icon" />
            <h1>{lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}</h1>
          </div>
          
          {/* Controls */}
          <div className="bible-controls">
            {/* Book Selector */}
            <select 
              value={selectedBookKey}
              onChange={(e) => {
                console.log('📖 Selected book:', e.target.value);
                setSelectedBookKey(e.target.value);
                setSelectedChapter(1);
              }}
              className="bible-select"
            >
              <option value="">{lang === 'fa' ? 'انتخاب کتاب' : 'Select Book'}</option>
              <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                {books.filter(b => b.testament && b.testament.toLowerCase() === 'old').map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name[lang]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                {books.filter(b => b.testament && b.testament.toLowerCase() === 'new').map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name[lang]}
                  </option>
                ))}
              </optgroup>
            </select>
            
            {/* Chapter Selector */}
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="bible-select"
            >
              {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
                <option key={ch} value={ch}>
                  {lang === 'fa' ? `فصل ${ch}` : `Chapter ${ch}`}
                </option>
              ))}
            </select>
            
            {/* View Options */}
            <div className="bible-options">
              <button
                onClick={() => setIsBilingual(!isBilingual)}
                className={`option-btn ${isBilingual ? 'active' : ''}`}
                title={lang === 'fa' ? 'نمایش دو زبانه' : 'Bilingual View'}
              >
                <Globe size={20} />
              </button>
              
              <button
                onClick={decreaseFontSize}
                className="option-btn"
                title={lang === 'fa' ? 'کوچک‌تر' : 'Smaller'}
              >
                <ZoomOut size={20} />
              </button>
              
              <span className="font-size-display">{fontSize}</span>
              
              <button
                onClick={increaseFontSize}
                className="option-btn"
                title={lang === 'fa' ? 'بزرگ‌تر' : 'Larger'}
              >
                <ZoomIn size={20} />
              </button>
              
              <button
                onClick={speakChapter}
                className={`option-btn ${isSpeaking ? 'active' : ''}`}
                title={lang === 'fa' ? 'روخوانی' : 'Read Aloud'}
              >
                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="bible-content">
        {isLoading ? (
          <div className="bible-loading">
            <div className="spinner"></div>
            <p>{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
          </div>
        ) : verses.length > 0 ? (
          <div>
            {/* Chapter Title */}
            <div className="chapter-title">
              <h2>{currentBook?.name[lang]} - {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}</h2>
            </div>
            
            {/* Verses */}
            <div className={`verses-container ${isBilingual ? 'bilingual' : 'single'}`}>
              {isBilingual ? (
                /* Bilingual Mode - Side by Side Verses */
                <div className="bilingual-wrapper" style={{ fontSize: `${fontSize}px` }}>
                  {verses.map((verse) => (
                    <div key={verse.verse} className="verse-row-bilingual">
                      <div className="verse-side verse-fa">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="verse-text">{verse.text.fa}</span>
                      </div>
                      <div className="verse-divider"></div>
                      <div className="verse-side verse-en">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="verse-text">{verse.text.en}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Language Mode */
                <div className="single-lang-wrapper" style={{ fontSize: `${fontSize}px` }}>
                  {verses.map((verse) => (
                    <div 
                      key={verse.verse} 
                      className="verse-item"
                      dir={readingLang === 'fa' ? 'rtl' : 'ltr'}
                    >
                      <span className="verse-number">{verse.verse}</span>
                      <span className="verse-text">{verse.text[readingLang]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Navigation - RTL for Persian */}
            <div className="bible-navigation" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
              <button
                onClick={lang === 'fa' ? goToNextChapter : goToPrevChapter}
                disabled={lang === 'fa' ? selectedChapter >= maxChapters : selectedChapter <= 1}
                className="nav-btn"
              >
                {lang === 'fa' ? (
                  <>
                    <ChevronLeft size={20} />
                    فصل بعد
                  </>
                ) : (
                  <>
                    <ChevronRight size={20} />
                    Previous
                  </>
                )}
              </button>
              
              <div className="chapter-info">
                {lang === 'fa' ? `فصل ${selectedChapter} از ${maxChapters}` : `Chapter ${selectedChapter} of ${maxChapters}`}
              </div>
              
              <button
                onClick={lang === 'fa' ? goToPrevChapter : goToNextChapter}
                disabled={lang === 'fa' ? selectedChapter <= 1 : selectedChapter >= maxChapters}
                className="nav-btn"
              >
                {lang === 'fa' ? (
                  <>
                    فصل قبل
                    <ChevronRight size={20} />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronLeft size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>{lang === 'fa' ? 'لطفاً یک کتاب و فصل انتخاب کنید' : 'Please select a book and chapter'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernBibleReader;
