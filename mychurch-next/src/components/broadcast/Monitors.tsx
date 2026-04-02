"use client";

import React, { useEffect, useRef } from "react";
import { MonitorPlay } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { SmartWorshipPlayer } from "@/components/worship/SmartWorshipPlayer";
import { SlideType, SlideContentLyrics } from "@/types/broadcast";
import { SlideRenderer } from "@/components/broadcast/SlideRenderer";

export function PreviewMonitor() {
    const { t } = useLanguage();
    const slides = useBroadcastStore((state) => state.slides);
    const activeSlideIndex = useBroadcastStore((state) => state.activeSlideIndex);
    const previewSlide = slides[activeSlideIndex + 1] || slides[activeSlideIndex] || null;

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative group">
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-emerald-400">
                {t.preview}
            </div>

            <div className="flex-1 flex items-center justify-center bg-neutral-950 pattern-grid-lg text-neutral-800 relative overflow-hidden">
                {previewSlide ? (
                    <SlideRenderer slide={previewSlide} isRemotePreview={true} />
                ) : (
                    <MonitorPlay className="w-12 h-12 opacity-20" />
                )}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
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

    const handleTimeUpdate = (time: number) => {
        // Broadcast the exact audio time to the viewer window
        if (channelRef.current && isLive) {
            channelRef.current.postMessage({
                type: 'audio_sync',
                payload: { currentTime: time }
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative ring-1 ring-neutral-800 ring-offset-2 ring-offset-black">
            <div className="absolute top-2 left-2 z-[60] px-2 py-1 bg-red-500/80 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white shadow-lg shadow-red-500/20">
                {t.program} {isLive ? '(ON AIR)' : ''}
            </div>

            <div className="flex-1 flex flex-col bg-neutral-950 relative overflow-hidden">
                {isLive ? (
                    activeSlide?.type === SlideType.LYRICS && (activeSlide.content as SlideContentLyrics).hasTiming ? (
                        <div className="absolute inset-0 z-50">
                            <SmartWorshipPlayer
                                timingData={(activeSlide.content as SlideContentLyrics).timingData}
                                audioSrc={(activeSlide.content as SlideContentLyrics).audioUrl || ''}
                                title={(activeSlide.content as SlideContentLyrics).title}
                                viewOnly={false}
                                onTimeUpdate={handleTimeUpdate}
                                translations={{
                                    finglish: (activeSlide.content as SlideContentLyrics).finglishLines
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0">
                                <SlideRenderer
                                    slide={activeSlide}
                                    isRemotePreview={false}
                                    internalPageIndex={internalPageIndex}
                                />
                            </div>
                            <p className="absolute bottom-3 right-3 text-[11px] text-white/70 bg-black/50 rounded px-2 py-1 z-[65]">
                                Slide {activeSlideIndex + 1} - {activeSlide?.type || 'No slide'}
                            </p>
                        </>
                    )
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-neutral-700 font-bold tracking-widest">{t.offline}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

