"use client";

import React from "react";
import { MonitorPlay } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function PreviewMonitor() {
    const { t } = useLanguage();
    // const { slides, activeSlideIndex } = useBroadcastStore();
    // In the future: const previewSlide = slides[activeSlideIndex];

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative group">
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-emerald-400">
                {t.preview}
            </div>

            {/* The actual slide content goes here */}
            <div className="flex-1 flex items-center justify-center bg-neutral-950 pattern-grid-lg text-neutral-800 relative">
                <MonitorPlay className="w-12 h-12 opacity-20" />
            </div>

            {/* Hover Actions */}
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
    // const { slides, activeSlideIndex } = useBroadcastStore();
    // The program monitor usually shows the live presentation

    return (
        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative ring-1 ring-neutral-800 ring-offset-2 ring-offset-black">
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-500/80 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white shadow-lg shadow-red-500/20">
                {t.program}
            </div>

            {/* The actual live slide content goes here */}
            <div className="flex-1 flex items-center justify-center bg-neutral-950 relative overflow-hidden">
                {isLive ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <MonitorPlay className="w-16 h-16 text-primary/50 animate-pulse" />
                    </div>
                ) : (
                    <span className="text-neutral-700 font-bold tracking-widest">{t.offline}</span>
                )}
            </div>
        </div>
    );
}
