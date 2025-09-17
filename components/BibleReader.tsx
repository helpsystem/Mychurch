import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, ChevronLeft, ChevronRight, Search, Volume2, Play, Pause, Square, Globe } from 'lucide-react';
import { getOldTestamentBooks, getNewTestamentBooks } from '../lib/localBibleData';
import TextToSpeech from './TextToSpeech';
import useBibleTTS from '../hooks/useBibleTTS';
import HTMLFlipBook from 'react-pageflip';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: { en: string; fa: string };
}

interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

const BibleReader = () => {
  const { lang } = useLanguage();
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentVersePlaying, setCurrentVersePlaying] = useState(null);
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingLang, setReadingLang] = useState('fa');
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

  const oldTestamentBooks = getOldTestamentBooks();
  const newTestamentBooks = getNewTestamentBooks();
  const allBooks = [...oldTestamentBooks, ...newTestamentBooks];

  // Sample verses for Genesis 1
  const sampleVerses: BibleVerse[] = [
    {
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: {
        en: 'In the beginning God created the heavens and the earth.',
        fa: 'در ابتدا خدا آسمانها و زمین را آفرید.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 2,
      text: {
        en: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
        fa: 'و زمین بی‌صورت و خالی بود و تاریکی بر وجه لجه بود و روح خدا بر سطح آبها حوم می‌کرد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 3,
      text: {
        en: 'And God said, "Let there be light," and there was light.',
        fa: 'و خدا گفت: «نور بشود.» و نور شد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 4,
      text: {
        en: 'God saw that the light was good, and he separated the light from the darkness.',
        fa: 'و خدا نور را دید که نیکوست. و خدا در میان نور و تاریکی تمیز کرد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 5,
      text: {
        en: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
        fa: 'و خدا نور را روز نامید و تاریکی را شب نامید. پس شام بود و صبح بود، روز اول.'
      }
    }
  ];

  // Fetch verses from Bible API
  useEffect(() => {
    const fetchBibleContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/bible/content/${selectedBook}/${selectedChapter}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chapter: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.verses) {
          // Transform API response to component format
          const versesData = [];
          const versesEn = data.verses.en || [];
          const versesFa = data.verses.fa || [];
          
          for (let i = 0; i < Math.max(versesEn.length, versesFa.length); i++) {
            versesData.push({
              book: selectedBook,
              chapter: selectedChapter,
              verse: i + 1,
              text: {
                en: versesEn[i] || `Verse ${i + 1} (English translation pending)`,
                fa: versesFa[i] || `آیه ${i + 1} (ترجمه فارسی در حال تکمیل)`
              }
            });
          }
          
          setVerses(versesData);
        } else {
          throw new Error(data.message || 'Failed to load Bible content');
        }
      } catch (err) {
        console.error('Error fetching Bible content:', err);
        setError(err.message);
        // Fallback to sample data for Genesis 1
        if (selectedBook === 'Genesis' && selectedChapter === 1) {
          setVerses(sampleVerses);
        } else {
          setVerses([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBibleContent();
  }, [selectedBook, selectedChapter]);

  const currentBook = allBooks.find(book => book.name.en === selectedBook);
  const maxChapters = currentBook?.chapters || 1;

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
  }, [selectedBook, selectedChapter, searchTerm]);

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
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setSelectedChapter(1);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                {oldTestamentBooks.map(book => (
                  <option key={book.id} value={book.name.en}>
                    {book.name[lang]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                {newTestamentBooks.map(book => (
                  <option key={book.id} value={book.name.en}>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
              <p className="text-red-600 text-center">
                {lang === 'fa' ? 'خطا در بارگذاری:' : 'Error loading:'} {error}
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