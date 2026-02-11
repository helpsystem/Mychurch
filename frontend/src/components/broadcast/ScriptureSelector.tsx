/**
 * 📖 Scripture Selector Pro - انتخابگر حرفه‌ای آیات کتاب مقدس
 * 
 * قابلیت‌ها:
 * - انتخاب کتاب، فصل، آیه با UI حرفه‌ای
 * - پشتیبانی از چندین ترجمه فارسی (مژده، قدیم، تفسیری)
 * - نمایش فارسی، انگلیسی، یا دوزبانه
 * - پنل آیات انتخاب‌شده در سمت راست
 * - هر آیه به عنوان یک اسلاید جداگانه
 * - Preview زنده محتوا
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScripturePage } from './types';
import { BookOpen, ChevronRight, X, Plus, Eye, Trash2, Languages, Check } from 'lucide-react';

// =============== TYPES ===============

interface BibleBook {
  key: string;
  name: { fa: string; en: string };
  chapters: number;
  testament: 'OT' | 'NT';
}

interface SelectedVerse {
  id: string;
  book: BibleBook;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: 'mojdeh' | 'qadim' | 'tafsiri';
  enTranslation: 'asv' | 'net' | 'kjv';
  showFa: boolean;
  showEn: boolean;
  textFa: string[];
  textEn: string[];
  verseNumbers: number[];
}

interface ScriptureSelectorProps {
  onClose: () => void;
  onAddSlides: (slides: ScripturePage[]) => void;
  lang: 'fa' | 'en';
}

// =============== TRANSLATIONS ===============

const translations = {
  fa: {
    title: '📖 انتخاب آیه کتاب مقدس',
    book: 'کتاب',
    chapter: 'فصل',
    verse: 'آیه',
    from: 'از',
    to: 'تا',
    translation: 'ترجمه',
    showFarsi: 'نمایش فارسی',
    showEnglish: 'نمایش انگلیسی',
    bilingual: 'دوزبانه',
    preview: 'پیش‌نمایش',
    add: 'افزودن به لیست',
    addAll: 'افزودن همه به اسلایدها',
    selectedVerses: 'آیات انتخاب‌شده',
    noSelection: 'آیه‌ای انتخاب نشده',
    close: 'بستن',
    loading: 'در حال بارگذاری...',
    oldTestament: 'عهد قدیم',
    newTestament: 'عهد جدید',
    searchBook: 'جستجوی کتاب...',
    mojdeh: 'مژده',
    qadim: 'قدیم',
    tafsiri: 'تفسیری',
    enTranslation: 'ترجمه انگلیسی',
    asv: 'ASV (امریکن استاندارد)',
    net: 'NET (ترجمه نوین)',
    kjv: 'KJV (کینگ جیمز)',
    clickToPreview: 'برای پیش‌نمایش کلیک کنید',
    chapters: 'فصل'
  },
  en: {
    title: '📖 Select Bible Verse',
    book: 'Book',
    chapter: 'Chapter',
    verse: 'Verse',
    from: 'From',
    to: 'To',
    translation: 'Translation',
    showFarsi: 'Show Farsi',
    showEnglish: 'Show English',
    bilingual: 'Bilingual',
    preview: 'Preview',
    add: 'Add to List',
    addAll: 'Add All to Slides',
    selectedVerses: 'Selected Verses',
    noSelection: 'No verse selected',
    close: 'Close',
    loading: 'Loading...',
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    searchBook: 'Search book...',
    mojdeh: 'Mojdeh',
    qadim: 'Qadim',
    tafsiri: 'Tafsiri',
    enTranslation: 'English Translation',
    asv: 'ASV (American Standard)',
    net: 'NET (New English)',
    kjv: 'KJV (King James)',
    clickToPreview: 'Click to preview',
    chapters: 'chapters'
  }
};

// =============== BIBLE BOOKS DATA ===============

const bibleBooks: BibleBook[] = [
  // Old Testament
  { key: 'GEN', name: { fa: 'پیدایش', en: 'Genesis' }, chapters: 50, testament: 'OT' },
  { key: 'EXO', name: { fa: 'خروج', en: 'Exodus' }, chapters: 40, testament: 'OT' },
  { key: 'LEV', name: { fa: 'لاویان', en: 'Leviticus' }, chapters: 27, testament: 'OT' },
  { key: 'NUM', name: { fa: 'اعداد', en: 'Numbers' }, chapters: 36, testament: 'OT' },
  { key: 'DEU', name: { fa: 'تثنیه', en: 'Deuteronomy' }, chapters: 34, testament: 'OT' },
  { key: 'JOS', name: { fa: 'یوشع', en: 'Joshua' }, chapters: 24, testament: 'OT' },
  { key: 'JDG', name: { fa: 'داوران', en: 'Judges' }, chapters: 21, testament: 'OT' },
  { key: 'RUT', name: { fa: 'روت', en: 'Ruth' }, chapters: 4, testament: 'OT' },
  { key: '1SA', name: { fa: 'اول سموئیل', en: '1 Samuel' }, chapters: 31, testament: 'OT' },
  { key: '2SA', name: { fa: 'دوم سموئیل', en: '2 Samuel' }, chapters: 24, testament: 'OT' },
  { key: '1KI', name: { fa: 'اول پادشاهان', en: '1 Kings' }, chapters: 22, testament: 'OT' },
  { key: '2KI', name: { fa: 'دوم پادشاهان', en: '2 Kings' }, chapters: 25, testament: 'OT' },
  { key: '1CH', name: { fa: 'اول تواریخ', en: '1 Chronicles' }, chapters: 29, testament: 'OT' },
  { key: '2CH', name: { fa: 'دوم تواریخ', en: '2 Chronicles' }, chapters: 36, testament: 'OT' },
  { key: 'EZR', name: { fa: 'عزرا', en: 'Ezra' }, chapters: 10, testament: 'OT' },
  { key: 'NEH', name: { fa: 'نحمیا', en: 'Nehemiah' }, chapters: 13, testament: 'OT' },
  { key: 'EST', name: { fa: 'استر', en: 'Esther' }, chapters: 10, testament: 'OT' },
  { key: 'JOB', name: { fa: 'ایوب', en: 'Job' }, chapters: 42, testament: 'OT' },
  { key: 'PSA', name: { fa: 'مزامیر', en: 'Psalms' }, chapters: 150, testament: 'OT' },
  { key: 'PRO', name: { fa: 'امثال', en: 'Proverbs' }, chapters: 31, testament: 'OT' },
  { key: 'ECC', name: { fa: 'جامعه', en: 'Ecclesiastes' }, chapters: 12, testament: 'OT' },
  { key: 'SNG', name: { fa: 'غزل غزلها', en: 'Song of Solomon' }, chapters: 8, testament: 'OT' },
  { key: 'ISA', name: { fa: 'اشعیا', en: 'Isaiah' }, chapters: 66, testament: 'OT' },
  { key: 'JER', name: { fa: 'ارمیا', en: 'Jeremiah' }, chapters: 52, testament: 'OT' },
  { key: 'LAM', name: { fa: 'مراثی ارمیا', en: 'Lamentations' }, chapters: 5, testament: 'OT' },
  { key: 'EZK', name: { fa: 'حزقیال', en: 'Ezekiel' }, chapters: 48, testament: 'OT' },
  { key: 'DAN', name: { fa: 'دانیال', en: 'Daniel' }, chapters: 12, testament: 'OT' },
  { key: 'HOS', name: { fa: 'هوشع', en: 'Hosea' }, chapters: 14, testament: 'OT' },
  { key: 'JOL', name: { fa: 'یوئیل', en: 'Joel' }, chapters: 3, testament: 'OT' },
  { key: 'AMO', name: { fa: 'عاموس', en: 'Amos' }, chapters: 9, testament: 'OT' },
  { key: 'OBA', name: { fa: 'عوبدیا', en: 'Obadiah' }, chapters: 1, testament: 'OT' },
  { key: 'JON', name: { fa: 'یونس', en: 'Jonah' }, chapters: 4, testament: 'OT' },
  { key: 'MIC', name: { fa: 'میکا', en: 'Micah' }, chapters: 7, testament: 'OT' },
  { key: 'NAM', name: { fa: 'ناحوم', en: 'Nahum' }, chapters: 3, testament: 'OT' },
  { key: 'HAB', name: { fa: 'حبقوق', en: 'Habakkuk' }, chapters: 3, testament: 'OT' },
  { key: 'ZEP', name: { fa: 'صفنیا', en: 'Zephaniah' }, chapters: 3, testament: 'OT' },
  { key: 'HAG', name: { fa: 'حجی', en: 'Haggai' }, chapters: 2, testament: 'OT' },
  { key: 'ZEC', name: { fa: 'زکریا', en: 'Zechariah' }, chapters: 14, testament: 'OT' },
  { key: 'MAL', name: { fa: 'ملاکی', en: 'Malachi' }, chapters: 4, testament: 'OT' },
  // New Testament
  { key: 'MAT', name: { fa: 'متی', en: 'Matthew' }, chapters: 28, testament: 'NT' },
  { key: 'MRK', name: { fa: 'مرقس', en: 'Mark' }, chapters: 16, testament: 'NT' },
  { key: 'LUK', name: { fa: 'لوقا', en: 'Luke' }, chapters: 24, testament: 'NT' },
  { key: 'JHN', name: { fa: 'یوحنا', en: 'John' }, chapters: 21, testament: 'NT' },
  { key: 'ACT', name: { fa: 'اعمال رسولان', en: 'Acts' }, chapters: 28, testament: 'NT' },
  { key: 'ROM', name: { fa: 'رومیان', en: 'Romans' }, chapters: 16, testament: 'NT' },
  { key: '1CO', name: { fa: 'اول قرنتیان', en: '1 Corinthians' }, chapters: 16, testament: 'NT' },
  { key: '2CO', name: { fa: 'دوم قرنتیان', en: '2 Corinthians' }, chapters: 13, testament: 'NT' },
  { key: 'GAL', name: { fa: 'غلاطیان', en: 'Galatians' }, chapters: 6, testament: 'NT' },
  { key: 'EPH', name: { fa: 'افسسیان', en: 'Ephesians' }, chapters: 6, testament: 'NT' },
  { key: 'PHP', name: { fa: 'فیلیپیان', en: 'Philippians' }, chapters: 4, testament: 'NT' },
  { key: 'COL', name: { fa: 'کولسیان', en: 'Colossians' }, chapters: 4, testament: 'NT' },
  { key: '1TH', name: { fa: 'اول تسالونیکیان', en: '1 Thessalonians' }, chapters: 5, testament: 'NT' },
  { key: '2TH', name: { fa: 'دوم تسالونیکیان', en: '2 Thessalonians' }, chapters: 3, testament: 'NT' },
  { key: '1TI', name: { fa: 'اول تیموتائوس', en: '1 Timothy' }, chapters: 6, testament: 'NT' },
  { key: '2TI', name: { fa: 'دوم تیموتائوس', en: '2 Timothy' }, chapters: 4, testament: 'NT' },
  { key: 'TIT', name: { fa: 'تیتوس', en: 'Titus' }, chapters: 3, testament: 'NT' },
  { key: 'PHM', name: { fa: 'فیلیمون', en: 'Philemon' }, chapters: 1, testament: 'NT' },
  { key: 'HEB', name: { fa: 'عبرانیان', en: 'Hebrews' }, chapters: 13, testament: 'NT' },
  { key: 'JAS', name: { fa: 'یعقوب', en: 'James' }, chapters: 5, testament: 'NT' },
  { key: '1PE', name: { fa: 'اول پطرس', en: '1 Peter' }, chapters: 5, testament: 'NT' },
  { key: '2PE', name: { fa: 'دوم پطرس', en: '2 Peter' }, chapters: 3, testament: 'NT' },
  { key: '1JN', name: { fa: 'اول یوحنا', en: '1 John' }, chapters: 5, testament: 'NT' },
  { key: '2JN', name: { fa: 'دوم یوحنا', en: '2 John' }, chapters: 1, testament: 'NT' },
  { key: '3JN', name: { fa: 'سوم یوحنا', en: '3 John' }, chapters: 1, testament: 'NT' },
  { key: 'JUD', name: { fa: 'یهودا', en: 'Jude' }, chapters: 1, testament: 'NT' },
  { key: 'REV', name: { fa: 'مکاشفه', en: 'Revelation' }, chapters: 22, testament: 'NT' },
];

// =============== COMPONENT ===============

const ScriptureSelector: React.FC<ScriptureSelectorProps> = ({
  onClose,
  onAddSlides,
  lang
}) => {
  const t = translations[lang];
  const isRTL = lang === 'fa';

  // Selection State
  const [step, setStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState(1);
  const [verseCount, setVerseCount] = useState(31);
  const [translation, setTranslation] = useState<'mojdeh' | 'qadim' | 'tafsiri'>('mojdeh');
  const [enTranslation, setEnTranslation] = useState<'asv' | 'net' | 'kjv'>('asv'); // ASV as default - most complete coverage

  // Display Options
  const [showFa, setShowFa] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [slideMode, setSlideMode] = useState<'list' | 'bubble'>('list');

  // Data State
  const [versesData, setVersesData] = useState<{ fa: string[]; en: string[] }>({ fa: [], en: [] });
  const [loading, setLoading] = useState(false);

  // Selected Verses List
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [previewVerse, setPreviewVerse] = useState<SelectedVerse | null>(null);

  // Filter books by search
  const filteredBooks = searchQuery
    ? bibleBooks.filter(book =>
      book.name.fa.includes(searchQuery) ||
      book.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.key.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : bibleBooks;

  const otBooks = filteredBooks.filter(b => b.testament === 'OT');
  const ntBooks = filteredBooks.filter(b => b.testament === 'NT');

  // Fetch verses when chapter changes
  const fetchChapterData = useCallback(async () => {
    if (!selectedBook) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/bible/content/${selectedBook.key}/${selectedChapter}?faTranslation=${translation}&enTranslation=${enTranslation}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('[ScriptureSelector] API Response:', { fa: data.verses?.fa?.length, en: data.verses?.en?.length, data });
        if (data.success) {
          setVersesData({
            fa: data.verses?.fa || [],
            en: data.verses?.en || []
          });
          setVerseCount(Math.max(data.verses?.fa?.length || 0, data.verses?.en?.length || 0, 1));
        }
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, translation, enTranslation]);

  useEffect(() => {
    if (step === 'verse' && selectedBook) {
      fetchChapterData();
    }
  }, [step, selectedBook, selectedChapter, translation, enTranslation, fetchChapterData]);

  // Handle book selection
  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setVerseStart(1);
    setVerseEnd(1);
    setStep('chapter');
  };

  // Handle chapter selection
  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setVerseStart(1);
    setVerseEnd(1);
    setStep('verse');
  };

  // Handle verse click (range selection)
  const handleVerseClick = (verse: number) => {
    if (verseStart === verseEnd) {
      // First click or single verse selected
      if (verse >= verseStart) {
        setVerseEnd(verse);
      } else {
        setVerseStart(verse);
      }
    } else {
      // Reset to single verse
      setVerseStart(verse);
      setVerseEnd(verse);
    }
  };

  // Add current selection to list
  const addToList = () => {
    console.log('[ScriptureSelector] addToList called:', {
      selectedBook: selectedBook?.key,
      versesDataFa: versesData.fa.length,
      versesDataEn: versesData.en.length,
      verseStart,
      verseEnd
    });

    // Remove strict check for data existence to allow adding just the reference
    if (!selectedBook) return;

    const verseNumbers = Array.from(
      { length: verseEnd - verseStart + 1 },
      (_, i) => verseStart + i
    );

    // Use empty array if data is missing (fallback)
    const textFaSlice = versesData.fa.length > 0
      ? versesData.fa.slice(verseStart - 1, verseEnd)
      : verseNumbers.map(() => '');

    const textEnSlice = versesData.en.length > 0
      ? versesData.en.slice(verseStart - 1, verseEnd)
      : verseNumbers.map(() => '');

    console.log('[ScriptureSelector] Creating verse with:', { textFaSlice, textEnSlice });

    const newVerse: SelectedVerse = {
      id: crypto.randomUUID(),
      book: selectedBook,
      chapter: selectedChapter,
      verseStart,
      verseEnd,
      translation,
      enTranslation,
      showFa,
      showEn,
      textFa: textFaSlice,
      textEn: textEnSlice,
      verseNumbers
    };

    setSelectedVerses(prev => [...prev, newVerse]);

    // Reset for next selection
    setVerseStart(verseEnd + 1 > verseCount ? 1 : verseEnd + 1);
    setVerseEnd(verseEnd + 1 > verseCount ? 1 : verseEnd + 1);
  };

  // Remove verse from list
  const removeFromList = (id: string) => {
    setSelectedVerses(prev => prev.filter(v => v.id !== id));
    if (previewVerse?.id === id) {
      setPreviewVerse(null);
    }
  };

  // Add all selected verses as slides
  const handleAddAllSlides = () => {
    // Group verses by Book & Chapter
    const groupedVerses: Record<string, SelectedVerse[]> = {};

    selectedVerses.forEach(verse => {
      const key = `${verse.book.key}-${verse.chapter}`;
      if (!groupedVerses[key]) {
        groupedVerses[key] = [];
      }
      groupedVerses[key].push(verse);
    });

    // Create a slide for EACH group (not each verse)
    const slides: ScripturePage[] = Object.values(groupedVerses).map(group => {
      // Sort verses in the group by verseStart
      const sortedGroup = group.sort((a, b) => a.verseStart - b.verseStart);
      const first = sortedGroup[0];

      // Combine text arrays
      const combinedTextFa: string[] = [];
      const combinedTextEn: string[] = [];
      const combinedVerseNumbers: number[] = [];

      sortedGroup.forEach(v => {
        combinedTextFa.push(...v.textFa);
        combinedTextEn.push(...v.textEn);
        // Regenerate verse numbers range for this chunk
        for (let i = v.verseStart; i <= v.verseEnd; i++) {
          combinedVerseNumbers.push(i);
        }
      });

      // Generate verse range string (e.g. "1-3, 5-7")
      const verseRange = sortedGroup.map(v =>
        v.verseStart === v.verseEnd ? `${v.verseStart}` : `${v.verseStart}-${v.verseEnd}`
      ).join(', ');

      const slide: ScripturePage = {
        id: crypto.randomUUID(),
        book: first.book.key,
        bookName: first.book.name,
        chapter: first.chapter,
        verses: verseRange,
        verseNumbers: combinedVerseNumbers,
        textPrimary: combinedTextFa,
        textSecondary: combinedTextEn,
        translation: first.translation,
        enTranslation: first.enTranslation,
        displayMode: slideMode
      };

      console.log('[ScriptureSelector] Created grouped slide:', slide);
      return slide;
    });

    onAddSlides(slides);
    setSelectedVerses([]);
    if (onClose) onClose();
  };

  // Check if verse is in selected range
  const isVerseInRange = (verse: number) => {
    return verse >= verseStart && verse <= verseEnd;
  };

  // Get translation label
  const getTranslationLabel = (trans: string) => {
    return t[trans as keyof typeof t] || trans;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isRTL ? 'font-[Vazirmatn]' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {t.title}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 text-sm border-b border-slate-700">
          <button
            onClick={() => setStep('book')}
            className={`px-3 py-1 rounded-lg transition ${step === 'book' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {t.book}
          </button>
          {selectedBook && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <button
                onClick={() => setStep('chapter')}
                className={`px-3 py-1 rounded-lg transition ${step === 'chapter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                {isRTL ? selectedBook.name.fa : selectedBook.name.en}
              </button>
            </>
          )}
          {step === 'verse' && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg">
                {t.chapter} {selectedChapter}
              </span>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Selection */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step 1: Book Selection */}
            {step === 'book' && (
              <>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchBook}
                  className="w-full bg-slate-800 text-white p-3 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 border border-slate-700"
                />

                {/* Old Testament */}
                {otBooks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-amber-400 font-bold mb-3 text-sm uppercase tracking-wide">
                      {t.oldTestament}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {otBooks.map(book => (
                        <button
                          key={book.key}
                          onClick={() => handleBookSelect(book)}
                          className="bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 p-3 rounded-xl text-right transition group"
                        >
                          <div className="text-white font-medium group-hover:text-amber-400 transition">
                            {isRTL ? book.name.fa : book.name.en}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {book.chapters} {t.chapters}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Testament */}
                {ntBooks.length > 0 && (
                  <div>
                    <h3 className="text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wide">
                      {t.newTestament}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {ntBooks.map(book => (
                        <button
                          key={book.key}
                          onClick={() => handleBookSelect(book)}
                          className="bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 p-3 rounded-xl text-right transition group"
                        >
                          <div className="text-white font-medium group-hover:text-emerald-400 transition">
                            {isRTL ? book.name.fa : book.name.en}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {book.chapters} {t.chapters}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Chapter Selection */}
            {step === 'chapter' && selectedBook && (
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapter => (
                  <button
                    key={chapter}
                    onClick={() => handleChapterSelect(chapter)}
                    className={`aspect-square flex items-center justify-center rounded-xl text-lg font-bold transition-all
                      ${selectedChapter === chapter
                        ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Verse Selection */}
            {step === 'verse' && selectedBook && (
              <div className="space-y-6">
                {/* Options Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  {/* Persian Translation Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🇮🇷 {t.translation}:</span>
                    <select
                      value={translation}
                      onChange={(e) => setTranslation(e.target.value as any)}
                      className="bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 text-sm"
                    >
                      <option value="mojdeh">{t.mojdeh}</option>
                      <option value="qadim">{t.qadim}</option>
                      <option value="tafsiri">{t.tafsiri}</option>
                    </select>
                  </div>

                  {/* English Translation Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🇺🇸 {t.enTranslation}:</span>
                    <select
                      value={enTranslation}
                      onChange={(e) => setEnTranslation(e.target.value as any)}
                      className="bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 text-sm"
                    >
                      <option value="asv">{t.asv}</option>
                      <option value="net">{t.net}</option>
                      <option value="kjv">{t.kjv}</option>
                    </select>
                  </div>

                  {/* Language Toggles */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFa}
                        onChange={(e) => setShowFa(e.target.checked)}
                        className="accent-indigo-500 w-4 h-4"
                      />
                      <span className="text-slate-300 text-sm">{t.showFarsi}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showEn}
                        onChange={(e) => setShowEn(e.target.checked)}
                        className="accent-purple-500 w-4 h-4"
                      />
                      <span className="text-slate-300 text-sm">{t.showEnglish}</span>
                    </label>
                  </div>

                  {/* Selected Range */}
                  {verseStart > 0 && (
                    <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 rounded-lg">
                      <span className="text-indigo-400 font-bold">
                        {verseStart === verseEnd ? verseStart : `${verseStart}-${verseEnd}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Verse Grid */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-slate-400">{t.loading}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                    {Array.from({ length: verseCount }, (_, i) => i + 1).map(verse => (
                      <button
                        key={verse}
                        onClick={() => handleVerseClick(verse)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                          ${isVerseInRange(verse)
                            ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                      >
                        {verse}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview of Selected Verses */}
                {!loading && verseStart > 0 && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {t.preview}
                      </h4>
                      <span className="text-slate-400 text-sm">
                        {isRTL ? selectedBook.name.fa : selectedBook.name.en} {selectedChapter}:{verseStart === verseEnd ? verseStart : `${verseStart}-${verseEnd}`}
                      </span>
                    </div>

                    {/* Data Missing Warning */}
                    {versesData.fa.length === 0 && versesData.en.length === 0 && (
                      <div className="p-3 bg-amber-900/30 border border-amber-500/30 rounded-lg text-amber-200 text-sm mb-4">
                        ⚠️ {isRTL ? 'متن آیه دریافت نشد (خطای سرور)، اما می‌توانید آدرس آن را اضافه کنید.' : 'Verse text unavailable (Server Error), but you can still add the reference.'}
                      </div>
                    )}

                    {/* Persian Text */}
                    {showFa && versesData.fa.length > 0 && (
                      <div className="space-y-2 mb-4" dir="rtl">
                        {versesData.fa.slice(verseStart - 1, verseEnd).map((text, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <span className="text-amber-400 font-bold min-w-[32px]">{verseStart + idx}</span>
                            <p className="text-white leading-relaxed font-[Vazirmatn]">{text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* English Text */}
                    {showEn && versesData.en.length > 0 && (
                      <div className={`space-y-2 ${showFa ? 'border-t border-slate-600 pt-4' : ''}`} dir="ltr">
                        {versesData.en.slice(verseStart - 1, verseEnd).map((text, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <span className="text-purple-400 font-bold min-w-[32px]">{verseStart + idx}</span>
                            <p className="text-slate-300 leading-relaxed">{text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add to List Button */}
                    <button
                      onClick={addToList}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t.add}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Selected Verses List */}
          <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="p-4 bg-slate-800 border-b border-slate-700">
              <h3 className="text-white font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                {t.selectedVerses} ({selectedVerses.length})
              </h3>
            </div>

            {/* Verses List */}
            <div className="flex-1 overflow-y-auto p-2">
              {selectedVerses.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t.noSelection}</p>
                  <p className="text-xs mt-2">{t.clickToPreview}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVerses.map((verse, index) => (
                    <div
                      key={verse.id}
                      onClick={() => setPreviewVerse(verse)}
                      className={`p-3 rounded-xl cursor-pointer transition border ${previewVerse?.id === verse.id
                        ? 'bg-indigo-600/20 border-indigo-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate">
                            {index + 1}. {isRTL ? verse.book.name.fa : verse.book.name.en}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {t.chapter} {verse.chapter}:{verse.verseStart === verse.verseEnd ? verse.verseStart : `${verse.verseStart}-${verse.verseEnd}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded">
                              {getTranslationLabel(verse.translation)}
                            </span>
                            {verse.showFa && <span className="text-xs text-indigo-400">🇮🇷</span>}
                            {verse.showEn && <span className="text-xs text-purple-400">🇺🇸</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromList(verse.id); }}
                          className="p-1.5 hover:bg-red-600/20 rounded-lg text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Panel Bubble - Shows when a verse is selected/hovered */}
            {previewVerse && (
              <div className="absolute left-80 top-4 bottom-4 w-72 bg-slate-900 border border-slate-700/50 rounded-r-2xl shadow-2xl z-30 animate-in slide-in-from-left-2 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                  <h4 className="text-emerald-400 font-bold text-sm">
                    {isRTL ? previewVerse.book.name.fa : previewVerse.book.name.en} {previewVerse.chapter}:{previewVerse.verseStart === previewVerse.verseEnd ? previewVerse.verseStart : `${previewVerse.verseStart}-${previewVerse.verseEnd}`}
                  </h4>
                  <button onClick={() => setPreviewVerse(null)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {previewVerse.showFa && (
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">🇮🇷 {t.mojdeh}</span>
                    <p className="text-white text-sm leading-8 font-[Vazirmatn] text-right" dir="rtl">
                      {previewVerse.textFa.join(' ')}
                    </p>
                  </div>
                )}

                {previewVerse.showEn && (
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">🇺🇸 {previewVerse.enTranslation.toUpperCase()}</span>
                    <p className="text-slate-300 text-sm leading-relaxed text-left" dir="ltr">
                      {previewVerse.textEn.join(' ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            {selectedVerses.length > 0 && (
              <div className="p-4 bg-slate-800 border-t border-slate-700 z-40 relative flex flex-col gap-3">
                {/* Mode Toggle */}
                <div className="flex bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setSlideMode('list')}
                    className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${slideMode === 'list'
                      ? 'bg-slate-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    📃 {isRTL ? 'لیستی' : 'List'}
                  </button>
                  <button
                    onClick={() => setSlideMode('bubble')}
                    className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${slideMode === 'bubble'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    💬 {isRTL ? 'حبابی' : 'Bubble'}
                  </button>
                </div>

                <button
                  onClick={handleAddAllSlides}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <Check className="w-5 h-5" />
                  {isRTL ? 'ثبت و افزودن به اسلایدها' : 'Save & Add to Slides'}
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">{selectedVerses.length}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptureSelector;
