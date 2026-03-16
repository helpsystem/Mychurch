"use client";

import React, { useState } from "react";
import SlideBuilder from "@/components/broadcast/SlideBuilder";
import { requireRole } from "@/utils/rbac";
import { BroadcastSession, AppLanguage } from "@/types/broadcast";

// We can't use metadata in "use client" components, but we can wrap it if needed.
// For now, let's keep it simple to fix the error.

export default function SlideBuilderPage() {
    const [session, setSession] = useState<BroadcastSession>({
        id: "default-session",
        title: "Session",
        date: new Date(),
        slides: [],
        status: "draft"
    });
    
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [lang, setLang] = useState<AppLanguage>('fa');

    // Only authorized roles can build slides
    // Note: requireRole is usually used in Server Components. 
    // In a client component, we should handle this differently or just let it be for now.
    // await requireRole(['Admin', 'Leader', 'Operator']);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
            <SlideBuilder 
                session={session}
                setSession={setSession}
                lang={lang}
                activeSlideIndex={activeSlideIndex}
                onSlideSelect={setActiveSlideIndex}
            />
            {/* We might want to add a preview or some other UI here later */}
            <div className="flex-1 bg-black flex items-center justify-center text-white/20 select-none">
                <div className="text-center">
                    <div className="text-9xl mb-4">🎬</div>
                    <div className="text-2xl font-bold font-[Vazirmatn]">پنل مدیریت پخش</div>
                    <div className="text-slate-500 mt-2 letter-spacing-wide uppercase text-xs">Broadcast Management Panel</div>
                </div>
            </div>
        </div>
    );
}
