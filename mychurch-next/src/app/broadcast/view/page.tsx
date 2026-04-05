"use client";

/**
 * 🎬 Broadcast Viewer Page
 * صفحه نمایش پخش زنده - برای نمایش روی پروژکتور
 * 
 * این صفحه از دو روش برای دریافت داده استفاده می‌کند:
 * 1. BroadcastChannel API - برای ارتباط بین تب‌های همان مرورگر (بدون نیاز به سرور)
 * 2. WebSocket - برای ارتباط بین دستگاه‌های مختلف
 */

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSocketSync } from '@/components/broadcast/hooks/useWebSocketSync';
import { SmartWorshipPlayer } from '@/components/worship/SmartWorshipPlayer';
import AmenBadge from '@/components/broadcast/AmenBadge';
import {
    Slide,
    BroadcastOverlayConfig,
    SlideType,
    SlideContentScripture,
    SlideContentLyrics,
    SlideContentMedia,
    SlideContentAnnouncement
} from '@/types/broadcast';

interface ViewerState {
    currentSlide: Slide | null;
    slideIndex: number;
    internalPageIndex: number;
    config: BroadcastOverlayConfig | null;
    connected: boolean;
    connectionType: 'none' | 'broadcast-channel' | 'websocket';
    audioCurrentTime: number; // زمان جاری صوت برای sync کاراوکه
}

const stripChordMarkers = (text: string): string => {
    if (!text) return '';
    return text.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
};

