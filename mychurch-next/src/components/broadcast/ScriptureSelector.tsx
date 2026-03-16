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
import { BookOpen, ChevronRight, X, Plus, Eye, Trash2, Languages, Check } from 'lucide-react';

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

import { getBibleBooks } from './dataService';
const bibleBooks = getBibleBooks();

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
  const [enTranslation, setEnTranslation] = useState<'asv' | 'net' | 'kjv'>('asv'); 

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
    ? bibleBooks.filter((book: BibleBook) =>
      book.name.fa.includes(searchQuery) ||
      book.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.key.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : bibleBooks;

  const otBooks = filteredBooks.filter((b: BibleBook) => b.testament === 'OT');
  const ntBooks = filteredBooks.filter((b: BibleBook) => b.testament === 'NT');

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
    if (!selectedBook) return;

    const verseNumbers = Array.from(
      { length: verseEnd - verseStart + 1 },
      (_, i) => verseStart + i
    );

    const textFaSlice = versesData.fa.length > 0
      ? versesData.fa.slice(verseStart - 1, verseEnd)
      : verseNumbers.map(() => '');

    const textEnSlice = versesData.en.length > 0
      ? versesData.en.slice(verseStart - 1, verseEnd)
      : verseNumbers.map(() => '');

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
        textPrimary: combinedTextFa,
        textSecondary: combinedTextEn,
        translation: first.translation,
        displayMode: slideMode as any
      };

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
                      {otBooks.map((book: BibleBook) => (
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
                      {ntBooks.map((book: BibleBook) => (
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

                  {verseStart > 0 && (
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
