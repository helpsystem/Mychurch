/**
 * 📖 Verse Grid Picker - انتخابگر آیه شبیه تقویم
 * 
 * یک UI Grid عددی برای انتخاب آسان محدوده آیات
 * شبیه انتخاب تاریخ در booking systems
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BibleBook, ScripturePage } from './types';
import { fetchBibleVerse, getBibleBooks, searchBibleBooks } from './dataService';

interface VerseGridPickerProps {
    onVerseSelect: (verse: ScripturePage) => void;
    lang: 'fa' | 'en';
    onClose: () => void;
}

const translations = {
    fa: {
        title: '📖 انتخاب آیه کتاب مقدس',
        book: 'کتاب',
        chapter: 'باب',
        selectVerses: 'انتخاب آیات',
        from: 'از',
        to: 'تا',
        showEnglish: 'نمایش متن انگلیسی',
        fetch: 'دریافت آیه',
        fetching: 'در حال دریافت...',
        add: 'افزودن',
        cancel: 'لغو',
        preview: 'پیش‌نمایش',
        searchBook: 'جستجوی کتاب...',
        selected: 'انتخاب شده',
        chapters: 'باب',
        tapToSelect: 'برای انتخاب کلیک کنید',
        hint: 'ابتدا آیه شروع، سپس آیه پایان را انتخاب کنید'
    },
    en: {
        title: '📖 Select Bible Verse',
        book: 'Book',
        chapter: 'Chapter',
        selectVerses: 'Select Verses',
        from: 'From',
        to: 'To',
        showEnglish: 'Show English Text',
        fetch: 'Fetch Verse',
        fetching: 'Fetching...',
        add: 'Add',
        cancel: 'Cancel',
        preview: 'Preview',
        searchBook: 'Search book...',
        selected: 'Selected',
        chapters: 'chapters',
        tapToSelect: 'Click to select',
        hint: 'First select start verse, then end verse'
    }
};

const VerseGridPicker: React.FC<VerseGridPickerProps> = ({
    onVerseSelect,
    lang,
    onClose
}) => {
    const t = translations[lang];
    const isRTL = lang === 'fa';

    // State
    const [step, setStep] = useState<'book' | 'chapter' | 'verse'>('book');
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [verseCount, setVerseCount] = useState<number>(31); // تعداد آیات باب
    const [startVerse, setStartVerse] = useState<number | null>(null);
    const [endVerse, setEndVerse] = useState<number | null>(null);
    const [showEnglish, setShowEnglish] = useState(true);
    const [preview, setPreview] = useState<ScripturePage | null>(null);
    const [loading, setLoading] = useState(false);

    // Load books on mount
    useEffect(() => {
        setBooks(getBibleBooks());
    }, []);

    // Filter books
    const filteredBooks = searchQuery
        ? searchBibleBooks(searchQuery)
        : books;

    // Handle book selection
    const handleBookSelect = (book: BibleBook) => {
        setSelectedBook(book);
        setSelectedChapter(1);
        setStartVerse(null);
        setEndVerse(null);
        setPreview(null);
        setStep('chapter');
    };

    // Handle chapter selection  
    const handleChapterSelect = async (chapter: number) => {
        setSelectedChapter(chapter);
        setStartVerse(null);
        setEndVerse(null);
        setPreview(null);

        // دریافت تعداد آیات این باب از API
        if (selectedBook) {
            try {
                const response = await fetch(`/api/bible/content/${selectedBook.key}/${chapter}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.verses?.fa) {
                        setVerseCount(data.verses.fa.length);
                    }
                }
            } catch (e) {
                // اگر API کار نکرد، مقدار پیش‌فرض
                setVerseCount(31);
            }
        }

        setStep('verse');
    };

    // Handle verse click (for range selection)
    const handleVerseClick = (verse: number) => {
        if (startVerse === null) {
            // اولین کلیک - انتخاب آیه شروع
            setStartVerse(verse);
            setEndVerse(verse);
        } else if (endVerse === startVerse) {
            // دومین کلیک - انتخاب آیه پایان
            if (verse >= startVerse) {
                setEndVerse(verse);
            } else {
                setStartVerse(verse);
                setEndVerse(startVerse);
            }
        } else {
            // ریست و شروع دوباره
            setStartVerse(verse);
            setEndVerse(verse);
        }
    };

    // Fetch verse preview
    const fetchPreview = useCallback(async () => {
        if (!selectedBook || startVerse === null || endVerse === null) return;

        setLoading(true);
        try {
            const verseRange = startVerse === endVerse
                ? `${startVerse}`
                : `${startVerse}-${endVerse}`;

            const result = await fetchBibleVerse(
                selectedBook.key,
                selectedChapter,
                verseRange
            );

            if (result) {
                setPreview(result);
            }
        } catch (error) {
            console.error('Error fetching verse:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedBook, selectedChapter, startVerse, endVerse]);

    // Auto-fetch when verses selected
    useEffect(() => {
        if (startVerse !== null && endVerse !== null && selectedBook) {
            const timer = setTimeout(fetchPreview, 500);
            return () => clearTimeout(timer);
        }
    }, [startVerse, endVerse, selectedBook, fetchPreview]);

    // Add verse to slides
    const handleAdd = () => {
        if (preview) {
            onVerseSelect(preview);
            onClose();
        }
    };

    // Check if verse is in selected range
    const isVerseSelected = (verse: number) => {
        if (startVerse === null || endVerse === null) return false;
        return verse >= startVerse && verse <= endVerse;
    };

    // Generate chapter grid
    const generateChapterGrid = () => {
        if (!selectedBook) return [];
        return Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    };

    // Generate verse grid
    const generateVerseGrid = () => {
        return Array.from({ length: verseCount }, (_, i) => i + 1);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className={`bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${isRTL ? 'font-[Vazirmatn]' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{t.title}</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">×</button>
                </div>

                {/* Breadcrumb */}
                <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setStep('book')}
                        className={`${step === 'book' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.book}
                    </button>
                    {selectedBook && (
                        <>
                            <span className="text-slate-600">›</span>
                            <button
                                onClick={() => setStep('chapter')}
                                className={`${step === 'chapter' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                {isRTL ? selectedBook.name.fa : selectedBook.name.en}
                            </button>
                        </>
                    )}
                    {step === 'verse' && (
                        <>
                            <span className="text-slate-600">›</span>
                            <span className="text-indigo-400">{t.chapter} {selectedChapter}</span>
                        </>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Step 1: Book Selection */}
                    {step === 'book' && (
                        <>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t.searchBook}
                                className="w-full bg-slate-800 text-white p-3 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
                                {filteredBooks.map(book => (
                                    <button
                                        key={book.key}
                                        onClick={() => handleBookSelect(book)}
                                        className="bg-slate-800 hover:bg-indigo-600 p-3 rounded-lg text-left transition-colors"
                                    >
                                        <div className="text-white font-medium">
                                            {isRTL ? book.name.fa : book.name.en}
                                        </div>
                                        <div className="text-slate-400 text-xs">
                                            {book.chapters} {t.chapters}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Step 2: Chapter Selection (Grid like calendar) */}
                    {step === 'chapter' && selectedBook && (
                        <>
                            <h3 className="text-white mb-4 text-center">
                                {isRTL ? selectedBook.name.fa : selectedBook.name.en} - {t.selectVerses}
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {generateChapterGrid().map(chapter => (
                                    <button
                                        key={chapter}
                                        onClick={() => handleChapterSelect(chapter)}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-lg font-medium transition-all
                      ${selectedChapter === chapter
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Step 3: Verse Selection (Grid like calendar booking) */}
                    {step === 'verse' && selectedBook && (
                        <>
                            <div className="text-center mb-4">
                                <h3 className="text-white text-lg">
                                    {isRTL ? selectedBook.name.fa : selectedBook.name.en} {selectedChapter}
                                </h3>
                                <p className="text-slate-400 text-sm">{t.hint}</p>

                                {/* Selected range display */}
                                {startVerse !== null && (
                                    <div className="mt-2 bg-indigo-600/20 rounded-lg px-4 py-2 inline-block">
                                        <span className="text-indigo-400 font-bold">
                                            {t.selected}: {startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Verse Grid */}
                            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 mb-4">
                                {generateVerseGrid().map(verse => (
                                    <button
                                        key={verse}
                                        onClick={() => handleVerseClick(verse)}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${isVerseSelected(verse)
                                                ? 'bg-indigo-600 text-white scale-105'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        {verse}
                                    </button>
                                ))}
                            </div>

                            {/* Show English Toggle */}
                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showEnglish}
                                    onChange={(e) => setShowEnglish(e.target.checked)}
                                    className="accent-indigo-500"
                                />
                                <span className="text-slate-300 text-sm">{t.showEnglish}</span>
                            </label>

                            {/* Preview */}
                            {loading && (
                                <div className="bg-slate-800 rounded-lg p-4 text-center">
                                    <div className="text-indigo-400">{t.fetching}</div>
                                </div>
                            )}

                            {preview && !loading && (
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-xs text-slate-400 mb-2">{t.preview}</div>
                                    <div className="text-emerald-400 font-bold mb-2">
                                        {isRTL ? preview.bookName.fa : preview.bookName.en} {preview.chapter}:{preview.verses}
                                    </div>
                                    <div className="text-white leading-relaxed mb-2">
                                        {preview.textPrimary}
                                    </div>
                                    {showEnglish && preview.textSecondary && (
                                        <div className="text-slate-400 text-sm italic">
                                            {preview.textSecondary}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-800 p-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                        {t.cancel}
                    </button>

                    {step === 'verse' && preview && (
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium"
                        >
                            {t.add}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerseGridPicker;
