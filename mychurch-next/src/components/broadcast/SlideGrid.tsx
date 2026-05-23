"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { SlideType } from "@/types/broadcast";
import { cn } from "@/lib/utils";

export function SlideGrid() {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const setActiveSlideIndex = useBroadcastStore((state) => state.setActiveSlideIndex);
    const activeSceneId = useBroadcastStore((state) => state.activeSceneId);

    const [filter, setFilter] = useState<'all' | 'lyrics' | 'bible' | 'media'>('all');

    // Auto-update filter based on Sidebar Scene selections
    useEffect(() => {
        if (activeSceneId === 'scene_1') {
            setFilter('lyrics');
        } else if (activeSceneId === 'scene_2') {
            setFilter('bible');
        } else if (activeSceneId === 'scene_5') {
            setFilter('media');
        }
    }, [activeSceneId]);

    // Filter slides and keep track of original index
    const filteredSlides = useMemo(() => {
        return slides
            .map((slide, originalIndex) => ({ slide, originalIndex }))
            .filter(({ slide }) => {
                if (filter === 'all') return true;
                if (filter === 'lyrics') return slide.type === SlideType.LYRICS;
                if (filter === 'bible') return slide.type === SlideType.SCRIPTURE;
                if (filter === 'media') return slide.type === SlideType.MEDIA;
                return true;
            });
    }, [slides, filter]);

    return (
        <div className="h-64 bg-neutral-900 rounded-xl border border-border/10 flex flex-col overflow-hidden font-[Vazirmatn]">
            {/* Quick Filters */}
            <div className="p-2 border-b border-border/10 bg-neutral-950/50 flex gap-2" dir="rtl">
                <button 
                    onClick={() => setFilter('all')}
                    className={cn(
                        "px-4 py-1 text-xs font-bold rounded transition-colors",
                        filter === 'all' ? "bg-primary text-white" : "bg-neutral-800 hover:bg-neutral-700 text-muted-foreground hover:text-foreground"
                    )} 
                    title="All"
                >
                    {t.all || 'همه'}
                </button>
                <button 
                    onClick={() => setFilter('lyrics')}
                    className={cn(
                        "px-4 py-1 text-xs font-bold rounded transition-colors",
                        filter === 'lyrics' ? "bg-primary text-white" : "bg-neutral-800 hover:bg-neutral-700 text-muted-foreground hover:text-foreground"
                    )} 
                    title="Lyrics"
                >
                    {t.lyrics || 'سرودها'}
                </button>
                <button 
                    onClick={() => setFilter('bible')}
                    className={cn(
                        "px-4 py-1 text-xs font-bold rounded transition-colors",
                        filter === 'bible' ? "bg-primary text-white" : "bg-neutral-800 hover:bg-neutral-700 text-muted-foreground hover:text-foreground"
                    )} 
                    title="Bible"
                >
                    {t.bible || 'کتاب‌مقدس'}
                </button>
                <button 
                    onClick={() => setFilter('media')}
                    className={cn(
                        "px-4 py-1 text-xs font-bold rounded transition-colors",
                        filter === 'media' ? "bg-primary text-white" : "bg-neutral-800 hover:bg-neutral-700 text-muted-foreground hover:text-foreground"
                    )} 
                    title="Media"
                >
                    {t.media || 'رسانه'}
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 p-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-y-auto" dir="ltr">
                {filteredSlides.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium font-[Vazirmatn]">
                        {t.noSlides || "اسلایدی با این مشخصات یافت نشد"}
                    </div>
                ) : (
                    filteredSlides.map(({ slide, originalIndex }) => (
                        <div
                            key={slide.id || originalIndex}
                            onClick={() => setActiveSlideIndex(originalIndex)}
                            className={cn(
                                "aspect-video rounded border cursor-pointer flex items-end p-2 relative group overflow-hidden transition-all",
                                activeSlideIndex === originalIndex
                                    ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,51,102,0.3)]"
                                    : "bg-neutral-800 border-border/20 hover:border-primary/50"
                            )}
                            title={`Slide ${originalIndex + 1}`}
                        >
                            <div className="absolute inset-0 bg-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Slide type badge indicator */}
                            <span className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black/40 text-white/60">
                                {slide.type}
                            </span>

                            <span className={cn(
                                "text-[10px] font-bold relative z-10 font-sans",
                                activeSlideIndex === originalIndex ? "text-primary" : "text-white/80"
                            )}>
                                Slide {originalIndex + 1}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
