"use client";

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
import { ScripturePage, BibleBook } from '@/types/broadcast';
import { BookOpen, ChevronRight, X, Plus, Eye, Trash2, Languages, Check, Loader2, Settings } from 'lucide-react';
import { INITIAL_BIBLE_CONTENT, OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '@/lib/bibleData';

interface BibleVersion {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
  hasAudio?: boolean;
}

// =============== TYPES ===============

interface SelectedVerse {
  id: string;
  book: BibleBook;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: string;
  enTranslation: string;
  showFa: boolean;
  showEn: boolean;
  textFa: string[];
  textEn: string[];
  verseNumbers: number[];
  fontFa?: string;
  fontEn?: string;
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

import { getBibleBooks, fetchBibleBooksFromDB } from './dataService';

const normalizeSearchText = (value: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim();

// =============== COMPONENT ===============

const ScriptureSelector: React.FC<ScriptureSelectorProps> = ({
  onClose,
  onAddSlides,
  lang
}) => {
  const t = translations[lang];
  const isRTL = lang === 'fa';
  
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>(getBibleBooks());

  // Selection State
  const [step, setStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [testamentFilter, setTestamentFilter] = useState<'all' | 'ot' | 'nt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verseStart, setVerseStart] = useState<number | null>(null);
  const [verseEnd, setVerseEnd] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState(31);
  const [translation, setTranslation] = useState<string>('NMV');
  const [enTranslation, setEnTranslation] = useState<string>('BSB'); 

  // Dynamic Versions State
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const englishVersions = versions.filter(v => v.language !== 'fa');
  const persianVersions = versions.filter(v => v.language === 'fa');

  // Load versions on mount
  useEffect(() => {
    fetch("/api/bible/versions")
      .then(r => r.json())
      .then(d => {
        if (d.versions) {
          setVersions(d.versions);
          const savedFa = localStorage.getItem('broadcast_verse_fa_trans');
          const savedEn = localStorage.getItem('broadcast_verse_en_trans');
          
          if (savedFa && d.versions.some((v: any) => v.abbr === savedFa)) {
             setTranslation(savedFa);
          } else {
             const hasNMV = d.versions.some((v: any) => v.abbr === 'NMV');
             if (!hasNMV && d.versions.filter((v: any) => v.language === 'fa').length > 0) {
                setTranslation(d.versions.find((v: any) => v.language === 'fa').abbr);
             } else if (hasNMV) setTranslation('NMV');
          }
          
          if (savedEn && d.versions.some((v: any) => v.abbr === savedEn)) {
             setEnTranslation(savedEn);
          } else {
             const hasBSB = d.versions.some((v: any) => v.abbr === 'BSB');
             if (!hasBSB && d.versions.filter((v: any) => v.language !== 'fa').length > 0) {
                setEnTranslation(d.versions.find((v: any) => v.language !== 'fa').abbr);
             } else if (hasBSB) setEnTranslation('BSB');
          }
        }
      })
      .catch(console.error);
  }, []);

  // Display Options
  const [showFa, setShowFa] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [primaryLang, setPrimaryLang] = useState<'fa' | 'en'>('fa');
  const [slideMode, setSlideMode] = useState<'list' | 'bubble'>('list');
  const [combineIntoOneSlide, setCombineIntoOneSlide] = useState(true);
  const [referenceListMode, setReferenceListMode] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<'manual' | 'nastaliq-wavy-ref'>('manual');
  
  // Font States initialized from localStorage
  const [fontFa, setFontFa] = useState('var(--font-vazirmatn)');
  const [fontEn, setFontEn] = useState('var(--font-inter)');

  useEffect(() => {
     const savedPri = localStorage.getItem('broadcast_verse_primary_lang');
     if (savedPri === 'fa' || savedPri === 'en') setPrimaryLang(savedPri);
     
     const savedFontFa = localStorage.getItem('broadcast_verse_font_fa');
     if (savedFontFa) setFontFa(savedFontFa);
     
     const savedFontEn = localStorage.getItem('broadcast_verse_font_en');
     if (savedFontEn) setFontEn(savedFontEn);
  }, []);

  // Sync Book List dynamically based on the primary active translation
  const activeTranslationForBooks = primaryLang === 'fa' ? translation : enTranslation;
  useEffect(() => {
    if (!activeTranslationForBooks) return;
    
    fetchBibleBooksFromDB(activeTranslationForBooks).then(liveBooks => {
       if (liveBooks && liveBooks.length > 0) {
           setBibleBooks(liveBooks);
           setSelectedBook((prev) => {
             if (!prev) return prev;
             const matched = liveBooks.find((b) => b.key === prev.key);
             if (!matched) {
               setStep('book');
               setVerseStart(null);
               setVerseEnd(null);
               return null;
             }
             if (selectedChapter > matched.chapters) {
               setSelectedChapter(matched.chapters);
               setVerseStart(null);
               setVerseEnd(null);
             }
             return matched;
           });
       }
    }).catch(console.error);
  }, [activeTranslationForBooks, selectedChapter]);

  // Data State
  const [versesData, setVersesData] = useState<{ fa: string[]; en: string[] }>({ fa: [], en: [] });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected Verses List
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);
  const [previewVerse, setPreviewVerse] = useState<SelectedVerse | null>(null);

  // Filter books by search
  const normalizedQuery = normalizeSearchText(searchQuery);
  const searchedBooks = normalizedQuery
    ? bibleBooks.filter((book: BibleBook) => {
      const fa = normalizeSearchText(book.name.fa);
      const en = normalizeSearchText(book.name.en);
      const key = normalizeSearchText(book.key);
      return fa.includes(normalizedQuery) || en.includes(normalizedQuery) || key.includes(normalizedQuery);
    })
    : bibleBooks;

  const hadNoExactResults = !!normalizedQuery && searchedBooks.length === 0;
  const filteredBooks = hadNoExactResults ? bibleBooks : searchedBooks;

  const otKeySet = new Set(OLD_TESTAMENT_BOOKS.map((key) => key.toLowerCase()));
  const ntKeySet = new Set(NEW_TESTAMENT_BOOKS.map((key) => key.toLowerCase()));

  const otBooks = filteredBooks.filter((b: BibleBook) => otKeySet.has((b.key || '').toLowerCase()));
  const ntBooks = filteredBooks.filter((b: BibleBook) => ntKeySet.has((b.key || '').toLowerCase()));
  const visibleBooks = testamentFilter === 'ot' ? otBooks : testamentFilter === 'nt' ? ntBooks : filteredBooks;
  // Fetch verses when chapter changes using the matching parallel API
  const fetchChapterData = useCallback(async () => {
    if (!selectedBook) return;

    setLoading(true);
    setLoadError(null);
    try {
      const BOOK_ABBRV_MAP: Record<string, string> = {
        "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
        "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1Samuel": "1SA", "2Samuel": "2SA",
        "1Kings": "1KI", "2Kings": "2KI", "1Chronicles": "1CH", "2Chronicles": "2CH", "Ezra": "EZR",
        "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
        "Ecclesiastes": "ECC", "SongOfSongs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
        "Lamentations": "LAM", "Ezekiel": "EZE", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL",
        "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM",
        "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
        "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
        "Romans": "ROM", "1Corinthians": "1CO", "2Corinthians": "2CO", "Galatians": "GAL",
        "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1Thessalonians": "1TH",
        "2Thessalonians": "2TH", "1Timothy": "1TI", "2Timothy": "2TI", "Titus": "TIT",
        "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS", "1Peter": "1PE", "2Peter": "2PE",
        "1John": "1JN", "2John": "2JN", "3John": "3JN", "Jude": "JUD", "Revelation": "REV"
      };
      
      const abbrBook = BOOK_ABBRV_MAP[selectedBook.key] || selectedBook.key;

      const response = await fetch(
        `/api/bible/parallel?versionEn=${enTranslation}&versionFa=${translation}&book=${abbrBook}&chapter=${selectedChapter}`
      );

      let loaded = false;
      if (response.ok) {
        const data = await response.json();
        if (data.parallel && Array.isArray(data.parallel)) {
          // data.parallel is an array of ParallelVerse: { verse_num, en, fa }
          const maxVerse = data.parallel.reduce((max: number, v: any) => Math.max(max, v.verse_num), 0);
          
          const faArray = new Array(maxVerse).fill('');
          const enArray = new Array(maxVerse).fill('');
          
          data.parallel.forEach((v: any) => {
             if (v.verse_num > 0) {
                 faArray[v.verse_num - 1] = v.fa || '';
                 enArray[v.verse_num - 1] = v.en || '';
             }
          });

          setVersesData({
            fa: faArray,
            en: enArray,
          });
          setVerseCount(Math.max(faArray.length, enArray.length, 1));
          loaded = true;
        }
      }

      if (!loaded) {
        const localChapter = INITIAL_BIBLE_CONTENT?.[selectedBook.key]?.[String(selectedChapter)];
        if (localChapter) {
          const fa = Array.isArray(localChapter.fa) ? localChapter.fa : [];
          const en = Array.isArray(localChapter.en) ? localChapter.en : [];
          setVersesData({ fa, en });
          setVerseCount(Math.max(fa.length, en.length, 1));
        } else {
          setVersesData({ fa: [], en: [] });
          setVerseCount(1);
          setLoadError(isRTL ? 'متن آیات برای این باب یافت نشد.' : 'No verse text found for this chapter.');
        }
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
      const localChapter = selectedBook ? INITIAL_BIBLE_CONTENT?.[selectedBook.key]?.[String(selectedChapter)] : undefined;
      if (localChapter) {
        const fa = Array.isArray(localChapter.fa) ? localChapter.fa : [];
        const en = Array.isArray(localChapter.en) ? localChapter.en : [];
        setVersesData({ fa, en });
        setVerseCount(Math.max(fa.length, en.length, 1));
      } else {
        setVersesData({ fa: [], en: [] });
        setVerseCount(1);
        setLoadError(isRTL ? 'خطا در دریافت آیات. لطفا دوباره تلاش کنید.' : 'Error loading verses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, translation, enTranslation, isRTL]);

  useEffect(() => {
    if (step === 'verse' && selectedBook) {
      fetchChapterData();
    }
  }, [step, selectedBook, selectedChapter, translation, enTranslation, fetchChapterData]);

  // Handle book selection
  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setVerseStart(null);
    setVerseEnd(null);
    setStep('chapter');
  };

  // Handle chapter selection
  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setVerseStart(null);
    setVerseEnd(null);
    setStep('verse');
  };

  // Handle verse click (range selection)
  const handleVerseClick = (verse: number) => {
    if (verseStart === null) {
      setVerseStart(verse);
      setVerseEnd(verse);
      return;
    }

    if (verseEnd === null || verseEnd === verseStart) {
      if (verse >= verseStart) {
        setVerseEnd(verse);
      } else {
        setVerseStart(verse);
        setVerseEnd(verseStart);
      }
      return;
    }

    // Reset and start a new range
    setVerseStart(verse);
    setVerseEnd(verse);
  };

  // Add current selection to list
  const addToList = () => {
    if (!selectedBook || verseStart === null || verseEnd === null) return;

    const normalizedStart = Math.min(verseStart, verseEnd);
    const normalizedEnd = Math.max(verseStart, verseEnd);

    const verseNumbers = Array.from(
      { length: normalizedEnd - normalizedStart + 1 },
      (_, i) => normalizedStart + i
    );

    const textFaSlice = versesData.fa.length > 0
      ? versesData.fa.slice(normalizedStart - 1, normalizedEnd)
      : verseNumbers.map(() => '');

    const textEnSlice = versesData.en.length > 0
      ? versesData.en.slice(normalizedStart - 1, normalizedEnd)
      : verseNumbers.map(() => '');

    const newVerse: SelectedVerse = {
      id: crypto.randomUUID(),
      book: selectedBook,
      chapter: selectedChapter,
      verseStart: normalizedStart,
      verseEnd: normalizedEnd,
      translation,
      enTranslation,
      showFa,
      showEn,
      textFa: textFaSlice,
      textEn: textEnSlice,
      verseNumbers,
      fontFa,
      fontEn,
    };

    setSelectedVerses(prev => [...prev, newVerse]);

    // Reset for next selection
    setVerseStart(null);
    setVerseEnd(null);
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
    if (selectedVerses.length === 0) return;

    const sortedAll = [...selectedVerses].sort((a, b) => {
      const byBook = a.book.name.fa.localeCompare(b.book.name.fa, 'fa');
      if (byBook !== 0) return byBook;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verseStart - b.verseStart;
    });

    if (combineIntoOneSlide) {
      const references = sortedAll.map((v) => ({
        id: v.id,
        book: v.book.key,
        bookName: v.book.name,
        chapter: v.chapter,
        verses: v.verseStart === v.verseEnd ? `${v.verseStart}` : `${v.verseStart}-${v.verseEnd}`,
        verseNumbers: v.verseNumbers,
        textFa: v.textFa,
        textEn: v.textEn,
        fontFa: v.fontFa,
        fontEn: v.fontEn,
        translation: v.translation,
        enTranslation: v.enTranslation,
      }));

      const mergedSlide: ScripturePage = {
        id: crypto.randomUUID(),
        book: 'MULTI',
        bookName: { fa: 'مجموعه آیات', en: 'Verse Collection' },
        chapter: 0,
        verses: `${references.length} بخش`,
        verseNumbers: [],
        textPrimary: [],
        textSecondary: [],
        translation,
        enTranslation,
        displayMode: referenceListMode ? 'referenceList' : (slideMode as any),
        fontFa,
        fontEn,
        glassPopupEnabled: selectedPreset === 'nastaliq-wavy-ref',
        referenceItems: references,
      };

      onAddSlides([mergedSlide]);
      setSelectedVerses([]);
      if (onClose) onClose();
      return;
    }

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
      const sortedGroup = group.sort((a, b) => a.verseStart - b.verseStart);
      const first = sortedGroup[0];

      const combinedTextFa: string[] = [];
      const combinedTextEn: string[] = [];
      const combinedVerseNumbers: number[] = [];

      sortedGroup.forEach(v => {
        combinedTextFa.push(...v.textFa);
        combinedTextEn.push(...v.textEn);
        for (let i = v.verseStart; i <= v.verseEnd; i++) {
          combinedVerseNumbers.push(i);
        }
      });

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
        textPrimary: primaryLang === 'fa' ? combinedTextFa : combinedTextEn,
        textSecondary: primaryLang === 'fa' ? combinedTextEn : combinedTextFa,
        fontFa: primaryLang === 'fa' ? fontFa : fontEn,
        fontEn: primaryLang === 'fa' ? fontEn : fontFa,
        primaryLanguage: primaryLang,
        glassPopupEnabled: selectedPreset === 'nastaliq-wavy-ref',
        translation: first.translation,
        displayMode: slideMode as any,
        referenceItems: sortedGroup.map((v) => ({
          id: v.id,
          book: v.book.key,
          bookName: v.book.name,
          chapter: v.chapter,
          verses: v.verseStart === v.verseEnd ? `${v.verseStart}` : `${v.verseStart}-${v.verseEnd}`,
          verseNumbers: v.verseNumbers,
          textFa: v.textFa,
          textEn: v.textEn,
          fontFa: v.fontFa,
          fontEn: v.fontEn,
          translation: v.translation,
          enTranslation: v.enTranslation,
        })),
      };

      return slide;
    });

    onAddSlides(slides);
    setSelectedVerses([]);
    if (onClose) onClose();
  };

  // Check if verse is in selected range
  const isVerseInRange = (verse: number) => {
    if (verseStart === null || verseEnd === null) return false;
    return verse >= verseStart && verse <= verseEnd;
  };

  // Get translation label
  const getTranslationLabel = (trans: string) => {
    return t[trans as keyof typeof t] || trans;
  };

  const applyPreset = (preset: 'manual' | 'nastaliq-wavy-ref') => {
    setSelectedPreset(preset);
    if (preset === 'nastaliq-wavy-ref') {
      setFontFa('var(--font-nastaliq)');
      setFontEn('var(--font-inter)');
      setSlideMode('list');
      setCombineIntoOneSlide(true);
      setReferenceListMode(true);
      setShowFa(true);
      setShowEn(true);
    }
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

        {/* Global Options Bar is removed, layout settings integrated directly into the main page view */}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Selection */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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

                {/* TRANSLATION & LAYOUT SETTINGS - FRONT AND CENTER */}
                <div className="bg-slate-800/40 rounded-2xl p-5 mb-6 border border-slate-700/50 backdrop-blur-sm" dir="rtl">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    تنظیمات ترجمه‌ها و چیدمان
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Persian Translations */}
                    <div>
                      <label className="text-slate-400 text-sm mb-3 block font-medium">🇮🇷 ترجمه‌های فارسی (نصب شده):</label>
                      <div className="flex flex-wrap gap-2 relative z-10">
                        {persianVersions.map(v => (
                          <button
                            key={v.abbr}
                            onClick={() => {
                              setTranslation(v.abbr);
                              localStorage.setItem('broadcast_verse_fa_trans', v.abbr);
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all border ${translation === v.abbr ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border-indigo-400' : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* English Translations */}
                    <div dir="ltr" className="text-left">
                      <label className="text-slate-400 text-sm mb-3 block font-medium">🇺🇸 English Translations:</label>
                      <div className="flex flex-wrap gap-2">
                        {englishVersions.map(v => (
                          <button
                            key={v.abbr}
                            onClick={() => {
                              setEnTranslation(v.abbr);
                              localStorage.setItem('broadcast_verse_en_trans', v.abbr);
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all border ${enTranslation === v.abbr ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border-indigo-400' : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                          >
                            {v.abbr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Layout Preference */}
                    <div>
                        <label className="text-slate-400 text-sm mb-3 block font-medium">✨ تعیین ردیف اول (زبان اصلی):</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setPrimaryLang('fa'); localStorage.setItem('broadcast_verse_primary_lang', 'fa'); }}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${primaryLang === 'fa' ? 'bg-emerald-600/20 text-emerald-400 shadow-lg border-emerald-500/50' : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                            >
                                🇮🇷 فارسی (بالا/راست)
                            </button>
                            <button
                                onClick={() => { setPrimaryLang('en'); localStorage.setItem('broadcast_verse_primary_lang', 'en'); }}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${primaryLang === 'en' ? 'bg-blue-600/20 text-blue-400 shadow-lg border-blue-500/50' : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                            >
                                🇺🇸 English (Top/Left)
                            </button>
                        </div>
                    </div>
                    {/* Fonts Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-sm mb-3 block font-medium">فونت فارسی:</label>
                            <select
                                value={fontFa}
                                onChange={(e) => { setFontFa(e.target.value); localStorage.setItem('broadcast_verse_font_fa', e.target.value); }}
                                className="w-full bg-slate-900/60 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="var(--font-vazirmatn)">Vazirmatn</option>
                                <option value="var(--font-nastaliq)">Nastaliq</option>
                                <option value="var(--font-lalezar)">Lalezar</option>
                            </select>
                        </div>
                        <div dir="ltr" className="text-left">
                            <label className="text-slate-400 text-sm mb-3 block font-medium">English Font:</label>
                            <select
                                value={fontEn}
                                onChange={(e) => { setFontEn(e.target.value); localStorage.setItem('broadcast_verse_font_en', e.target.value); }}
                                className="w-full bg-slate-900/60 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="var(--font-inter)">Inter</option>
                                <option value="var(--font-playfair)">Playfair</option>
                                <option value="var(--font-cinzel)">Cinzel</option>
                            </select>
                        </div>
                    </div>
                  </div>
                </div>

                {hadNoExactResults && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {isRTL
                      ? 'نتیجه دقیقی پیدا نشد. برای جلوگیری از صفحه خالی، همه کتاب ها نمایش داده شد.'
                      : 'No exact match found. Showing all books to avoid an empty screen.'}
                  </div>
                )}

                <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setTestamentFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${testamentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {isRTL ? 'همه کتاب ها' : 'All Books'}
                    </button>
                    <button
                      onClick={() => setTestamentFilter('ot')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${testamentFilter === 'ot' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {primaryLang === 'fa' ? t.oldTestament : translations.en.oldTestament}
                    </button>
                    <button
                      onClick={() => setTestamentFilter('nt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${testamentFilter === 'nt' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {primaryLang === 'fa' ? t.newTestament : translations.en.newTestament}
                    </button>
                    <span className="mr-auto text-xs text-slate-400">
                      {isRTL ? `${visibleBooks.length} کتاب` : `${visibleBooks.length} books`}
                    </span>
                  </div>

                  {visibleBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {visibleBooks.map((book: BibleBook) => (
                        <button
                          key={book.key}
                          onClick={() => handleBookSelect(book)}
                          className="bg-slate-800 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/40 p-3 rounded-xl transition group"
                          dir={primaryLang === 'fa' ? 'rtl' : 'ltr'}
                        >
                          <div className={`text-white font-medium group-hover:text-indigo-300 transition ${primaryLang === 'en' ? 'text-left' : 'text-right'}`}>
                            {primaryLang === 'fa' ? book.name.fa : book.name.en}
                          </div>
                          <div className={`text-slate-500 text-xs ${primaryLang === 'en' ? 'text-left' : 'text-right'}`}>
                            {book.chapters} {primaryLang === 'fa' ? t.chapters : translations.en.chapters}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
                      {isRTL ? 'کتابی برای این فیلتر پیدا نشد.' : 'No books found for this filter.'}
                    </div>
                  )}
                </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🇮🇷 {t.translation}:</span>
                    <select
                      value={translation}
                      onChange={(e) => {
                        setTranslation(e.target.value);
                        localStorage.setItem('broadcast_verse_fa_trans', e.target.value);
                      }}
                      className="bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 text-sm font-[Vazirmatn] w-36 truncate"
                      dir="rtl"
                    >
                      {persianVersions.length === 0 ? (
                        <option value="NMV">هزارۀ نو</option>
                      ) : (
                        persianVersions.map(v => (
                           <option key={v.abbr} value={v.abbr}>{v.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🇺🇸 {t.enTranslation}:</span>
                    <select
                      value={enTranslation}
                      onChange={(e) => {
                        setEnTranslation(e.target.value);
                        localStorage.setItem('broadcast_verse_en_trans', e.target.value);
                      }}
                      className="bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 text-sm w-28 truncate"
                    >
                      {englishVersions.length === 0 ? (
                        <option value="BSB">BSB</option>
                      ) : (
                        englishVersions.map(v => (
                           <option key={v.abbr} value={v.abbr}>{v.abbr}</option>
                        ))
                      )}
                    </select>
                  </div>

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

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">FA Font:</span>
                    <select
                      value={fontFa}
                      onChange={(e) => setFontFa(e.target.value)}
                      className="bg-slate-700 text-white px-2 py-1.5 rounded-lg border border-slate-600 text-xs"
                    >
                      <option value="var(--font-vazirmatn)">Vazirmatn</option>
                      <option value="var(--font-nastaliq)">Nastaliq</option>
                      <option value="var(--font-lalezar)">Lalezar</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">EN Font:</span>
                    <select
                      value={fontEn}
                      onChange={(e) => setFontEn(e.target.value)}
                      className="bg-slate-700 text-white px-2 py-1.5 rounded-lg border border-slate-600 text-xs"
                    >
                      <option value="var(--font-inter)">Inter</option>
                      <option value="var(--font-playfair)">Playfair</option>
                      <option value="var(--font-merriweather)">Merriweather</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Preset:</span>
                    <select
                      value={selectedPreset}
                      onChange={(e) => applyPreset(e.target.value as 'manual' | 'nastaliq-wavy-ref')}
                      className="bg-slate-700 text-white px-2 py-1.5 rounded-lg border border-slate-600 text-xs"
                    >
                      <option value="manual">Manual</option>
                      <option value="nastaliq-wavy-ref">Nastaliq + Wavy + ReferenceList</option>
                    </select>
                  </div>

                  {verseStart !== null && verseEnd !== null && (
                    <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 rounded-lg">
                      <span className="text-indigo-400 font-bold">
                        {verseStart === verseEnd ? verseStart : `${verseStart}-${verseEnd}`}
                      </span>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-slate-400">{t.loading}</p>
                  </div>
                ) : (
                  <>
                    {loadError && (
                      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 px-3 py-2 text-sm">
                        {loadError}
                      </div>
                    )}
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
                  </>
                )}

                {!loading && verseStart !== null && verseEnd !== null && (
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

          <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="p-4 bg-slate-800 border-b border-slate-700">
              <h3 className="text-white font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                {t.selectedVerses} ({selectedVerses.length})
              </h3>
            </div>

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

            {selectedVerses.length > 0 && (
              <div className="p-4 bg-slate-800 border-t border-slate-700 z-40 relative flex flex-col gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={combineIntoOneSlide}
                    onChange={(e) => setCombineIntoOneSlide(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  یک اسلاید برای همه آیات انتخابی
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={referenceListMode}
                    onChange={(e) => setReferenceListMode(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  حالت حرفه ای: لیست مرجع (بدون متن) + پاپ آپ جزئیات
                </label>
                <button
                  onClick={handleAddAllSlides}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20"
                >
                  {t.addAll}
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
