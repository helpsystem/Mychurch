/**
 * Bible Unified App - Mobile First Redesign
 * "App-like" experience for Mobile, "Pro" experience for Desktop.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Book, Monitor, Mic2, Settings, ChevronLeft, ChevronRight,
    Menu, X, Volume2, Maximize2, Type, Sun, Moon, Search,
    Home, Headphones, Layers, MoreHorizontal, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import BilingualBiblePresentation, { BiblePayload } from '@/components/BilingualBiblePresentation';
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

    // Fetch Books
    useEffect(() => {
        const fetchBooks = async () => {
            try {
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
                }
            } catch (err) {
                console.error("Failed to fetch books", err);
            }
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
                const response = await fetch(`/api/bible-local/content/${translationCode}/${usfmCode}/${selectedChapter}`);
                const data = await response.json();

                if (data.success && data.verses) {
                    const audioUrlFa = data.audio || `/api/bible-local/audio/${translationCode}/${usfmCode}/${selectedChapter}`;
                    const audioUrlEn = `/api/bible-local/audio/eng/${usfmCode}/${selectedChapter}`;
                    const currentBook = books.find(b => b.key === selectedBook);
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


    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    // Get Current Book Name safely
    const currentBookName = books.find(b => b.key === selectedBook)?.name[lang as 'en' | 'fa'] || (lang === 'fa' ? 'پیدایش' : 'Genesis');

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

                    <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400">
                        <Settings size={20} />
                    </button>
                </header>

                {/* 2. MAIN CONTENT (Scrollable) */}
                <main className="flex-1 overflow-hidden relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
                            {/* Added pb-20 for bottom nav space */}
                            {presentationData && (
                                <BilingualBiblePresentation
                                    data={presentationData}
                                    autoStart={true}
                                    enableAudio={isPlaying} // Pass playing state (simplified)
                                    viewMode={viewMode}
                                    key={`${selectedBook}-${selectedChapter}`}
                                />
                            )}
                        </div>
                    )}

                    {/* Floating Audio Play Button (If viewing text) */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`absolute bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-40 transition-all ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-600 text-white'
                            }`}
                    >
                        {isPlaying ? <div className="w-3 h-3 bg-white rounded-sm" /> : <div className="ml-1 w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent" />}
                        {/* Status Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20" />
                    </button>
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
                        icon={<MoreHorizontal size={20} />}
                        label={lang === 'fa' ? 'بیشتر' : 'More'}
                        active={activeTab === 'more'}
                        onClick={() => setActiveTab('more')}
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

                {/* 5. AUDIO PLAYER SHEET */}
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

                    {/* Desktop Mode Switcher */}
                    <div className="flex bg-neutral-800 p-1 rounded-lg">
                        {['presentation', 'study', 'karaoke', 'book3d'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${mode === m ? 'bg-neutral-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 outline-none"
                    >
                        <option value="MOJDEH">MZH (Mojdeh)</option>
                        <option value="QADIM">POV (Old Persian)</option>
                        <option value="TPV">TPV (Today's)</option>
                    </select>
                    <button onClick={() => setViewMode(v => v === 'dual' ? 'fa' : 'dual')} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors" title="Toggle Dual View">
                        <Languages size={18} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
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
                            <button
                                key={book.key}
                                onClick={() => { setSelectedBook(book.key); setSelectedChapter(1); }}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${selectedBook === book.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                            >
                                <span className={lang === 'fa' ? 'font-medium' : 'font-medium'}>{lang === 'fa' ? book.name.fa : book.name.en}</span>
                                {selectedBook === book.key && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* MAIN STAGE */}
                <main className="flex-1 relative bg-black flex flex-col">
                    {/* Toolbar / Breadcrumbs */}
                    <div className="h-12 bg-neutral-800/50 border-b border-white/5 flex items-center justify-between px-6">
                        <div className="flex items-center gap-2 text-gray-300">
                            <span className="font-bold text-white">{currentBookName}</span>
                            <ChevronRight size={14} className="opacity-50" />
                            <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-sm">CH {selectedChapter}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedChapter(c => Math.max(1, c - 1))} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"><ChevronLeft size={16} /></button>
                            <button onClick={() => setSelectedChapter(c => c + 1)} className="p-1.5 hover:bg-white/10 rounded"><ChevronRight size={16} /></button>
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
                                        autoStart={true}
                                        enableAudio={isPlaying}
                                        viewMode={viewMode}
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

            {/* DESKTOP AUDIO PLAYER BAR (Fixed Bottom) */}
            <div className="h-16 bg-neutral-900 border-t border-white/10 flex items-center px-6 gap-6 z-50">
                <div className="flex items-center gap-4 w-64">
                    <div className="w-10 h-10 bg-purple-900/50 rounded flex items-center justify-center text-purple-400">
                        <Book size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{currentBookName} {selectedChapter}</span>
                        <span className="text-xs text-gray-500">{translation} Audio Bible</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white"><SkipBack /></button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <div className="w-3 h-3 bg-black" /> : <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent ml-1" />}
                        </button>
                        <button className="text-gray-400 hover:text-white"><SkipForward /></button>
                    </div>
                </div>

                <div className="w-64 flex justify-end items-center gap-4">
                    <Volume2 size={18} className="text-gray-400" />
                    <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-purple-500" />
                    </div>
                </div>
            </div>
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

const Drawer = ({ isOpen, onClose, children, title }: any) => (
    <>
        {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={onClose} />}
        <div className={`fixed inset-x-0 bottom-0 max-h-[85vh] h-[85vh] bg-neutral-900 rounded-t-3xl z-[70] transform transition-transform duration-300 ease-out flex flex-col shadow-2xl border-t border-white/10 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="h-1.5 w-12 bg-gray-700 rounded-full mx-auto mt-3 mb-2 shrink-0" />
            {title && (
                <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-800 rounded-full"><X size={16} /></button>
                </div>
            )}
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>
    </>
);

// Icons for player
const SkipBack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>;
const SkipForward = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>;

export default BibleUnifiedApp;
