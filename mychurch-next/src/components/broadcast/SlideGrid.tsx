"use client";

import React from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { cn } from "@/lib/utils";

export function SlideGrid() {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const setActiveSlideIndex = useBroadcastStore((state) => state.setActiveSlideIndex);

    return (
        <div className="h-64 bg-neutral-900 rounded-xl border border-border/10 flex flex-col overflow-hidden">
            {/* Quick Filters */}
            <div className="p-2 border-b border-border/10 bg-neutral-950/50 flex gap-2">
                <button className="px-4 py-1 text-xs font-bold bg-neutral-800 rounded text-white" title="All">{t.all || 'All'}</button>
                <button className="px-4 py-1 text-xs font-bold hover:bg-neutral-800 rounded text-muted-foreground" title="Lyrics">{t.lyrics}</button>
                <button className="px-4 py-1 text-xs font-bold hover:bg-neutral-800 rounded text-muted-foreground" title="Bible">{t.bible}</button>
                <button className="px-4 py-1 text-xs font-bold hover:bg-neutral-800 rounded text-muted-foreground" title="Media">{t.media}</button>
            </div>

            {/* Grid */}
            <div className="flex-1 p-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-y-auto">
                {slides.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                        {t.noSlides || "No slides matching criteria"}
                    </div>
                ) : (
                    slides.map((slide, i) => (
                        <div
                            key={slide.id || i}
                            onClick={() => setActiveSlideIndex(i)}
                            className={cn(
                                "aspect-video rounded border cursor-pointer flex items-end p-2 relative group overflow-hidden transition-all",
                                activeSlideIndex === i
                                    ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,51,102,0.3)]"
                                    : "bg-neutral-800 border-border/20 hover:border-primary/50"
                            )}
                            title={`Slide ${i + 1}`}
                        >
                            <div className="absolute inset-0 bg-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className={cn(
                                "text-[10px] font-bold relative z-10",
                                activeSlideIndex === i ? "text-primary" : "text-muted-foreground"
                            )}>
                                {t.slide} {i + 1}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
