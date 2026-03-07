"use client";

import React, { useState, useEffect } from "react";
import {
    Plus, Save, Image as ImageIcon,
    Settings, Play, Trash2, Copy, FolderOpen, Loader2,
    Music, BookOpen, ChevronUp, ChevronDown, ListPlus, X, RadioReceiver
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getPresentations, savePresentation, type Presentation } from "@/actions/presentations";
import { fetchWorshipSongs, type WorshipSong } from "@/actions/worship";
import { getBibleBooks, type BibleBook } from "@/data/bibleBooks";
import { useBroadcastStore } from "@/store/useBroadcastStore";

export interface Slide {
    id: string;
    type: 'text' | 'lyric' | 'scripture' | 'media';
    content: string;
    targetContent?: string;
    title: string;
    background?: string;
    reference?: string;
    mediaUrl?: string;
}

export default function SlideBuilder() {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [currentPresentation, setCurrentPresentation] = useState<Partial<Presentation>>({
        title: "کلیسای یکشنبه",
        session_date: new Date().toISOString().split('T')[0],
        slides: [
            { id: "1", type: "text", content: "به کلیسای ایرانیان خوش آمدید", title: "Welcome" }
        ]
    });

    const [activeSlideId, setActiveSlideId] = useState<string>("1");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Remote Control Mode
    const [isRemoteMode, setIsRemoteMode] = useState(false);
    const { initRemoteSync, disconnectSync, setActiveSlideIndex: setGlobalActiveSlideIndex, isConnected: isGlobalConnected } = useBroadcastStore();

    // Sidebar Tabs: 'slides', 'worship', 'bible'
    const [activeTab, setActiveTab] = useState<'slides' | 'worship' | 'bible'>('slides');
    const [worshipSongs, setWorshipSongs] = useState<WorshipSong[]>([]);
    const bibleBooks = getBibleBooks();

    useEffect(() => {
        getPresentations().then(data => {
            setPresentations(data);
            if (data.length > 0) {
                handleSelectPresentation(data[0]);
            }
            setIsLoading(false);
        });

        fetchWorshipSongs().then(data => {
            setWorshipSongs(data);
        });
    }, []);

    const handleSelectPresentation = (p: Partial<Presentation>) => {
        setCurrentPresentation(p);
        if (p.slides && p.slides.length > 0) {
            handleSlideSelect(p.slides[0].id, p.slides);
        }
    };

    const handleSlideSelect = (id: string, currentSlides?: Slide[]) => {
        setActiveSlideId(id);

        if (isRemoteMode) {
            // Find global index and push to Supabase
            const targetSlides = currentSlides || slides;
            const idx = targetSlides.findIndex(s => s.id === id);
            if (idx !== -1) {
                setGlobalActiveSlideIndex(idx, false); // false implies DO sync
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await savePresentation(currentPresentation);
        if (res.success) {
            // refresh list to get new IDs
            const data = await getPresentations();
            setPresentations(data);
            if (!currentPresentation.id) {
                // If it was new, select the first one (most recent)
                handleSelectPresentation(data[0]);
            }
        } else {
            alert('Error saving presentation');
        }
        setIsSaving(false);
    };

    const createNewPresentation = () => {
        const newP: Partial<Presentation> = {
            title: "ارائه جدید",
            session_date: new Date().toISOString().split('T')[0],
            slides: [
                { id: Date.now().toString(), type: "text", content: "اسلاید جدید", title: "New Slide" }
            ]
        };
        setCurrentPresentation(newP);
        setActiveSlideId(newP.slides![0].id);
    };

    const addSlide = () => {
        const newSlide: Slide = {
            id: Date.now().toString(),
            type: "text",
            content: "متن اسلاید...",
            title: "New Slide"
        };
        setCurrentPresentation(prev => ({
            ...prev,
            slides: [...(prev.slides || []), newSlide]
        }));
        setActiveSlideId(newSlide.id);
    };

    const updateSlide = (id: string, updates: Partial<Slide>) => {
        setCurrentPresentation(prev => ({
            ...prev,
            slides: prev.slides?.map((s: Slide) => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const deleteSlide = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPresentation(prev => {
            const newSlides = (prev.slides || []).filter((s: Slide) => s.id !== id);
            if (activeSlideId === id && newSlides.length > 0) {
                setActiveSlideId(newSlides[0].id);
            }
            return { ...prev, slides: newSlides };
        });
    };

    const duplicateSlide = (slide: Slide, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSlide = { ...slide, id: Date.now().toString() };
        setCurrentPresentation(prev => ({
            ...prev,
            slides: [...(prev.slides || []), newSlide]
        }));
        setActiveSlideId(newSlide.id);
    };

    const moveSlide = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPresentation(prev => {
            const newSlides = [...(prev.slides || [])];
            if (direction === 'up' && index > 0) {
                [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
            } else if (direction === 'down' && index < newSlides.length - 1) {
                [newSlides[index + 1], newSlides[index]] = [newSlides[index], newSlides[index + 1]];
            }
            return { ...prev, slides: newSlides };
        });
    };

    const importWorshipSong = (song: WorshipSong) => {
        const faLyrics = song.lyrics?.fa || song.title.fa;
        // Split by double newline for stanzas, or single if no double
        const stanzas = faLyrics.includes('\n\n')
            ? faLyrics.split('\n\n')
            : faLyrics.split('\n');

        const newSlides: Slide[] = stanzas.filter(s => s.trim().length > 0).map((stanza, idx) => ({
            id: Date.now().toString() + idx,
            type: "lyric",
            title: `${song.title.fa} - بخش ${idx + 1}`,
            content: stanza.trim()
        }));

        setCurrentPresentation(prev => ({
            ...prev,
            slides: [...(prev.slides || []), ...newSlides]
        }));
        setActiveTab('slides');
        if (newSlides.length > 0) setActiveSlideId(newSlides[0].id);
    };

    const importBibleChapter = (book: BibleBook, chapter: number) => {
        // Placeholder for real bible verses until API is connected
        const newSlides: Slide[] = Array.from({ length: 5 }).map((_, idx) => ({
            id: Date.now().toString() + idx,
            type: "scripture",
            title: `${book.name_fa} ${chapter}:${idx + 1}`,
            content: "در ابتدا خدا آسمانها و زمین را آفرید.", // dummy
            reference: `${book.code}-${chapter}-${idx + 1}`
        }));

        setCurrentPresentation(prev => ({
            ...prev,
            slides: [...(prev.slides || []), ...newSlides]
        }));
        setActiveTab('slides');
        if (newSlides.length > 0) setActiveSlideId(newSlides[0].id);
    };

    const slides = currentPresentation.slides || [];
    const activeSlide = slides.find((s: Slide) => s.id === activeSlideId) || slides[0];

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-[100dvh] w-full bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary/30">

            {/* Left Panel: Slide List */}
            <aside className="w-80 bg-neutral-900 border-r border-border/10 flex flex-col z-10 shrink-0">
                <div className="p-4 border-b border-border/10 flex flex-col gap-3 bg-neutral-950/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold tracking-wide">PRESENTATION</span>
                        <button onClick={createNewPresentation} className="text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1.5 rounded transition">
                            <Plus className="w-3 h-3 inline-block mr-1" /> NEW
                        </button>
                    </div>
                    <select
                        className="w-full bg-neutral-900 border border-border/20 rounded-md px-2 py-2 text-sm focus:outline-none focus:border-primary text-right"
                        dir="rtl"
                        title="انتخاب ارائه"
                        value={currentPresentation.id || ""}
                        onChange={(e) => {
                            const p = presentations.find(p => p.id === e.target.value);
                            if (p) handleSelectPresentation(p);
                        }}
                    >
                        <option value="" disabled>-- یک ارائه را انتخاب کنید --</option>
                        {presentations.map(p => (
                            <option key={p.id} value={p.id}>{p.title} ({p.session_date})</option>
                        ))}
                    </select>
                </div>

                {/* Sidebar Navigation Tabs */}
                <div className="flex border-b border-border/10 bg-neutral-900/50">
                    <button
                        onClick={() => setActiveTab('slides')}
                        className={cn("flex-1 py-3 text-xs font-bold transition-all border-b-2", activeTab === 'slides' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        اسلایدها
                    </button>
                    <button
                        onClick={() => setActiveTab('worship')}
                        className={cn("flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5", activeTab === 'worship' ? "border-pink-500 text-pink-500" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        <Music className="w-3.5 h-3.5" /> سرودها
                    </button>
                    <button
                        onClick={() => setActiveTab('bible')}
                        className={cn("flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5", activeTab === 'bible' ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        <BookOpen className="w-3.5 h-3.5" /> کتاب‌مقدس
                    </button>
                </div>

                {activeTab === 'slides' && (
                    <>
                        <div className="p-4 border-b border-border/10 flex items-center justify-between bg-neutral-950/30">
                            <span className="text-sm font-bold tracking-wide">SLIDES ({slides.length})</span>
                            <button onClick={addSlide} className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1.5 rounded transition">
                                <Plus className="w-3 h-3" /> ADD SLIDE
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
                            {slides.map((slide: Slide, index: number) => (
                                <div
                                    key={slide.id}
                                    onClick={() => handleSlideSelect(slide.id)}
                                    className={cn(
                                        "group flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer relative",
                                        activeSlideId === slide.id
                                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/5"
                                            : "bg-neutral-800/50 border-border/10 hover:bg-neutral-800 hover:border-border/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                            slide.type === 'scripture' ? "bg-indigo-500/20 text-indigo-400" :
                                                slide.type === 'lyric' ? "bg-pink-500/20 text-pink-400" :
                                                    "bg-neutral-700 text-muted-foreground"
                                        )}>
                                            {slide.type}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                                    </div>
                                    <div className={cn(
                                        "font-bold truncate text-sm transition-colors",
                                        activeSlideId === slide.id ? "text-primary" : "text-foreground"
                                    )}>
                                        {slide.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate opacity-80" dir="rtl">
                                        {slide.content.replace('\n', ' ')}
                                    </div>

                                    {/* Floating Actions */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <div className="flex flex-col bg-black/60 rounded overflow-hidden mr-1">
                                            <button title="Move Up" onClick={(e) => moveSlide(index, 'up', e)} disabled={index === 0} className="p-0.5 hover:bg-primary hover:text-white text-muted-foreground disabled:opacity-30">
                                                <ChevronUp className="w-3 h-3" />
                                            </button>
                                            <button title="Move Down" onClick={(e) => moveSlide(index, 'down', e)} disabled={index === slides.length - 1} className="p-0.5 hover:bg-primary hover:text-white text-muted-foreground disabled:opacity-30">
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button onClick={(e) => duplicateSlide(slide, e)} className="p-1.5 rounded bg-black/60 hover:bg-black text-white" title="Duplicate">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                        <button onClick={(e) => deleteSlide(slide.id, e)} className="p-1.5 rounded bg-red-500/80 hover:bg-red-500 text-white" title="Delete">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'worship' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800" dir="rtl">
                        <p className="text-xs text-muted-foreground mb-4">برای افزودن خودکار متن سرود به اسلایدها، یک سرود را انتخاب کنید:</p>
                        {worshipSongs.length === 0 ? (
                            <div className="text-center p-4 border border-dashed border-border/20 rounded-xl text-xs text-muted-foreground">
                                سرودی در دیتابیس یافت نشد. می‌توانید از پنل ادمین اضافه کنید.
                            </div>
                        ) : (
                            worshipSongs.map((song: WorshipSong) => (
                                <div key={song.id} className="p-3 bg-neutral-800/50 border border-border/10 rounded-xl hover:bg-neutral-800 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-sm text-pink-100">{song.title.fa}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{song.artist || 'ناشناس'}</div>
                                    </div>
                                    <button
                                        onClick={() => importWorshipSong(song)}
                                        className="p-2 rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        title="ایجاد اسلایدهای سرود"
                                    >
                                        <ListPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'bible' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800" dir="rtl">
                        <p className="text-xs text-muted-foreground mb-4">برای افزودن آیات کتاب‌مقدس، یک کتاب را انتخاب کنید:</p>
                        <div className="space-y-2">
                            {bibleBooks.slice(0, 5).map(book => ( // Shortened for UI brevity
                                <div key={book.code} className="p-3 bg-neutral-800/50 border border-border/10 rounded-xl hover:bg-neutral-800 transition-colors flex justify-between items-center group">
                                    <div className="font-bold text-sm text-indigo-100">{book.name_fa}</div>
                                    <button
                                        onClick={() => importBibleChapter(book, 1)} // Defaults to chapter 1
                                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        title="افزودن فصل ۱"
                                    >
                                        <ListPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="text-center p-4 border border-dashed border-border/20 rounded-xl text-xs text-muted-foreground">
                                موتور جستجوی کامل آیات در حال توسعه است...
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Center Panel: Editor & Preview */}
            <main className="flex-1 flex flex-col bg-black relative">

                {/* Header */}
                <header className="h-14 bg-neutral-900 border-b border-border/10 flex items-center justify-between px-6 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/broadcast" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2">
                            <Play className="w-4 h-4" /> Console
                        </Link>
                        <h1 className="font-bold tracking-wide flex items-center gap-2">
                            SLIDE BUILDER
                            {isRemoteMode && (
                                <span className="flex items-center gap-1.5 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-widest font-black animate-pulse">
                                    <RadioReceiver className="w-3 h-3" /> LIVE REMOTE
                                </span>
                            )}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Remote Control Toggle */}
                        <button
                            onClick={() => {
                                if (isRemoteMode) {
                                    disconnectSync();
                                    setIsRemoteMode(false);
                                } else {
                                    // Make sure store slides match current presentation slides before syncing
                                    useBroadcastStore.getState().setSlides(slides);
                                    initRemoteSync();
                                    setIsRemoteMode(true);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                isRemoteMode
                                    ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-red-500/20"
                                    : "bg-neutral-800 border-border/50 text-muted-foreground hover:bg-neutral-700 hover:text-foreground"
                            )}
                            title={isRemoteMode ? "Disconnect iPad/Remote" : "Connect as Remote Control for Projector"}
                        >
                            <RadioReceiver className="w-4 h-4" />
                            {isRemoteMode ? "REMOTE ACTIVE" : "ENABLE REMOTE"}
                        </button>

                        <div className="w-px h-6 bg-border/20 mx-1" />

                        <input
                            title="Presentation Title"
                            value={currentPresentation.title || ""}
                            onChange={(e) => setCurrentPresentation(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-transparent border-b border-border/20 text-right px-2 py-1 focus:outline-none focus:border-primary font-bold text-sm w-48"
                            dir="rtl"
                            placeholder="عنوان ارائه"
                        />
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg transition-colors shadow-md shadow-primary/20",
                                isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
                            )}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? "Saving..." : "Save Deck"}
                        </button>
                    </div>
                </header>

                {/* Workspace Split */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Working Area (Editor) */}
                    <div className="w-1/2 border-r border-border/10 bg-neutral-900 flex flex-col">
                        <div className="flex-1 p-6 overflow-y-auto space-y-6">

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Slide Title</label>
                                <input
                                    type="text"
                                    title="Slide Title"
                                    placeholder="Enter Title"
                                    value={activeSlide?.title || ""}
                                    onChange={(e) => updateSlide(activeSlide.id, { title: e.target.value })}
                                    className="w-full bg-neutral-950 border border-border/20 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary font-bold shadow-inner text-right"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between">
                                    <span>Content</span>
                                    <select
                                        title="Slide Type"
                                        className="bg-transparent text-primary font-bold focus:outline-none"
                                        value={activeSlide?.type || 'text'}
                                        onChange={(e) => updateSlide(activeSlide.id, { type: e.target.value as any })}
                                    >
                                        <option value="text">TEXT</option>
                                        <option value="scripture">SCRIPTURE</option>
                                        <option value="lyric">LYRIC</option>
                                    </select>
                                </label>
                                <textarea
                                    title="Slide Content"
                                    value={activeSlide?.content || ""}
                                    onChange={(e) => updateSlide(activeSlide.id, { content: e.target.value })}
                                    className="w-full h-64 bg-neutral-950 border border-border/20 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary font-medium resize-none shadow-inner text-right"
                                    dir="rtl"
                                    placeholder="متن اسلاید را وارد کنید..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition text-muted-foreground hover:text-foreground border border-border/10">
                                    <ImageIcon className="w-4 h-4" /> Change Background
                                </button>
                                <button className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition text-muted-foreground hover:text-foreground border border-border/10">
                                    <Settings className="w-4 h-4" /> Typography
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Preview Area (16:9) */}
                    <div className="flex-1 bg-neutral-950 pattern-grid-lg flex items-center justify-center p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        <div className="w-full aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 rounded-lg shadow-2xl overflow-hidden relative border border-border/20 ring-1 ring-white/5 flex flex-col justify-center items-center p-12 lg:p-20 text-center">

                            {/* Ambient background effect */}
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen" />

                            <p className="relative z-10 text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-lg leading-tight" dir="rtl">
                                {activeSlide?.content.split('\n').map((line: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </p>

                            {/* Presentation Meta */}
                            {activeSlide?.type === 'scripture' && (
                                <div className="absolute bottom-10 inset-x-0 mx-auto w-fit z-10 border-t-2 border-primary/50 pt-4">
                                    <p className="text-xl md:text-2xl font-bold text-primary tracking-widest uppercase drop-shadow">
                                        {activeSlide.title}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Safe Area Markers */}
                        <div className="absolute inset-10 border border-dashed border-white/10 pointer-events-none rounded opacity-50" />
                    </div>

                </div>

            </main>
        </div>
    );
}