function ViewerContent() {
    const searchParams = useSearchParams();
    const sessionId = (searchParams && searchParams.get('session')) || 'default';
    const viewerToken = (searchParams && searchParams.get('token')) || '';
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ❌ غیرفعال کردن تمام تعاملات کاربر در صفحه نمایشگر
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target?.closest('[data-allow-interaction="true"]')) {
                return;
            }
            if (!target?.closest('video')) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleKeyDown, { passive: false });
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousedown', handleMouseDown);

        document.body.style.overflow = 'hidden';
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousedown', handleMouseDown);
            document.body.style.overflow = '';
            document.body.style.userSelect = '';
            document.body.style.touchAction = '';
        };
    }, []);

    const [state, setState] = useState<ViewerState>({
        currentSlide: null,
        slideIndex: 0,
        internalPageIndex: 0,
        config: null,
        connected: false,
        connectionType: 'none',
        audioCurrentTime: 0
    });
    const [showGlassPopup, setShowGlassPopup] = useState(false);
    const [tokenState, setTokenState] = useState<"checking" | "valid" | "invalid">("checking");
    const [tokenCheckTimeout, setTokenCheckTimeout] = useState(false);
    const [initialStateTimeout, setInitialStateTimeout] = useState(false);
    const [sessionSlides, setSessionSlides] = useState<Slide[]>([]);
    const slidesRef = useRef<Slide[]>([]);

    useEffect(() => {
        slidesRef.current = sessionSlides;
    }, [sessionSlides]);

    useEffect(() => {
        let isMounted = true;
        const timeoutId = window.setTimeout(() => {
            if (isMounted) {
                setTokenCheckTimeout(true);
                setTokenState("invalid");
            }
        }, 8000);

        const validateToken = async () => {
            if (!viewerToken) {
                if (isMounted) setTokenState("invalid");
                return;
            }

            try {
                const res = await fetch(
                    `/api/broadcast/viewer-token?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(viewerToken)}`,
                    { cache: 'no-store' }
                );
                if (!isMounted) return;
                clearTimeout(timeoutId);
                setTokenState(res.ok ? "valid" : "invalid");
            } catch {
                if (isMounted) setTokenState("invalid");
            }
        };

        void validateToken();
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [sessionId, viewerToken]);

    useEffect(() => {
        setInitialStateTimeout(false);
        if (tokenState !== "valid") return;
        if (state.connected || state.currentSlide) return;

        const timeoutId = window.setTimeout(() => {
            setInitialStateTimeout(true);
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [tokenState, state.connected, state.currentSlide, sessionId]);

    useEffect(() => {
        setShowGlassPopup(false);
    }, [state.slideIndex, state.internalPageIndex]);

    useEffect(() => {
        if (tokenState !== "valid") return;
        let isMounted = true;

        const loadSessionSlides = async () => {
            try {
                const res = await fetch(
                    `/api/broadcast/viewer-session?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(viewerToken)}`,
                    { cache: 'no-store' }
                );
                if (!res.ok) return;

                const data = await res.json();
                if (!isMounted || !Array.isArray(data?.slides)) return;
                setSessionSlides(data.slides as Slide[]);
            } catch {
                // Viewer can still run via BroadcastChannel in same-browser mode.
            }
        };

        void loadSessionSlides();
        return () => {
            isMounted = false;
        };
    }, [tokenState, sessionId, viewerToken]);

    // WebSocket sync (for cross-device communication)
    const { state: syncState } = useWebSocketSync({
        sessionId: tokenState === "valid" ? sessionId : undefined,
        isLeader: false,
        onSlideChange: (index) => {
            const fromSession = slidesRef.current[index] || null;
            setState(prev => ({
                ...prev,
                currentSlide: fromSession,
                slideIndex: index,
                internalPageIndex: 0,
                connected: true,
                connectionType: prev.connectionType === 'broadcast-channel' ? prev.connectionType : 'websocket'
            }));
        }
    });

    useEffect(() => {
        if (!sessionSlides.length) return;
        if (state.currentSlide) return;

        const fromSession = sessionSlides[state.slideIndex] || null;
        if (!fromSession) return;

        setState(prev => ({
            ...prev,
            currentSlide: fromSession
        }));
    }, [sessionSlides, state.slideIndex, state.currentSlide]);

    // BroadcastChannel for same-browser communication (more reliable for local use)
    useEffect(() => {
        if (tokenState !== "valid") return;

        const channelName = `broadcast-console-${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        broadcastChannelRef.current = channel;

        console.log('📺 Viewer: BroadcastChannel connected to:', channelName);

        channel.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === 'slide_change' && msg.payload) {
                setState(prev => ({
                    ...prev,
                    currentSlide: msg.payload.slide,
                    slideIndex: msg.payload.index,
                    internalPageIndex: msg.payload.internalPageIndex || 0,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'overlay_toggle' && msg.payload) {
                setState(prev => ({
                    ...prev,
                    config: msg.payload,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'full_state' && msg.payload) {
                setState(prev => ({
                    ...prev,
                    currentSlide: msg.payload.currentSlide,
                    slideIndex: msg.payload.slideIndex,
                    internalPageIndex: msg.payload.internalPageIndex || 0,
                    config: msg.payload.config,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'scroll_sync' && msg.payload && scrollContainerRef.current) {
                const { scrollPercentage } = msg.payload;
                const container = scrollContainerRef.current;
                const targetScroll = scrollPercentage * (container.scrollHeight - container.clientHeight);
                container.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }

            if (msg.type === 'audio_sync' && msg.payload) {
                setState(prev => ({
                    ...prev,
                    audioCurrentTime: msg.payload.currentTime
                }));
            }
        };

        channel.postMessage({ type: 'viewer_ready', payload: { sessionId } });

        return () => {
            channel.close();
        };
    }, [sessionId, tokenState]);

    // Response to WebSocket sync state change
    useEffect(() => {
        if (syncState.isConnected) {
            setState(prev => ({
                ...prev,
                connected: true,
                connectionType: prev.connectionType === 'none' ? 'websocket' : prev.connectionType
            }));
        }
    }, [syncState.isConnected]);

    const renderSlideContent = () => {
        if (!state.currentSlide) {
            return (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                    <div className="text-center animate-pulse">
                        <div className="text-8xl mb-8">🎬</div>
                        <h2 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 font-[Vazirmatn]">
                            منتظر شروع پخش...
                        </h2>
                        <p className="text-3xl text-gray-300 mb-6">
                            Waiting for broadcast to start...
                        </p>
                        {!state.connected && (
                            <div className="mt-8 text-yellow-300 text-2xl flex items-center justify-center gap-3 font-[Vazirmatn]">
                                <div className="w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
                                در حال اتصال به کنسول...
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const slide = state.currentSlide;

        if (slide.type === SlideType.SCRIPTURE) {
            const scriptureContent = slide.content as SlideContentScripture;
            const currentPage = scriptureContent.pages?.[state.internalPageIndex] || scriptureContent.pages?.[0];

            if (!currentPage) return null;

            const hasFarsiArray = Array.isArray(currentPage.textPrimary) && currentPage.textPrimary.length > 0;
            const hasEnglishArray = Array.isArray(currentPage.textSecondary) && currentPage.textSecondary.length > 0;
            const englishVerses = hasEnglishArray ? currentPage.textSecondary as string[] : [];
            const farsiVerses = hasFarsiArray ? currentPage.textPrimary as string[] : [];
            const maxVerses = Math.max(englishVerses.length, farsiVerses.length);

            const faTranslationNames: Record<string, string> = {
                mojdeh: 'مژده',
                qadim: 'قدیم',
                tafsiri: 'تفسیری'
            };
            const enTranslationNames: Record<string, string> = {
                kjv: 'KJV',
                asv: 'ASV',
                net: 'NET'
            };

            const faTransName = faTranslationNames[currentPage.translation || 'mojdeh'] || 'مژده';
            const enTransName = enTranslationNames[currentPage.enTranslation || 'asv'] || 'ASV';
            const scripturePopupEnabled = currentPage.glassPopupEnabled !== false;
            const scripturePopupTitleFa = currentPage.popupLabelFa || `${currentPage.bookName.fa} ${currentPage.chapter}:${currentPage.verses}`;
            const scripturePopupTitleEn = currentPage.popupLabelEn || `${currentPage.bookName.en} ${currentPage.chapter}:${currentPage.verses}`;

            return (
                <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent pointer-events-none"></div>
                    {scripturePopupEnabled && (
                        <button
                            data-allow-interaction="true"
                            onClick={() => setShowGlassPopup(prev => !prev)}
                            className="absolute top-5 right-5 z-[70] px-4 py-2 rounded-xl bg-white/15 border border-white/30 text-white text-sm backdrop-blur-md hover:bg-white/25 transition font-[Vazirmatn]"
                        >
                            {showGlassPopup ? '✕ بستن / Close' : '📖 آیات / Verses'}
                        </button>
                    )}

                    <div className="flex-shrink-0 flex flex-row gap-4 px-6 pt-4" dir="ltr">
                        {hasEnglishArray && (
                            <div className="flex-1 bg-gradient-to-br from-slate-800/80 to-purple-900/30 rounded-t-xl px-6 py-4 border-b-2 border-purple-500/50">
                                <div className="text-center">
                                    <h3 className="text-3xl font-bold text-purple-300">
                                        📖 {currentPage?.bookName?.en || 'Book'}
                                    </h3>
                                    <div className="flex items-center justify-center gap-4 mt-2 text-xl">
                                        <span className="bg-purple-600/40 px-3 py-1 rounded text-purple-200">
                                            {enTransName}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-purple-200">Chapter {currentPage?.chapter}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-purple-200">Verses {currentPage?.verses}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {hasFarsiArray && (
                            <div className="flex-1 bg-gradient-to-bl from-amber-900/50 to-slate-800/80 rounded-t-xl px-6 py-4 border-b-2 border-amber-500/50">
                                <div className="text-center" dir="rtl">
                                    <h3 className="text-3xl font-bold text-amber-300 font-[Vazirmatn]">
                                        📖 {currentPage?.bookName?.fa || 'کتاب'}
                                    </h3>
                                    <div className="flex items-center justify-center gap-4 mt-2 text-xl font-[Vazirmatn]">
                                        <span className="bg-amber-600/40 px-3 py-1 rounded text-amber-200">{faTransName}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-amber-200">فصل {currentPage?.chapter}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-amber-200">آیات {currentPage?.verses}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={scrollContainerRef} className="flex-1 overflow-auto px-6 pb-4">
                        <div className="space-y-4">
                            {Array.from({ length: maxVerses }).map((_, idx) => {
                                const englishVerse = englishVerses[idx] || '';
                                const farsiVerse = farsiVerses[idx] || '';
                                const verseNum = currentPage?.verseNumbers?.[idx] || (idx + 1);

                                if ((!englishVerse || englishVerse.trim() === '') && (!farsiVerse || farsiVerse.trim() === '')) {
                                    return null;
                                }

                                return (
                                    <div key={idx} className="flex flex-row gap-4" dir="ltr">
                                        {hasEnglishArray && (
                                            <div className="flex-1 bg-slate-800/50 rounded-lg p-4" dir="ltr">
                                                <div className="flex gap-3 items-start">
                                                    <span className="text-2xl font-bold text-purple-400 min-w-[40px] text-right" style={{ textShadow: '0 0 15px rgba(216, 180, 254, 0.6)' }}>
                                                        {verseNum}
                                                    </span>
                                                    <p className="text-2xl text-slate-200 leading-relaxed flex-1" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                                                        {englishVerse || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {hasFarsiArray && (
                                            <div className="flex-1 bg-amber-900/30 rounded-lg p-4" dir="rtl">
                                                <div className="flex gap-3 items-start">
                                                    <span className="text-2xl font-bold text-amber-400 min-w-[40px] text-right" style={{ textShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}>
                                                        {verseNum}
                                                    </span>
                                                    <p className="text-2xl text-white leading-[1.8] flex-1 text-right font-[Vazirmatn]" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                                                        {farsiVerse || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {scripturePopupEnabled && showGlassPopup && (
                        <div data-allow-interaction="true" className="absolute inset-0 z-[80] bg-black/35 backdrop-blur-sm flex items-center justify-center p-6">
                            <div className="w-full max-w-6xl max-h-[86vh] overflow-auto rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl p-6">
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div className="text-right" dir="rtl">
                                        <h3 className="text-3xl font-bold text-white font-[Vazirmatn]">{scripturePopupTitleFa}</h3>
                                        <p className="text-cyan-200 mt-1 text-lg" dir="ltr">{scripturePopupTitleEn}</p>
                                    </div>
                                    <button data-allow-interaction="true" onClick={() => setShowGlassPopup(false)} className="px-3 py-1 rounded-lg bg-white/15 border border-white/20 text-white hover:bg-white/25">✕</button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {Array.from({ length: maxVerses }).map((_, idx) => {
                                        const englishVerse = englishVerses[idx] || '';
                                        const farsiVerse = farsiVerses[idx] || '';
                                        const verseNum = currentPage?.verseNumbers?.[idx] || (idx + 1);
                                        if (!englishVerse && !farsiVerse) return null;
                                        return (
                                            <React.Fragment key={`popup-${idx}`}>
                                                <div className="rounded-2xl bg-purple-950/35 border border-purple-300/30 p-4" dir="ltr">
                                                    <div className="text-sm text-purple-300 mb-2">{verseNum}</div>
                                                    <p className="text-white/90 text-lg leading-relaxed">{englishVerse}</p>
                                                </div>
                                                <div className="rounded-2xl bg-amber-900/35 border border-amber-300/30 p-4" dir="rtl">
                                                    <div className="text-sm text-amber-300 mb-2">{verseNum}</div>
                                                    <p className="text-white text-xl leading-[1.9] font-[Vazirmatn]">{farsiVerse}</p>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-indigo-600/80 p-4 text-center">
                        <p className="text-white font-semibold text-2xl font-[Vazirmatn]">
                            {currentPage?.bookName?.fa} {currentPage?.chapter}:{currentPage?.verses}
                        </p>
                    </div>
                </div>
            );
        }

        if (slide.type === SlideType.LYRICS) {
            const lyricsContent = slide.content as SlideContentLyrics;
            const lyricsPopupEnabled = lyricsContent.glassPopupEnabled !== false;
            const lyricsPopupTitleFa = lyricsContent.titleFa || lyricsContent.title;
            const lyricsPopupTitleEn = lyricsContent.titleEn || lyricsContent.title;
            const farsiPopupLines = (lyricsContent.lines || []).map(line => stripChordMarkers(line.text)).filter(Boolean);
            const englishPopupLines = (lyricsContent.lyricsEnLines || []).map(line => line.trim()).filter(Boolean);

            if (lyricsContent.timingData && lyricsContent.audioUrl) {
                return (
                    <div className="fixed inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
                        {lyricsPopupEnabled && (
                            <button
                                data-allow-interaction="true"
                                onClick={() => setShowGlassPopup(prev => !prev)}
                                className="absolute top-5 right-5 z-[70] px-4 py-2 rounded-xl bg-white/15 border border-white/30 text-white text-sm backdrop-blur-md hover:bg-white/25 transition font-[Vazirmatn]"
                            >
                                {showGlassPopup ? '✕ بستن / Close' : '🎵 متن دوزبانه / Bilingual'}
                            </button>
                        )}
                        <SmartWorshipPlayer
                            timingData={lyricsContent.timingData}
                            audioSrc={lyricsContent.audioUrl}
                            title={lyricsContent.title}
                            viewOnly={true}
                            externalCurrentTime={state.audioCurrentTime}
                            translations={{
                                finglish: lyricsContent.finglishLines
                            }}
                        />
                        {lyricsPopupEnabled && showGlassPopup && (
                            <div data-allow-interaction="true" className="absolute inset-0 z-[80] bg-black/35 backdrop-blur-sm flex items-center justify-center p-6">
                                <div className="w-full max-w-6xl max-h-[86vh] overflow-auto rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl p-6">
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div className="text-right" dir="rtl">
                                            <h3 className="text-3xl font-bold text-white font-[Vazirmatn]">{lyricsPopupTitleFa}</h3>
                                            <p className="text-cyan-200 mt-1 text-lg" dir="ltr">{lyricsPopupTitleEn}</p>
                                        </div>
                                        <button data-allow-interaction="true" onClick={() => setShowGlassPopup(false)} className="px-3 py-1 rounded-lg bg-white/15 border border-white/20 text-white hover:bg-white/25">✕</button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {farsiPopupLines.map((line, idx) => (
                                            <React.Fragment key={`lyr-popup-t-${idx}`}>
                                                <div className="rounded-2xl bg-purple-950/35 border border-purple-300/30 p-4" dir="ltr">
                                                    <p className="text-white/90 text-lg leading-relaxed">{englishPopupLines[idx] || ''}</p>
                                                </div>
                                                <div className="rounded-2xl bg-amber-900/35 border border-amber-300/30 p-4" dir="rtl">
                                                    <p className="text-white text-xl leading-[1.9] font-[Vazirmatn]">{line}</p>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            let displayLines: Array<{ text: string; isChorus?: boolean }> = [];
            if (lyricsContent.lines?.length > 0) {
                displayLines = lyricsContent.lines.map(line => ({
                    ...line,
                    text: stripChordMarkers(line.text)
                }));
            } else if (lyricsContent.timingData?.lines && Array.isArray(lyricsContent.timingData.lines)) {
                displayLines = lyricsContent.timingData.lines.map((l: any) => ({
                    text: stripChordMarkers(l.line || ''),
                    isChorus: l.label?.toLowerCase().includes('chorus') || false
                }));
            }

            let finglishLines = lyricsContent.finglishLines;
            if (!finglishLines && lyricsContent.timingData?.lines) {
                finglishLines = (lyricsContent.timingData.lines as any[]).map((line: any) => {
                    if (line.words && Array.isArray(line.words)) {
                        return line.words.map((w: any) => w.finglish || '').join(' ').trim();
                    }
                    return '';
                });
            }

            return (
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/20 via-transparent to-transparent animate-pulse"></div>
                    </div>
                    {lyricsPopupEnabled && (
                        <button
                            data-allow-interaction="true"
                            onClick={() => setShowGlassPopup(prev => !prev)}
                            className="absolute top-5 right-5 z-[70] px-4 py-2 rounded-xl bg-white/15 border border-white/30 text-white text-sm backdrop-blur-md hover:bg-white/25 transition font-[Vazirmatn]"
                        >
                            {showGlassPopup ? '✕ بستن / Close' : '🎵 متن دوزبانه / Bilingual'}
                        </button>
                    )}

                    <div className="absolute top-20 left-20 text-white/5 text-8xl animate-bounce pointer-events-none" style={{ animationDuration: '3s' }}>🎵</div>
                    <div className="absolute bottom-20 right-20 text-white/5 text-8xl animate-bounce pointer-events-none" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🎶</div>

                    <div className="relative flex flex-col h-full">
                        <div className="flex-shrink-0 p-6 bg-gradient-to-r from-pink-600/80 via-purple-600/80 to-pink-600/80">
                            <h2 className="text-5xl font-bold text-white text-center drop-shadow-2xl font-[Vazirmatn]" style={{ textShadow: '0 0 40px rgba(236, 72, 153, 0.6)' }}>
                                🎵 {lyricsContent.title}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="text-center max-w-5xl mx-auto space-y-6">
                                {displayLines.map((line: any, idx: number) => (
                                    <div key={idx} className="text-center">
                                        <p className={`text-4xl leading-[1.8] font-bold transition-all duration-300 font-[Vazirmatn] ${line.isChorus ? 'text-yellow-200 scale-105 border-l-4 border-r-4 border-yellow-400/50 px-6 py-2' : 'text-white'}`} style={{ textShadow: line.isChorus ? '0 0 30px rgba(253, 224, 71, 0.6), 0 0 60px rgba(253, 224, 71, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.6)' }}>
                                            {line.text}
                                        </p>
                                        {finglishLines?.[idx] && (
                                            <p className="text-2xl text-cyan-300 mt-2 font-mono tracking-wide" dir="ltr" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
                                                {finglishLines[idx]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (slide.type === SlideType.MEDIA) {
            const mediaContent = slide.content as SlideContentMedia;
            const displayConfig = mediaContent.displayConfig || {
                width: 100,
                height: 100,
                position: 'center',
                objectFit: 'contain',
                borderRadius: 0,
                opacity: 100
            };

            const getPositionStyles = () => {
                const base: React.CSSProperties = {
                    width: `${displayConfig.width}%`,
                    height: `${displayConfig.height}%`,
                    opacity: (displayConfig.opacity || 100) / 100,
                    borderRadius: `${displayConfig.borderRadius || 0}px`,
                    objectFit: (displayConfig.objectFit as any) || 'contain',
                };
                switch (displayConfig.position) {
                    case 'top-left': return { ...base, position: 'absolute' as const, top: '2%', left: '2%' };
                    case 'top-right': return { ...base, position: 'absolute' as const, top: '2%', right: '2%' };
                    case 'bottom-left': return { ...base, position: 'absolute' as const, bottom: '2%', left: '2%' };
                    case 'bottom-right': return { ...base, position: 'absolute' as const, bottom: '2%', right: '2%' };
                    case 'custom': return { ...base, position: 'absolute' as const, left: `${displayConfig.customX || 50}%`, top: `${displayConfig.customY || 50}%`, transform: 'translate(-50%, -50%)' };
                    case 'center':
                    default: return { ...base, position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                }
            };

            return (
                <div className="relative h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
                    <div className="relative h-full">
                        {mediaContent.mediaType === 'image' && <img src={mediaContent.url} alt={mediaContent.title || 'Media'} style={getPositionStyles()} className="shadow-2xl border-2 border-white/10 animate-fadeIn" />}
                        {mediaContent.mediaType === 'video' && <video src={mediaContent.url} controls autoPlay={mediaContent.isAutoPlay} loop={mediaContent.isLoop} style={getPositionStyles()} className="shadow-2xl border-2 border-white/20" />}
                    </div>
                    {mediaContent.title && (
                        <div className="absolute bottom-8 left-0 right-0 text-center">
                            <p className="text-3xl font-bold text-white drop-shadow-lg bg-black/30 backdrop-blur-md py-4 mx-auto max-w-4xl rounded-xl font-[Vazirmatn]">{mediaContent.title}</p>
                        </div>
                    )}
                </div>
            );
        }

        if (slide.type === SlideType.ANNOUNCEMENT) {
            const announcementContent = slide.content as SlideContentAnnouncement;
            return (
                <div className="relative h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent"></div>
                    </div>
                    <div className="relative flex items-center justify-center h-full p-16">
                        <div className="text-center max-w-5xl animate-fadeIn">
                            <div className="mb-8 inline-block px-6 py-3 bg-emerald-500/20 rounded-full border border-emerald-400/30 backdrop-blur-sm">
                                <span className="text-2xl text-emerald-300 font-semibold font-[Vazirmatn]">📢 اعلان مهم</span>
                            </div>
                            <h2 className="text-7xl font-bold text-white mb-12 drop-shadow-2xl leading-tight font-[Vazirmatn]" style={{ textShadow: '0 0 40px rgba(16, 185, 129, 0.5)' }}>{announcementContent.title}</h2>
                            {announcementContent.content && <p className="text-5xl leading-relaxed text-gray-100 mb-12 font-[Vazirmatn]">{announcementContent.content}</p>}
                            {announcementContent.imageUrl && <img src={announcementContent.imageUrl} alt={announcementContent.title} className="relative max-w-2xl rounded-2xl shadow-2xl border-4 border-white/20 mx-auto" />}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div 
            className="w-screen h-screen bg-black overflow-hidden relative select-none" 
            style={{ userSelect: 'none', cursor: 'none', WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {tokenState === "checking" && (
                <div className="absolute inset-0 z-[80] bg-black/90 text-white flex items-center justify-center text-3xl font-[Vazirmatn]">
                    در حال بررسی دسترسی Viewer...
                </div>
            )}
            {tokenState === "invalid" && (
                <div className="absolute inset-0 z-[80] bg-black text-red-400 flex flex-col items-center justify-center gap-4 font-[Vazirmatn]">
                    <div className="text-4xl font-bold">دسترسی نامعتبر</div>
                    <div className="text-xl text-red-300">{tokenCheckTimeout ? 'بررسی دسترسی timeout شد. دوباره لینک جدید بسازید.' : 'لینک Viewer منقضی شده یا معتبر نیست.'}</div>
                </div>
            )}
            {!state.connected && !state.currentSlide && (
                <div className="absolute top-6 left-6 bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-xl z-50 shadow-2xl animate-pulse border-2 border-red-400 font-[Vazirmatn]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <span className="font-bold">⚠️ در انتظار اتصال...</span>
                    </div>
                </div>
            )}
            {tokenState === "valid" && initialStateTimeout && !state.currentSlide && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber-500/95 text-black px-6 py-3 rounded-xl z-50 shadow-2xl border border-amber-200 font-[Vazirmatn]">
                    <div className="font-bold text-lg">اتصال اولیه دریافت نشد</div>
                    <div className="text-sm">کنسول پخش را باز نگه دارید و دوباره Open Presenter را بزنید.</div>
                </div>
            )}
            <div className="w-full h-full">{renderSlideContent()}</div>
            {state.config?.amenBadge && <AmenBadge config={state.config.amenBadge} isEditable={false} />}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
                .animate-slideInUp { animation: slideInUp 0.6s ease-out forwards; opacity: 0; }
            `}</style>
        </div>
    );
}

export default function ProjectorViewPage() {
    return (
        <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
            <ViewerContent />
        </Suspense>
    );
}
