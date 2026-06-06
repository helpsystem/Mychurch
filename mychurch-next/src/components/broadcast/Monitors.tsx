"use client";

import React, { useEffect, useRef } from "react";
import { MonitorPlay, Camera } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { SmartWorshipPlayer } from "@/components/worship/SmartWorshipPlayer";
import { SlideType, SlideContentLyrics } from "@/types/broadcast";
import { SlideRenderer } from "@/components/broadcast/SlideRenderer";
import { cn } from "@/lib/utils";

// Camera Stream Video Renderer
function VideoFeed({
    stream,
    isMirrored,
    isBlur,
    className
}: {
    stream: MediaStream | null;
    isMirrored: boolean;
    isBlur: boolean;
    className?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className={cn("w-full h-full bg-neutral-950 flex flex-col items-center justify-center border border-dashed border-neutral-800 text-muted-foreground", className)}>
                <Camera className="w-8 h-8 opacity-30 mb-2" />
                <span className="text-[10px] font-bold font-[Vazirmatn] tracking-wide">دوربین غیرفعال</span>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn("w-full h-full object-cover transition-all duration-300", className)}
            style={{
                transform: isMirrored ? "scaleX(-1)" : undefined,
                filter: isBlur ? "blur(8px)" : undefined,
            }}
        />
    );
}

export function PreviewMonitor() {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const previewSlide = slides[activeSlideIndex + 1] || slides[activeSlideIndex] || null;

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative group">
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-emerald-400 font-[Vazirmatn]">
                {t.preview}
            </div>

            <div className="flex-1 flex items-center justify-center bg-neutral-950 pattern-grid-lg text-neutral-800 relative overflow-hidden">
                {previewSlide ? (
                    <SlideRenderer slide={previewSlide} isRemotePreview={true} />
                ) : (
                    <MonitorPlay className="w-12 h-12 opacity-20" />
                )}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2 font-[Vazirmatn]">
                <button className="px-4 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 rounded text-white transition" title="Edit">
                    {t.edit || "Edit"}
                </button>
                <button className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded text-white transition" title="Transition">
                    {t.transition || "Transition"} ➔
                </button>
            </div>
        </div>
    );
}

