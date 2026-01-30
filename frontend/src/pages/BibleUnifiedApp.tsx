/**
 * Bible Unified App - Mobile First Redesign
 * "App-like" experience for Mobile, "Pro" experience for Desktop.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Book, Monitor, Mic2, Settings, ChevronLeft, ChevronRight,
    Menu, X, Volume2, Maximize2, Type, Sun, Moon, Search,
    Home, Headphones, Layers, MoreHorizontal, ArrowLeft, Languages, Box
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import BilingualBiblePresentation, { BiblePayload } from '@/components/BilingualBiblePresentation';
import MobileBibleReader from '@/components/MobileBibleReader';
import { OnboardingTour } from '@/components/OnboardingTour';
import BibleKaraokeMode from '@/components/BibleKaraokeMode';
import BibleStudyMode from '@/components/BibleStudyMode';
import Bible3DMode from '@/components/Bible3DMode';
import { BookOpen, Globe } from 'lucide-react';

// Interfaces
interface BibleBook {
    key: string;
    name: { en: string; fa: string };
    chapters: number;
    testament: 'OT' | 'NT';
}

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

import { getBibleBooks as getLocalBibleBooks } from '@/data/bibleBooks';

const BibleUnifiedApp: React.FC = () => {
    const { lang } = useLanguage();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    // UI Logic
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'read' | 'listen' | 'study' | 'more'>('read');

    // Drawers / Modals (Mobile)
    const [showBookSelector, setShowBookSelector] = useState(false);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Modes & Preferences
    const [mode, setMode] = useState<'study' | 'presentation' | 'karaoke' | 'book3d'>('presentation');
    const [viewMode, setViewMode] = useState<'dual' | 'fa' | 'en'>('fa');
    const [translation, setTranslation] = useState('MOJDEH');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Bible Data
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [selectedBook, setSelectedBook] = useState('01');
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [presentationData, setPresentationData] = useState<BiblePayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedBook, setExpandedBook] = useState<string | null>('01'); // For showing chapters list

    // Audio
    const [isPlaying, setIsPlaying] = useState(false);


    // -------------------------------------------------------------------------
    // EFFECTS
    // -------------------------------------------------------------------------

    // Responsive Check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Tablet limit
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch Books with Local Fallback
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                // Try fetching from API first
                const response = await fetch('/api/bible-json/books');
                const data = await response.json();
                if (data.success && data.books) {
                    const transformedBooks: BibleBook[] = data.books.map((b: any) => ({
                        key: b.code,
                        name: { en: b.name_en, fa: b.name_fa },
                        chapters: b.chapters || 50,
                        testament: b.testament || 'OT'
                    }));
                    setBooks(transformedBooks);
                    console.log('✅ Bible books loaded from API');
                    return;
                }
            } catch (err) {
                console.warn('⚠️ API unavailable, using local fallback', err);
            }

            // Fallback to local data
            const localBooks = getLocalBibleBooks();
            const transformedBooks: BibleBook[] = localBooks.map(b => ({
                key: b.code,
                name: { en: b.name_en, fa: b.name_fa },
                chapters: b.chapters,
                testament: b.testament
            }));
            setBooks(transformedBooks);
            console.log('📚 Bible books loaded from local fallback');
        };
        fetchBooks();
    }, []);

    // Fetch Content
    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            try {
                const usfmCode = BOOK_CODE_MAP[selectedBook] || 'GEN';
                const translationCode = translation.toUpperCase();

                // 1. Fetch Primary Text (Selected Translation)
                const primaryResponse = await fetch(`/api/bible-local/content/${translationCode}/${usfmCode}/${selectedChapter}`);
                const primaryData = await primaryResponse.json();

                // 2. Fetch Secondary Text (English fallback) if needed
                let englishVerses: any[] = [];
                const isPersian = primaryData.translation?.language === 'fa' ||
                    ['MOJDEH', 'QADIM', 'TPV', 'NMV', 'PCB'].includes(translationCode);

                if (isPersian) {
                    try {
                        const enResponse = await fetch(`/api/bible-local/content/NET/${usfmCode}/${selectedChapter}`);
                        const enData = await enResponse.json();
                        if (enData.success) englishVerses = enData.verses;
                    } catch (e) {
                        console.warn('Failed to fetch English fallback', e);
                    }
                }

                if (primaryData.success && primaryData.verses) {
                    // Use audio URL from API (handles fallback automatically)
                    const audioUrl = primaryData.audioUrl || primaryData.audio || null;
                    const currentBook = books.find(b => b.key === selectedBook);

                    // Log audio info for debugging
                    if (primaryData.audioNote?.usingFallback) {
                        console.log(`🎵 Using fallback audio: ${primaryData.audioNote.audioTranslation} for ${translationCode}`);
                    }

                    const payload: BiblePayload = {
                        book_en: currentBook?.name.en || 'Genesis',
                        book_fa: currentBook?.name.fa || 'پیدایش',
                        audioUrl: audioUrl,
                        audioNote: primaryData.audioNote, // Info about fallback audio
                        chapters: [{
                            chapterNumber: selectedChapter,
                            audioUrl: audioUrl,
                            verses: primaryData.verses.map((v: any, idx: number) => {
                                const enVerse = englishVerses.find(ev => ev.verse === v.verse) || englishVerses[idx];
                                return {
                                    verseNumber: v.verse || (idx + 1),
                                    text_en: isPersian ? (enVerse?.text || '') : (v.text || ''),
                                    text_fa: isPersian ? (v.text || '') : (enVerse?.text || ''),
                                    audio_en: null,
                                    audio_fa: audioUrl,
                                    timing: v.timing
                                };
                            })
                        }],
                        hasAudio: primaryData.hasAudio === true,
                        hasTiming: primaryData.hasTiming === true,
                        translation: primaryData.translation // Include translation info
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


    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    // Get Current Book safely
    const currentBook = books.find(b => b.key === selectedBook);
    const currentBookName = currentBook?.name[lang as 'en' | 'fa'] || (lang === 'fa' ? 'پیدایش' : 'Genesis');

    // -------------------------------------------------------------------------
    // JSX: MOBILE LAYOUT
    // -------------------------------------------------------------------------
    if (isMobile) {
        return (
            <div className={`h-[100dvh] w-screen overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

                {/* 1. MOBILE HEADER (App Bar) */}
                <header className="h-14 px-4 flex items-center justify-between bg-neutral-900/95 backdrop-blur-md border-b border-white/5 z-50 shrink-0">
                    <button onClick={() => window.history.back()} className="p-2 text-gray-400">
                        <ArrowLeft size={20} />
                    </button>

                    {/* Title triggers Book Selector */}
                    <button
                        onClick={() => setShowBookSelector(true)}
                        className="bg-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
                    >
                        <span className="font-bold text-sm tracking-wide">{currentBookName} {selectedChapter}</span>
                        <ChevronRight size={14} className="rotate-90 opacity-50" />
                    </button>

                    <button id="bible-settings-btn" onClick={() => setShowSettings(true)} className="p-2 text-gray-400">
                        <Settings size={20} />
                    </button>
                </header>

                {/* 2. MAIN CONTENT (Scrollable) */}
                <main className="flex-1 overflow-hidden relative bg-neutral-50 dark:bg-neutral-950">
                    <OnboardingTour />
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        presentationData ? (
                            <MobileBibleReader
                                chapter={{
                                    number: selectedChapter,
                                    verses: presentationData.chapters[0].verses.map((v: any) => ({
                                        verseNumber: v.verseNumber,
                                        text_fa: v.text_fa,
                                        text_en: v.text_en,
                                        timing: v.timing
                                    })),
                                    audioUrl: presentationData.chapters[0]?.audioUrl || (presentationData as any).audioUrl || undefined
                                }}
                                bookName={currentBookName}
                                translation={translation}
                                onNextChapter={() => setSelectedChapter(c => c + 1)}
                                onPrevChapter={() => setSelectedChapter(c => Math.max(1, c - 1))}
                                isPlaying={isPlaying}
                                onPlayPause={() => setIsPlaying(!isPlaying)}
                                onSettingsClick={() => setShowSettings(true)}
                                fontSize={1.4}
                                viewMode={viewMode || 'fa'}
                                theme={theme}
                                hasAudio={(presentationData as any).hasAudio === true}
                                hasTiming={(presentationData as any).hasTiming === true}
                                audioNote={(presentationData as any).audioNote}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full opacity-50">Select a book</div>
                        )
                    )}
                </main>

                {/* 3. BOTTOM NAVIGATION */}
                <nav className="h-16 bg-neutral-900 border-t border-white/10 flex items-center justify-around px-2 z-50 shrink-0 select-none pb-safe">
                    <NavButton
                        icon={<Book size={20} />}
                        label={lang === 'fa' ? 'خواندن' : 'Read'}
                        active={activeTab === 'read'}
                        onClick={() => setActiveTab('read')}
                    />
                    <NavButton
                        icon={<Headphones size={20} />}
                        label={lang === 'fa' ? 'شنیدن' : 'Listen'}
                        active={activeTab === 'listen'}
                        onClick={() => { setActiveTab('listen'); setShowAudioPlayer(true); }}
                    />
                    <NavButton
                        icon={<Layers size={20} />}
                        label={lang === 'fa' ? 'نسخه‌ها' : 'Versions'}
                        active={false}
                        onClick={() => {
                            // Cycle translations or open menu
                            const opts = ['MOJDEH', 'QADIM', 'TPV'];
                            const next = opts[(opts.indexOf(translation) + 1) % opts.length];
                            setTranslation(next);
                        }}
                    />
                    <NavButton
                        icon={<Menu size={20} />}
                        label={lang === 'fa' ? 'منو' : 'Menu'}
                        active={showMenu}
                        onClick={() => setShowMenu(true)}
                    />
                </nav>

                {/* 4. BOOK SELECTOR DRAWER */}
                <Drawer isOpen={showBookSelector} onClose={() => setShowBookSelector(false)} title={lang === 'fa' ? 'انتخاب کتاب' : 'Select Book'}>
                    <div className="flex flex-col h-full bg-neutral-900">
                        {/* Search */}
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-neutral-900 z-10">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-white/5 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 gap-1 pb-10">
                            {books.map(book => (
                                <button
                                    key={book.key}
                                    onClick={() => {
                                        setSelectedBook(book.key);
                                        setSelectedChapter(1);
                                        setShowBookSelector(false);
                                    }}
                                    className={`p-4 rounded-xl flex items-center justify-between text-left transition-colors ${selectedBook === book.key ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-300'}`}
                                >
                                    <span className="font-semibold text-lg">{lang === 'fa' ? book.name.fa : book.name.en}</span>
                                    <span className="text-gray-500 text-sm">{book.chapters} ch</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </Drawer>

                {/* 5. SETTINGS DRAWER (Mobile) */}
                <Drawer isOpen={showSettings} onClose={() => setShowSettings(false)} title="تنظیمات (Settings)">
                    <div className="p-6 space-y-8 bg-neutral-900 h-full text-white">
                        {/* Translation */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Globe size={16} /> ترجمه (Translation)
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'MOJDEH', label: 'مژده (MZH) - تفسیری', hasAudio: true, fallback: null },
                                    { id: 'QADIM', label: 'قدیم (POV) - استاندارد', hasAudio: true, fallback: null },
                                    { id: 'TPV', label: 'هزاره نو (TPV) - امروزی', hasAudio: true, fallback: null },
                                    { id: 'NMV', label: 'مژده جدید (NMV)', hasAudio: true, fallback: null },
                                    { id: 'PCB', label: 'امید (PCB) - معاصر', hasAudio: false, fallback: 'MOJDEH' },
                                    { id: 'RCPV', label: 'معاصر بازبینی (RCPV)', hasAudio: false, fallback: 'MOJDEH' },
                                    { id: 'ASV', label: 'American Standard (ASV)', hasAudio: false, fallback: null },
                                    { id: 'NIV', label: 'New International (NIV)', hasAudio: false, fallback: null }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setTranslation(t.id); setShowSettings(false); }}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-all flex items-center justify-between ${translation === t.id
                                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                            : 'bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-750'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">{t.label}</span>
                                        </div>
                                        {t.hasAudio ? (
                                            <div className="flex items-center gap-1 text-xs opacity-80">
                                                <Volume2 size={16} className={translation === t.id ? "text-white" : "text-green-500"} />
                                                <span className="hidden sm:inline">صوتی</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs opacity-50">
                                                <Book size={16} className="text-gray-500" style={{ opacity: 0.5 }} />
                                                <span className="text-gray-500 hidden sm:inline">متن</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Display Mode */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Monitor size={16} /> حالت نمایش (Display Mode)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { mode: 'presentation', label: 'ارائه', icon: Monitor },
                                    { mode: 'study', label: 'مطالعه', icon: Book },
                                    { mode: 'karaoke', label: 'کارائوکه', icon: Mic2 },
                                    { mode: 'book3d', label: 'سه‌بعدی', icon: Box }
                                ].map((m) => {
                                    const Icon = m.icon;
                                    const isCurrent = mode === m.mode;
                                    return (
                                        <button
                                            key={m.mode}
                                            onClick={() => setMode(m.mode as any)}
                                            className={`px-3 py-3 rounded-xl border font-medium transition-all flex items-center gap-2 ${isCurrent
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                                : 'bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-750'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-sm">{m.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Sun size={16} /> ظاهر (Theme)
                            </label>
                            <div className="flex bg-neutral-800 rounded-xl p-1 border border-neutral-700">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
                                >
                                    <Sun size={18} /> Light
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-neutral-700 text-white shadow-md' : 'text-gray-400'}`}
                                >
                                    <Moon size={18} /> Dark
                                </button>
                            </div>
                        </div>

                        {/* View Mode */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <BookOpen size={16} /> نمایش (View)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setViewMode('fa')} className={`py-2 rounded-lg border ${viewMode === 'fa' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400'}`}>فارسی</button>
                                <button onClick={() => setViewMode('dual')} className={`py-2 rounded-lg border ${viewMode === 'dual' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400'}`}>دوزبانه</button>
                                <button onClick={() => setViewMode('en')} className={`py-2 rounded-lg border ${viewMode === 'en' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400'}`}>English</button>
                            </div>
                        </div>
                    </div>
                </Drawer>

                {/* 6. MENU DRAWER (Mobile) */}
                <Drawer isOpen={showMenu} onClose={() => setShowMenu(false)} title="منو (Menu)">
                    <div className="p-4 space-y-2 bg-neutral-900 h-full text-white">
                        <a href="/" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3">
                            <Home size={20} className="text-purple-400" />
                            <span className="font-bold">خانه (Home)</span>
                        </a>
                        <a href="/live" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3">
                            <Monitor size={20} className="text-red-400" />
                            <span className="font-bold">پخش زنده (Live)</span>
                        </a>
                        <a href="/sermons" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3">
                            <Mic2 size={20} className="text-blue-400" />
                            <span className="font-bold">موعظه‌ها (Sermons)</span>
                        </a>
                        <a href="/donate" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3">
                            <span className="w-5 h-5 flex items-center justify-center font-bold text-green-400">$</span>
                            <span className="font-bold">هدایا (Donate)</span>
                        </a>
                    </div>
                </Drawer>

                {/* 7. AUDIO PLAYER SHEET */}
                {/* Simplified for demo: just reusing the karaoke component or a control panel */}
                {showAudioPlayer && (
                    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold">Audio Player</h2>
                            <button onClick={() => setShowAudioPlayer(false)}><X /></button>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-8 text-center text-white">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">{currentBookName} {selectedChapter}</h3>
                                <div className="mt-8 flex gap-6 justify-center">
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center"
                                    >
                                        {isPlaying ? <div className="w-4 h-4 bg-black" /> : <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-black border-b-[10px] border-b-transparent ml-2" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // JSX: DESKTOP LAYOUT (Enhanced Pro)
    // -------------------------------------------------------------------------
    return (
        <div className={`h-screen w-screen overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* ... Existing Desktop Code with Refinements ... */}
            {/* Recycling the existing layout but cleaning it up */}

            {/* TOP BAR */}
            <header className="h-16 px-6 flex items-center justify-between bg-neutral-900 border-b border-white/10 z-50">
                <div className="flex items-center gap-6">
                    <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-serif">B</span>
                        <span>Bible Unified <span className="text-purple-400 text-sm font-normal px-2 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/20">PRO</span></span>
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <a href="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"><Home size={16} /> Home</a>
                        <a href="/live" className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-2"><Monitor size={16} /> Live</a>
                        <a href="/sermons" className="text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors flex items-center gap-2"><Mic2 size={16} /> Sermons</a>
                        <a href="/donate" className="text-gray-400 hover:text-green-400 text-sm font-medium transition-colors flex items-center gap-2"><span className="font-bold text-xs border border-current rounded px-1">$</span> Donate</a>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mode Switcher - Compact */}
                    <div className="flex bg-neutral-800 p-1 rounded-lg">
                        {['presentation', 'study', 'karaoke', 'book3d'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${mode === m ? 'bg-neutral-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <select
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 outline-none"
                    >
                        <optgroup label="🇮🇷 فارسی">
                            <option value="MOJDEH">🔊 MZH - مژده (Mojdeh)</option>
                            <option value="QADIM">🔊 POV - ترجمه قدیم</option>
                            <option value="TPV">🔊 TPV - ترجمه امروز</option>
                            <option value="NMV">🔊 NMV - مژده جدید</option>
                            <option value="PCB">📖 PCB - معاصر فارسی</option>
                            <option value="RCPV">📖 RCPV - معاصر بازبینی</option>
                        </optgroup>
                        <optgroup label="🇬🇧 English">
                            <option value="ASV">📖 ASV - American Standard</option>
                            <option value="NIV">📖 NIV - New International</option>
                        </optgroup>
                    </select>
                    <button onClick={() => setViewMode(v => v === 'dual' ? 'fa' : 'dual')} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors" title="Toggle Dual View">
                        <Languages size={18} />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* DESKTOP SIDEBAR */}
                <aside className="w-72 bg-neutral-900 border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder={lang === 'fa' ? 'جستجو...' : 'Search books...'}
                                className="w-full bg-neutral-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-gray-200"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-700">
                        {books.map(book => (
                            <div key={book.key}>
                                {/* Book Header */}
                                <button
                                    onClick={() => {
                                        setExpandedBook(expandedBook === book.key ? null : book.key);
                                        if (selectedBook !== book.key) {
                                            setSelectedBook(book.key);
                                            setSelectedChapter(1);
                                        }
                                    }}
                                    className={`w-full text-right px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${selectedBook === book.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                                >
                                    <ChevronRight size={14} className={`transition-transform ${expandedBook === book.key ? 'rotate-90' : ''}`} />
                                    <span className="font-medium">{lang === 'fa' ? book.name.fa : book.name.en}</span>
                                </button>

                                {/* Chapter Grid - Expandable */}
                                {expandedBook === book.key && (
                                    <div className="grid grid-cols-5 gap-1 p-2 bg-black/30 rounded-lg mt-1 mb-2">
                                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                                            <button
                                                key={ch}
                                                onClick={() => { setSelectedBook(book.key); setSelectedChapter(ch); }}
                                                className={`py-2 rounded text-sm font-medium transition-all ${selectedBook === book.key && selectedChapter === ch
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-white'
                                                    }`}
                                            >
                                                {ch}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* MAIN STAGE */}
                <main className="flex-1 relative bg-black flex flex-col">
                    {/* Toolbar / Breadcrumbs - IMPROVED */}
                    <div className="h-14 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3 text-gray-300">
                            <span className="font-bold text-white text-lg">{currentBookName}</span>
                            <ChevronRight size={14} className="opacity-50" />

                            {/* Chapter Navigation - Standard Direction */}
                            <div className="flex items-center bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                                {/* Previous Chapter - Always LEFT arrow */}
                                <button
                                    onClick={() => setSelectedChapter(c => Math.max(1, c - 1))}
                                    disabled={selectedChapter <= 1}
                                    className="px-3 py-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-r border-white/10"
                                    title={lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {/* Chapter Dropdown */}
                                <div className="relative group">
                                    <select
                                        value={selectedChapter}
                                        onChange={(e) => setSelectedChapter(Number(e.target.value))}
                                        className="appearance-none bg-transparent px-4 py-2 text-center font-bold text-white cursor-pointer hover:bg-white/5 transition-all min-w-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded"
                                        style={{ textAlignLast: 'center' }}
                                    >
                                        {Array.from({ length: currentBook?.chapters || 50 }, (_, i) => i + 1).map(ch => (
                                            <option key={ch} value={ch} className="bg-neutral-800 text-white">
                                                {lang === 'fa' ? `فصل ${ch}` : `Ch ${ch}`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="font-mono text-base">{lang === 'fa' ? `فصل ${selectedChapter}` : `CH ${selectedChapter}`}</span>
                                    </div>
                                </div>

                                {/* Next Chapter - Always RIGHT arrow */}
                                <button
                                    onClick={() => setSelectedChapter(c => Math.min(currentBook?.chapters || 50, c + 1))}
                                    disabled={selectedChapter >= (currentBook?.chapters || 50)}
                                    className="px-3 py-2 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-l border-white/10"
                                    title={lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-lg text-xs font-medium">
                                {translation}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {/* Reuse existing presentation components */}
                        {loading ? (
                            <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-purple-500 rounded-full border-t-transparent" /></div>
                        ) : presentationData ? (
                            <>
                                {mode === 'presentation' && (
                                    <BilingualBiblePresentation
                                        data={presentationData}
                                        autoStart={false}
                                        enableAudio={true}
                                        viewMode={viewMode}
                                        bookCode={BOOK_CODE_MAP[selectedBook]}
                                        key={`${selectedBook}-${selectedChapter}`}
                                    />
                                )}
                                {mode === 'karaoke' && <BibleKaraokeMode initialBook={selectedBook} initialChapter={selectedChapter} />}
                                {mode === 'book3d' && <Bible3DMode data={presentationData} viewMode={viewMode} />}
                                {mode === 'study' && <BibleStudyMode data={presentationData} viewMode={viewMode} />}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">Select a book to begin</div>
                        )}
                    </div>
                </main>
            </div>

            {/* DESKTOP AUDIO PLAYER BAR (Fixed Bottom) - REMOVED (Relies on BilingualBiblePresentation controls) */}
        </div>
    );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENTS
// -----------------------------------------------------------------------------

const NavButton = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-gray-200'}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

// Responsive Drawer / Modal
const Drawer = ({ isOpen, onClose, children, title }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            {/* Content Container */}
            <div className={`
                relative bg-neutral-900 z-[70] flex flex-col shadow-2xl border-white/10
                w-full md:w-[500px] md:bg-neutral-900/95
                rounded-t-3xl md:rounded-2xl border-t md:border
                h-[85vh] md:h-auto md:max-h-[85vh]
                transform transition-all duration-300 ease-out
                animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 md:zoom-in-95
            `}>
                <div className="h-1.5 w-12 bg-gray-700 rounded-full mx-auto mt-3 mb-2 shrink-0 md:hidden" />
                {title && (
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg text-white">{title}</h3>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Icons for player (Legacy, kept just in case)
const SkipBack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>;
const SkipForward = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>;

export default BibleUnifiedApp;
