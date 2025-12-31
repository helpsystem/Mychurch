/**
 * Bible Unified Pro - Version 2.0 (TPV Only)
 * Last Updated: Dec 15, 2025
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Book, Monitor, Mic2, Settings, ChevronLeft, ChevronRight,
    Menu, X, Volume2, Maximize2, Type, Sun, Moon, Search
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import BilingualBiblePresentation, { BiblePayload } from '@/components/BilingualBiblePresentation';
import BibleKaraokeMode from '@/components/BibleKaraokeMode';
import BibleStudyMode from '@/components/BibleStudyMode';
import Bible3DMode from '@/components/Bible3DMode';
import { BookOpen, Globe, Layout, Languages } from 'lucide-react';

// Interfaces
interface BibleBook {
    key: string;
    name: { en: string; fa: string };
    chapters: number;
    testament: 'OT' | 'NT';
}

import { BIBLE_AUDIO_BASE_URL } from '@/lib/constants';

// USFM Code Mapping (01 -> GEN)
const BOOK_CODE_MAP: { [key: string]: string } = {
    '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
    '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
    '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
    '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
    '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
    '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
    '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
    '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL',
    '40': 'MAT', '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT',
    '45': 'ROM', '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH',
    '50': 'PHP', '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI',
    '55': '2TI', '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS',
    '60': '1PE', '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN',
    '65': 'JUD', '66': 'REV'
};

const BibleUnifiedPro: React.FC = () => {
    const { lang } = useLanguage();

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mode, setMode] = useState<'study' | 'presentation' | 'karaoke' | 'book3d'>('presentation');
    const [viewMode, setViewMode] = useState<'dual' | 'fa' | 'en'>('fa'); // Default to Persian
    const [translation, setTranslation] = useState('MOJDEH'); // Default to MOJDEH (complete)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Bible Data State
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [selectedBook, setSelectedBook] = useState('01'); // Genesis
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [presentationData, setPresentationData] = useState<BiblePayload | null>(null);
    const [loading, setLoading] = useState(false);

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasAudio, setHasAudio] = useState(true); // Track if current translation has audio

    // Translation is now user-selectable (MOJDEH, QADIM, TPV)

    // Fetch Books on Mount
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch('/api/bible-json/books');
                const data = await response.json();
                if (data.success && data.books) {
                    const transformedBooks: BibleBook[] = data.books.map((b: any) => ({
                        key: b.code, // e.g. "01"
                        name: { en: b.name_en, fa: b.name_fa },
                        chapters: b.chapters || 50,
                        testament: b.testament || 'OT'
                    }));
                    setBooks(transformedBooks);
                    if (transformedBooks.length > 0) setSelectedBook(transformedBooks[0].key);
                }
            } catch (err) {
                console.error("Failed to fetch books", err);
            }
        };
        fetchBooks();
    }, []);

    // Fetch Chapter Content when selection changes
    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            try {
                const usfmCode = BOOK_CODE_MAP[selectedBook] || 'GEN';

                // Use LOCAL downloaded files (MOJDEH, QADIM, or TPV)
                const translationCode = translation.toUpperCase();

                const response = await fetch(`/api/bible-local/content/${translationCode}/${usfmCode}/${selectedChapter}`);
                const data = await response.json();

                console.log('📖 Bible fetch:', { translationCode, usfmCode, selectedChapter, success: data.success, verseCount: data.verses?.length, hasAudio: data.hasAudio });

                if (data.success && data.verses) {
                    // Update audio availability state
                    setHasAudio(data.hasAudio || false);

                    // Audio URL from local backend API or HiDrive
                    const audioUrlFa = data.audio || data.hasAudio ? `/api/bible-local/audio/${translationCode}/${usfmCode}/${selectedChapter}` : null;
                    const audioUrlEn = `/api/bible-local/audio/eng/${usfmCode}/${selectedChapter}`;

                    const currentBook = books.find(b => b.key === selectedBook);

                    // All Persian translations (MOJDEH, QADIM, TPV)
                    const isPersian = ['MOJDEH', 'QADIM', 'TPV'].includes(translationCode);

                    const payload: BiblePayload = {
                        book_en: currentBook?.name.en || 'Genesis',
                        book_fa: currentBook?.name.fa || 'پیدایش',
                        chapters: [{
                            chapterNumber: selectedChapter,
                            verses: data.verses.map((v: any) => ({
                                verseNumber: v.verse || 1,
                                text_en: isPersian ? '[English translation not available for TPV]' : (v.text || ''),
                                text_fa: isPersian ? (v.text || '') : '',
                                audio_en: audioUrlEn,
                                audio_fa: audioUrlFa
                            }))
                        }]
                    };

                    setPresentationData(payload);
                }
            } catch (error) {
                console.error("Failed to load chapter", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
    }, [selectedBook, selectedChapter, translation, books]);


    return (
        <div className={`h-screen w-screen overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-gray-900'}`}>

            {/* ------------------------------------------------------------ */}
            {/* 1. TOP BAR (Navigation & Quick Tools) */}
            {/* ------------------------------------------------------------ */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-neutral-900/90 backdrop-blur-md z-50 shadow-sm relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Menu size={20} className="text-gray-300" />
                    </button>
                    <h1 className="font-bold text-lg flex items-center gap-2 select-none">
                        <span className="text-purple-400">Bible</span>
                        <span className="opacity-70 text-sm font-light tracking-wider">UNIFIED PRO</span>
                    </h1>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setMode('study')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'study' ? 'bg-purple-600 shadow-lg text-white' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                    >
                        <Book size={16} />
                        <span className="hidden md:inline">Study</span>
                    </button>
                    <button
                        onClick={() => setMode('presentation')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'presentation' ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                    >
                        <Monitor size={16} />
                        <span className="hidden md:inline">Presentation</span>
                    </button>
                    <button
                        onClick={() => setMode('book3d')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'book3d' ? 'bg-amber-600 shadow-lg text-white' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                    >
                        <BookOpen size={16} />
                        <span className="hidden md:inline">3D Book</span>
                    </button>
                    <button
                        onClick={() => setMode('karaoke')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'karaoke' ? 'bg-pink-600 shadow-lg text-white' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                    >
                        <Mic2 size={16} />
                        <span className="hidden md:inline">Karaoke</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* ------------------------------------------------------------ */}
            {/* 2. MAIN WORKSPACE */}
            {/* ------------------------------------------------------------ */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* SIDEBAR (Collapsible) */}
                <aside
                    className={`
                        ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                        bg-neutral-900 border-r border-white/10
                        transition-all duration-300 ease-in-out flex flex-col z-40
                    `}
                >
                    <div className="p-4 border-b border-white/10 space-y-3">
                        {/* Translation Selector */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 flex items-center gap-2">
                                <Globe size={14} />
                                {lang === 'fa' ? 'ترجمه' : 'Translation'}
                            </label>
                            <select
                                value={translation}
                                onChange={(e) => setTranslation(e.target.value)}
                                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                            >
                                <option value="MOJDEH">{lang === 'fa' ? '🔊 مژده (کامل + صدا)' : '🔊 MOJDEH (Complete + Audio)'}</option>
                                <option value="QADIM">{lang === 'fa' ? '📖 قدیم (کامل - بدون صوت)' : '📖 QADIM (Complete - No Audio)'}</option>
                                <option value="TPV">{lang === 'fa' ? '🔊 TPV (کامل + صدا)' : '🔊 TPV (Complete + Audio)'}</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder={lang === 'fa' ? 'جستجو در کتاب‌ها...' : 'Search books...'}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-gray-200 placeholder-gray-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {books.map(book => (
                            <button
                                key={book.key}
                                onClick={() => {
                                    setSelectedBook(book.key);
                                    setSelectedChapter(1);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${selectedBook === book.key ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                            >
                                <span className={lang === 'fa' ? 'font-bold' : ''}>{lang === 'fa' ? book.name.fa : book.name.en}</span>
                                <span className="text-xs opacity-30 font-mono group-hover:opacity-100 transition-opacity">{book.chapters} ch</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* STAGE (Active Mode Content) */}
                <main className="flex-1 overflow-hidden relative bg-black">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <>
                            {/* PRESENTATION MODE */}
                            {mode === 'presentation' && presentationData && (
                                <div className="w-full h-full">
                                    <BilingualBiblePresentation
                                        data={presentationData}
                                        autoStart={true}
                                        enableAudio={hasAudio}
                                        viewMode={viewMode}
                                        hasAudio={hasAudio}
                                        key={`${selectedBook}-${selectedChapter}-${translation}`}
                                    />
                                </div>
                            )}

                            {mode === 'presentation' && !presentationData && (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center space-y-4">
                                        <div className="text-6xl">📖</div>
                                        <div className="text-lg">
                                            {lang === 'fa' ? 'یک کتاب و فصل انتخاب کنید' : 'Select a book and chapter'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KARAOKE MODE */}
                            {mode === 'karaoke' && (
                                <div className="w-full h-full bg-white overflow-hidden">
                                    <BibleKaraokeMode
                                        initialBook={selectedBook}
                                        initialChapter={selectedChapter}
                                        key={`${selectedBook}-${selectedChapter}`}
                                    />
                                </div>
                            )}

                            {/* 3D BOOK MODE */}
                            {mode === 'book3d' && presentationData && (
                                <div className="w-full h-full bg-gray-900 overflow-hidden">
                                    <Bible3DMode data={presentationData} viewMode={viewMode} />
                                </div>
                            )}

                            {/* STUDY MODE */}
                            {mode === 'study' && presentationData && (
                                <div className="w-full h-full bg-white relative">
                                    <BibleStudyMode data={presentationData} viewMode={viewMode} />
                                </div>
                            )}

                            {mode === 'study' && !presentationData && (
                                <div className="w-full h-full flex items-center justify-center">
                                    {loading ? 'Loading...' : 'Select a chapter'}
                                </div>
                            )}
                        </>
                    )}
                </main>

            </div>

            {/* ------------------------------------------------------------ */}
            {/* 3. DOCK (Floating Audio Controls) - Mobile-optimized */}
            {/* ------------------------------------------------------------ */}
            {!hasAudio && (
                <div className="fixed bottom-6 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pb-[env(safe-area-inset-bottom)]">
                    <div className="bg-amber-600/95 backdrop-blur-xl border border-amber-500/30 rounded-xl px-4 py-3 shadow-lg text-white text-sm flex items-center gap-2" dir="rtl">
                        <span className="text-lg">🔇</span>
                        <span>{lang === 'fa' ? 'صوت برای این ترجمه موجود نیست' : 'Audio not available for this translation'}</span>
                    </div>
                </div>
            )}
            {hasAudio && (
                <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 z-50 transition-all duration-300 pb-[env(safe-area-inset-bottom)]">
                    <div className="bg-neutral-900/95 sm:bg-neutral-900/90 backdrop-blur-xl border-t sm:border border-white/10 sm:rounded-2xl p-3 sm:p-2 sm:px-6 shadow-2xl flex items-center justify-between sm:justify-start gap-3 sm:gap-6 ring-1 ring-white/5">

                        {/* Chapter Nav */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setSelectedChapter(c => Math.max(1, c - 1))}
                                disabled={selectedChapter <= 1}
                                className="p-2 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors disabled:opacity-30 text-gray-300"
                            >
                                <ChevronLeft size={24} className="sm:w-5 sm:h-5" />
                            </button>

                            <div className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3rem]">
                                <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                                    {lang === 'fa' ? 'فصل' : 'CH'}
                                </span>
                                <span className="font-mono text-lg sm:text-xl font-bold text-white leading-none">{selectedChapter}</span>
                            </div>

                            <button
                                onClick={() => setSelectedChapter(c => c + 1)}
                                className="p-2 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors text-gray-300"
                            >
                                <ChevronRight size={24} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <div className="hidden sm:block h-10 w-px bg-white/10"></div>

                        {/* Playback - Larger on mobile */}
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`w-16 h-16 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border-4 ${isPlaying 
                                ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-neutral-900 text-white' 
                                : 'bg-white border-neutral-900 text-black'
                            }`}
                        >
                            {isPlaying 
                                ? <div className="w-5 h-5 sm:w-4 sm:h-4 bg-white rounded-sm" /> 
                                : <div className="w-0 h-0 border-t-[10px] sm:border-t-[8px] border-t-transparent border-l-[16px] sm:border-l-[14px] border-l-black border-b-[10px] sm:border-b-[8px] border-b-transparent ml-1" />
                            }
                        </button>

                        <div className="hidden sm:block h-10 w-px bg-white/10"></div>

                        {/* Tools - Hidden on small mobile */}
                        <div className="hidden sm:flex items-center gap-2">
                            <button className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-mono text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                1.0x
                            </button>
                        </div>

                        {/* Audio indicator on mobile */}
                        <div className="flex sm:hidden items-center gap-1 text-green-400">
                            <Volume2 size={18} />
                            <span className="text-xs">{lang === 'fa' ? 'صوت' : 'Audio'}</span>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};


export default BibleUnifiedPro;