export function ProgramMonitor({ isLive }: { isLive: boolean }) {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const internalPageIndex = useBroadcastStore((state) => state.internalPageIndex);
    const sessionId = useBroadcastStore((state) => state.sessionId);
    const activeScriptureReference = useBroadcastStore((state) => state.activeScriptureReference);
    const scripturePopupScale = useBroadcastStore((state) => state.scripturePopupScale);

    // Hardware and Config bindings
    const mediaStream = useBroadcastStore((state) => state.mediaStream);
    const isMirrored = useBroadcastStore((state) => state.isMirrored);
    const isBlur = useBroadcastStore((state) => state.isBlur);
    const config = useBroadcastStore((state) => state.config);
    
    const activeSlide = slides[activeSlideIndex];
    const channelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        const channelName = `broadcast-console-${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        channelRef.current = channel;
        
        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, [sessionId]);

    const handleTimeUpdate = React.useCallback((time: number, isPlaying?: boolean) => {
        // Broadcast the exact audio time to the viewer window
        if (channelRef.current && isLive) {
            channelRef.current.postMessage({
                type: 'audio_sync',
                payload: { 
                    currentTime: time, 
                    isPlaying: isPlaying !== undefined ? isPlaying : false 
                }
            });
        }
    }, [isLive]);

    const renderSlideOrKaraoke = (isTrans: boolean, isPreview: boolean = false) => {
        const lyricsContent = activeSlide?.content as SlideContentLyrics;
        if (activeSlide?.type === SlideType.LYRICS && (lyricsContent?.timingData || lyricsContent?.hasTiming)) {
            return (
                <SmartWorshipPlayer
                    timingData={lyricsContent.timingData}
                    audioSrc={lyricsContent.audioUrl || ''}
                    title={lyricsContent.title}
                    viewOnly={isPreview}
                    onTimeUpdate={handleTimeUpdate}
                    externalActiveLineIndex={internalPageIndex}
                    showPersian={true}
                    showFinglish={true}
                    showEnglish={true}
                    translations={{
                        finglish: lyricsContent.finglishLines,
                        english: lyricsContent.lyricsEnLines,
                        persian: lyricsContent.persianTranslationLines
                    }}
                    isTransparent={isTrans}
                />
            );
        }

        return (
            <SlideRenderer
                slide={activeSlide}
                isRemotePreview={isPreview}
                internalPageIndex={internalPageIndex}
                isTransparent={isTrans}
                activeScriptureReference={activeScriptureReference}
                scripturePopupScale={scripturePopupScale}
            />
        );
    };

    const renderLayoutContent = () => {
        if (!activeSlide) {
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                    <span className="text-neutral-700 font-bold tracking-widest font-[Vazirmatn]">{t.offline}</span>
                </div>
            );
        }

        // Layout: Slides Only
        if (config.layout === 'SLIDES_ONLY') {
            return (
                <div className="absolute inset-0">
                    {renderSlideOrKaraoke(false, false)}
                </div>
            );
        }

        // Layout: Full Camera overlay
        if (config.layout === 'FULL_CAM') {
            return (
                <>
                    <div className="absolute inset-0 z-0 bg-black">
                        <VideoFeed stream={mediaStream} isMirrored={isMirrored} isBlur={isBlur} />
                    </div>
                    <div className="absolute inset-0 z-10">
                        {renderSlideOrKaraoke(true, false)}
                    </div>
                </>
            );
        }

        // Layout: Split Screen (50/50)
        if (config.layout === 'SPLIT') {
            return (
                <div className="absolute inset-0 flex flex-row items-stretch">
                    <div className="w-1/2 relative bg-black border-r border-white/5">
                        <VideoFeed stream={mediaStream} isMirrored={isMirrored} isBlur={isBlur} />
                    </div>
                    <div className="w-1/2 relative bg-neutral-950">
                        {renderSlideOrKaraoke(false, false)}
                    </div>
                </div>
            );
        }

        // Layout: Picture-in-Picture (PIP)
        if (config.layout === 'PIP') {
            // Determine video shape class
            const shapeClass = config.leaderVideoShape === 'circle'
                ? 'rounded-full aspect-square w-32 h-32 md:w-36 md:h-36 border-2'
                : config.leaderVideoShape === 'square'
                    ? 'rounded-2xl aspect-square w-32 h-32 md:w-36 md:h-36'
                    : 'rounded-xl aspect-video w-44 h-28 md:w-48 md:h-32';

            // Determine position coordinates class
            let posClass = 'bottom-4 right-4';
            if (config.pipPosition === 'top-left') posClass = 'top-4 left-4';
            else if (config.pipPosition === 'top-center') posClass = 'top-4 left-1/2 -translate-x-1/2';
            else if (config.pipPosition === 'top-right') posClass = 'top-4 right-4';
            else if (config.pipPosition === 'center-left') posClass = 'top-1/2 -translate-y-1/2 left-4';
            else if (config.pipPosition === 'center') posClass = 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
            else if (config.pipPosition === 'center-right') posClass = 'top-1/2 -translate-y-1/2 right-4';
            else if (config.pipPosition === 'bottom-left') posClass = 'bottom-4 left-4';
            else if (config.pipPosition === 'bottom-center') posClass = 'bottom-4 left-1/2 -translate-x-1/2';

            return (
                <>
                    <div className="absolute inset-0 z-0">
                        {renderSlideOrKaraoke(false, false)}
                    </div>
                    <div className={cn("absolute z-20 overflow-hidden border border-white/10 shadow-2xl bg-neutral-950", shapeClass, posClass)}>
                        <VideoFeed stream={mediaStream} isMirrored={isMirrored} isBlur={isBlur} />
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative ring-1 ring-neutral-800 ring-offset-2 ring-offset-black">
            <div className="absolute top-2 left-2 z-[60] px-2 py-1 bg-red-500/80 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white shadow-lg shadow-red-500/20 font-[Vazirmatn]">
                {t.program} {isLive ? '(ON AIR)' : ''}
            </div>

            <div className="flex-1 flex flex-col bg-neutral-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    {renderLayoutContent()}
                </div>
                <p className="absolute bottom-3 right-3 text-[11px] text-white/70 bg-black/50 rounded px-2 py-1 z-[65] font-mono">
                    Slide {activeSlideIndex + 1} - {activeSlide?.type || 'No slide'}
                </p>
            </div>
        </div>
    );
}
