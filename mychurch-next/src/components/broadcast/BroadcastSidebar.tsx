"use client";

import React from "react";
import { Layers, Mic, Type, Layout, Video } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { cn } from "@/lib/utils";

export function BroadcastSidebar() {
    const { t } = useLanguage();
    const { activeSceneId, setActiveSceneId } = useBroadcastStore();

    const scenes = [
        { id: "scene_1", name: t.worship || 'Worship', icon: Mic },
        { id: "scene_2", name: t.bible || 'Bible', icon: Type },
        { id: "scene_3", name: t.lowerThirds || 'Lower Thirds', icon: Layout },
        { id: "scene_4", name: t.mainCam || 'Main Camera', icon: Video },
        { id: "scene_5", name: t.media || 'Media', icon: Layout }
    ];

    return (
        <aside className="w-72 bg-neutral-900 border-r border-border/10 flex flex-col">
            <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide">{t.scenes || 'Scenes'}</span>
                <button className="p-1.5 hover:bg-neutral-800 rounded text-muted-foreground transition" title="Scenes Options">
                    <Layers className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                {scenes.map((scene) => (
                    <button
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-right",
                            activeSceneId === scene.id
                                ? "bg-primary/20 text-primary font-bold border border-primary/20"
                                : "hover:bg-neutral-800 text-muted-foreground hover:text-foreground font-medium"
                        )}
                    >
                        <scene.icon className={cn("w-4 h-4", activeSceneId === scene.id ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn(activeSceneId === scene.id ? "font-bold" : "opacity-90")}>{scene.name}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
