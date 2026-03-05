"use client";

import React, { useState } from "react";
import {
    Plus, Save, Layout, Type, Image as ImageIcon, Video,
    Settings, Play, Move, Trash2, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Slide {
    id: string;
    type: 'text' | 'lyric' | 'scripture' | 'media';
    content: string;
    title: string;
    background?: string;
}

export default function SlideBuilder() {
    const [slides, setSlides] = useState<Slide[]>([
        { id: "1", type: "text", content: "به کلیسای ایرانیان خوش آمدید", title: "Welcome" },
        { id: "2", type: "scripture", content: "در ابتدا کلمه بود،\nو کلمه نزد خدا بود،\nو کلمه خدا بود.", title: "John 1:1" }
    ]);
    const [activeSlideId, setActiveSlideId] = useState<string>("1");

    const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

    return (
        <div className="flex h-[100dvh] w-full bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary/30">

            {/* Left Panel: Slide List */}
            <aside className="w-80 bg-neutral-900 border-r border-border/10 flex flex-col z-10 shrink-0">
                <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between bg-neutral-950/50">
                    <span className="text-sm font-bold tracking-wide">SLIDES</span>
                    <button className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1.5 rounded transition">
                        <Plus className="w-3 h-3" /> ADD SLIDE
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            onClick={() => setActiveSlideId(slide.id)}
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
                            <div className="text-xs text-muted-foreground truncate opacity-80">
                                {slide.content.replace('\n', ' ')}
                            </div>

                            {/* Floating Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button className="p-1.5 rounded bg-black/60 hover:bg-black text-white" title="Duplicate">
                                    <Copy className="w-3 h-3" />
                                </button>
                                <button className="p-1.5 rounded bg-red-500/80 hover:bg-red-500 text-white" title="Delete">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Center Panel: Editor & Preview */}
            <main className="flex-1 flex flex-col bg-black relative">

                {/* Header */}
                <header className="h-14 bg-neutral-900 border-b border-border/10 flex items-center justify-between px-6 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/broadcast" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2">
                            <Play className="w-4 h-4" /> Console
                        </Link>
                        <div className="w-px h-6 bg-border/20" />
                        <h1 className="font-bold tracking-wide">SLIDE BUILDER</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors">
                            Preview
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-md shadow-primary/20">
                            <Save className="w-4 h-4" /> Save All
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
                                    className="w-full bg-neutral-950 border border-border/20 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary font-bold shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between">
                                    <span>Content</span>
                                    <span className={cn(
                                        activeSlide?.type === "scripture" ? "text-indigo-400" : ""
                                    )}>Type: {activeSlide?.type}</span>
                                </label>
                                <textarea
                                    value={activeSlide?.content || ""}
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
                                {activeSlide?.content.split('\n').map((line, i) => (
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
