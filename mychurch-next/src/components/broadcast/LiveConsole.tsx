"use client";

import React, { useState } from "react";
import {
    Layout, MonitorPlay, Settings, RadioReceiver, Layers,
    Type, Edit3, Power, Mic, Video, StopCircle, Play
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export default function LiveConsole() {
    const { t } = useLanguage();
    const [isLive, setIsLive] = useState(false);
    const [activeSceneId, setActiveSceneId] = useState<string>("scene_1");

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary/30">
            {/* Top Navigation / Status Bar */}
            <header className="h-16 px-6 border-b border-border/10 flex items-center justify-between bg-neutral-900 shrink-0 z-10 w-full shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-primary overflow-hidden shrink-0">
                            <Image src="/logo-transparent.png" alt="MyChurch" width={32} height={32} className="object-contain drop-shadow" />
                        </div>
                        <span className="font-bold tracking-wide">{t.broadcastConsole}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-2">{t.pro}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-border/10">
                        <div className={cn("w-2 h-2 rounded-full", isLive ? "bg-red-500 animate-pulse" : "bg-neutral-500")} />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {isLive ? t.onAir : t.offline}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-1.5 rounded-lg font-bold text-sm transition-all shadow-md",
                            isLive
                                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                    >
                        {isLive ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isLive ? t.endStream : t.goLive}
                    </button>

                    <a href="/broadcast/view" target="_blank" className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-muted-foreground hover:text-foreground transition-colors" title={t.openProjectorView}>
                        <MonitorPlay className="w-4 h-4" />
                    </a>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Sources / Scenes */}
                <aside className="w-72 bg-neutral-900 border-r border-border/10 flex flex-col">
                    <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                        <span className="text-sm font-bold tracking-wide">{t.scenes}</span>
                        <button className="p-1.5 hover:bg-neutral-800 rounded text-muted-foreground transition" title="Scenes Options">
                            <Layers className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                        {[
                            { id: "scene_1", name: t.worship, icon: Mic },
                            { id: "scene_2", name: t.bible, icon: Type },
                            { id: "scene_3", name: t.lowerThirds, icon: Layout },
                            { id: "scene_4", name: t.mainCam, icon: Video },
                            { id: "scene_5", name: t.media, icon: Layout }
                        ].map((scene) => (
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

                {/* Center Panel: Preview & Program (Forced LTR for monitors) */}
                <main dir="ltr" className="flex-1 flex flex-col bg-black relative p-4 gap-4">
                    {/* Monitors Area */}
                    <div className="flex-1 flex gap-4 h-1/2">
                        {/* Preview Monitor */}
                        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative group">
                            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-emerald-400">
                                {t.preview}
                            </div>
                            <div className="flex-1 flex items-center justify-center bg-neutral-950 pattern-grid-lg text-neutral-800">
                                <MonitorPlay className="w-12 h-12 opacity-20" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                <button className="px-4 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 rounded text-white transition" title="Edit">{t.edit}</button>
                                <button className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded text-white transition" title="Transition">{t.transition} ➔</button>
                            </div>
                        </div>

                        {/* Program Monitor */}
                        <div className="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-border/10 overflow-hidden relative ring-1 ring-neutral-800 ring-offset-2 ring-offset-black">
                            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-500/80 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white shadow-lg shadow-red-500/20">
                                {t.program}
                            </div>
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
                    </div>

                    {/* Bottom Area: Deck / Quick Controls */}
                    <div className="h-64 bg-neutral-900 rounded-xl border border-border/10 flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-border/10 bg-neutral-950/50 flex gap-2">
                            <button className="px-4 py-1 text-xs font-bold bg-neutral-800 rounded text-white" title="Lyrics">{t.lyrics}</button>
                            <button className="px-4 py-1 text-xs font-bold hover:bg-neutral-800 rounded text-muted-foreground" title="Bible">{t.bible}</button>
                            <button className="px-4 py-1 text-xs font-bold hover:bg-neutral-800 rounded text-muted-foreground" title="Media">{t.media}</button>
                        </div>
                        <div className="flex-1 p-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-y-auto">
                            {/* Slide Thumbnails Mock */}
                            {[...Array(16)].map((_, i) => (
                                <div key={i} className="aspect-video bg-neutral-800 rounded border border-border/20 hover:border-primary/50 cursor-pointer flex items-end p-2 relative group overflow-hidden" title={`Slide ${i + 1}`}>
                                    <div className="absolute inset-0 bg-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-[10px] font-bold text-muted-foreground relative z-10">{t.slide} {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-16 shrink-0 flex items-center gap-4 border-t border-border/10 justify-center">
                        <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 text-sm tracking-wide" title="Live Power">
                            <Power className="w-4 h-4" /> {t.goLive}
                        </button>
                        <Link href="/broadcast/builder" className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20" title="Builder">
                            <Edit3 className="w-4 h-4" /> {t.slideBuilder}
                        </Link>
                    </div>
                </main>

                {/* Right Panel: Properties */}
                <aside className="w-72 bg-neutral-900 border-l border-border/10 flex flex-col">
                    <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                        <span className="text-sm font-bold tracking-wide">{t.properties}</span>
                        <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">{t.backgroundMode}</label>
                            <select title={t.backgroundMode} className="w-full bg-neutral-800 border border-border/20 rounded pl-2 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary">
                                <option>{t.transparent}</option>
                                <option>{t.solidColor}</option>
                                <option>{t.dynamicVideo}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">{t.animationSpeed}</label>
                            <input type="range" title={t.animationSpeed} className="w-full accent-primary" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">{t.lowerThirdTheme}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="py-2 bg-neutral-800 rounded border border-primary/50 text-xs font-bold text-primary" title={t.modern}>{t.modern}</button>
                                <button className="py-2 bg-neutral-800 rounded border border-border/20 text-xs font-bold text-muted-foreground" title={t.classic}>{t.classic}</button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
