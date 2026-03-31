"use client";

import React, { useEffect } from "react";
import { Edit3, Power, Play, StopCircle, RadioReceiver, CloudDownload, X, FileJson, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { getPresentations } from "@/actions/presentations";
import { BroadcastSession } from "@/types/broadcast";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { cn } from "@/lib/utils";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { toast } from "sonner";

// Sub-components
import { BroadcastSidebar } from "./BroadcastSidebar";
import { BroadcastProperties } from "./BroadcastProperties";
import { PreviewMonitor, ProgramMonitor } from "./Monitors";
import { SlideGrid } from "./SlideGrid";

export default function LiveConsole() {
    const { t } = useLanguage();
    const isLive = useBroadcastStore(state => state.isLive);
    const setIsLive = useBroadcastStore(state => state.setIsLive);
    const setSlides = useBroadcastStore(state => state.setSlides);
    const setSessionId = useBroadcastStore(state => state.setSessionId);
    const sessionId = useBroadcastStore(state => state.sessionId);
    const { initRemoteSync, disconnectSync, isConnected } = useBroadcastStore();

    const [isLoadModalOpen, setIsLoadModalOpen] = React.useState(false);
    const [savedSessions, setSavedSessions] = React.useState<BroadcastSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);
    const [isGeneratingViewerLink, setIsGeneratingViewerLink] = React.useState(false);

    const handleOpenLoadModal = async () => {
        setIsLoadModalOpen(true);
        setIsLoadingSessions(true);
        try {
            const sessions = await getPresentations();
            setSavedSessions(sessions);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleLoadSession = (session: BroadcastSession) => {
        setSessionId(session.id);
        setSlides(session.slides);
        setIsLoadModalOpen(false);
    };

    const handleCopyViewerLink = async () => {
        if (!sessionId) {
            toast.error("ابتدا یک جلسه را Cloud Load کنید.");
            return;
        }

        setIsGeneratingViewerLink(true);
        try {
            const res = await fetch('/api/broadcast/viewer-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            const data = await res.json();
            if (!res.ok || !data?.token) {
                throw new Error(data?.error || 'Failed to generate token');
            }

            const viewerUrl = `${window.location.origin}/broadcast/view?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(data.token)}`;
            await navigator.clipboard.writeText(viewerUrl);
            toast.success("لینک امن Viewer کپی شد");
        } catch (error: any) {
            toast.error(error?.message || "خطا در ساخت لینک امن Viewer");
        } finally {
            setIsGeneratingViewerLink(false);
        }
    };

    useEffect(() => {
        // Automatically start listening for Remote Control (iPad) commands via Supabase Realtime
        initRemoteSync();
        return () => disconnectSync();
    }, [initRemoteSync, disconnectSync]);

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary/30">
            <PageVisuals soft />
            {/* Top Navigation / Status Bar */}
            <header className="h-16 px-6 border-b border-border/10 flex items-center justify-between bg-neutral-900 shrink-0 z-10 w-full shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-primary overflow-hidden shrink-0">
                            <Image src="/logo-transparent.png" alt="MyChurch" width={32} height={32} className="object-contain drop-shadow" />
                        </div>
                        <span className="font-bold tracking-wide">{t.broadcastConsole || 'Broadcast Console'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-2">
                            {t.pro || 'PRO'}
                        </span>
                        {isConnected && (
                            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-2 animate-pulse flex items-center gap-1 uppercase" title="Listening for Remote Control">
                                <RadioReceiver className="w-3 h-3" /> Remote Sync
                            </span>
                        )}
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
                        {isLive ? (t.endStream || 'End Stream') : (t.goLive || 'Go Live')}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                <BroadcastSidebar />

                {/* Center Panel: Preview & Program */}
                <main dir="ltr" className="flex-1 flex flex-col bg-black relative p-4 gap-4">
                    {/* Monitors Area */}
                    <div className="flex-1 flex gap-4 h-1/2">
                        <PreviewMonitor />
                        <ProgramMonitor isLive={isLive} />
                    </div>

                    {/* Bottom Area: Deck / Quick Controls */}
                    <SlideGrid />

                    {/* Action Footer */}
                    <div className="h-16 shrink-0 flex items-center gap-4 border-t border-border/10 justify-center mt-2 p-2">
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={cn(
                                "px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm tracking-wide",
                                isLive ? "bg-neutral-800 text-white border border-border/20 hover:bg-neutral-700" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                            )}>
                            <Power className="w-4 h-4" /> {isLive ? (t.endStream || 'Stop') : (t.goLive || 'Go Live')}
                        </button>
                        <Link href="/broadcast/builder" className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20" title="Builder">
                            <Edit3 className="w-4 h-4" /> {t.slideBuilder || 'Slide Builder'}
                        </Link>
                        <button onClick={handleOpenLoadModal} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm">
                            <CloudDownload className="w-4 h-4" /> Cloud Load
                        </button>
                        <button
                            onClick={handleCopyViewerLink}
                            disabled={!sessionId || isGeneratingViewerLink}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm"
                        >
                            {isGeneratingViewerLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <RadioReceiver className="w-4 h-4" />} Viewer Link
                        </button>
                    </div>
                </main>

                {/* Right Panel */}
                <BroadcastProperties />
            </div>

            {/* Cloud Load Modal */}
            {isLoadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-border/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] font-[Vazirmatn]">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                            <h2 className="text-xl font-bold flex items-center gap-2"><CloudDownload className="text-indigo-500" /> Load Presentation</h2>
                            <button onClick={() => setIsLoadModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {isLoadingSessions ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                                    Loading from PostgreSQL...
                                </div>
                            ) : savedSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                                    <FileJson className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No saved presentations found.</p>
                                    <p className="text-sm">Create one in the Slide Builder first.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {savedSessions.map(session => (
                                        <button 
                                            key={session.id} 
                                            onClick={() => handleLoadSession(session)}
                                            className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-left group"
                                        >
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{session.title}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                    <span>{new Date(session.date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{session.slides?.length || 0} Slides</span>
                                                </p>
                                            </div>
                                            <div className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-6 h-6" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
