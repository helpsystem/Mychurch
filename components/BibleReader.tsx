import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, ChevronLeft, ChevronRight, Search, Play, Pause, Square, Globe } from 'lucide-react';
import useBibleTTS from '../hooks/useBibleTTS';
import { api } from '../lib/api';
import HTMLFlipBook from 'react-pageflip';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: { en: string; fa: string };
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
  const bookRef = useRef(null);
  const versesPerPage = 8; // تعداد آیات در هر صفحه
  
  const {
    isPlaying,
    currentVerse,
    speakVerse,
    speakChapter,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    isSupported
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

    return () => {
      isMounted = false;
    };
  }, [lang]);

  useEffect(() => {
    if (!selectedBookKey) {
      return;
    }

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

        if (isMounted) {
          setVerses(normalizedVerses);
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
  }, [selectedBookKey, selectedChapter, lang]);

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
          {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
        </h1>
        <p className="text-lg text-gray-600">
          {lang === 'fa' 
            ? 'تجربه مطالعه کتاب مقدس به شکل کتاب واقعی' 
            : 'Experience the Bible like a real book'
          }
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Book Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'کتاب' : 'Book'}
            </label>
            <select
              value={selectedBookKey ?? ''}
              onChange={(e) => {
                const nextKey = e.target.value || null;
                setSelectedBookKey(nextKey);
                setSelectedChapter(1);
                setCurrentPage(0);
              }}
              disabled={booksLoading || !!booksError || books.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
            >
              <option value="" disabled>
                {booksLoading
                  ? (lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...')
                  : lang === 'fa'
                    ? 'یک کتاب انتخاب کنید'
                    : 'Select a book'}
              </option>
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
            </select>
          </div>

          {/* Chapter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'فصل' : 'Chapter'}
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

      {/* TTS Controls Bar */}
      {isSupported && verses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
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
                      speakChapter(verses.map(v => ({ text: v.text[readingLang], number: v.verse })), readingLang);
                    }}
                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    title={lang === 'fa' ? 'خواندن کل فصل' : 'Read Entire Chapter'}
                  >
                    <Play className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={pauseSpeech}
                    className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                    title={lang === 'fa' ? 'مکث' : 'Pause'}
                  >
                    <Pause className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  onClick={stopSpeech}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title={lang === 'fa' ? 'توقف' : 'Stop'}
                >
                  <Square className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {currentBook?.name[lang]} {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
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
                        pageVerses.map((verse, index) => (
                          <div 
                            key={`verse-${verse.verse}`}
                            className={`verse-container group ${
                              currentVerse?.number === verse.verse ? 'bg-yellow-100 border-r-2 border-yellow-400 pr-2' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                              <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {verse.verse}
                              </span>
                              <div className="flex-1">
                                <p className={`text-gray-800 leading-relaxed ${
                                  currentVerse?.number === verse.verse ? 'font-medium text-yellow-900' : ''
                                }`} style={{fontSize: '14px', lineHeight: '1.6'}}>
                                  {verse.text?.[lang] || 'Loading...'}
                                </p>
                                
                                {/* Individual Verse TTS Controls */}
                                {isSupported && verse.text?.[readingLang] && (
                                  <button
                                    onClick={() => speakVerse(verse.text[readingLang], verse.verse, readingLang)}
                                    className="mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors opacity-0 group-hover:opacity-100"
                                    title={lang === 'fa' ? 'خواندن این آیه' : 'Read this verse'}
                                  >
                                    <Play className="h-2 w-2 inline mr-1" />
                                    {lang === 'fa' ? 'خواندن' : 'Read'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
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
    </div>
  );
};

export default BibleReader;