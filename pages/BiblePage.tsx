
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { ChevronDown, Search, X, Book, BookOpen, MonitorPlay } from 'lucide-react';
import Spinner from '../components/Spinner';
import HTMLFlipBook from 'react-pageflip';
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

// Moved Page and PageCover outside the component to prevent re-creation on every render.
const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number, className?: string, style?: React.CSSProperties }>((props, ref) => {
    return (
        <div className={`page ${props.className || ''}`} ref={ref} style={props.style}>
            <div className="page-content">{props.children}</div>
            {props.number && <div className="page-footer">{props.number}</div>}
        </div>
    );
});

const PageCover = React.forwardRef<HTMLDivElement, { children: React.ReactNode, isBackCover?: boolean, bgImage?: string }>((props, ref) => {
    const style = props.bgImage ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${props.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};
    return (
        <div className={`page page--cover ${props.isBackCover ? 'page--cover-back' : ''}`} ref={ref} style={style}>
            <div className="page-content">{props.children}</div>
        </div>
    );
});

const BiblePage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content: fullContent } = useContent();
  const { user } = useAuth();
  const { bibleBooks, bibleContent } = fullContent;
  const [selectedBook, setSelectedBook] = useState<string>(bibleBooks[0]?.key || '');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [content, setContent] = useState<{ en: string[]; fa: string[] }>({ en: [], fa: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState<{ bookKey: string; book: string; chapter: number; verse: number; text: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const [presentationWindow, setPresentationWindow] = useState<Window | null>(null);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Admin presentation controls state
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(1);
  const [enableAudio, setEnableAudio] = useState(true);
  const [enableHighlight, setEnableHighlight] = useState(true);

  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER');

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

  const loadChapterContent = useCallback(() => {
    const bookData = bibleContent[selectedBook];
    if (bookData && bookData[selectedChapter]) {
      setContent({
          en: bookData[selectedChapter].en || [],
          fa: bookData[selectedChapter].fa || [],
      });
      setStartVerse(1);
      setEndVerse(bookData[selectedChapter].en?.length || 1);
    } else {
      setContent({ en: [], fa: [] });
      setStartVerse(1);
      setEndVerse(1);
    }
    setHasInteracted(false); // Reset interaction state on chapter change
  }, [selectedBook, selectedChapter, bibleContent]);

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

  const PageTurnHint = () => (
      <div className="page-turn-hint-container" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <div className="hand-icon"></div>
      </div>
  );

  const renderBookPages = () => {
      if (!content.en.length) return [];

      const pages: JSX.Element[] = [];
      const totalVerses = content.en.length;
      let verseCounter = 0;

      const isPresentationActive = isAdmin && presentationWindow && !presentationWindow.closed;

      while(verseCounter < totalVerses) {
          // English page
          const enPageContent: JSX.Element[] = [];
          let enPageVerseCount = 0;
          while(verseCounter + enPageVerseCount < totalVerses && enPageVerseCount < VERSES_PER_PAGE) {
              const verseIndex = verseCounter + enPageVerseCount;
              enPageContent.push(
                  <p key={`en-${verseIndex}`} className="mb-3 leading-relaxed relative group">
                      <span className="text-secondary/80 font-bold text-xs mr-2" dir="ltr">{verseIndex + 1}</span>
                      {content.en[verseIndex]}
                      {isPresentationActive && (
                        <button 
                            onClick={() => presentVerse(verseIndex + 1)}
                            className="absolute -top-1 -right-1 rtl:-left-1 rtl:-right-auto p-1 bg-primary/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Present this verse"
                        >
                            <MonitorPlay size={16} className="text-secondary" />
                        </button>
                      )}
                  </p>
              );
              enPageVerseCount++;
          }
          pages.push(<Page number={(pages.length / 2) + 2} key={`en-page-${pages.length}`}>{enPageContent}</Page>);

          // Farsi page
          const faPageContent: JSX.Element[] = [];
          let faPageVerseCount = 0;
          while(verseCounter + faPageVerseCount < totalVerses && faPageVerseCount < VERSES_PER_PAGE) {
              const verseIndex = verseCounter + faPageVerseCount;
              faPageContent.push(
                   <p key={`fa-${verseIndex}`} className="mb-3 text-right leading-relaxed relative group" dir="rtl">
                      <span className="text-secondary/80 font-bold text-xs ml-2" dir="ltr">{verseIndex + 1}</span>
                      {content.fa[verseIndex]}
                       {isPresentationActive && (
                        <button 
                            onClick={() => presentVerse(verseIndex + 1)}
                            className="absolute -top-1 -left-1 rtl:-right-1 rtl:-left-auto p-1 bg-primary/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Present this verse"
                        >
                            <MonitorPlay size={16} className="text-secondary" />
                        </button>
                      )}
                  </p>
              );
              faPageVerseCount++;
          }
          pages.push(<Page number={(pages.length / 2) + 2} key={`fa-page-${pages.length}`}>{faPageContent}</Page>);
          
          verseCounter += VERSES_PER_PAGE;
      }
      return pages;
  };

  
  const inputClass = "w-full p-3 border-0 rounded-lg appearance-none bg-primary text-white focus:outline-none focus:ring-2 focus:ring-secondary";
  const smallInputClass = "w-full p-2 border-0 rounded-lg bg-primary text-white focus:outline-none focus:ring-2 focus:ring-secondary";

  return (
    <div className="space-y-8 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2">{t('bibleTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('bibleDescription')}</p>
      </div>

      <div className="bg-black-gradient p-4 rounded-[20px] box-shadow sticky top-[88px] z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          <div className="relative">
            <select value={selectedBook} onChange={handleBookChange} className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}>
              {bibleBooks.map(book => <option key={book.key} value={book.key}>{book.name[lang]}</option>)}
            </select>
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 rtl:left-3 rtl:right-auto text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
             <select value={selectedChapter} onChange={handleChapterChange} disabled={!currentBook} className={`${inputClass} pr-10 rtl:pl-10 rtl:pr-4`}>
                {currentBook && bibleContent[currentBook.key] && Object.keys(bibleContent[currentBook.key] || {}).map(chap => (
                  <option key={chap} value={chap}>{t('chapter')} {chap}</option>
                ))}
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
          <>
            <HTMLFlipBook 
                width={550} 
                height={733}
                size="stretch"
                minWidth={315}
                maxWidth={1000}
                minHeight={420}
                maxHeight={1333}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="flip-book"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={1000}
                usePortrait={true}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={3}
                showPageCorners={true}
                disableFlipByClick={false}
                onFlip={() => setHasInteracted(true)}
                onChangeOrientation={() => {}}
                onChangeState={() => {}}
                onInit={() => {}}
            >
                <PageCover bgImage="https://upload.wikimedia.org/wikipedia/commons/2/23/Carl_Bloch_-_The_Crucifixion_-_Google_Art_Project.jpg">
                    <div className="flex flex-col justify-around items-center h-full text-center">
                        <BookOpen size={64} className="text-white/50" />
                        <div>
                            <h2 className="text-5xl font-bold">{currentBook?.name[lang]}</h2>
                            <p className="text-3xl mt-2 bible-chapter-ref">{t('chapter')} {selectedChapter}</p>
                        </div>
                        <LatinCrossIcon size={120} className="text-yellow-400" />
                    </div>
                </PageCover>
                
                {renderBookPages()}

                <PageCover isBackCover={true}>
                     <img src="https://i.imgur.com/gA0939q.png" alt="Church Logo" className="w-24 h-24" />
                </PageCover>
            </HTMLFlipBook>
            {!hasInteracted && <PageTurnHint />}
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Book size={48} className="mx-auto mb-4" />
            <p>{t('contentNotAvailable')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiblePage;