"use client";

import React, { useEffect, useState } from "react";
import { 
    Slide, SlideType, 
    SlideContentScripture, SlideContentLyrics, SlideContentMedia, 
    SlideContentAnnouncement, SlideContentGeneric, SlideContentLiveData, SlideContentMeeting, ScriptureReferenceItem
} from "@/types/broadcast";
import { cn } from "@/lib/utils";
import { Megaphone, MapPin, Calendar, Clock, BarChart3, PieChart, LineChart, CheckCircle } from "lucide-react";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { LordsPrayerSlide } from "./luxury/LordsPrayerSlide";

const isVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov') || cleanUrl.includes('video');
};

const isNonEmptyText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const SCRIPTURE_LAYOUT = {
    headerPaddingY: 1.5,
    headerPaddingX: 2,
    columnPaddingY: 0.8,
    columnPaddingX: 2,
    rowGap: 0.8,
    cellPaddingY: 1.2,
    cellPaddingX: 1.5,
    headerBorder: 0.12,
    columnBorder: 0.08,
} as const;

const SCRIPTURE_COLUMNS = {
    fa: { label: 'فارسی', dir: 'rtl' as const },
    en: { label: 'English', dir: 'ltr' as const },
} as const;

const renderWavyPaperFilter = (id: string, scale: number, seed: number) => (
    <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <filter id={id}>
            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={scale} />
        </filter>
    </svg>
);

const getScriptureColumnOrder = (primaryLanguage: 'en' | 'fa') => (
    primaryLanguage === 'en'
        ? [SCRIPTURE_COLUMNS.en, SCRIPTURE_COLUMNS.fa]
        : [SCRIPTURE_COLUMNS.fa, SCRIPTURE_COLUMNS.en]
);

type VerseBadgeSize = 'sm' | 'md';

const VerseNumberBadge = ({
    children,
    size = 'md',
    isWavyPaper = false,
}: {
    children: React.ReactNode;
    size?: VerseBadgeSize;
    isWavyPaper?: boolean;
}) => {
    const sizeMap: Record<VerseBadgeSize, { fontSize: string; minWidth: string; height: string; lineHeight: string; radius: string }> = {
        sm: { fontSize: '1.3rem', minWidth: '2.25rem', height: '2.25rem', lineHeight: '2.25rem', radius: '0.45rem' },
        md: { fontSize: '1.8rem', minWidth: '3rem', height: '3rem', lineHeight: '3rem', radius: '0.6rem' },
    };

    return (
        <span
            className="shrink-0 font-black text-center inline-flex items-center justify-center tabular-nums"
            style={{
                fontSize: sizeMap[size].fontSize,
                minWidth: sizeMap[size].minWidth,
                height: sizeMap[size].height,
                lineHeight: sizeMap[size].lineHeight,
                borderRadius: sizeMap[size].radius,
                background: isWavyPaper ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.2)',
                color: '#fbbf24',
                border: isWavyPaper ? '1px solid rgba(251,191,36,0.28)' : '1px solid rgba(251,191,36,0.35)',
            }}
        >
            {children}
        </span>
    );
};

const StickyScriptureHeader = ({ children, tone, isWavyPaper = false }: { children: React.ReactNode; tone: 'emerald' | 'blue'; isWavyPaper?: boolean }) => (
    <h4
        className={`sticky top-0 z-20 inline-flex items-center rounded-full px-3 py-1.5 backdrop-blur-sm font-black shadow-sm ${
            isWavyPaper 
                ? (tone === 'emerald' ? 'text-[#8a4d0f] bg-[#fffef0]/80 font-[Vazirmatn]' : 'text-[#8a4d0f] bg-[#fffef0]/80') 
                : (tone === 'emerald' ? 'text-emerald-400 bg-slate-950/70 font-[Vazirmatn]' : 'text-blue-400 bg-slate-950/70')
        }`}
        style={{ fontSize: '1.9rem', marginBottom: '0.7rem' }}
    >
        {children}
    </h4>
);

interface SlideRendererProps {
    slide: Slide | undefined;
    className?: string;
    isRemotePreview?: boolean;
    previewZoom?: number;
    previewMode?: 'fit' | 'fixed';
    internalPageIndex?: number;
    isTransparent?: boolean;
    activeScriptureReference?: ScriptureReferenceItem | null;
    scripturePopupScale?: number;
    onCloseActiveReference?: () => void;
    onUpdatePopupScale?: (scale: number) => void;
    lyricsVisibility?: {
        showPersian: boolean;
        showFinglish: boolean;
        showEnglish: boolean;
    };
}

export function SlideRenderer({
    slide,
    className,
    isRemotePreview = false,
    previewZoom = 1,
    internalPageIndex = 0,
    isTransparent = false,
    activeScriptureReference: propActiveReference,
    scripturePopupScale: propPopupScale,
    onCloseActiveReference,
    onUpdatePopupScale,
    lyricsVisibility: propLyricsVisibility
}: SlideRendererProps) {
    const storeActiveReference = useBroadcastStore(state => state.activeScriptureReference);
    const storePopupScale = useBroadcastStore(state => state.scripturePopupScale);
    const setStoreActiveReference = useBroadcastStore(state => state.setActiveScriptureReference);
    const setStorePopupScale = useBroadcastStore(state => state.setScripturePopupScale);

    // Fallbacks
    const activeReference = propActiveReference !== undefined ? propActiveReference : storeActiveReference;
    const setActiveReference = (ref: ScriptureReferenceItem | null) => {
        if (onCloseActiveReference) {
            onCloseActiveReference();
        } else {
            setStoreActiveReference(ref);
        }
    };

    const popupScale = propPopupScale !== undefined ? propPopupScale : storePopupScale;
    const setPopupScale = (scale: number) => {
        if (onUpdatePopupScale) {
            onUpdatePopupScale(scale);
        } else {
            setStorePopupScale(scale);
        }
    };

    const slideZoom = Number.isFinite(slide?.zoom || 1) ? Math.max(0.5, Math.min(slide?.zoom || 1, 2.5)) : 1;
    const safeZoom = Number.isFinite(previewZoom) ? Math.max(0.25, Math.min(previewZoom, 3)) : 1;

    const containerRef = React.useRef<HTMLDivElement>(null);
    const faScrollRef = React.useRef<HTMLDivElement>(null);
    const enScrollRef = React.useRef<HTMLDivElement>(null);
    const activeLineRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [internalPageIndex, slide?.id]);

    // Scrolling logic
    const handleScrollFa = (e: React.UIEvent<HTMLDivElement>) => {
        if (isRemotePreview) return;
        const target = e.target as HTMLDivElement;
        const pct = target.scrollTop / (target.scrollHeight - target.clientHeight) || 0;

        if (typeof window !== 'undefined') {
            const bc = new BroadcastChannel(`broadcast-console-${useBroadcastStore.getState().sessionId}`);
            bc.postMessage({
                type: 'popup_scroll_sync',
                payload: { column: 'fa', pct }
            });
            bc.close();
        }
    };

    const handleScrollEn = (e: React.UIEvent<HTMLDivElement>) => {
        if (isRemotePreview) return;
        const target = e.target as HTMLDivElement;
        const pct = target.scrollTop / (target.scrollHeight - target.clientHeight) || 0;

        if (typeof window !== 'undefined') {
            const bc = new BroadcastChannel(`broadcast-console-${useBroadcastStore.getState().sessionId}`);
            bc.postMessage({
                type: 'popup_scroll_sync',
                payload: { column: 'en', pct }
            });
            bc.close();
        }
    };

    useEffect(() => {
        if (!isRemotePreview) return;

        const handleSync = (e: Event) => {
            const { column, pct } = (e as CustomEvent).detail;
            const container = column === 'fa' ? faScrollRef.current : enScrollRef.current;
            if (container) {
                const targetScroll = pct * (container.scrollHeight - container.clientHeight);
                container.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        };

        window.addEventListener('popup_scroll_sync', handleSync);
        return () => window.removeEventListener('popup_scroll_sync', handleSync);
    }, [isRemotePreview]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateScale = (width: number, height: number) => {
            const scaleX = width / 1920;
            const scaleY = height / 1080;
            const newScale = Math.min(scaleX, scaleY);
            container.style.setProperty("--slide-scale", String(newScale));
        };

        // Set initial scale to avoid flicker
        const rect = container.getBoundingClientRect();
        if (rect.width && rect.height) {
            updateScale(rect.width, rect.height);
        } else {
            container.style.setProperty("--slide-scale", "1");
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width || entry.target.getBoundingClientRect().width || 1920;
                const height = entry.contentRect.height || entry.target.getBoundingClientRect().height || 1080;
                updateScale(width, height);
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setActiveReference(null);
    }, [slide?.id]);

    if (!slide) {
        return (
            <div className={cn("w-full h-full flex flex-col items-center justify-center bg-black text-white/30", className)}>
                <div className="text-6xl mb-4">🖥️</div>
                <div className="text-xl font-bold font-[Vazirmatn]">هیچ اسلایدی انتخاب نشده</div>
            </div>
        );
    }

    // Common background utility
    const renderBackground = (bgConfig: any) => {
        if (isTransparent) return null;
        if (!bgConfig) return <div className="absolute inset-0 bg-black -z-10" />;
        
        switch (bgConfig.type) {
            case 'color':
                return <div className="absolute inset-0 -z-10" style={{ backgroundColor: bgConfig.value, opacity: (bgConfig.opacity || 100) / 100 }} />;
            case 'gradient':
                return <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900 via-black to-blue-900" style={{ opacity: (bgConfig.opacity || 100) / 100 }} />;
            case 'image':
                return (
                    <div 
                        className="absolute inset-0 -z-10 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${bgConfig.value})`, opacity: (bgConfig.opacity || 100) / 100 }} 
                    />
                );
            case 'video':
                return (
                    <video 
                        key={bgConfig.value}
                        crossOrigin="anonymous"
                        className="absolute inset-0 w-full h-full object-cover -z-10" 
                        autoPlay loop muted playsInline 
                        style={{ opacity: (bgConfig.opacity || 100) / 100 }}
                    >
                        <source src={bgConfig.value} type="video/mp4" />
                    </video>
                );
            case 'wavyPaper': {
                const line = (bgConfig.value || 'Sample text / نمونه متن').trim() || 'Sample text / نمونه متن';
                const lines = Array.from({ length: 4 }, () => line);
                return (
                    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#fffef0]">
                        {renderWavyPaperFilter('wavy2', 15, 1)}
                        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:4px_4px]" />
                        <div className="relative h-full w-full p-10 space-y-5 text-[#41290e]">
                            {lines.map((item, idx) => (
                                <blockquote
                                    key={idx}
                                    className="relative rounded-md p-4 leading-tight bg-[#fffef0] shadow-[2px_3px_10px_rgba(0,0,0,0.45),inset_0_0_30px_#8a4d0f]"
                                    style={{ filter: 'url(#wavy2)' }}
                                >
                                    <p className="relative z-10 text-sm md:text-base">{item}</p>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                );
            }
            default:
                return <div className="absolute inset-0 bg-black -z-10" />;
        }
    };

    const renderContent = () => {
        switch (slide.type) {
            case SlideType.LYRICS: {
                const content = slide.content as SlideContentLyrics;
                const opts = content.displayOptions;
                const showFa = propLyricsVisibility ? propLyricsVisibility.showPersian : (opts?.showFarsiLyrics !== false);
                const showEn = propLyricsVisibility ? propLyricsVisibility.showEnglish : (opts?.showEnglishLyrics !== false);
                const showFinglish = propLyricsVisibility ? propLyricsVisibility.showFinglish : (opts?.showFinglish !== false);
                const lineCount = content.lines.length;
                // Auto-fit: base font size decreases as line count grows so all lines fit 1080px
                // slideZoom (0.5–2.5) lets user override the auto-fit on a per-slide basis
                const baseFontRem = lineCount <= 2 ? 4.5
                    : lineCount <= 4 ? 3.75
                    : lineCount <= 6 ? 3.0
                    : lineCount <= 9 ? 2.25
                    : 1.75;
                const fontRem = baseFontRem * slideZoom;
                const finglishRem = (fontRem * 0.55);
                const englishRem = (fontRem * 0.75);

                return (
                    <div className="w-full h-full flex flex-col items-center justify-start p-12 text-center relative overflow-y-auto">
                        {/* Dynamic Background */}
                        {opts?.showBackground !== false && !isTransparent && (
                            <div className="absolute inset-0 -z-10 overflow-hidden">
                                {opts?.backgroundUrl && isVideoUrl(opts.backgroundUrl) ? (
                                    <video
                                        key={opts.backgroundUrl}
                                        src={opts.backgroundUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover scale-105"
                                        style={{ opacity: opts.backgroundOpacity ? opts.backgroundOpacity / 100 : 0.6 }}
                                    />
                                ) : opts?.backgroundType === 'image' && opts.backgroundUrl ? (
                                    <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${opts.backgroundUrl})`, opacity: opts.backgroundOpacity ? opts.backgroundOpacity / 100 : 0.6 }} />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-black" />
                                )}
                                {/* Standard overlay and vignette for readability */}
                                <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 via-black/20 to-black/80" />
                            </div>
                        )}
                        
                        <div className={`space-y-6 z-10 w-full max-w-[90%] py-24 pb-48 ${opts?.textShadow ? 'drop-shadow-2xl' : ''}`}>
                            {content.lines.map((line, idx) => {
                                const isActive = idx === internalPageIndex;
                                return (
                                    <div 
                                        key={idx} 
                                        ref={isActive ? activeLineRef : null}
                                        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                                            isActive ? 'scale-105 opacity-100 bg-white/5 border border-white/10 rounded-2xl p-4' : 'opacity-25 scale-95'
                                        }`}
                                    >
                                        {line.text && (
                                            <p
                                                className={`font-bold font-[Vazirmatn] leading-snug w-full transition-colors ${
                                                    isActive ? 'text-cyan-300' : 'text-white'
                                                }`}
                                                dir="rtl"
                                                style={{ fontSize: `${fontRem}rem`, wordBreak: 'break-word' }}
                                            >
                                                {line.text}
                                            </p>
                                        )}
                                        {showFa && content.persianTranslationLines && content.persianTranslationLines[idx] && content.persianTranslationLines[idx] !== line.text && (
                                            <p
                                                className={`font-medium font-[Vazirmatn] leading-snug w-full transition-colors opacity-90 ${
                                                    isActive ? 'text-emerald-300' : 'text-emerald-300/60'
                                                }`}
                                                dir="rtl"
                                                style={{ fontSize: `${fontRem * 0.7}rem`, wordBreak: 'break-word' }}
                                            >
                                                {content.persianTranslationLines[idx]}
                                            </p>
                                        )}
                                        {showFinglish && content.finglishLines && content.finglishLines[idx] && (
                                            <p
                                                className={`font-medium tracking-wide w-full transition-colors ${
                                                    isActive ? 'text-yellow-300' : 'text-yellow-300/60'
                                                }`}
                                                style={{ fontSize: `${finglishRem}rem` }}
                                            >
                                                {content.finglishLines[idx]}
                                            </p>
                                        )}
                                        {showEn && content.lyricsEnLines && content.lyricsEnLines[idx] && (
                                            <p
                                                className={`font-serif opacity-90 w-full transition-colors ${
                                                    isActive ? 'text-white' : 'text-blue-200'
                                                }`}
                                                style={{ fontSize: `${englishRem}rem` }}
                                            >
                                                {content.lyricsEnLines[idx]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {opts?.showTitle !== false && (
                            <div className="absolute bottom-12 left-12 text-left z-10 glass-strong p-4 border border-white/10 rounded-2xl">
                                <p className="text-white/80 font-bold text-xl">{content.title}</p>
                                {opts?.showArtist !== false && (
                                    <p className="text-white/50 text-sm mt-1">Iran Church DC Worship</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            }

            case SlideType.SCRIPTURE: {
                const content = slide.content as SlideContentScripture;
                const page = content.pages[internalPageIndex] || content.pages[0];
                if (!page) return null;

                const references = page.referenceItems || [];
                const renderMissingVerseMarker = (isRtl: boolean) => (
                    <span className={`text-rose-400 font-bold uppercase tracking-wider ${isRtl ? 'font-[Vazirmatn]' : ''}`} style={{ fontSize: `${1.2 * slideZoom}rem` }}>
                        {isRtl ? 'آیه در این ترجمه موجود نیست' : 'Verse missing in this translation'}
                    </span>
                );
                if (page.displayMode === 'referenceList' && references.length > 0) {
                    const useWavyPaper = page.glassPopupEnabled === true;
                    const columnOrder = getScriptureColumnOrder(page.primaryLanguage || 'fa');
                    const headerPaddingY = SCRIPTURE_LAYOUT.headerPaddingY * slideZoom;
                    const headerPaddingX = SCRIPTURE_LAYOUT.headerPaddingX * slideZoom;
                    const columnPaddingY = SCRIPTURE_LAYOUT.columnPaddingY * slideZoom;
                    const columnPaddingX = SCRIPTURE_LAYOUT.columnPaddingX * slideZoom;
                    const rowGap = SCRIPTURE_LAYOUT.rowGap * slideZoom;
                    const cellPaddingY = SCRIPTURE_LAYOUT.cellPaddingY * slideZoom;
                    const cellPaddingX = SCRIPTURE_LAYOUT.cellPaddingX * slideZoom;
                    const headerBorder = SCRIPTURE_LAYOUT.headerBorder * slideZoom;
                    const columnBorder = SCRIPTURE_LAYOUT.columnBorder * slideZoom;
                    return (
                        <div className={`w-full h-full p-6 md:p-8 lg:p-10 relative overflow-hidden ${useWavyPaper ? 'bg-[#fffef0]' : 'bg-slate-950'}`}>
                            {useWavyPaper ? (
                                <>
                                    {renderWavyPaperFilter('wavyRefBg', 12, 2)}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:4px_4px] -z-10" />
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_rgba(2,6,23,0.9))] -z-10" />
                            )}

                            <div
                                className={`h-full min-h-0 rounded-3xl flex flex-col gap-0 overflow-hidden ${useWavyPaper ? 'border border-[#8a4d0f]/40 bg-[#fffef0]/90 shadow-[2px_3px_10px_rgba(0,0,0,0.25),inset_0_0_30px_#8a4d0f]' : 'border border-indigo-500/20 bg-black/30 backdrop-blur-sm'}`}
                            >
                                {!activeReference ? (
                                    <>
                                        {/* Header */}
                                        <div className="shrink-0 flex items-center justify-between" style={{ padding: `${headerPaddingY}rem ${headerPaddingX}rem`, borderBottom: `${headerBorder}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.25)' : 'rgba(99,102,241,0.25)'}` }}>
                                            <h2 className={`font-black leading-tight font-[Vazirmatn] ${useWavyPaper ? 'text-[#41290e]' : 'text-indigo-300'}`} style={{ fontFamily: 'var(--font-vazirmatn)', fontSize: `${3 * slideZoom}rem` }}>فهرست آیات انتخابی</h2>
                                            <span style={{ fontFamily: 'var(--font-vazirmatn)', fontSize: `${1.5 * slideZoom}rem`, padding: `${0.4 * slideZoom}rem ${1 * slideZoom}rem`, borderRadius: `${999 * slideZoom}rem` }} className={`font-bold font-[Vazirmatn] ${useWavyPaper ? 'bg-[#8a4d0f]/15 text-[#41290e]' : 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40'}`}>
                                                {references.length} آیه
                                            </span>
                                        </div>

                                        {/* Column Labels */}
                                        <div className="shrink-0 grid grid-cols-2" style={{ padding: `${columnPaddingY}rem ${columnPaddingX}rem`, borderBottom: `${columnBorder}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.15)' : 'rgba(99,102,241,0.15)'}` }}>
                                            {columnOrder.map((column) => (
                                                <div
                                                    key={column.dir}
                                                    dir={column.dir}
                                                    className={`text-${column.dir === 'rtl' ? 'right' : 'left'} font-semibold ${useWavyPaper ? 'text-[#8a4d0f]' : 'text-slate-400'} ${column.dir === 'rtl' ? 'font-[Vazirmatn]' : ''}`}
                                                    style={{ fontFamily: column.dir === 'rtl' ? 'var(--font-vazirmatn)' : 'var(--font-inter)', fontSize: `${1.6 * slideZoom}rem` }}
                                                >
                                                    {column.label}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Reference Rows */}
                                        <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: `${rowGap}rem`, display: 'flex', flexDirection: 'column', gap: `${rowGap}rem` }}>
                                            {references.map((ref, idx) => (
                                                <button
                                                    key={ref.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        console.log(`[SlideRenderer] Coordinate clicked:`, ref);
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveReference(ref);
                                                    }}
                                                    title={`${ref.bookName.fa} ${ref.chapter}:${ref.verses}`}
                                                    className={`w-full grid grid-cols-2 transition-all ${useWavyPaper ? 'border border-[#8a4d0f]/25 bg-[#fffef0] hover:bg-[#f6eed9]' : 'border border-slate-700/60 bg-slate-900/60 hover:bg-indigo-500/10 hover:border-indigo-500/50'}`}
                                                    style={{ borderRadius: `${1.2 * slideZoom}rem`, overflow: 'hidden' }}
                                                >
                                                    {/* Farsi half element render function */}
                                                    {(() => {
                                                        const faHalf = (
                                                            <div
                                                                dir="rtl"
                                                                className={`flex items-center gap-0 ${useWavyPaper ? (page.primaryLanguage === 'en' ? 'border-l border-[#8a4d0f]/15' : 'border-l border-[#8a4d0f]/15') : (page.primaryLanguage === 'en' ? 'border-l border-slate-700/40' : 'border-l border-slate-700/40')}`}
                                                                style={{ padding: `${cellPaddingY}rem ${cellPaddingX}rem`, fontFamily: 'var(--font-vazirmatn)' }}
                                                            >
                                                                {/* Row badge */}
                                                                <span
                                                                    className="shrink-0 font-black text-center"
                                                                    style={{
                                                                        fontSize: `${1.8 * slideZoom}rem`,
                                                                        minWidth: `${3 * slideZoom}rem`,
                                                                        height: `${3 * slideZoom}rem`,
                                                                        lineHeight: `${3 * slideZoom}rem`,
                                                                        borderRadius: `${0.6 * slideZoom}rem`,
                                                                        marginLeft: `${1 * slideZoom}rem`,
                                                                        background: 'rgba(251,191,36,0.2)',
                                                                        color: '#fbbf24',
                                                                        border: '1px solid rgba(251,191,36,0.35)',
                                                                    }}
                                                                >{idx + 1}</span>
                                                                {/* Book name */}
                                                                <span
                                                                    className={`font-bold leading-snug font-[Vazirmatn] ${useWavyPaper ? 'text-[#41290e]' : 'text-white'}`}
                                                                    style={{ fontSize: `${2.4 * slideZoom}rem`, marginLeft: `${0.5 * slideZoom}rem` }}
                                                                >{ref.bookName.fa}</span>
                                                                {/* Chapter:verse badge */}
                                                                <span
                                                                    className="shrink-0 font-black tabular-nums"
                                                                    style={{
                                                                        fontSize: `${2 * slideZoom}rem`,
                                                                        padding: `${0.2 * slideZoom}rem ${0.7 * slideZoom}rem`,
                                                                        borderRadius: `${0.5 * slideZoom}rem`,
                                                                        marginRight: 'auto',
                                                                        background: useWavyPaper ? 'rgba(138,77,15,0.12)' : 'rgba(34,211,238,0.15)',
                                                                        color: useWavyPaper ? '#8a4d0f' : '#22d3ee',
                                                                        border: useWavyPaper ? '1px solid rgba(138,77,15,0.25)' : '1px solid rgba(34,211,238,0.3)',
                                                                    }}
                                                                >{ref.chapter}:{ref.verses}</span>
                                                            </div>
                                                        );

                                                        const enHalf = (
                                                            <div
                                                                dir="ltr"
                                                                className="flex items-center"
                                                                style={{ padding: `${cellPaddingY}rem ${cellPaddingX}rem`, fontFamily: 'var(--font-inter)' }}
                                                            >
                                                                {/* Row badge */}
                                                                <span
                                                                    className="shrink-0 font-black text-center"
                                                                    style={{
                                                                        fontSize: `${1.8 * slideZoom}rem`,
                                                                        minWidth: `${3 * slideZoom}rem`,
                                                                        height: `${3 * slideZoom}rem`,
                                                                        lineHeight: `${3 * slideZoom}rem`,
                                                                        borderRadius: `${0.6 * slideZoom}rem`,
                                                                        marginRight: `${1 * slideZoom}rem`,
                                                                        background: 'rgba(251,191,36,0.2)',
                                                                        color: '#fbbf24',
                                                                        border: '1px solid rgba(251,191,36,0.35)',
                                                                    }}
                                                                >{idx + 1}</span>
                                                                {/* Book name */}
                                                                <span
                                                                    className={`font-semibold leading-snug ${useWavyPaper ? 'text-[#5e4021]' : 'text-slate-200'}`}
                                                                    style={{ fontSize: `${2 * slideZoom}rem`, marginRight: `${0.5 * slideZoom}rem` }}
                                                                >{ref.bookName.en}</span>
                                                                {/* Chapter:verse badge */}
                                                                <span
                                                                    className="shrink-0 font-black tabular-nums"
                                                                    style={{
                                                                        fontSize: `${1.8 * slideZoom}rem`,
                                                                        padding: `${0.2 * slideZoom}rem ${0.7 * slideZoom}rem`,
                                                                        borderRadius: `${0.5 * slideZoom}rem`,
                                                                        marginLeft: 'auto',
                                                                        background: useWavyPaper ? 'rgba(138,77,15,0.12)' : 'rgba(34,211,238,0.15)',
                                                                        color: useWavyPaper ? '#8a4d0f' : '#22d3ee',
                                                                        border: useWavyPaper ? '1px solid rgba(138,77,15,0.25)' : '1px solid rgba(34,211,238,0.3)',
                                                                    }}
                                                                >{ref.chapter}:{ref.verses}</span>
                                                            </div>
                                                        );

                                                        return page.primaryLanguage === 'en' ? (
                                                            <>
                                                                {enHalf}
                                                                {faHalf}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {faHalf}
                                                                {enHalf}
                                                            </>
                                                        );
                                                    })()}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Integrated Elegant Active Verse Header */}
                                        <div className="shrink-0 flex items-center justify-between" style={{ padding: `${1.2 * slideZoom}rem ${2 * slideZoom}rem`, borderBottom: `${headerBorder}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                                            <div className="flex flex-col gap-0.5">
                                                <h3
                                                    className={`font-black ${useWavyPaper ? 'text-[#41290e]' : 'text-white'}`}
                                                    style={{
                                                        fontSize: `${3 * slideZoom}rem`,
                                                        lineHeight: 1.1,
                                                        fontFamily: activeReference.fontFa || page.fontFa || 'var(--font-vazirmatn)',
                                                    }}
                                                >
                                                    {activeReference.bookName.fa} {activeReference.chapter}:{activeReference.verses}
                                                </h3>
                                                <p
                                                    className={`font-semibold ${useWavyPaper ? 'text-[#8a4d0f]' : 'text-indigo-300'}`}
                                                    style={{
                                                        fontSize: `${1.6 * slideZoom}rem`,
                                                        fontFamily: activeReference.fontEn || page.fontEn || 'var(--font-inter)',
                                                    }}
                                                >
                                                    {activeReference.bookName.en} {activeReference.chapter}:{activeReference.verses}
                                                </p>
                                            </div>

                                            {/* Presenter Controls: Scale & Close */}
                                            <div className="flex items-center gap-3">
                                                {!isRemotePreview && (
                                                    <div className={`flex items-center gap-1 border rounded-2xl p-1 shrink-0 font-[Vazirmatn] ${useWavyPaper ? 'border-[#8a4d0f]/20 bg-[#8a4d0f]/5' : 'border-white/10 bg-white/5'}`} dir="ltr">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setPopupScale(Math.max(0.5, popupScale - 0.1));
                                                            }} 
                                                            className={`hover:text-white transition-all font-black rounded-lg flex items-center justify-center cursor-pointer select-none ${useWavyPaper ? 'text-[#8a4d0f] hover:bg-[#8a4d0f]/15' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                                                            style={{ width: `${2.8 * slideZoom}rem`, height: `${2.8 * slideZoom}rem`, fontSize: `${1.4 * slideZoom}rem` }}
                                                            title="کوچک‌تر کردن متن"
                                                        >
                                                            A-
                                                        </button>
                                                        <span 
                                                            className={`font-bold text-center select-none ${useWavyPaper ? 'text-[#41290e]' : 'text-white'}`}
                                                            style={{ minWidth: `${4 * slideZoom}rem`, fontSize: `${1.4 * slideZoom}rem` }}
                                                        >
                                                            {Math.round(popupScale * 100)}%
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setPopupScale(Math.min(3.0, popupScale + 0.1));
                                                            }} 
                                                            className={`hover:text-white transition-all font-black rounded-lg flex items-center justify-center cursor-pointer select-none ${useWavyPaper ? 'text-[#8a4d0f] hover:bg-[#8a4d0f]/15' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                                                            style={{ width: `${2.8 * slideZoom}rem`, height: `${2.8 * slideZoom}rem`, fontSize: `${1.4 * slideZoom}rem` }}
                                                            title="بزرگ‌تر کردن متن"
                                                        >
                                                            A+
                                                        </button>
                                                    </div>
                                                )}
                                                {!isRemotePreview && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            console.log(`[SlideRenderer] Close clicked`);
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveReference(null);
                                                        }}
                                                        title="بازگشت به فهرست"
                                                        className={`rounded-2xl font-bold transition-all cursor-pointer ${useWavyPaper ? 'bg-[#8a4d0f]/10 hover:bg-[#8a4d0f]/20 text-[#41290e]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                                        style={{ padding: `${0.6 * slideZoom}rem ${1.2 * slideZoom}rem`, fontSize: `${1.6 * slideZoom}rem` }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Body with columns: 78% Active Verse columns + 22% mini sidebar */}
                                        <div className="flex-1 min-h-0 flex overflow-hidden" style={{ gap: 0 }}>
                                            {/* Left Side: Active Verse Columns (78% width) */}
                                            <div className="flex-1 min-h-0 grid grid-cols-2 overflow-hidden" style={{ width: '78%' }}>
                                                {(() => {
                                                    const faSide = (
                                                        <div 
                                                            ref={faScrollRef}
                                                            onScroll={handleScrollFa}
                                                            className="overflow-y-auto" 
                                                            dir="rtl" 
                                                            style={{ 
                                                                padding: `${2 * slideZoom}rem`, 
                                                                borderLeft: page.primaryLanguage !== 'en' ? `${0.1 * slideZoom}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.15)' : 'rgba(99,102,241,0.15)'}` : 'none', 
                                                                fontFamily: activeReference.fontFa || page.fontFa || 'var(--font-vazirmatn)' 
                                                            }}
                                                        >
                                                            <StickyScriptureHeader tone="emerald" isWavyPaper={useWavyPaper}>
                                                                متن فارسی
                                                            </StickyScriptureHeader>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: `${1.2 * slideZoom}rem` }}>
                                                                {activeReference.textFa.map((line, i) => (
                                                                    <p 
                                                                        key={`fa-${i}`} 
                                                                        className={`leading-relaxed font-[Vazirmatn] ${useWavyPaper ? 'text-[#41290e]' : 'text-slate-100'}`} 
                                                                        style={{ fontSize: `${2.8 * slideZoom * popupScale}rem` }}
                                                                    >
                                                                        <VerseNumberBadge size="sm" isWavyPaper={useWavyPaper}>
                                                                            {activeReference.verseNumbers[i] || ''}
                                                                        </VerseNumberBadge>
                                                                        {isNonEmptyText(line) ? line : renderMissingVerseMarker(true)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );

                                                    const enSide = (
                                                        <div 
                                                            ref={enScrollRef}
                                                            onScroll={handleScrollEn}
                                                            className="overflow-y-auto" 
                                                            dir="ltr" 
                                                            style={{ 
                                                                padding: `${2 * slideZoom}rem`, 
                                                                borderRight: page.primaryLanguage === 'en' ? `${0.1 * slideZoom}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.15)' : 'rgba(99,102,241,0.15)'}` : 'none', 
                                                                fontFamily: activeReference.fontEn || page.fontEn || 'var(--font-inter)' 
                                                            }}
                                                        >
                                                            <StickyScriptureHeader tone="blue" isWavyPaper={useWavyPaper}>
                                                                English Text
                                                            </StickyScriptureHeader>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: `${1.2 * slideZoom}rem` }}>
                                                                {activeReference.textEn.map((line, i) => (
                                                                    <p 
                                                                        key={`en-${i}`} 
                                                                        className={`leading-relaxed ${useWavyPaper ? 'text-[#5e4021]' : 'text-slate-200'}`} 
                                                                        style={{ fontSize: `${2.2 * slideZoom * popupScale}rem` }}
                                                                    >
                                                                        <VerseNumberBadge size="sm" isWavyPaper={useWavyPaper}>
                                                                            {activeReference.verseNumbers[i] || ''}
                                                                        </VerseNumberBadge>
                                                                        {isNonEmptyText(line) ? line : renderMissingVerseMarker(false)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );

                                                    return page.primaryLanguage === 'en' ? (
                                                        <>
                                                            {enSide}
                                                            {faSide}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {faSide}
                                                            {enSide}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Right Side: Floating Mini-List Column (22% width) */}
                                            <div 
                                                className={`shrink-0 flex flex-col overflow-hidden relative ${useWavyPaper ? 'bg-[#8a4d0f]/5' : 'bg-slate-950/30'}`} 
                                                style={{ 
                                                    width: '22%', 
                                                    borderLeft: `${0.1 * slideZoom}rem solid ${useWavyPaper ? 'rgba(138,77,15,0.15)' : 'rgba(99,102,241,0.2)'}` 
                                                }}
                                            >
                                                {/* Mini List Header */}
                                                <div className={`p-4 text-right shrink-0 border-b ${useWavyPaper ? 'border-[#8a4d0f]/15' : 'border-indigo-500/15'}`} dir="rtl">
                                                    <h4 className={`font-bold text-[1.4rem] font-[Vazirmatn] ${useWavyPaper ? 'text-[#41290e]' : 'text-indigo-300'}`}>لیست آیات انتخابی</h4>
                                                    <p className={`text-[0.95rem] mt-1 font-[Vazirmatn] ${useWavyPaper ? 'text-[#8a4d0f]' : 'text-slate-400'}`}>
                                                        {isRemotePreview ? 'آیه فعال با رنگ طلایی مشخص است' : 'جهت پخش روی آیه کلیک کنید'}
                                                    </p>
                                                </div>

                                                {/* Mini List Scrollable Area */}
                                                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                                                    {references.map((ref, idx) => {
                                                        const isActive = activeReference.id === ref.id;
                                                        return (
                                                            <button
                                                                key={ref.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setActiveReference(ref);
                                                                }}
                                                                className={`w-full text-right p-3 transition-all rounded-xl border flex flex-col gap-1 ${
                                                                    isActive 
                                                                        ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                                                                        : useWavyPaper 
                                                                            ? 'bg-white/50 border-[#8a4d0f]/15 hover:bg-[#8a4d0f]/10 hover:border-[#8a4d0f]/30' 
                                                                            : 'bg-slate-950/40 border-slate-800/60 hover:bg-indigo-500/5 hover:border-indigo-500/25'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between w-full" dir="rtl">
                                                                    <span className={`font-bold text-[1.2rem] font-[Vazirmatn] flex items-center gap-1.5 ${useWavyPaper ? 'text-[#41290e]' : 'text-white'}`}>
                                                                        {isActive && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
                                                                        {ref.bookName.fa}
                                                                    </span>
                                                                    <span className="text-[0.95rem] font-black text-amber-400 tabular-nums">
                                                                        {ref.chapter}:{ref.verses}
                                                                    </span>
                                                                </div>
                                                                <div className={`text-[0.9rem] font-mono tracking-wider truncate text-left w-full ${useWavyPaper ? 'text-[#8a4d0f]' : 'text-slate-400'}`} dir="ltr">
                                                                    {ref.bookName.en}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={cn("w-full h-full flex flex-col items-center justify-center p-16 relative", isTransparent ? "" : "bg-[url('/bg-dark-texture.jpg')] bg-cover bg-center")}>
                        {!isTransparent && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" />}
                        
                        {/* Reference Badge */}
                        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                            <span className="font-bold font-[Vazirmatn] text-[0.95rem] sm:text-[1.2rem]" style={{ color: 'rgb(251 191 36)' }}>{page.bookName.fa} {page.chapter}:{page.verses}</span>
                        </div>
                        
                        <div className="max-w-6xl w-full text-center space-y-5 sm:space-y-6">
                            <div
                                className="leading-[1.85] font-bold text-white"
                                dir={page.primaryLanguage === 'en' ? 'ltr' : 'rtl'}
                                style={{
                                    fontSize: `${3.1 * slideZoom}rem`,
                                    textShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                    fontFamily: page.primaryLanguage === 'en'
                                        ? (page.fontEn || "var(--font-inter)")
                                        : (page.fontFa || "var(--font-vazirmatn)"),
                                }}
                            >
                                {page.textPrimary.map((verse, idx) => (
                                    <div key={idx} className="flex flex-wrap items-start justify-center gap-2 mb-2 sm:mb-2.5">
                                        <VerseNumberBadge size="md">
                                            {page.verseNumbers?.[idx] || idx + 1}
                                        </VerseNumberBadge>
                                        <span>
                                            {isNonEmptyText(verse) ? verse : renderMissingVerseMarker(page.primaryLanguage !== 'en')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {page.textSecondary && page.textSecondary.length > 0 && (
                                <div
                                    className="leading-[1.75] text-amber-200/80 italic"
                                    dir={page.primaryLanguage === 'en' ? 'rtl' : 'ltr'}
                                    style={{
                                        fontSize: `${1.8 * slideZoom}rem`,
                                        fontFamily: page.primaryLanguage === 'en'
                                            ? (page.fontFa || "var(--font-vazirmatn)")
                                            : (page.fontEn || "var(--font-inter)"),
                                    }}
                                >
                                    {page.textSecondary.map((verse, idx) => (
                                        <div key={idx} className="flex flex-wrap items-start justify-center gap-2 mb-1.5 sm:mb-2">
                                            <VerseNumberBadge size="sm">
                                                {page.verseNumbers?.[idx] || idx + 1}
                                            </VerseNumberBadge>
                                            <span>{isNonEmptyText(verse) ? verse : renderMissingVerseMarker(page.primaryLanguage === 'en')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case SlideType.ANNOUNCEMENT: {
                const content = slide.content as SlideContentAnnouncement;
                return (
                    <div className="w-full h-full flex bg-gradient-to-br from-indigo-950 to-black p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[150px] -z-10" />
                        
                        <div className="flex-1 flex flex-col justify-center max-w-4xl z-10 space-y-8" dir="rtl">
                            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2 rounded-full w-fit">
                                <Megaphone className="w-6 h-6 text-indigo-400" />
                                <span className="text-indigo-200 font-bold tracking-widest text-lg font-[Vazirmatn]">اطلاعیه کلیسا</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl font-black text-white font-[Vazirmatn] leading-tight">
                                {content.title}
                            </h1>
                            
                            {content.content && (
                                <p className="text-3xl text-slate-300 leading-relaxed font-[Vazirmatn] max-w-3xl">
                                    {content.content}
                                </p>
                            )}
                            
                            {content.eventDate && (
                                <div className="flex items-center gap-4 text-2xl text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl w-fit mt-8">
                                    <Calendar className="w-8 h-8" />
                                    <span>تاریخ: {content.eventDate}</span>
                                </div>
                            )}
                        </div>

                        {content.imageUrl && (
                            <div className="flex-1 flex items-center justify-end z-10">
                                <div className="w-[80%] aspect-square rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl relative">
                                    <img src={content.imageUrl} key={content.imageUrl} crossOrigin="anonymous" alt={content.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            case SlideType.MEDIA: {
                const content = slide.content as SlideContentMedia;
                return (
                    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                        {content.mediaType === 'image' && (
                            <img src={content.url} key={content.url} crossOrigin="anonymous" className="w-full h-full object-contain" alt="Media" />
                        )}
                        {content.mediaType === 'video' && (
                            <video key={content.url} src={content.url} crossOrigin="anonymous" className="w-full h-full object-contain" autoPlay={content.isAutoPlay} loop={content.isLoop} muted={isRemotePreview} />
                        )}
                    </div>
                );
            }

            case SlideType.GENERIC: {
                const content = slide.content as SlideContentGeneric;
                return (
                    <div className="w-full h-full flex p-16 relative overflow-hidden font-[Vazirmatn]">
                        {renderBackground(content.background)}
                        
                        <div 
                            className={`w-full h-full flex flex-col z-10 ${content.layout === 'centered' ? 'items-center justify-center text-center' : content.layout === 'split-left' ? 'items-start justify-center w-1/2' : 'items-center justify-center'}`} 
                            dir="rtl"
                            style={{ fontFamily: content.fontFamily || 'var(--font-vazirmatn)' }}
                            dangerouslySetInnerHTML={{ __html: content.htmlContent }} 
                        />
                    </div>
                );
            }

            case SlideType.LIVEDATA: {
                const content = slide.content as SlideContentLiveData;
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-16 relative overflow-hidden">
                        {renderBackground(content.background)}
                        <h1 className="text-6xl font-black text-white font-[Vazirmatn] mb-12 z-10">{content.title}</h1>
                        
                        <div className="flex items-end justify-center gap-8 h-1/2 w-full max-w-5xl z-10 border-b-4 border-white/20 pb-2">
                            {content.data.map((point, idx) => {
                                const maxVal = Math.max(...content.data.map(d => d.value));
                                const heightPct = (point.value / maxVal) * 100;
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-4 flex-1">
                                        {content.showValues && <span className="text-3xl font-bold text-white mb-2">{point.value}</span>}
                                        <div 
                                            className="w-full rounded-t-xl transition-all duration-1000 shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
                                            style={{ backgroundColor: point.color, height: `${heightPct}%` }}
                                        />
                                        <span className="text-2xl font-bold text-white/80 font-[Vazirmatn] mt-4">{point.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            case SlideType.PRAYER: {
                const content = slide.content as any; // SlideContentPrayer
                return (
                    <div className="w-full h-full flex bg-gradient-to-br from-rose-950 to-black p-12 relative overflow-hidden font-[Vazirmatn]">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-600/10 blur-[150px] -z-10" />
                        
                        <div className="flex-1 flex flex-col justify-center max-w-4xl z-10 space-y-8" dir="rtl">
                            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2 rounded-full w-fit">
                                <span className="text-2xl">🙏</span>
                                <span className="text-rose-200 font-bold tracking-widest text-lg">درخواست دعا</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                                {content.title}
                            </h1>
                            
                            <p className="text-3xl text-slate-300 leading-relaxed max-w-3xl border-r-4 border-rose-500/50 pr-6">
                                {content.content}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-8">
                                <div className="text-xl text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-6 py-3 rounded-2xl w-fit">
                                    توسط: {content.userName || 'ناشناس'}
                                </div>
                                {content.isAnswered && (
                                    <div className="text-xl text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl w-fit flex items-center gap-2">
                                        <CheckCircle className="w-6 h-6" /> مستجاب شده
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            case SlideType.LORDS_PRAYER: {
                return <LordsPrayerSlide content={slide.content as any} isActive={true} />;
            }

            default:
                return (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <h1 className="text-4xl text-white">Unsupported Slide Type</h1>
                    </div>
                );
        }
    };

    return (
        <div className={cn("relative w-full h-full overflow-hidden shrink-0", className)}>
            {/* Resolution Scaling Container (Forces 16:9 1080p aspect internally for broadcast accuracy) */}
            <div ref={containerRef} className="absolute inset-0">
                <div 
                    className="absolute"
                    style={{ 
                        width: '1920px', 
                        height: '1080px',
                        left: '50%',
                        top: '50%',
                        // Keep outer frame constrained to parent; zoom is applied inside the frame.
                        transform: 'translate(-50%, -50%) scale(var(--slide-scale, 1))',
                        transformOrigin: 'center center'
                    }}
                >
                    <div className="w-[1920px] h-[1080px] bg-black overflow-hidden relative shadow-2xl">
                        <div
                            className="w-full h-full"
                            style={{
                                transform: `scale(${safeZoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
