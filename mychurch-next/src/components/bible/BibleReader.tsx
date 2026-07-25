"use client";

import React, { useState } from "react";
import {
    Book, Search, Settings, ChevronRight, ChevronLeft,
    Volume2, Monitor, Home, Languages, Maximize2,
    Type, Contrast, Play, Pause, SkipForward, SkipBack, X
} from "lucide-react";
import { type BibleBook } from "@/data/bibleBooks";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { fetchChapterData, type UnifiedVerse } from "@/actions/bible";

interface BibleReaderProps {
    initialBooks: BibleBook[];
}

export default function BibleReader({ initialBooks }: BibleReaderProps) {
    const [selectedBook, setSelectedBook] = useState<string>("01");
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [translation, setTranslation] = useState<"MOJDEH" | "TPV" | "QADIM" | "WP">("MOJDEH");

    // Accessibility & Sync State
    const [fontSize, setFontSize] = useState<"md" | "lg" | "xl">("md");
    const [highContrast, setHighContrast] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Audio Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeVerse, setActiveVerse] = useState<number | null>(null);
    const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Data State
    const [verses, setVerses] = useState<UnifiedVerse[]>([]);
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const filteredBooks = initialBooks.filter(b =>
        b.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name_fa.includes(searchQuery)
    );

    const currentBook = initialBooks.find(b => b.code === selectedBook) || initialBooks[0];

    // Load actual data when book/chapter changes
    useEffect(() => {
        let isMounted = true;

        async function loadChapter() {
            setIsLoading(true);
            setIsPlaying(false);
            setActiveVerse(null);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            console.log('Force Reloading actions to clear cache');
            const data = await fetchChapterData(selectedBook, selectedChapter);

            if (isMounted) {
                if (data) {
                    setVerses(data.verses);
                    
                    // Route to correct audio base on translation selected
                    let currentAudio = data.audioUrl; // Primary fallback
                    if (translation === "TPV" && data.tpvAudioUrl) currentAudio = data.tpvAudioUrl;
                    if (translation === "MOJDEH" && data.mojdehAudioUrl) currentAudio = data.mojdehAudioUrl;
                    if (translation === "QADIM" && data.qadimAudioUrl) currentAudio = data.qadimAudioUrl;

                    setAudioUrl(currentAudio || "");
                } else {
                    setVerses([]);
                    setAudioUrl("");
                }
                setIsLoading(false);
            }
        }

        loadChapter();
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, translation]);

    // Auto-scroll logic when active verse changes
    useEffect(() => {
        if (activeVerse !== null && verseRefs.current[activeVerse - 1]) {
            verseRefs.current[activeVerse - 1]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeVerse]);

    // Native Audio Engine Sync Hook
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;

            // Find the verse that corresponds to the precise audio playback time
            // We use >= start and < end for precise range targeting
            const active = verses.find(v => currentTime >= v.start && currentTime < v.end);

            if (active) {
                if (activeVerse !== active.number) {
                    setActiveVerse(active.number);
                }
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setActiveVerse(null);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [verses, activeVerse]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const fontClasses = {
        md: "text-2xl md:text-3xl",
        lg: "text-3xl md:text-4xl",
        xl: "text-4xl md:text-5xl font-black leading-loose"
    };

    return (
        <div className={cn(
            "flex h-[100dvh] w-full overflow-hidden transition-colors duration-500",
            highContrast ? "bg-black text-yellow-400 selection:bg-yellow-400/30" : "bg-background text-foreground selection:bg-primary/30"
        )}>

            {/* Desktop Sidebar */}
            <aside className={cn(
                "w-80 border-l border-border/50 bg-background/50 backdrop-blur-2xl flex flex-col transition-all duration-300 z-40 relative",
                isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 hidden md:flex"
            )}>
                {/* Search Bar */}
                <div className="p-4 border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="نام کتاب (پیدایش، یوحنا...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary/50 border border-border/50 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                {/* Books List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 p-3 space-y-1">
                    {filteredBooks.map(book => (
                        <div key={book.code} className="flex flex-col gap-1">
                            <button
                                onClick={() => {
                                    setSelectedBook(book.code);
                                    setSelectedChapter(1);
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "w-full text-right px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-300 group",
                                    selectedBook === book.code
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                                        : "hover:bg-secondary/80 text-foreground/80 hover:text-foreground font-medium"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all",
                                        selectedBook === book.code ? "bg-primary-foreground" : "bg-primary/50 group-hover:scale-150"
                                    )} />
                                    {book.name_fa}
                                </span>
                                <span className={cn(
                                    "text-xs transition-colors",
                                    selectedBook === book.code ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                    {book.name_en}
                                </span>
                            </button>

                            {/* Chapters Grid (Only if selected) */}
                            {selectedBook === book.code && (
                                <div className="grid grid-cols-5 gap-1.5 p-2 bg-secondary/30 rounded-xl mt-1 mb-2 animate-in slide-in-from-top-2 duration-300">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                                        <button
                                            key={ch}
                                            onClick={() => setSelectedChapter(ch)}
                                            className={cn(
                                                "py-2 rounded-lg text-sm font-semibold transition-all",
                                                selectedChapter === ch
                                                    ? "bg-primary/20 text-primary border border-primary/30"
                                                    : "bg-background/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
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

            {/* Main Reading Area */}
            <main className="flex-1 flex flex-col relative bg-background h-[100dvh]">

                {/* Background Ambient Layers */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Top Nav / Breadcrumbs */}
                <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-10 shrink-0 shadow-sm">
                    {/* Left side actions */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Link href="/" className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all group" title="خانه">
                            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Link>

                        <div className="w-px h-6 bg-border hidden sm:block mx-1" />

                        {/* Chapter Navigation Panel */}
                        {/* Chapter Navigation Panel (Force LTR layout to keep Back on left, Next on right) */}
                        <div className="flex items-center bg-secondary/50 rounded-xl border border-border/50 p-1 shadow-sm" dir="ltr">
                            <button
                                title="Previous Chapter"
                                onClick={() => setSelectedChapter(c => Math.max(1, c - 1))}
                                disabled={selectedChapter <= 1}
                                className="p-2 rounded-lg hover:bg-background hover:shadow-sm disabled:opacity-30 transition-all text-foreground"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="px-4 font-bold text-sm min-w-[5rem] text-center select-none text-foreground" dir="rtl">
                                فصل <span dir="ltr">{selectedChapter}</span>
                            </div>

                            <button
                                title="Next Chapter"
                                onClick={() => setSelectedChapter(c => Math.min(currentBook.chapters, c + 1))}
                                disabled={selectedChapter >= currentBook.chapters}
                                className="p-2 rounded-lg hover:bg-background hover:shadow-sm disabled:opacity-30 transition-all text-foreground"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Audio Element (Hidden) */}
                        {audioUrl && (
                            <audio ref={audioRef} src={audioUrl} preload="auto" />
                        )}

                        {/* Audio Controls */}
                        {audioUrl && (
                            <div className="hidden sm:flex items-center gap-1 bg-secondary/50 rounded-xl border border-border/50 p-1">
                                <button
                                    onClick={togglePlay}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm transition-all",
                                        isPlaying ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {isPlaying ? "توقف" : "پخش صوتی"}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn(
                                "p-2.5 rounded-xl transition-all border shadow-sm",
                                showSettings ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 hover:bg-secondary text-foreground border-border/50"
                            )}
                            title="تنظیمات دسترسی پذیری"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        <button title="لیست کتاب‌ها" className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-all border border-border/50 shadow-sm sm:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Book className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Accessibility Settings Panel */}
                {showSettings && (
                    <div className="absolute top-16 right-4 sm:right-6 w-80 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-30 p-5 origin-top-right animate-in fade-in zoom-in-95 duration-200" dir="rtl">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <Settings className="w-4 h-4 text-primary" /> تنظیمات خواندن
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Font Size */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Type className="w-4 h-4" /> اندازه قلم (فارسی)
                                </label>
                                <div className="flex bg-secondary/50 rounded-xl p-1 border border-border/50">
                                    <button
                                        onClick={() => setFontSize("md")}
                                        className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors", fontSize === "md" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        متوسط
                                    </button>
                                    <button
                                        onClick={() => setFontSize("lg")}
                                        className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors", fontSize === "lg" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        بزرگ
                                    </button>
                                    <button
                                        onClick={() => setFontSize("xl")}
                                        className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors", fontSize === "xl" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        خیلی بزرگ
                                    </button>
                                </div>
                            </div>

                            {/* Translation Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Languages className="w-4 h-4" /> ترجمه فارسی
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["NMV", "MOJDEH", "TPV", "QADIM"].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTranslation(t as any)}
                                            className={cn(
                                                "py-2 px-3 text-sm font-bold rounded-xl transition-all border",
                                                translation === t
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-secondary/50 text-foreground border-border/50 hover:bg-secondary hover:border-border"
                                            )}
                                        >
                                            {t === "NMV" && "ترجمه تفسیری (NMV)"}
                                            {t === "MOJDEH" && "مژده برای عصر جدید"}
                                            {t === "TPV" && "پارسایان (TPV)"}
                                            {t === "QADIM" && "ترجمه قدیم"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contrast */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Contrast className="w-4 h-4" /> کنتراست تصویر
                                </label>
                                <button
                                    onClick={() => setHighContrast(!highContrast)}
                                    className={cn(
                                        "w-full py-2.5 rounded-xl font-bold transition-all border",
                                        highContrast
                                            ? "bg-yellow-400 text-black border-yellow-500"
                                            : "bg-secondary/50 border-border/50 text-foreground hover:bg-secondary"
                                    )}
                                >
                                    {highContrast ? "حالت کنتراست بالا: روشن" : "حالت کنتراست بالا: خاموش"}
                                </button>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    حالت کنتراست بالا برای افراد کم‌بینا طراحی شده است تا خواندن متن در طولانی مدت چشم را خسته نکند.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reader Content */}
                <div className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
                    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 lg:px-8">
                        {/* Title Display */}
                        <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-widest mb-6">
                                {translation} TRANSLATION
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black mb-4 text-foreground tracking-tight drop-shadow-sm">
                                {currentBook.name_fa}
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground font-medium opacity-80 uppercase tracking-widest">
                                {currentBook.name_en} {selectedChapter}
                            </p>
                        </div>

                        {/* Verses Container */}
                        <div className="space-y-10 md:space-y-12">
                            {isLoading ? (
                                <div className="py-20 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-4">
                                    <Book className="w-12 h-12 opacity-50" />
                                    <p>در حال بارگذاری کلام خدا...</p>
                                </div>
                            ) : verses.length === 0 ? (
                                <div className="py-20 text-center text-muted-foreground">
                                    <p>متاسفانه دیتای این فصل در سرور یافت نشد.</p>
                                </div>
                            ) : (
                                verses.map(verse => {
                                    const isActive = activeVerse === verse.number;

                                    let displayFaText = verse.fa;
                                    if (translation === "TPV" && verse.fa_tpv) displayFaText = verse.fa_tpv;
                                    if (translation === "MOJDEH" && verse.fa_mojdeh) displayFaText = verse.fa_mojdeh;
                                    if (translation === "QADIM" && verse.fa_qadim) displayFaText = verse.fa_qadim;
                                    if (translation === "WP" && verse.fa_wp) displayFaText = verse.fa_wp;

                                    return (
                                        <div
                                            key={verse.number}
                                            ref={el => { verseRefs.current[verse.number - 1] = el; }}
                                            className={cn(
                                                "group flex flex-col gap-3 relative p-4 -mx-4 rounded-2xl transition-all duration-500",
                                                isActive
                                                    ? (highContrast ? "bg-yellow-400/20 border border-yellow-400/50" : "bg-primary/10 border border-primary/20 scale-[1.02] shadow-xl shadow-primary/5")
                                                    : "hover:bg-secondary/20 border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-4 -right-12 text-lg font-black transition-colors select-none text-right w-8",
                                                isActive ? (highContrast ? "text-yellow-400" : "text-primary") : "text-amber-500/80 group-hover:text-amber-500"
                                            )} dir="ltr">
                                                {verse.number}
                                            </div>
                                            <div className="w-full">
                                                <p className={cn(
                                                    "text-right drop-shadow-sm font-medium transition-all duration-300 w-full",
                                                fontClasses[fontSize],
                                                )} dir="rtl" style={{ lineHeight: fontSize === 'xl' ? '2.5' : '1.8' }}>
                                                    {displayFaText}
                                                </p>
                                                <p className={cn(
                                                    "text-lg md:text-xl leading-relaxed font-serif text-left md:w-[90%] border-l-2 pl-4 mt-6 transition-colors tracking-wide",
                                                    isActive
                                                        ? (highContrast ? "text-yellow-400/80 border-yellow-400/50" : "text-foreground/90 border-primary")
                                                        : "text-muted-foreground/60 border-primary/20",
                                                    "font-['Times_New_Roman',ui-serif,Georgia]" 
                                                )} dir="ltr">
                                                    {verse.en}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* End of Chapter Navigation */}
                        <div className="mt-24 flex justify-between items-center py-8 border-t border-border/50">
                            {selectedChapter < currentBook.chapters && (
                                <button onClick={() => setSelectedChapter(c => c + 1)} className="flex items-center gap-3 px-6 py-3 bg-secondary rounded-2xl hover:bg-secondary/80 transition-all font-semibold mr-auto group text-foreground">
                                    فصل بعدی <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
