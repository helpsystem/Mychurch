import React, { useEffect, useMemo, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { BibleBook, Language } from '../types';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import './FlipBook.css';

type VerseLanguage = 'fa' | 'en';

interface BibleVerse {
  number: number;
  text: {
    fa: string;
    en: string;
  };
}

type FlipBookBibleBook = (BibleBook & {
  code?: string;
  testament?: 'OT' | 'NT';
  name?: BibleBook['name'] | string;
}) | null | undefined;

interface PageProps {
  number?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface PageVerse {
  number: number;
  text: string;
  language: VerseLanguage;
}

interface FlipBookBibleProps {
  verses: BibleVerse[];
  currentBook?: FlipBookBibleBook;
  selectedChapter: number;
  maxChapters: number;
  isBilingual: boolean;
  fontSize: number;
  isPlaying: boolean;
  currentVerse: number | null;
  onChapterChange: (chapter: number) => void;
  onBilingualToggle: () => void;
  onFontSizeChange: (size: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onLanguageChange: (lang: string) => void;
  lang: Language;
  persianBookNames: Record<string, string>;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => (
  <div ref={ref} className={`page ${props.className || ''}`} style={props.style}>
    <div className="page-content">{props.children}</div>
    {props.number && <div className="page-footer">{props.number}</div>}
  </div>
));

Page.displayName = 'Page';

interface PageCoverProps {
  isBackCover?: boolean;
  children: React.ReactNode;
}

const PageCover = React.forwardRef<HTMLDivElement, PageCoverProps>(({ isBackCover, children }, ref) => (
  <div ref={ref} className={`page page--cover ${isBackCover ? 'page--cover-back' : ''}`}>
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      {isBackCover ? (
        <>
          <img src="/images/church-logo-hq.png" alt="Church Logo" className="w-20 h-20 mb-4" />
          <div className="mb-2 text-dimWhite">پایان فصل</div>
        </>
      ) : (
        <>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2.2rem', color: '#8B4513', marginBottom: '1.2rem' }}>کتاب مقدس</h2>
          <div style={{ fontSize: '1.2rem', color: '#444', marginBottom: '2rem' }}>خوانش آیات الهام‌بخش</div>
        </>
      )}
      {children}
    </div>
  </div>
));

PageCover.displayName = 'PageCover';

const FlipBookBible: React.FC<FlipBookBibleProps> = ({
  verses,
  currentBook,
  selectedChapter,
  maxChapters,
  isBilingual,
  fontSize,
  isPlaying: _isPlaying,
  currentVerse,
  onChapterChange,
  onBilingualToggle: _onBilingualToggle,
  onFontSizeChange: _onFontSizeChange,
  onPlay: _onPlay,
  onStop: _onStop,
  onPrevChapter,
  onNextChapter,
  onLanguageChange: _onLanguageChange,
  lang,
  persianBookNames
}) => {
  const versesPerPage = 6;
  const totalPages = isBilingual
    ? Math.ceil(Math.max(1, verses.length) / versesPerPage) * 2
    : Math.ceil(Math.max(1, verses.length) / versesPerPage);

  const [currentPage, setCurrentPage] = useState(0);
  const [showCover, setShowCover] = useState(true);
  const [showPlain, setShowPlain] = useState(false);

  const isRtl = lang === 'fa';
  const primaryLanguage: VerseLanguage = isRtl ? 'fa' : 'en';
  const secondaryLanguage: VerseLanguage = primaryLanguage === 'fa' ? 'en' : 'fa';

  useEffect(() => {
    setCurrentPage(0);
    setShowCover(true);
  }, [selectedChapter, currentBook, isBilingual]);

  const chapterOptions = useMemo(
    () => Array.from({ length: Math.max(1, maxChapters) }, (_, index) => index + 1),
    [maxChapters]
  );

  const bookTitle = useMemo(() => {
    if (!currentBook) return '';
    const bookKey = currentBook.key || currentBook.code || '';
    const nameValue = currentBook.name;

    const resolveName = (): string => {
      if (!nameValue) return '';
      if (typeof nameValue === 'string') return nameValue;
      const requested = nameValue[lang as keyof typeof nameValue];
      if (typeof requested === 'string' && requested.trim()) return requested;
      if (isRtl && typeof nameValue.fa === 'string' && nameValue.fa.trim()) return nameValue.fa;
      if (typeof nameValue.en === 'string' && nameValue.en.trim()) return nameValue.en;
      return '';
    };

    if (isRtl && bookKey) {
      return persianBookNames[bookKey] || resolveName();
    }
    return resolveName();
  }, [currentBook, lang, isRtl, persianBookNames]);

  const getVerseText = (verse: BibleVerse, language: VerseLanguage) => {
    if (language === 'fa') {
      if (verse.text.fa && verse.text.fa.trim().length > 0) return verse.text.fa;
      return verse.text.en || '';
    }
    if (verse.text.en && verse.text.en.trim().length > 0) return verse.text.en;
    return verse.text.fa || '';
  };

  const getPageVerses = (pageIndex: number): PageVerse[] => {
    if (verses.length === 0) {
      return [];
    }

    if (isBilingual) {
      // In bilingual mode, we want:
      // Page 0 (Right): Persian Verses 1-N
      // Page 1 (Left): English Verses 1-N (Same verses as Page 0)
      // Page 2 (Right): Persian Verses N+1-M
      // Page 3 (Left): English Verses N+1-M

      const pairIndex = Math.floor(pageIndex / 2);
      const startIndex = pairIndex * versesPerPage;
      const endIndex = Math.min(startIndex + versesPerPage, verses.length);

      // Determine language for this page
      // If book is RTL (Persian main):
      // Even pages (0, 2, 4...) are RIGHT side -> Persian
      // Odd pages (1, 3, 5...) are LEFT side -> English
      const isRightPage = pageIndex % 2 === 0;
      const targetLang: VerseLanguage = isRightPage ? 'fa' : 'en';

      return verses.slice(startIndex, endIndex).map(verse => ({
        number: verse.number,
        text: getVerseText(verse, targetLang),
        language: targetLang
      }));
    }

    const startIndex = pageIndex * versesPerPage;
    const endIndex = Math.min(startIndex + versesPerPage, verses.length);
    return verses.slice(startIndex, endIndex).map(verse => ({
      number: verse.number,
      text: getVerseText(verse, primaryLanguage),
      language: primaryLanguage
    }));
  };

  const flipToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages) return;
    setCurrentPage(pageIndex);
  };

  const nextPage = () => {
    if (showPlain) return;
    if (showCover) {
      setShowCover(false);
      return;
    }
    if (currentPage < totalPages - 1) {
      flipToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (showPlain) return;
    if (showCover) return;
    if (currentPage > 0) {
      flipToPage(currentPage - 1);
    } else {
      setShowCover(true);
    }
  };

  const renderVerse = (verse: PageVerse, index: number) => {
    const isFirstOnPage = index === 0;
    const isCurrentVerse = currentVerse === verse.number;
    const isEnglish = verse.language === 'en';

    return (
      <div
        key={`flip-${verse.language}-${verse.number}`}
        className={`verse ${isFirstOnPage ? 'first-verse' : ''} ${isCurrentVerse ? 'current-verse' : ''}`}
        style={{ marginBottom: '1rem', lineHeight: '1.8' }}
      >
        <div className={`verse-single ${isEnglish ? 'verse-english' : 'verse-persian'}`} dir={isEnglish ? 'ltr' : 'rtl'}>
          <span className="verse-number" style={{ fontWeight: 600, marginInlineEnd: '0.5rem', color: '#8B4513' }}>
            {verse.number}
          </span>
          <span className="verse-text" style={{ display: 'inline', color: '#333' }}>
            {verse.text}
          </span>
        </div>
      </div>
    );
  };

  const renderPageContent = (pageVerses: PageVerse[]) => (
    <div className="verses" style={{ padding: '1rem 0.5rem', height: '100%', overflowY: 'auto' }}>
      {pageVerses.map((verse, idx) => renderVerse(verse, idx))}
    </div>
  );

  const renderFlipBookPages = () => {
    const pages: React.ReactNode[] = [];

    // Cover Page
    pages.push(
      <PageCover key="cover">
        <div className="flex flex-col justify-around items-center h-full text-center p-8 border-4 border-double border-[#8B4513] m-4 rounded-lg bg-[#fdfbf7]">
          <BookOpen className="text-[#8B4513]" size={64} />
          <div>
            <h2 className="text-4xl font-bold text-[#8B4513] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {isRtl ? 'کتاب مقدس' : 'Holy Bible'}
            </h2>
            <p className="text-lg text-[#5d4037]" dir={isRtl ? 'rtl' : 'ltr'}>
              {bookTitle
                ? `${bookTitle} ${isRtl ? `- فصل ${selectedChapter}` : `- Chapter ${selectedChapter}`}`
                : (isRtl ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`)}
            </p>
          </div>
          <div className="text-sm text-[#8B4513]/60 mt-8">
            {isRtl ? 'برای شروع ورق بزنید' : 'Flip to start reading'}
          </div>
        </div>
      </PageCover>
    );

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const subset = getPageVerses(pageIndex);
      pages.push(
        <Page key={`page-${pageIndex}`} number={pageIndex + 1}>
          {renderPageContent(subset)}
        </Page>
      );
    }

    // Back Cover
    pages.push(
      <PageCover key="back-cover" isBackCover>
        <div className="flex flex-col justify-center items-center h-full text-center p-8 border-4 border-double border-[#8B4513] m-4 rounded-lg bg-[#fdfbf7]">
          <img src="/images/church-logo-hq.png" alt="Church Logo" className="w-24 h-24 mb-6 opacity-80" />
          <div className="mb-2 text-[#8B4513] text-xl font-serif">{isRtl ? 'پایان فصل' : 'End of chapter'}</div>
        </div>
      </PageCover>
    );

    return pages;
  };

  const renderPlainView = () => (
    <div className="plain-bible-view space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white/70 rounded-xl shadow-sm px-5 py-4 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">
          {bookTitle || (isRtl ? 'کتاب انتخاب‌شده' : 'Selected book')}
        </h3>
        <p className="text-gray-500">
          {isRtl ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
        </p>
      </div>
      <div className="space-y-3">
        {verses.map(verse => {
          const primaryText = getVerseText(verse, primaryLanguage);
          const secondaryText = isBilingual ? getVerseText(verse, secondaryLanguage) : null;

          return (
            <div
              key={`plain-${verse.number}`}
              className="bg-white/80 border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-amber-700">{verse.number}</span>
                <div className="flex-1 space-y-1">
                  <p className="text-gray-800 leading-relaxed" dir={primaryLanguage === 'fa' ? 'rtl' : 'ltr'}>
                    {primaryText}
                  </p>
                  {secondaryText && (
                    <p className="text-gray-600 leading-relaxed" dir={secondaryLanguage === 'fa' ? 'rtl' : 'ltr'}>
                      {secondaryText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const handlePlainToggle = () => {
    setShowPlain(prev => !prev);
  };

  const handleChapterSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextChapter = Number(event.target.value);
    if (!Number.isNaN(nextChapter) && nextChapter !== selectedChapter) {
      onChapterChange(nextChapter);
      setCurrentPage(0);
      setShowCover(true);
    }
  };

  const pageIndicator = showCover
    ? (isRtl ? 'جلد' : 'Cover')
    : `${isRtl ? 'صفحه' : 'Page'} ${currentPage + 1} ${isRtl ? 'از' : 'of'} ${totalPages}`;

  const togglePlainLabel = showPlain
    ? (isRtl ? 'بازگشت به کتاب' : 'Back to flipbook')
    : (isRtl ? 'نمایش ساده آیات' : 'Plain verse view');

  const plainViewTitle = showPlain
    ? (isRtl ? 'بازگشت به حالت کتاب' : 'Return to flipbook mode')
    : (isRtl ? 'برای مشاهده ساده آیات کلیک کنید' : 'Switch to plain view');

  return (
    <div className="flipbook-container" style={{ fontSize: `${fontSize}px` }}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        {showPlain ? (
          renderPlainView()
        ) : (
          <HTMLFlipBook
            width={550}
            height={733}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1333}
            maxShadowOpacity={0.5}
            showCover
            mobileScrollSupport={false}
            className="flip-book"
            startPage={0}
            drawShadow
            flippingTime={1000}
            usePortrait
            startZIndex={0}
            autoSize
            clickEventForward
            useMouseEvents
            swipeDistance={3}
            showPageCorners
            disableFlipByClick={false}
          >
            {renderFlipBookPages()}
          </HTMLFlipBook>
        )}
      </div>

      <div className="flipbook-controls" dir="ltr">
        <button
          onClick={onPrevChapter}
          disabled={selectedChapter <= 1}
          className="flip-button"
          title={isRtl ? 'فصل قبلی' : 'Previous chapter'}
        >
          <ArrowLeft className="w-4 h-4" />
          {isRtl ? 'فصل قبلی' : 'Previous chapter'}
        </button>

        <button
          onClick={prevPage}
          disabled={showPlain || showCover}
          className="flip-button"
          title={isRtl ? 'صفحه قبل' : 'Previous page'}
        >
          <ChevronLeft className="w-4 h-4" />
          {isRtl ? 'صفحه قبل' : 'Previous page'}
        </button>

        <div className="flip-button page-indicator">
          {showPlain ? (isRtl ? 'نمایش ساده' : 'Plain view') : pageIndicator}
        </div>

        <button
          onClick={nextPage}
          disabled={showPlain || (!showCover && currentPage >= totalPages - 1)}
          className="flip-button"
          title={isRtl ? 'صفحه بعد' : 'Next page'}
        >
          {isRtl ? 'صفحه بعد' : 'Next page'}
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onNextChapter}
          disabled={selectedChapter >= maxChapters}
          className="flip-button"
          title={isRtl ? 'فصل بعدی' : 'Next chapter'}
        >
          {isRtl ? 'فصل بعدی' : 'Next chapter'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlainToggle}
          className="flip-button"
          title={plainViewTitle}
        >
          {togglePlainLabel}
        </button>
      </div>

      <div className="flex justify-center items-center gap-3 mt-4">
        <label className="text-sm text-gray-200">
          {isRtl ? 'انتخاب فصل:' : 'Chapter:'}
        </label>
        <select
          value={selectedChapter}
          onChange={handleChapterSelect}
          className="flip-select"
          dir="ltr"
        >
          {chapterOptions.map(chapter => (
            <option key={chapter} value={chapter}>
              {isRtl ? `فصل ${chapter}` : `Chapter ${chapter}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FlipBookBible;
