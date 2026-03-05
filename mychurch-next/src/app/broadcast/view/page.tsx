"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * 🎬 Projector View
 * This page is opened on the second monitor (or projector) via OBS or physical display.
 */
export default function ProjectorViewPage() {
    // In a real implementation, this would listen to WebSocket or Supabase Realtime
    // to get the current active slide from LiveConsole.
    const [currentSlideHTML, setCurrentSlideHTML] = useState<string | null>(null);

    return (
        <div className="w-screen h-screen overflow-hidden bg-black text-white flex items-center justify-center relative cursor-none">
            {currentSlideHTML ? (
                <div
                    className="w-full h-full animate-in fade-in duration-700"
                    dangerouslySetInnerHTML={{ __html: currentSlideHTML }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center opacity-30 select-none">
                    <div className="w-32 h-32 border-4 border-dashed border-white/50 rounded-full animate-pulse-slow flex items-center justify-center">
                        <span className="font-bold tracking-widest text-xl">STANDBY</span>
                    </div>
                </div>
            )}
        </div>
    );
}
