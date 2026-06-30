"use client";

/**
 * 🎬 Broadcast Viewer Page
 * صفحه نمایش پخش زنده - برای نمایش روی پروژکتور
 * 
 * این صفحه از دو روش برای دریافت داده استفاده می‌کند:
 * 1. BroadcastChannel API - برای ارتباط بین تب‌های همان مرورگر (بدون نیاز به سرور)
 * 2. WebSocket - برای ارتباط بین دستگاه‌های مختلف
 */

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useWebSocketSync } from '@/components/broadcast/hooks/useWebSocketSync';
import { SmartWorshipPlayer, getSafeAudioUrl } from '@/components/worship/SmartWorshipPlayer';
import AmenBadge from '@/components/broadcast/AmenBadge';
import { SlideRenderer } from '@/components/broadcast/SlideRenderer';
import {
    Slide,
    BroadcastOverlayConfig,
    SlideType,
    SlideContentLyrics,
} from '@/types/broadcast';

interface ViewerState {
    currentSlide: Slide | null;
    slideIndex: number;
    internalPageIndex: number;
    config: BroadcastOverlayConfig | null;
    connected: boolean;
    connectionType: 'none' | 'broadcast-channel' | 'websocket';
    audioCurrentTime: number; // زمان جاری صوت برای sync کاراوکه
    audioIsPlaying?: boolean; // آیا صوت در حال پخش است؟
    activeScriptureReference?: import('@/types/broadcast').ScriptureReferenceItem | null;
    scripturePopupScale?: number;
    lyricsVisibility?: {
        showPersian: boolean;
        showFinglish: boolean;
        showEnglish: boolean;
    } | null;
    liveTranslationText?: string;
    showLiveTranslation?: boolean;
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

