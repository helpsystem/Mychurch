"use client";

import React from "react";
import { Layers, Mic, Type, Layout, Video } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { cn } from "@/lib/utils";

const localDict = {
    en: { showAllSlides: "Show all slides" },
    fa: { showAllSlides: "نمایش همه اسلایدها" },
    es: { showAllSlides: "Mostrar todas las diapositivas" },
};

interface BroadcastSidebarProps {
    className?: string;
}

export function BroadcastSidebar({ className }: BroadcastSidebarProps) {
    const { t, isRTL, language } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const activeSceneId = useBroadcastStore(state => state.activeSceneId);
    const setActiveSceneId = useBroadcastStore(state => state.setActiveSceneId);
    const updateConfig = useBroadcastStore(state => state.updateConfig);
    const config = useBroadcastStore(state => state.config);

    // Each scene both marks itself active (so the slide grid below can filter to it)
    // and performs the one concrete console action that scene name implies.
    const scenes = [
        { id: "scene_1", name: t.worship || 'سرودهای پرستشی', icon: Mic, onSelect: () => {} },
        { id: "scene_2", name: t.bible || 'کتاب مقدس', icon: Type, onSelect: () => {} },
        { id: "scene_3", name: t.lowerThirds || 'زیرنویس‌ها', icon: Layout, onSelect: () => updateConfig({ showLowerThird: !config.showLowerThird }) },
        { id: "scene_4", name: t.mainCam || 'دوربین اصلی', icon: Video, onSelect: () => updateConfig({ layout: 'FULL_CAM' }) },
        { id: "scene_5", name: t.media || 'رسانه', icon: Layout, onSelect: () => {} }
    ];

    return (
        <aside
            dir={isRTL ? "rtl" : "ltr"}
            className={cn(
                "w-72 bg-neutral-900 flex flex-col shrink-0",
                isRTL ? "border-l border-border/10 font-[Vazirmatn]" : "border-r border-border/10 font-sans",
                className
            )}
        >
            <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide">{t.scenes || 'Scenes'}</span>
                <button
                    onClick={() => setActiveSceneId('')}
                    className="p-1.5 hover:bg-neutral-800 rounded text-muted-foreground transition"
                    title={d.showAllSlides}
                >
                    <Layers className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                {scenes.map((scene) => (
                    <button
                        key={scene.id}
                        onClick={() => {
                            setActiveSceneId(scene.id);
                            scene.onSelect();
                        }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                            isRTL ? "text-right" : "text-left",
                            activeSceneId === scene.id
                                ? "bg-primary/20 text-primary font-bold border border-primary/20"
                                : "hover:bg-neutral-800 text-muted-foreground hover:text-foreground font-medium"
                        )}
                    >
                        <scene.icon className={cn("w-4 h-4 shrink-0", activeSceneId === scene.id ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn(activeSceneId === scene.id ? "font-bold" : "opacity-90")}>{scene.name}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
