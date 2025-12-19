
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { ChevronDown, Search, X, Book, BookOpen, MonitorPlay, ZoomIn, ZoomOut } from 'lucide-react';
import Spinner from '../components/Spinner';
// import HTMLFlipBook from 'react-pageflip'; // Removed - using two-column layout
import { useAuth } from '../hooks/useAuth';

const VERSES_PER_PAGE = 10; // Adjust this number to control how much text appears on each page

// A custom hook to debounce a value.
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes or the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}


const LatinCrossIcon: React.FC<{ className?: string, size?: number }> = ({ className, size = 24 }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 5v14" />
        <path d="M7 9h10" />
    </svg>
);

// NOTE: Page and PageCover components removed - no longer using FlipBook
// Switched to two-column side-by-side layout with Farsi (right) and English (left)

const BiblePage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content: fullContent, loading: contentLoading } = useContent();
  const { user } = useAuth();
  const { bibleBooks = [], bibleContent = {} } = fullContent || {};
  
  const [selectedBook, setSelectedBook] = useState<string>(bibleBooks[0]?.key || '');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedTestament, setSelectedTestament] = useState<'OT' | 'NT' | 'ALL'>('ALL');
  const [content, setContent] = useState<{ en: string[]; fa: string[] }>({ en: [], fa: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState<{ bookKey: string; book: string; chapter: number; verse: number; text: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Zoom state for new two-column layout
  const [zoom, setZoom] = useState<number>(100); // Percentage (50-200%)
  
  // Persian translation selector
  const [persianTranslation, setPersianTranslation] = useState<string>('qadim'); // qadim | mojdeh | tafsiri
  
  const [presentationWindow, setPresentationWindow] = useState<Window | null>(null);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Admin presentation controls state
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(1);
  const [enableAudio, setEnableAudio] = useState(true);
  const [enableHighlight, setEnableHighlight] = useState(true);

  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER');

  // Filter books based on selected testament
  const filteredBooks = selectedTestament === 'ALL' 
    ? bibleBooks 
    : bibleBooks.filter((book: any) => {
        // Use testament field directly (backend now sets it automatically)
        return book.testament === selectedTestament;
      });

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
        broadcastChannel?.close();
        if (presentationWindow && !presentationWindow.closed) {
            presentationWindow.close();
        }
    };
  }, [broadcastChannel, presentationWindow]);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
    }

    setIsSearching(true);
    const results: { bookKey: string; book: string; chapter: number; verse: number; text: string }[] = [];
    const term = debouncedSearchTerm.toLowerCase();
    
    // Using a timeout to allow UI to update to "isSearching" state before blocking thread
    const searchTimeout = setTimeout(() => {
        Object.keys(bibleContent).forEach(bookKey => {
            const bookData = bibleBooks.find(b => b.key === bookKey);
            const bookName = bookData ? bookData.name[lang] : bookKey;
            Object.keys(bibleContent[bookKey]).forEach(chapterNum => {
                const chapterData = bibleContent[bookKey][chapterNum][lang];
                if (chapterData) {
                    chapterData.forEach((verseText, verseIndex) => {
                        if (verseText.toLowerCase().includes(term)) {
                            results.push({
                                bookKey: bookKey,
                                book: bookName,
                                chapter: Number(chapterNum),
                                verse: verseIndex + 1,
                                text: verseText,
                            });
                        }
                    });
                }
            });
        });
        setSearchResults(results);
        setIsSearching(false);
    }, 50);

    return () => clearTimeout(searchTimeout);
  }, [debouncedSearchTerm, bibleContent, bibleBooks, lang]);


  const togglePresentationMode = () => {
    if (presentationWindow && !presentationWindow.closed) {
        presentationWindow.close();
        setPresentationWindow(null);
        broadcastChannel?.close();
        setBroadcastChannel(null);
    } else {
        const newWindow = window.open('#/presentation', 'BiblePresentation', 'width=1024,height=768');
        setPresentationWindow(newWindow);
        const newChannel = new BroadcastChannel('bible_presentation');
        setBroadcastChannel(newChannel);
    }
  };
  
  const currentBook = bibleBooks.find(b => b.key === selectedBook);

  const presentVerse = (verseNum: number) => { // verseNum is 1-based index
    if (!broadcastChannel || !currentBook) return;

    const verseIndex = verseNum - 1;
    const enText = content.en[verseIndex];
    const faText = content.fa[verseIndex];

    if (!enText || !faText) {
        console.error(`Verse ${verseNum} not found for both languages.`);
        return;
    }

    const bookNameEn = currentBook.name.en;
    const bookNameFa = currentBook.name.fa;
    
    broadcastChannel.postMessage({
        type: 'PRESENT_SINGLE',
        book: { en: bookNameEn, fa: bookNameFa },
        chapter: selectedChapter,
        verseNum: verseNum,
        text: { en: enText, fa: faText }
    });
  };

  const presentVerseRange = () => {
    if (!broadcastChannel || !currentBook) return;
    
    const start = Math.max(0, startVerse - 1);
    const end = Math.min(content.en.length, endVerse);

    if (start >= end) {
        alert("Start verse must be before end verse.");
        return;
    }

    const selectedVerses = {
        en: content.en.slice(start, end),
        fa: content.fa.slice(start, end),
    };

    broadcastChannel.postMessage({
        type: 'PRESENT_RANGE',
        book: { en: currentBook.name.en, fa: currentBook.name.fa },
        chapter: selectedChapter,
        startVerse: startVerse,
        endVerse: endVerse,
        verses: selectedVerses,
        settings: { audio: enableAudio, highlight: enableHighlight }
    });
  };

  const loadChapterContent = useCallback(async () => {
    // Don't load if no book is selected
    if (!selectedBook || !selectedChapter) {
      return;
    }
    
    // Check if content is already loaded
    const bookData = bibleContent[selectedBook];
    
    if (bookData && bookData[selectedChapter]) {
      setContent({
          en: bookData[selectedChapter].en || [],
          fa: bookData[selectedChapter].fa || [],
      });
      setStartVerse(1);
      setEndVerse(bookData[selectedChapter].en?.length || 1);
    } else {
      // Load content from API with selected Persian translation
      try {
        const response = await fetch(`/api/bible/content/${selectedBook}/${selectedChapter}?faTranslation=${persianTranslation}`);
        const data = await response.json();
        
        if (data.success && data.verses) {
          const chapterContent = {
            en: data.verses.en || [],
            fa: data.verses.fa || [],
            es: data.verses.es || []
          };
          
          setContent(chapterContent);
          setStartVerse(1);
          setEndVerse(chapterContent.en?.length || 1);
          
          // Cache the loaded content
          if (!bibleContent[selectedBook]) {
            bibleContent[selectedBook] = {};
          }
          bibleContent[selectedBook][selectedChapter] = chapterContent;
        } else {
          setContent({ en: [], fa: [] });
          setStartVerse(1);
          setEndVerse(1);
        }
      } catch (error) {
        console.error('Failed to load chapter content:', error);
        setContent({ en: [], fa: [] });
        setStartVerse(1);
        setEndVerse(1);
      }
    }
    setHasInteracted(false); // Reset interaction state on chapter change
  }, [selectedBook, selectedChapter, persianTranslation, bibleContent]);

  useEffect(() => {
    if (bibleBooks.length > 0 && !selectedBook) {
        setSelectedBook(bibleBooks[0].key);
    }
  }, [bibleBooks, selectedBook]);
  
  useEffect(() => {
    if(selectedBook){
        loadChapterContent();
    }
    setSearchResults([]);
  }, [selectedBook, selectedChapter, lang, loadChapterContent]);

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBook(e.target.value);
    setSelectedChapter(1);
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChapter(Number(e.target.value));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  }

  const handleResultClick = (bookKey: string, chapter: number) => {
    setSelectedBook(bookKey);
    setSelectedChapter(chapter);
    setSearchTerm(''); // This will clear debounced term and results
  };

  // PageTurnHint and renderBookPages removed - using two-column layout instead

  
  const inputClass = "w-full p-3 border-0 rounded-lg appearance-none bg-primary text-white focus:outline-none focus:ring-2 focus:ring-secondary";
  const smallInputClass = "w-full p-2 border-0 rounded-lg bg-primary text-white focus:outline-none focus:ring-2 focus:ring-secondary";

  return (
    <div className="space-y-8 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2">{t('bibleTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('bibleDescription')}</p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Audio Bible Card */}
        <a
          href="/#/bible/audio"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m-2.828-5.657a9 9 0 0012.728 0" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {lang === 'fa' ? '🎧 کتاب مقدس صوتی' : '🎧 Audio Bible'}
            </h3>
          </div>
          <p className="text-blue-100 text-sm">
            {lang === 'fa'
              ? 'گوش دهید به کلام خدا به زبان فارسی و انگلیسی. 66 کتاب کامل با صدای عالی.'
              : 'Listen to the Word of God in Persian and English. All 66 books with high-quality audio.'
            }
          </p>
          <div className="flex items-center gap-2 mt-4 text-white font-medium">
            <span>{lang === 'fa' ? 'شروع گوش دادن' : 'Start Listening'}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </a>

        {/* Interactive Reader Card */}
        <a
          href="/#/bible/reader"
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              {lang === 'fa' ? '📖 کتاب مقدس تعاملی' : '📖 Interactive Bible'}
            </h3>
          </div>
          <p className="text-purple-100 text-sm">
            {lang === 'fa'
              ? 'مطالعه دوزبانه با حالت نمایش و ارائه. مناسب برای مطالعه شخصی و نمایش روی پروژکتور.'
              : 'Bilingual reading with presentation mode. Perfect for personal study and projector display.'
            }
          </p>
          <div className="flex items-center gap-2 mt-4 text-white font-medium">
            <span>{lang === 'fa' ? 'شروع مطالعه' : 'Start Reading'}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </a>
      </div>

      {contentLoading && bibleBooks.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="12" />
          <span className="ml-4 text-dimWhite">در حال بارگذاری کتاب‌ها...</span>
        </div>
      )}

      {!contentLoading && bibleBooks.length === 0 && (
        <div className="bg-black-gradient p-8 rounded-[20px] text-center">
          <p className="text-red-400 text-lg">خطا در بارگذاری کتاب‌های مقدس. لطفاً صفحه را رفرش کنید.</p>
        </div>
      )}

      {bibleBooks.length > 0 && (
      <>
      <div className="bg-black-gradient p-4 rounded-[20px] box-shadow sticky top-[88px] z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-center">
          <div className="relative">
            <select 
              value={selectedTestament} 
              onChange={(e) => {
                const newTestament = e.target.value as 'OT' | 'NT' | 'ALL';
                setSelectedTestament(newTestament);
                // Reset book to first available in new testament
                const availableBooks = newTestament === 'ALL' 
                  ? bibleBooks 
                  : bibleBooks.filter((book: any) => book.testament === newTestament);
                if (availableBooks.length > 0) {
                  setSelectedBook(availableBooks[0].key);
                  setSelectedChapter(1);
                }
              }} 
              className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}
            >
              <option value="ALL">{lang === 'fa' ? 'همه کتاب‌ها' : 'All Books'}</option>
              <option value="OT">{lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}</option>
              <option value="NT">{lang === 'fa' ? 'عهد جدید' : 'New Testament'}</option>
            </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={selectedBook} onChange={handleBookChange} className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}>
              {filteredBooks && filteredBooks.length > 0 ? (
                filteredBooks.map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name?.[lang] || book.name?.en || book.key}
                  </option>
                ))
              ) : (
                <option value="">{lang === 'fa' ? 'هیچ کتابی یافت نشد' : 'No books found'}</option>
              )}
            </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
             <select value={selectedChapter} onChange={handleChapterChange} disabled={!currentBook} className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}>
                {currentBook && Array.from({ length: currentBook.chapters || 1 }, (_, i) => i + 1).map(chap => (
                  <option key={chap} value={chap}>{t('chapter')} {chap}</option>
                ))}
              </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={persianTranslation} 
              onChange={(e) => setPersianTranslation(e.target.value)}
              className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}
              title={lang === 'fa' ? 'ترجمه فارسی' : 'Persian Translation'}
            >
              <option value="qadim">{lang === 'fa' ? '📖 قدیم' : '📖 Qadim'}</option>
              <option value="mojdeh">{lang === 'fa' ? '✨ مژده' : '✨ Mojdeh'}</option>
              <option value="tafsiri">{lang === 'fa' ? '📚 تفسیری' : '📚 Tafsiri'}</option>
            </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 pointer-events-none" />
          </div>
          <div className="relative col-span-1 lg:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`${inputClass} pl-10 rtl:pr-10 rtl:pl-4`}
            />
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 rtl:right-3 rtl:left-auto text-gray-400" />
            {isSearching ? (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto">
                    <Spinner size="5" />
                </div>
            ) : searchTerm ? (
                <X onClick={handleClearSearch} className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 cursor-pointer" />
            ) : null}
          </div>
          {isAdmin && (
            <button onClick={togglePresentationMode} className="w-full py-3 px-4 bg-secondary text-primary font-bold rounded-lg flex items-center justify-center gap-2">
                <MonitorPlay size={16}/> 
                {presentationWindow && !presentationWindow.closed ? t('stopPresentation') : t('present')}
            </button>
          )}
        </div>
        {isAdmin && presentationWindow && !presentationWindow.closed && (
            <div className="bg-primary/50 p-4 rounded-lg mt-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-secondary mb-2">{t('presentationMode')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-xs text-dimWhite">{t('startVerse')}</label>
                        <input type="number" value={startVerse} onChange={e => setStartVerse(Number(e.target.value))} min="1" max={content.en.length} className={smallInputClass} />
                    </div>
                     <div>
                        <label className="text-xs text-dimWhite">{t('endVerse')}</label>
                        <input type="number" value={endVerse} onChange={e => setEndVerse(Number(e.target.value))} min="1" max={content.en.length} className={smallInputClass} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-dimWhite cursor-pointer">
                        <input type="checkbox" checked={enableAudio} onChange={e => setEnableAudio(e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"/>
                        {t('enableAudio')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-dimWhite cursor-pointer">
                        <input type="checkbox" checked={enableHighlight} onChange={e => setEnableHighlight(e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"/>
                        {t('enableHighlight')}
                    </label>
                    <button onClick={presentVerseRange} className="w-full py-2 px-3 bg-blue-gradient text-primary font-bold rounded-lg text-sm">
                        {t('presentRange')}
                    </button>
                </div>
            </div>
        )}
      </div>
      
      <div className="bg-primary p-2 md:p-4 rounded-[20px] shadow-lg min-h-[400px] border border-gray-800 relative">
        {searchResults.length > 0 ? (
          <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
            <h2 className="font-semibold text-2xl mb-4 text-white">{t('searchResultsFor')}: "{debouncedSearchTerm}"</h2>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <button
                    key={index}
                    onClick={() => handleResultClick(result.bookKey, result.chapter)}
                    className="w-full text-left border-b border-gray-700 pb-2 hover:bg-primary/50 p-2 rounded-md transition-colors"
                >
                  <p className="font-bold text-secondary">{result.book} <span dir="ltr">{result.chapter}:{result.verse}</span></p>
                  <p className="text-dimWhite" dangerouslySetInnerHTML={{ __html: result.text.replace(new RegExp(debouncedSearchTerm, 'gi'), (match) => `<mark class="bg-secondary text-primary rounded px-1">${match}</mark>`) }} />
                </button>
              ))}
            </div>
          </div>
        ) : debouncedSearchTerm ? (
            <div className="text-center py-10 text-gray-500">
                <p>{t('noResultsFound')}</p>
            </div>
        ) : content.en.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-4 mb-4 bg-primary/50 p-3 rounded-lg border border-gray-700">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
                className="p-2 bg-secondary text-primary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              
              <div className="flex items-center gap-2 min-w-[100px] justify-center">
                <span className="text-white font-semibold">{zoom}%</span>
              </div>
              
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                disabled={zoom >= 200}
                className="p-2 bg-secondary text-primary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              
              <button
                onClick={() => setZoom(100)}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors border border-gray-700"
              >
                {t('reset')}
              </button>
            </div>

            {/* Two-Column Layout: Farsi (Right) | English (Left) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              {/* English Column - LEFT */}
              <div 
                className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg p-4 md:p-6 overflow-y-auto border border-gray-700"
                style={{ fontSize: `${16 * (zoom / 100)}px` }}
              >
                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-primary/90 backdrop-blur-sm p-2 rounded-lg z-10">
                  <BookOpen size={24} className="text-secondary" />
                  <h3 className="text-xl font-bold text-white">
                    {currentBook?.name.en || 'English'}
                  </h3>
                  <span className="text-secondary">Chapter {selectedChapter}</span>
                </div>
                
                <div className="space-y-3">
                  {content.en.map((verse, index) => (
                    <p 
                      key={index} 
                      className="text-dimWhite leading-relaxed hover:bg-primary/20 p-2 rounded transition-colors"
                    >
                      <span className="inline-block min-w-[30px] text-secondary font-bold mr-2">
                        {index + 1}
                      </span>
                      <span className="text-white">{verse}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Farsi Column - RIGHT */}
              <div 
                className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg p-4 md:p-6 overflow-y-auto border border-gray-700"
                dir="rtl"
                style={{ fontSize: `${16 * (zoom / 100)}px` }}
              >
                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-primary/90 backdrop-blur-sm p-2 rounded-lg z-10">
                  <BookOpen size={24} className="text-secondary" />
                  <h3 className="text-xl font-bold text-white">
                    {currentBook?.name.fa || 'فارسی'}
                  </h3>
                  <span className="text-secondary">فصل {selectedChapter}</span>
                </div>
                
                <div className="space-y-3">
                  {content.fa.map((verse, index) => (
                    <p 
                      key={index} 
                      className="text-dimWhite leading-relaxed hover:bg-primary/20 p-2 rounded transition-colors"
                    >
                      <span className="inline-block min-w-[30px] text-secondary font-bold ml-2">
                        {index + 1}
                      </span>
                      <span className="text-white">{verse}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Book size={48} className="mx-auto mb-4" />
            <p>{t('contentNotAvailable')}</p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default BiblePage;