"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { 
    SlideType, 
    SlideContentScripture, 
    SlideContentLyrics, 
    SlideContentMedia, 
    SlideContentAnnouncement, 
    SlideContentGeneric, 
    SlideContentLiveData, 
    SlideContentMeeting, 
    SlideContentPrayer 
} from "@/types/broadcast";
import { cn } from "@/lib/utils";
import { 
    BookOpen, Music, FileImage, Video, Mic, 
    Megaphone, Edit3, PieChart, PhoneCall, Heart 
} from "lucide-react";

export function SlideGrid() {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const setActiveSlideIndex = useBroadcastStore((state) => state.setActiveSlideIndex);
    const activeSceneId = useBroadcastStore((state) => state.activeSceneId);

    const [filter, setFilter] = useState<'all' | 'lyrics' | 'bible' | 'media'>('all');

    // Counts for tabs
    const counts = useMemo(() => {
        let lyrics = 0;
        let bible = 0;
        let media = 0;
        slides.forEach(s => {
            if (s.type === SlideType.LYRICS) lyrics++;
            else if (s.type === SlideType.SCRIPTURE) bible++;
            else if (s.type === SlideType.MEDIA) media++;
        });
        return { total: slides.length, lyrics, bible, media };
    }, [slides]);

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
        <div className="h-72 min-h-[260px] shrink-0 bg-neutral-900 rounded-xl border border-border/10 flex flex-col overflow-hidden font-[Vazirmatn] shadow-md">
            {/* Quick Filters */}
            <div className="p-2 border-b border-border/10 bg-neutral-950/60 flex flex-wrap items-center justify-between gap-2" dir="rtl">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button 
                        type="button"
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 font-[Vazirmatn]",
                            filter === 'all' ? "bg-blue-600 text-white shadow-sm" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        )} 
                        title="All"
                    >
                        <span>{t.all || 'همه'}</span>
                        <span className="text-[10px] opacity-80 font-mono">({counts.total})</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setFilter('lyrics')}
                        className={cn(
                            "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 font-[Vazirmatn]",
                            filter === 'lyrics' ? "bg-pink-600 text-white shadow-sm" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        )} 
                        title="Lyrics"
                    >
                        <span>{t.lyrics || 'متن سرود'}</span>
                        <span className="text-[10px] opacity-80 font-mono">({counts.lyrics})</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setFilter('bible')}
                        className={cn(
                            "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 font-[Vazirmatn]",
                            filter === 'bible' ? "bg-amber-600 text-white shadow-sm" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        )} 
                        title="Bible"
                    >
                        <span>{t.bible || 'کتاب مقدس'}</span>
                        <span className="text-[10px] opacity-80 font-mono">({counts.bible})</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setFilter('media')}
                        className={cn(
                            "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 font-[Vazirmatn]",
                            filter === 'media' ? "bg-blue-500 text-white shadow-sm" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        )} 
                        title="Media"
                    >
                        <span>{t.media || 'رسانه'}</span>
                        <span className="text-[10px] opacity-80 font-mono">({counts.media})</span>
                    </button>
                </div>

                <div className="text-[11px] text-neutral-400 font-bold px-2 hidden sm:block">
                    اسلاید فعال: <b className="text-white font-mono">{activeSlideIndex + 1}</b> از <b className="font-mono">{slides.length}</b>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-y-auto" dir="ltr">
                {filteredSlides.length === 0 ? (
                    <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs font-medium font-[Vazirmatn] gap-2 py-8">
                        <span>اسلایدی در دسته‌بندی فیلترشده یافت نشد.</span>
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition"
                        >
                            نمایش همه اسلایدها ({counts.total})
                        </button>
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
                            {/* Thumbnail Preview Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5 text-center select-none bg-neutral-950/20 group-hover:bg-neutral-950/40 transition-all">
                                {slide.type === SlideType.SCRIPTURE && (
                                    <div className="w-full text-center px-1">
                                        <BookOpen className="w-4 h-4 text-amber-400/90 mx-auto mb-1 animate-pulse" />
                                        <p className="text-[9px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentScripture).pages?.[0]?.bookName?.fa || 'کتاب‌مقدس'}
                                        </p>
                                        <p className="text-[7.5px] text-slate-400 font-mono truncate" dir="ltr">
                                            {(slide.content as SlideContentScripture).pages?.[0]?.chapter}:{(slide.content as SlideContentScripture).pages?.[0]?.verses}
                                        </p>
                                    </div>
                                )}
                                {slide.type === SlideType.LYRICS && (
                                    <div className="w-full text-center px-1">
                                        <Music className="w-4 h-4 text-pink-400/90 mx-auto mb-0.5 animate-bounce" style={{ animationDuration: '3s' }} />
                                        <p className="text-[9px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentLyrics).titleFa || (slide.content as SlideContentLyrics).title}
                                        </p>
                                        {(slide.content as SlideContentLyrics).titleEn && (
                                            <p className="text-[7.5px] text-slate-400 truncate" dir="ltr">
                                                {(slide.content as SlideContentLyrics).titleEn}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {slide.type === SlideType.MEDIA && (
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        {(slide.content as SlideContentMedia).url && (slide.content as SlideContentMedia).mediaType === 'image' ? (
                                            <img 
                                                src={(slide.content as SlideContentMedia).url} 
                                                alt="Media Preview" 
                                                className="w-full h-full object-cover rounded opacity-40 absolute inset-0"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded z-10">
                                            {(slide.content as SlideContentMedia).mediaType === 'image' && <FileImage className="w-4 h-4 text-blue-400" />}
                                            {(slide.content as SlideContentMedia).mediaType === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                                            {(slide.content as SlideContentMedia).mediaType === 'audio' && <Mic className="w-4 h-4 text-green-400" />}
                                        </div>
                                    </div>
                                )}
                                {slide.type === SlideType.ANNOUNCEMENT && (
                                    <div className="w-full text-center px-1">
                                        <Megaphone className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                        <p className="text-[8px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentAnnouncement).title}
                                        </p>
                                    </div>
                                )}
                                {slide.type === SlideType.GENERIC && (
                                    <div className="w-full text-center px-1">
                                        <Edit3 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                        <p className="text-[8px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentGeneric).title || 'اسلاید طرح'}
                                        </p>
                                    </div>
                                )}
                                {slide.type === SlideType.LIVEDATA && (
                                    <div className="w-full text-center px-1">
                                        <PieChart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                                        <p className="text-[8px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentLiveData).title || 'آمار زنده'}
                                        </p>
                                    </div>
                                )}
                                {slide.type === SlideType.MEETING && (
                                    <div className="w-full text-center px-1">
                                        <PhoneCall className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                                        <p className="text-[8px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentMeeting).subject || 'کنفرانس'}
                                        </p>
                                    </div>
                                )}
                                {slide.type === SlideType.PRAYER && (
                                    <div className="w-full text-center px-1">
                                        <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                                        <p className="text-[8px] text-white/90 font-bold truncate leading-tight font-[Vazirmatn]">
                                            {(slide.content as SlideContentPrayer).title || 'درخواست دعا'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-neutral-700/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Slide type badge indicator */}
                            <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-black/60 text-white/70 z-20">
                                {slide.type}
                            </span>

                            <span className={cn(
                                "text-[9px] font-bold absolute bottom-1 left-1.5 z-20 font-sans px-1 bg-black/45 rounded-sm",
                                activeSlideIndex === originalIndex ? "text-primary text-white" : "text-white/80"
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