        const handleDblClick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    console.error("[Viewer] Error entering fullscreen:", err);
                });
            } else {
                document.exitFullscreen().catch((err) => {
                    console.error("[Viewer] Error exiting fullscreen:", err);
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown, { passive: false });
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('dblclick', handleDblClick);

        document.body.style.overflow = 'hidden';
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('dblclick', handleDblClick);
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
        audioCurrentTime: 0,
        audioIsPlaying: false,
        activeScriptureReference: null,
        scripturePopupScale: 1.0,
        lyricsVisibility: null,
        liveTranslationText: "",
        showLiveTranslation: false
    });
    const [showGlassPopup, setShowGlassPopup] = useState(false);
    const activeLineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [state.internalPageIndex, state.currentSlide?.id]);
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

    // Stable slide change handler to prevent WebSocket infinite connection loops
    const handleSlideChange = useCallback((index: number) => {
        const fromSession = slidesRef.current[index] || null;
        setState(prev => ({
            ...prev,
            currentSlide: fromSession,
            slideIndex: index,
            internalPageIndex: 0,
            connected: true,
            connectionType: prev.connectionType === 'broadcast-channel' ? prev.connectionType : 'websocket'
        }));
    }, []);

    // WebSocket sync (for cross-device communication)
    const { state: syncState } = useWebSocketSync({
        sessionId: tokenState === "valid" ? sessionId : undefined,
        isLeader: false,
        onSlideChange: handleSlideChange
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

    // Supabase Realtime for cross-device communication (extremely robust and works everywhere)
    useEffect(() => {
        if (tokenState !== "valid" || !sessionId) return;

        const supabase = createClient();
        const channelName = `broadcast-remote-${sessionId}`;
        console.log('📺 Viewer: Supabase Realtime connecting to:', channelName);

        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false }
            }
        });

        channel
            .on('broadcast', { event: 'sync-event' }, (payload) => {
                const msg = payload.payload;
                if (!msg) return;
                console.log('📺 [Viewer Realtime] Received message:', msg);

                if (msg.type === 'SET_SLIDE') {
                    const fromSession = slidesRef.current[msg.slideIndex] || null;
                    setState(prev => ({
                        ...prev,
                        currentSlide: fromSession,
                        slideIndex: msg.slideIndex,
                        internalPageIndex: msg.pageIndex || 0,
                        lyricsVisibility: null,
                        activeScriptureReference: null,
                        connected: true,
                        connectionType: 'websocket' // Treat realtime as cloud-sync
                    }));
                }

                if (msg.type === 'SET_PAGE') {
                    setState(prev => ({
                        ...prev,
                        internalPageIndex: msg.pageIndex,
                        activeScriptureReference: null
                    }));
                }

                if (msg.type === 'SET_ACTIVE_REFERENCE') {
                    setState(prev => ({
                        ...prev,
                        activeScriptureReference: msg.reference
                    }));
                }

                if (msg.type === 'SET_POPUP_SCALE') {
                    setState(prev => ({
                        ...prev,
                        scripturePopupScale: msg.scale
                    }));
                }

                if (msg.type === 'SET_LYRICS_VISIBILITY') {
                    setState(prev => ({
                        ...prev,
                        lyricsVisibility: msg.visibility
                    }));
                }

                if (msg.type === 'SET_LIVE_TRANSLATION') {
                    setState(prev => ({
                        ...prev,
                        liveTranslationText: msg.text,
                        showLiveTranslation: msg.show
                    }));
                }
            })
            .subscribe((status) => {
                console.log(`📺 [Viewer Realtime] Status for ${channelName}:`, status);
            });

        return () => {
            console.log('📺 Viewer: Unsubscribing from Realtime:', channelName);
            channel.unsubscribe();
        };
    }, [tokenState, sessionId]);

    // BroadcastChannel for same-browser communication (more reliable for local use)
    useEffect(() => {
        if (tokenState !== "valid") return;

        const channelName = `broadcast-console-${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        broadcastChannelRef.current = channel;

        console.log('📺 Viewer: BroadcastChannel connected to:', channelName);

        channel.onmessage = (event) => {
            const msg = event.data;
            console.log('📺 [Viewer Channel] Received message type:', msg?.type, 'payload:', msg?.payload);

            if (msg.type === 'slide_change' && msg.payload) {
                console.log('📺 [Viewer Channel] Slide changed to index:', msg.payload.index, 'slide:', msg.payload.slide);
                setState(prev => ({
                    ...prev,
                    currentSlide: msg.payload.slide,
                    slideIndex: msg.payload.index,
                    internalPageIndex: msg.payload.internalPageIndex || 0,
                    lyricsVisibility: null, // Reset overrides upon active slide change
                    activeScriptureReference: null,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'overlay_toggle' && msg.payload) {
                console.log('📺 [Viewer Channel] Overlay toggle:', msg.payload);
                setState(prev => ({
                    ...prev,
                    config: msg.payload,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'lyrics_visibility_sync' && msg.payload) {
                console.log('📺 [Viewer Channel] Lyrics visibility sync:', msg.payload);
                setState(prev => ({
                    ...prev,
                    lyricsVisibility: msg.payload,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'full_state' && msg.payload) {
                console.log('📺 [Viewer Channel] Full state update:', msg.payload);
                setState(prev => ({
                    ...prev,
                    currentSlide: msg.payload.currentSlide,
                    slideIndex: msg.payload.slideIndex,
                    internalPageIndex: msg.payload.internalPageIndex || 0,
                    config: msg.payload.config,
                    activeScriptureReference: msg.payload.activeScriptureReference || null,
                    scripturePopupScale: msg.payload.scripturePopupScale || 1.0,
                    lyricsVisibility: msg.payload.lyricsVisibility || null,
                    connected: true,
                    connectionType: 'broadcast-channel'
                }));
            }

            if (msg.type === 'active_reference_change') {
                console.log('📺 [Viewer Channel] Active reference changed:', msg.payload.reference);
                setState(prev => ({
                    ...prev,
                    activeScriptureReference: msg.payload.reference
                }));
            }

            if (msg.type === 'popup_scale_change') {
                console.log('📺 [Viewer Channel] Popup scale changed:', msg.payload.scale);
                setState(prev => ({
                    ...prev,
                    scripturePopupScale: msg.payload.scale
                }));
            }

            if (msg.type === 'popup_scroll_sync') {
                console.log('📺 [Viewer Channel] Popup scroll sync:', msg.payload);
                const { column, pct } = msg.payload;
                window.dispatchEvent(new CustomEvent('popup_scroll_sync', { detail: { column, pct } }));
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
                    audioCurrentTime: msg.payload.currentTime,
                    audioIsPlaying: msg.payload.isPlaying
                }));
            }

            if (msg.type === 'live_translation_sync' && msg.payload) {
                setState(prev => ({
                    ...prev,
                    liveTranslationText: msg.payload.text,
                    showLiveTranslation: msg.payload.show
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
            return (
                <SlideRenderer
                    slide={slide}
                    internalPageIndex={state.internalPageIndex}
                    isRemotePreview={true}
                    activeScriptureReference={state.activeScriptureReference}
                    scripturePopupScale={state.scripturePopupScale}
                />
            );
        }

        if (slide.type === SlideType.LYRICS) {
            const lyricsContent = slide.content as SlideContentLyrics;
            const lyricsPopupEnabled = lyricsContent.glassPopupEnabled !== false;
            const lyricsPopupTitleFa = lyricsContent.titleFa || lyricsContent.title;
            const lyricsPopupTitleEn = lyricsContent.titleEn || lyricsContent.title;
            const farsiPopupLines = (lyricsContent.lines || []).map(line => stripChordMarkers(line.text)).filter(Boolean);
            const englishPopupLines = (lyricsContent.lyricsEnLines || []).map(line => line.trim()).filter(Boolean);
            const safeAudioUrl = getSafeAudioUrl(lyricsContent.audioUrl);

            const renderGlassPopup = () => {
                if (!lyricsPopupEnabled || !showGlassPopup) return null;
                return (
                    <div data-allow-interaction="true" className="absolute inset-0 z-[80] bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-6xl max-h-[86vh] overflow-y-auto rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl shadow-2xl p-5 md:p-8 custom-scrollbar">
                            <div className="flex items-start justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                                <div className="text-right" dir="rtl">
                                    <h3 className="text-2xl md:text-3xl font-black text-white font-[Vazirmatn]">{lyricsPopupTitleFa}</h3>
                                    <p className="text-cyan-200 mt-1 text-sm md:text-lg" dir="ltr">{lyricsPopupTitleEn}</p>
                                </div>
                                <button 
                                    data-allow-interaction="true" 
                                    onClick={() => setShowGlassPopup(false)} 
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {farsiPopupLines.map((line, idx) => (
                                    <div key={`lyr-popup-t-${idx}`} className="flex flex-col md:flex-row gap-3 md:gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex-1 text-left" dir="ltr">
                                            <p className="text-white/95 text-[15px] md:text-lg leading-relaxed font-serif">{englishPopupLines[idx] || ''}</p>
                                        </div>
                                        <div className="hidden md:block w-px bg-white/10 self-stretch" />
                                        <div className="flex-1 text-right" dir="rtl">
                                            <p className="text-white text-lg md:text-xl leading-[1.8] font-[Vazirmatn]">{line}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            };

            if (lyricsContent.timingData) {
                const displayOpts = lyricsContent.displayOptions;

                return (
                    <div className="fixed inset-0 bg-black">
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
                            audioSrc={safeAudioUrl}
                            title={lyricsContent.title}
                            viewOnly={true}
                            externalCurrentTime={state.audioCurrentTime}
                            externalIsPlaying={state.audioIsPlaying}
                            externalActiveLineIndex={state.internalPageIndex}
                            backgroundImage={displayOpts?.backgroundUrl}
                            backgroundOpacity={displayOpts?.backgroundOpacity}
                            backgroundBlur={displayOpts?.backgroundBlur}
                            textShadow={displayOpts?.textShadow}
                            objectFit={displayOpts?.objectFit}
                            showPersian={state.lyricsVisibility ? state.lyricsVisibility.showPersian : (displayOpts?.showFarsiLyrics !== false)}
                            showFinglish={state.lyricsVisibility ? state.lyricsVisibility.showFinglish : (displayOpts?.showFinglish !== false)}
                            showEnglish={state.lyricsVisibility ? state.lyricsVisibility.showEnglish : (displayOpts?.showEnglishLyrics !== false)}
                            translations={{
                                finglish: lyricsContent.finglishLines,
                                english: lyricsContent.lyricsEnLines,
                                persian: lyricsContent.persianTranslationLines
                            }}
                        />
                        {renderGlassPopup()}
                    </div>
                );
            }

            // ✅ Use SlideRenderer for non-timing lyrics — same component as console preview
            // This ensures 100% visual consistency between the presenter and projector views
            return (
                <div className="fixed inset-0 overflow-hidden">
                    <SlideRenderer
                        slide={slide}
                        isRemotePreview={true}
                        internalPageIndex={state.internalPageIndex}
                        lyricsVisibility={state.lyricsVisibility || undefined}
                    />
                    {lyricsPopupEnabled && (
                        <button
                            data-allow-interaction="true"
                            onClick={() => setShowGlassPopup(prev => !prev)}
                            className="absolute top-5 right-5 z-[70] px-4 py-2 rounded-xl bg-white/15 border border-white/30 text-white text-sm backdrop-blur-md hover:bg-white/25 transition font-[Vazirmatn]"
                        >
                            {showGlassPopup ? '✕ بستن / Close' : '🎵 متن دوزبانه / Bilingual'}
                        </button>
                    )}
                    {renderGlassPopup()}
                </div>
            );
        }

        if (slide.type === SlideType.MEDIA) {
            return (
                <SlideRenderer
                    slide={slide}
                    isRemotePreview={true}
                    internalPageIndex={state.internalPageIndex}
                />
            );
        }

        if (slide.type === SlideType.ANNOUNCEMENT) {
            return (
                <SlideRenderer
                    slide={slide}
                    isRemotePreview={true}
                    internalPageIndex={state.internalPageIndex}
                />
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
            <div 
                className="w-full h-full"
                style={{
                    transform: `scale(${state.config?.contentScale ?? 1.0})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-out'
                }}
            >
                {renderSlideContent()}
            </div>
            {state.config?.amenBadge && <AmenBadge config={state.config.amenBadge} isEditable={false} />}

            {/* Live Conference Overlay Banner */}
            {state.config?.showLiveMeetingOverlay && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-5xl rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white font-[Vazirmatn] animate-slideInUp">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-xl animate-pulse flex items-center justify-center">
                            <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-white/50 block">ارتباط زنده صوتی و تصویری (Live Conference)</span>
                            <span className="text-base font-bold text-emerald-400">جلسه آنلاین کلیسا برقرار است</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                            <span className="text-white/60">📞 شماره تماس:</span>
                            <span className="font-bold tracking-wide font-mono select-all">(605) 313-9689</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs">کد دسترسی: 1036379#</span>
                        </div>
                        
                        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                            <span className="text-white/60">🌐 اتصال تصویری وب:</span>
                            <span className="font-bold text-cyan-300 font-mono tracking-wide font-sans">join.freeconferencecall.com/iranianchurchdcus</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Translation Subtitles Overlay */}
            {state.showLiveTranslation && state.liveTranslationText && (
                <div 
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[65] w-[80%] max-w-4xl rounded-2xl border border-indigo-500/30 bg-black/85 backdrop-blur-md shadow-2xl p-6 text-center text-white animate-slideInUp font-[Vazirmatn]"
                    style={{ 
                        boxShadow: "0 0 25px rgba(99, 102, 241, 0.25)",
                        border: "1px solid rgba(99, 102, 241, 0.3)"
                    }}
                >
                    <p className="text-xl md:text-2xl font-black text-indigo-200 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {state.liveTranslationText}
                    </p>
                </div>
            )}

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
