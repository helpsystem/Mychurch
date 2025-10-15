import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, ChevronLeft, ChevronRight, Search, Play, Pause, Square, Globe, Highlighter, BookmarkPlus, Bookmark, StickyNote, X, Save, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import useBibleTTS from '../hooks/useBibleTTS';
import { api } from '../lib/api';
import HTMLFlipBook from 'react-pageflip';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: { en: string; fa: string };
  highlight?: string; // رنگ هایلایت: 'yellow', 'green', 'blue', 'pink', 'purple', null
  note?: string; // یادداشت کاربر
  bookmarked?: boolean; // نشانک‌گذاری
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
  translation?: {
    code: string;
    name: { en: string; fa: string };
  };
}

interface Translation {
  id: number;
  code: string;
  name: { en: string; fa: string };
  description: { en: string; fa: string };
  language: string;
  isDefault: boolean;
  sortOrder: number;
}

interface TranslationsResponse {
  success: boolean;
  translations: Translation[];
}

const BibleReader = () => {
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
  
  // امکانات جدید
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  
  // Tree Navigation State
  const [showTreeNav, setShowTreeNav] = useState(true);
  const [expandedTestament, setExpandedTestament] = useState<'old' | 'new' | null>('old');
  const [expandedBook, setExpandedBook] = useState<string | null>('GEN'); // پیش‌فرض: پیدایش باز است
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  
  // Translation State
  const [availableTranslations, setAvailableTranslations] = useState<Translation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>(''); // خالی تا کاربر انتخاب کند
  const [translationsLoading, setTranslationsLoading] = useState(true);
  const [translationSelected, setTranslationSelected] = useState(false); // آیا ترجمه انتخاب شده
  
  const bookRef = useRef(null);
  const versesPerPage = 8; // تعداد آیات در هر صفحه
  
  const {
    isPlaying,
    currentVerse,
    playVerse,
    playChapter,
    pauseAudio,
    resumeAudio,
    stopAudio
  } = useBibleTTS();

  const testamentGroups = useMemo(() => {
    const oldBooks = books.filter(book => book.testament === 'old');
    const newBooks = books.filter(book => book.testament === 'new');
    return {
      old: oldBooks,
      new: newBooks
    };
  }, [books]);

  const allBooks = useMemo(() => books, [books]);

  const currentBook = allBooks.find(book => book.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;

  // Load translations
  useEffect(() => {
    let isMounted = true;

    const loadTranslations = async () => {
      setTranslationsLoading(true);
      try {
        const response = await api.get<TranslationsResponse>('/api/bible/translations');
        if (response?.success && isMounted) {
          setAvailableTranslations(response.translations);
          // ترجمه را خودکار انتخاب نکن، کاربر خودش انتخاب کند
        }
      } catch (err) {
        console.error('Failed to load translations:', err);
      } finally {
        if (isMounted) {
          setTranslationsLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle translation selection
  const handleTranslationChange = (translationCode: string) => {
    setSelectedTranslation(translationCode);
    if (translationCode && !translationSelected) {
      setTranslationSelected(true);
    }
    // Reset selected book and chapter when translation changes
    setSelectedBookKey(null);
    setSelectedChapter(1);
    setVerses([]);
  };

  // Load books only after translation is selected
  useEffect(() => {
    if (!translationSelected || !selectedTranslation) return; // فقط بعد از انتخاب ترجمه کتاب‌ها لود شوند

    let isMounted = true;

    const loadBooks = async () => {
      setBooksLoading(true);
      setBooksError(null);
      try {
        const response = await api.get<BibleBooksResponse>(`/api/bible/books?translation=${selectedTranslation}`);
        if (!response?.success) {
          throw new Error(lang === 'fa' ? 'بارگذاری فهرست کتاب‌ها ناموفق بود.' : 'Failed to load Bible books.');
        }

        if (isMounted) {
          const fetchedBooks = Array.isArray(response.books) ? response.books : [];
          setBooks(fetchedBooks);
          // کتاب را فقط اگر قبلاً انتخاب نشده باشد، انتخاب کن
          if (!selectedBookKey && fetchedBooks.length > 0) {
            setSelectedBookKey(fetchedBooks[0].key);
          }
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

    return () => {
      isMounted = false;
    };
  }, [translationSelected, selectedTranslation, lang]);

  useEffect(() => {
    if (!selectedBookKey) {
      return;
    }

    let isMounted = true;

    const loadChapter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = `/api/bible/content/${selectedBookKey}/${selectedChapter}${selectedTranslation ? `?translation=${selectedTranslation}` : ''}`;
        const response = await api.get<BibleChapterResponse>(apiUrl);

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

        if (isMounted) {
          setVerses(normalizedVerses);
          
          // بارگذاری داده‌های ذخیره‌شده از LocalStorage
          const savedData = loadFromLocalStorage(selectedBookKey, selectedChapter);
          setVerses(prev => prev.map(v => ({
            ...v,
            highlight: savedData[v.verse]?.highlight,
            note: savedData[v.verse]?.note,
            bookmarked: savedData[v.verse]?.bookmark
          })));
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

    return () => {
      isMounted = false;
    };
  }, [selectedBookKey, selectedChapter, selectedTranslation, lang]);

  useEffect(() => {
    if (lang === 'fa' || lang === 'en') {
      setReadingLang(lang);
    }
  }, [lang]);

  const filteredVerses = verses.filter(verse =>
    (verse.text?.[lang] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (direction === 'next' && selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  // توابع Highlighting
  const toggleHighlight = (verseNumber: number, color: string) => {
    setVerses(prevVerses => 
      prevVerses.map(v => 
        v.verse === verseNumber 
          ? { ...v, highlight: v.highlight === color ? undefined : color }
          : v
      )
    );
    saveToLocalStorage(selectedBookKey!, selectedChapter, 'highlight', verseNumber, color);
  };

  // توابع Bookmark
  const toggleBookmark = (verseNumber: number) => {
    setVerses(prevVerses => 
      prevVerses.map(v => 
        v.verse === verseNumber 
          ? { ...v, bookmarked: !v.bookmarked }
          : v
      )
    );
    saveToLocalStorage(selectedBookKey!, selectedChapter, 'bookmark', verseNumber, undefined);
  };

  // توابع Note
  const openNoteModal = (verseNumber: number) => {
    const verse = verses.find(v => v.verse === verseNumber);
    setSelectedVerse(verseNumber);
    setCurrentNote(verse?.note || '');
    setNoteModalOpen(true);
  };

  const saveNote = () => {
    if (selectedVerse !== null) {
      setVerses(prevVerses => 
        prevVerses.map(v => 
          v.verse === selectedVerse 
            ? { ...v, note: currentNote }
            : v
        )
      );
      saveToLocalStorage(selectedBookKey!, selectedChapter, 'note', selectedVerse, currentNote);
      setNoteModalOpen(false);
    }
  };

  // ذخیره در LocalStorage
  const saveToLocalStorage = (bookKey: string, chapter: number, type: string, verseNumber: number, value: any) => {
    const key = `bible_${bookKey}_${chapter}_${verseNumber}_${type}`;
    if (value === undefined || value === null || value === '') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // بارگذاری از LocalStorage
  const loadFromLocalStorage = (bookKey: string, chapter: number) => {
    const savedData: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`bible_${bookKey}_${chapter}_`)) {
        const parts = key.split('_');
        const verseNumber = parseInt(parts[3]);
        const type = parts[4];
        const value = JSON.parse(localStorage.getItem(key)!);
        
        if (!savedData[verseNumber]) savedData[verseNumber] = {};
        savedData[verseNumber][type] = value;
      }
    }
    return savedData;
  };

  // تقسیم verses به صفحات
  const pages = [];
  for (let i = 0; i < filteredVerses.length; i += versesPerPage) {
    pages.push(filteredVerses.slice(i, i + versesPerPage));
  }

  // اگر صفحه‌ای وجود نداشت، صفحه خالی اضافه کن
  if (pages.length === 0) {
    pages.push([]);
  }

  // Reset flipbook page when content changes
  useEffect(() => {
    setCurrentPage(0);
    if (bookRef.current) {
      setTimeout(() => {
        bookRef.current?.pageFlip()?.turnToPage(0);
      }, 100);
    }
  }, [selectedBookKey, selectedChapter, searchTerm]);

  // Clamp current page when pages change
  useEffect(() => {
    const lastFlipIndex = pages.length; // Cover + content pages
    if (currentPage > lastFlipIndex && lastFlipIndex > 0) {
      const targetPage = lastFlipIndex;
      setCurrentPage(targetPage);
      if (bookRef.current) {
        setTimeout(() => {
          bookRef.current?.pageFlip()?.turnToPage(targetPage);
        }, 100);
      }
    }
  }, [pages.length, currentPage]);

  const handlePageFlip = (e) => {
    setCurrentPage(e.data);
  };

  const goToNextPage = () => {
    const lastFlipIndex = pages.length; // Cover + content pages
    if (bookRef.current && currentPage < lastFlipIndex) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const goToPrevPage = () => {
    if (bookRef.current && currentPage > 0) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  // Helper for display
  const getPageDisplayInfo = () => {
    if (currentPage === 0) {
      return {
        label: lang === 'fa' ? 'جلد' : 'Cover',
        pageInfo: lang === 'fa' ? 'صفحه جلد' : 'Cover Page'
      };
    }
    
    const contentPageNum = currentPage; // Since cover is index 0, content starts at 1
    return {
      label: lang === 'fa' ? `صفحه ${contentPageNum}` : `Page ${contentPageNum}`,
      pageInfo: lang === 'fa' 
        ? `صفحه ${contentPageNum} از ${pages.length}` 
        : `Page ${contentPageNum} of ${pages.length}`
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === 'fa' ? 'کتاب مقدس - نمای استاندارد' : 'Holy Bible - Standard View'}
        </h1>
        
        {/* دکمه انتخاب کتاب */}
        {!showTreeNav && (
          <button
            onClick={() => setShowTreeNav(true)}
            className="mb-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <BookOpen className="h-5 w-5" />
            {lang === 'fa' ? 'انتخاب کتاب و فصل' : 'Select Book & Chapter'}
          </button>
        )}
        
        {currentBook && selectedBookKey && (
          <p className="text-lg text-blue-600 font-semibold">
            {currentBook.testament === 'old' 
              ? (lang === 'fa' ? 'عهد عتیق' : 'Old Testament')
              : (lang === 'fa' ? 'عهد جدید' : 'New Testament')
            } 
            {' - '}
            {currentBook.name[lang]}
            {' - '}
            {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
          </p>
        )}
        <p className="text-lg text-gray-600 mt-2">
          {lang === 'fa' 
            ? 'تجربه مطالعه کتاب مقدس به شکل کتاب واقعی' 
            : 'Experience the Bible like a real book'
          }
        </p>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex gap-6 relative">
        {/* Toggle Button - Always Visible */}
        <button
          onClick={() => setShowTreeNav(!showTreeNav)}
          className="fixed top-20 left-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title={showTreeNav ? (lang === 'fa' ? 'بستن منو' : 'Close menu') : (lang === 'fa' ? 'باز کردن منو' : 'Open menu')}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tree Navigation Sidebar */}
        {showTreeNav && (
          <div className="w-80 bg-white rounded-lg shadow-lg p-4 sticky top-4 self-start max-h-[calc(100vh-120px)] overflow-y-auto" style={{ minWidth: '320px' }}>
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                {lang === 'fa' ? 'فهرست کتاب‌ها' : 'Books Index'}
              </h2>
              <button
                onClick={() => setShowTreeNav(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Translation Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                {lang === 'fa' ? 'انتخاب ترجمه (گام اول)' : 'Select Translation (Step 1)'}
              </label>
              <select
                value={selectedTranslation}
                onChange={(e) => handleTranslationChange(e.target.value)}
                disabled={translationsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white disabled:opacity-50"
              >
                <option value="" disabled>
                  {translationsLoading 
                    ? (lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...')
                    : (lang === 'fa' ? 'ابتدا ترجمه‌ای انتخاب کنید' : 'Please select a translation first')
                  }
                </option>
                {!translationsLoading && availableTranslations.map(translation => (
                  <option key={translation.code} value={translation.code}>
                    {lang === 'fa' ? translation.name.fa : translation.name.en}
                    {translation.isDefault ? ` (${lang === 'fa' ? 'پیش‌فرض' : 'Default'})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Show translation selection reminder if no translation selected */}
            {!translationSelected && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-sm text-yellow-700">
                  {lang === 'fa' 
                    ? '⬆️ ابتدا ترجمه‌ای انتخاب کنید تا فهرست کتاب‌ها نمایش داده شود'
                    : '⬆️ Please select a translation first to see the list of books'
                  }
                </p>
              </div>
            )}

            {/* Filter Books Input - only show if translation selected */}
            {translationSelected && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'جستجو در کتاب‌ها (گام دوم)' : 'Search Books (Step 2)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'fa' ? 'جستجو کتاب...' : 'Search books...'}
                  value={bookSearchTerm}
                  onChange={(e) => setBookSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            )}

            {/* Books List - only show if translation is selected */}
            {translationSelected && (
              booksLoading ? (
                <div className="text-center py-8 text-gray-500">
                  {lang === 'fa' ? 'در حال بارگذاری کتاب‌ها...' : 'Loading books...'}
                </div>
              ) : booksError ? (
                <div className="text-center py-8 text-red-500 text-sm">
                  {booksError}
                </div>
              ) : (
              <div className="space-y-2">
                {/* Old Testament Section */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTestament(expandedTestament === 'old' ? null : 'old')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-colors"
                  >
                    <span className="font-bold text-amber-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}
                      <span className="text-xs bg-amber-200 px-2 py-0.5 rounded-full">{testamentGroups.old.length}</span>
                    </span>
                    {expandedTestament === 'old' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {expandedTestament === 'old' && (
                    <div className="bg-white">
                      {testamentGroups.old
                        .filter(book => 
                          bookSearchTerm === '' || 
                          book.name.fa.includes(bookSearchTerm) || 
                          book.name.en.toLowerCase().includes(bookSearchTerm.toLowerCase())
                        )
                        .map(book => (
                        <div key={book.key} className="border-t border-gray-100">
                          <button
                            onClick={() => setExpandedBook(expandedBook === book.key ? null : book.key)}
                            className={`w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors ${selectedBookKey === book.key ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                          >
                            <span className="text-sm font-medium text-gray-700 text-left">
                              {book.name[lang]}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">{book.chapters}</span>
                              {expandedBook === book.key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </div>
                          </button>
                          
                          {/* Chapters List */}
                          {expandedBook === book.key && (
                            <div className="bg-gray-50 px-3 py-2 grid grid-cols-8 gap-1">
                              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                <button
                                  key={chapter}
                                  onClick={() => {
                                    setSelectedBookKey(book.key);
                                    setSelectedChapter(chapter);
                                    setCurrentPage(0);
                                    setShowTreeNav(false); // بستن Tree Navigation بعد از انتخاب فصل
                                  }}
                                  className={`px-2 py-1 text-xs rounded hover:bg-blue-500 hover:text-white transition-colors ${
                                    selectedBookKey === book.key && selectedChapter === chapter
                                      ? 'bg-blue-600 text-white font-bold'
                                      : 'bg-white text-gray-700'
                                  }`}
                                  title={lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
                                >
                                  {chapter}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Testament Section */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTestament(expandedTestament === 'new' ? null : 'new')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors"
                  >
                    <span className="font-bold text-blue-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {lang === 'fa' ? 'عهد جدید' : 'New Testament'}
                      <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">{testamentGroups.new.length}</span>
                    </span>
                    {expandedTestament === 'new' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {expandedTestament === 'new' && (
                    <div className="bg-white">
                      {testamentGroups.new
                        .filter(book => 
                          bookSearchTerm === '' || 
                          book.name.fa.includes(bookSearchTerm) || 
                          book.name.en.toLowerCase().includes(bookSearchTerm.toLowerCase())
                        )
                        .map(book => (
                        <div key={book.key} className="border-t border-gray-100">
                          <button
                            onClick={() => setExpandedBook(expandedBook === book.key ? null : book.key)}
                            className={`w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors ${selectedBookKey === book.key ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                          >
                            <span className="text-sm font-medium text-gray-700 text-left">
                              {book.name[lang]}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">{book.chapters}</span>
                              {expandedBook === book.key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </div>
                          </button>
                          
                          {/* Chapters List */}
                          {expandedBook === book.key && (
                            <div className="bg-gray-50 px-3 py-2 grid grid-cols-8 gap-1">
                              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                <button
                                  key={chapter}
                                  onClick={() => {
                                    setSelectedBookKey(book.key);
                                    setSelectedChapter(chapter);
                                    setCurrentPage(0);
                                    setShowTreeNav(false); // بستن Tree Navigation بعد از انتخاب فصل
                                  }}
                                  className={`px-2 py-1 text-xs rounded hover:bg-blue-500 hover:text-white transition-colors ${
                                    selectedBookKey === book.key && selectedChapter === chapter
                                      ? 'bg-blue-600 text-white font-bold'
                                      : 'bg-white text-gray-700'
                                  }`}
                                  title={lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
                                >
                                  {chapter}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Progress Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              {lang === 'fa' ? '🔥 مراحل مطالعه کتاب مقدس' : '🔥 Bible Study Steps'}
            </h3>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                selectedTranslation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <span>{selectedTranslation ? '✅' : '1️⃣'}</span>
                <span>{lang === 'fa' ? 'ترجمه انتخاب شد' : 'Translation Selected'}</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                selectedBookKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <span>{selectedBookKey ? '✅' : '2️⃣'}</span>
                <span>{lang === 'fa' ? 'کتاب انتخاب شد' : 'Book Selected'}</span>
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                selectedBookKey && selectedChapter > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <span>{selectedBookKey && selectedChapter > 0 ? '✅' : '3️⃣'}</span>
                <span>{lang === 'fa' ? 'فصل انتخاب شد' : 'Chapter Selected'}</span>
              </div>
            </div>
          </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Book Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'کتاب (گام دوم)' : 'Book (Step 2)'}
            </label>
            <select
              value={selectedBookKey ?? ''}
              onChange={(e) => {
                const nextKey = e.target.value || null;
                setSelectedBookKey(nextKey);
                setSelectedChapter(1);
                setCurrentPage(0);
              }}
              disabled={!translationSelected || booksLoading || !!booksError || books.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
            >
              <option value="" disabled>
                {!translationSelected
                  ? (lang === 'fa' ? 'ابتدا ترجمه انتخاب کنید' : 'Select translation first')
                  : booksLoading
                    ? (lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...')
                    : lang === 'fa'
                      ? 'یک کتاب انتخاب کنید'
                      : 'Select a book'}
              </option>
              {translationSelected && (
                <>
                  <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                    {testamentGroups.old.map(book => (
                      <option key={book.key} value={book.key}>
                        {book.name[lang]}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                    {testamentGroups.new.map(book => (
                      <option key={book.key} value={book.key}>
                        {book.name[lang]}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {/* Chapter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'فصل (گام سوم)' : 'Chapter (Step 3)'}
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={selectedChapter <= 1}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(parseInt(e.target.value));
                  setCurrentPage(0);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: Math.max(1, maxChapters) }, (_, i) => i + 1).map(chapter => (
                  <option key={`chapter-${chapter}`} value={chapter}>
                    {lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigateChapter('next')}
                disabled={selectedChapter >= maxChapters}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'جستجو' : 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'fa' ? 'جستجو در آیات...' : 'Search verses...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Reading Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'زبان روخوانی' : 'Reading Language'}
            </label>
            <select
              value={readingLang}
              onChange={(e) => setReadingLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {booksError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {booksError}
          </div>
        )}
      </div>
      {/* End of Controls */}

      {/* TTS Controls Bar */}
      {verses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <h3 className="font-medium text-gray-700">
                {lang === 'fa' ? 'کنترل‌های صوتی' : 'Audio Controls'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReadingLang(readingLang === 'fa' ? 'en' : 'fa')}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title={lang === 'fa' ? 'تغییر زبان روخوانی' : 'Change reading language'}
                >
                  <Globe className="h-4 w-4" />
                  <span className="ml-1 text-sm">{readingLang === 'fa' ? 'فارسی' : 'English'}</span>
                </button>
                
                {!isPlaying ? (
                  <button
                    onClick={() => {
                      const chapterText = verses.map(v => v.text[readingLang]).join(' ');
                      playChapter(verses.map(v => v.text[readingLang]));
                    }}
                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    title={lang === 'fa' ? 'خواندن کل فصل' : 'Read Entire Chapter'}
                  >
                    <Play className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={pauseAudio}
                    className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                    title={lang === 'fa' ? 'مکث' : 'Pause'}
                  >
                    <Pause className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  onClick={stopAudio}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title={lang === 'fa' ? 'توقف' : 'Stop'}
                >
                  <Square className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* دکمه‌های امکانات جدید */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  showBookmarks 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={lang === 'fa' ? 'نشانک‌های من' : 'My Bookmarks'}
              >
                <Bookmark className="h-4 w-4 mr-1" />
                <span className="text-sm">{lang === 'fa' ? 'نشانک‌ها' : 'Bookmarks'}</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              {currentBook?.name[lang]} {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
              {selectedTranslation && (
                <span className="mx-2">•</span>
              )}
              {selectedTranslation && (
                <span className="text-blue-600">
                  {availableTranslations.find(t => t.code === selectedTranslation)?.name[lang] || selectedTranslation}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bible Book */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg mx-auto">
              <p className="text-green-700 text-center text-sm">
                {error}
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <HTMLFlipBook
              ref={bookRef}
              width={400}
              height={600}
              size="stretch"
              minWidth={300}
              maxWidth={500}
              minHeight={400}
              maxHeight={700}
              showCover={true}
              flippingTime={1000}
              usePortrait={true}
              startPage={0}
              drawShadow={true}
              onFlip={handlePageFlip}
              className="bible-book"
            >
              {/* صفحه جلد */}
              <div className="page cover" key="cover">
                <div className="h-full bg-gradient-to-br from-blue-900 to-blue-700 text-white flex flex-col justify-center items-center p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20"></div>
                  <div className="relative z-10 text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">
                      {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
                    </h1>
                    <h2 className="text-xl mb-1">
                      {currentBook?.name[lang]}
                    </h2>
                    <p className="text-lg">
                      {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* صفحات آیات */}
              {pages.map((pageVerses, pageIndex) => (
                <div className="page" key={`page-${pageIndex}`}>
                  <div className="h-full bg-cream bg-opacity-95 p-6 flex flex-col" style={{backgroundColor: '#fefcf7'}}>
                    <div className="flex-1 space-y-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                      {pageVerses.length > 0 ? (
                        pageVerses.map((verse, index) => {
                          const highlightColors = {
                            yellow: 'bg-yellow-100 border-yellow-300',
                            green: 'bg-green-100 border-green-300',
                            blue: 'bg-blue-100 border-blue-300',
                            pink: 'bg-pink-100 border-pink-300',
                            purple: 'bg-purple-100 border-purple-300'
                          };
                          
                          const highlightClass = verse.highlight 
                            ? highlightColors[verse.highlight as keyof typeof highlightColors]
                            : '';
                          
                          return (
                            <div 
                              key={`verse-${verse.verse}`}
                              className={`verse-container group relative rounded-lg p-3 transition-all ${
                                highlightClass ? `${highlightClass} border-l-4` : 'hover:bg-gray-50'
                              } ${
                                currentVerse === verse.verse ? 'ring-2 ring-yellow-400' : ''
                              }`}
                            >
                              {/* نشانک */}
                              {verse.bookmarked && (
                                <div className="absolute -top-2 right-2 z-10">
                                  <Bookmark className="h-5 w-5 text-red-500 fill-red-500" />
                                </div>
                              )}
                              
                              <div className="flex items-start space-x-3 space-x-reverse" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full text-sm font-bold shadow-md">
                                  {verse.verse}
                                </span>
                                <div className="flex-1">
                                  <p className={`bible-verse-text verse-text text-gray-900 ${
                                    currentVerse === verse.verse ? 'font-semibold text-yellow-900 bg-yellow-50 rounded-lg p-2' : ''
                                  }`}>
                                    {verse.text?.[lang] || 'Loading...'}
                                  </p>
                                  
                                  {/* یادداشت */}
                                  {verse.note && (
                                    <div className="mt-2 p-2 bg-amber-50 border-l-2 border-amber-400 rounded text-xs text-gray-700 italic">
                                      <StickyNote className="h-3 w-3 inline mr-1" />
                                      {verse.note}
                                    </div>
                                  )}
                                  
                                  {/* دکمه‌های عملیات - نمایش در hover */}
                                  <div className="mt-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* TTS */}
                                    {verse.text?.[readingLang] && (
                                      <button
                                        onClick={() => {
                                          const textToSpeak = verse.text?.[readingLang] || '';
                                          console.log('🎙️ TTS Click:', { verseNum: verse.verse, lang: readingLang, text: textToSpeak.substring(0, 50) });
                                          playVerse(textToSpeak, verse.verse);
                                        }}
                                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center"
                                        title={lang === 'fa' ? 'خواندن' : 'Read'}
                                      >
                                        <Play className="h-3 w-3 mr-1" />
                                        {lang === 'fa' ? 'خواندن' : 'Read'}
                                      </button>
                                    )}
                                    
                                    {/* Highlight Colors */}
                                    <div className="flex items-center space-x-1 bg-white rounded px-1 py-1 shadow-sm">
                                      {['yellow', 'green', 'blue', 'pink', 'purple'].map(color => (
                                        <button
                                          key={color}
                                          onClick={() => toggleHighlight(verse.verse, color)}
                                          className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
                                            verse.highlight === color ? 'ring-2 ring-gray-400' : ''
                                          }`}
                                          style={{ 
                                            backgroundColor: color === 'yellow' ? '#fef08a' 
                                              : color === 'green' ? '#bbf7d0' 
                                              : color === 'blue' ? '#bfdbfe'
                                              : color === 'pink' ? '#fbcfe8'
                                              : '#e9d5ff'
                                          }}
                                          title={lang === 'fa' ? 'رنگ‌آمیزی' : 'Highlight'}
                                        />
                                      ))}
                                    </div>
                                    
                                    {/* Bookmark */}
                                    <button
                                      onClick={() => toggleBookmark(verse.verse)}
                                      className={`text-xs px-2 py-1 rounded transition-colors flex items-center ${
                                        verse.bookmarked 
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                      title={lang === 'fa' ? 'نشانک' : 'Bookmark'}
                                    >
                                      {verse.bookmarked ? <Bookmark className="h-3 w-3 fill-current" /> : <BookmarkPlus className="h-3 w-3" />}
                                    </button>
                                    
                                    {/* Note */}
                                    <button
                                      onClick={() => openNoteModal(verse.verse)}
                                      className={`text-xs px-2 py-1 rounded transition-colors flex items-center ${
                                        verse.note 
                                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                      title={lang === 'fa' ? 'یادداشت' : 'Note'}
                                    >
                                      <StickyNote className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {lang === 'fa' ? 'هیچ آیه‌ای موجود نیست' : 'No verses available'}
                        </div>
                      )}
                    </div>
                    
                    {/* شماره صفحه */}
                    <div className="text-center text-xs text-gray-500 mt-4 pt-2 border-t border-gray-200">
                      {pageIndex + 1}
                    </div>
                  </div>
                </div>
              ))}
            </HTMLFlipBook>
          )}
        </div>
      </div>

      {/* Book Navigation Footer */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* صفحه قبل */}
          <div className="flex justify-start">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 0}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {lang === 'fa' ? 'صفحه قبل' : 'Previous Page'}
            </button>
          </div>

          {/* اطلاعات صفحه */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              {getPageDisplayInfo().pageInfo}
            </div>
            <div className="text-xs text-gray-500">
              {lang === 'fa' 
                ? `فصل ${selectedChapter} از ${maxChapters}` 
                : `Chapter ${selectedChapter} of ${maxChapters}`
              }
            </div>
          </div>

          {/* صفحه بعد */}
          <div className="flex justify-end">
            <button
              onClick={goToNextPage}
              disabled={currentPage >= pages.length}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {lang === 'fa' ? 'صفحه بعد' : 'Next Page'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* کنترل‌های فصل */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigateChapter('prev')}
            disabled={selectedChapter <= 1}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
          </button>

          <div className="text-center">
            <div className="text-sm font-medium text-gray-800">
              {currentBook?.name[lang]}
            </div>
          </div>

          <button
            onClick={() => navigateChapter('next')}
            disabled={selectedChapter >= maxChapters}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'fa' ? `یادداشت برای آیه ${selectedVerse}` : `Note for Verse ${selectedVerse}`}
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder={lang === 'fa' ? 'یادداشت خود را بنویسید...' : 'Write your note...'}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              dir={lang === 'fa' ? 'rtl' : 'ltr'}
            />
            
            <div className="flex items-center justify-end space-x-2 mt-4">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {lang === 'fa' ? 'لغو' : 'Cancel'}
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                {lang === 'fa' ? 'ذخیره' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {lang === 'fa' ? 'نشانک‌های من' : 'My Bookmarks'}
            </h3>
            <button
              onClick={() => setShowBookmarks(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {verses.filter(v => v.bookmarked).length > 0 ? (
              verses.filter(v => v.bookmarked).map(verse => (
                <div 
                  key={verse.verse}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    // پیدا کردن صفحه‌ای که این آیه در آن است
                    const pageIndex = Math.floor((verse.verse - 1) / versesPerPage);
                    setCurrentPage(pageIndex + 1);
                    if (bookRef.current) {
                      bookRef.current.pageFlip().turnToPage(pageIndex + 1);
                    }
                    setShowBookmarks(false);
                  }}
                >
                  <div className="flex items-start space-x-2" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                    <Bookmark className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {lang === 'fa' ? `آیه ${verse.verse}` : `Verse ${verse.verse}`}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {verse.text[lang]}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {lang === 'fa' ? 'هیچ نشانکی ذخیره نشده است' : 'No bookmarks saved'}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default BibleReader;