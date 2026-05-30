"use client";

import React, { useEffect } from "react";
import { Edit3, Power, Play, StopCircle, RadioReceiver, CloudDownload, X, FileJson, Loader2, SkipBack, SkipForward, ChevronLeft, ChevronRight, ExternalLink, Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { getPresentations, getPresentationById } from "@/actions/presentations";
import { BroadcastSession } from "@/types/broadcast";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { toast } from "sonner";


// Sub-components
import { BroadcastSidebar } from "./BroadcastSidebar";
import { BroadcastProperties } from "./BroadcastProperties";
import { PreviewMonitor, ProgramMonitor } from "./Monitors";
import { SlideGrid } from "./SlideGrid";
import { DeviceSettingsModal } from "./DeviceSettingsModal";

interface LiveConsoleProps {
    initialPresentationId?: string | null;
}

export default function LiveConsole({ initialPresentationId = null }: LiveConsoleProps) {
    const { t } = useLanguage();
    const presentationId = initialPresentationId;

    const isLive = useBroadcastStore(state => state.isLive);
    const setIsLive = useBroadcastStore(state => state.setIsLive);
    const setSlides = useBroadcastStore(state => state.setSlides);
    const setSessionId = useBroadcastStore(state => state.setSessionId);
    const sessionId = useBroadcastStore(state => state.sessionId);
    const slides = useBroadcastStore(state => state.slides);
    const activeSlideIndex = useBroadcastStore(state => state.activeSlideIndex);
    const internalPageIndex = useBroadcastStore(state => state.internalPageIndex);
    const setActiveSlideIndex = useBroadcastStore(state => state.setActiveSlideIndex);
    const setInternalPageIndex = useBroadcastStore(state => state.setInternalPageIndex);
    const nextSlide = useBroadcastStore(state => state.nextSlide);
    const prevSlide = useBroadcastStore(state => state.prevSlide);
    const config = useBroadcastStore(state => state.config);
    const initRemoteSync = useBroadcastStore(state => state.initRemoteSync);
    const disconnectSync = useBroadcastStore(state => state.disconnectSync);
    const isConnected = useBroadcastStore(state => state.isConnected);
    const viewerChannelRef = React.useRef<BroadcastChannel | null>(null);

    // Hardware bindings
    const {
        mediaStream,
        videoDevices,
        audioDevices,
        selectedVideoDevice,
        selectedAudioDevice,
        videoResolution,
        isMirrored,
        isBlur,
        showDeviceSelector,
        isCameraOn,
        isMicOn,
        setMediaStream,
        setVideoDevices,
        setAudioDevices,
        setVideoDevice,
        setAudioDevice,
        setVideoResolution,
        setIsMirrored,
        setIsBlur,
        setShowDeviceSelector
    } = useBroadcastStore(useShallow(state => ({
        mediaStream: state.mediaStream,
        videoDevices: state.videoDevices,
        audioDevices: state.audioDevices,
        selectedVideoDevice: state.selectedVideoDevice,
        selectedAudioDevice: state.selectedAudioDevice,
        videoResolution: state.videoResolution,
        isMirrored: state.isMirrored,
        isBlur: state.isBlur,
        showDeviceSelector: state.showDeviceSelector,
        isCameraOn: state.isCameraOn,
        isMicOn: state.isMicOn,
        setMediaStream: state.setMediaStream,
        setVideoDevices: state.setVideoDevices,
        setAudioDevices: state.setAudioDevices,
        setVideoDevice: state.setVideoDevice,
        setAudioDevice: state.setAudioDevice,
        setVideoResolution: state.setVideoResolution,
        setIsMirrored: state.setIsMirrored,
        setIsBlur: state.setIsBlur,
        setShowDeviceSelector: state.setShowDeviceSelector
    })));

    const [isLoadModalOpen, setIsLoadModalOpen] = React.useState(false);

    // Enumerate available devices
    const enumerateDevices = React.useCallback(async () => {
        try {
            if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

            // Request temporary permission to see labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
            if (tempStream) {
                tempStream.getTracks().forEach(track => track.stop());
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videos = devices.filter(d => d.kind === 'videoinput');
            const audios = devices.filter(d => d.kind === 'audioinput');
            setVideoDevices(videos);
            setAudioDevices(audios);

            // Default selections
            if (!selectedVideoDevice && videos.length > 0) {
                setVideoDevice(videos[0].deviceId);
            }
            if (!selectedAudioDevice && audios.length > 0) {
                setAudioDevice(audios[0].deviceId);
            }
        } catch (err) {
            console.error('Error enumerating devices:', err);
        }
    }, [selectedVideoDevice, selectedAudioDevice, setVideoDevices, setAudioDevices, setVideoDevice, setAudioDevice]);

    // Apply selected devices with constraints
    const applySelectedDevices = React.useCallback(async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

        try {
            // Stop existing tracks
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }

            let videoConstraints: boolean | MediaTrackConstraints = selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true;

            // Resolution Ideal Sizes
            if (videoResolution === 'hd') {
                videoConstraints = {
                    ...((videoConstraints as object) || {}),
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
                };
            } else if (videoResolution === 'fhd') {
                videoConstraints = {
                    ...((videoConstraints as object) || {}),
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
                };
            }

            const constraints: MediaStreamConstraints = {
                video: isCameraOn ? videoConstraints : false,
                audio: isMicOn ? (selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true) : false
            };

            // Stop stream if both are disabled
            if (!isCameraOn && !isMicOn) {
                setMediaStream(null);
                return;
            }

            console.log("📷 Requesting UserMedia with constraints:", constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setMediaStream(stream);

            // Double check toggles
            stream.getVideoTracks().forEach(t => t.enabled = isCameraOn);
            stream.getAudioTracks().forEach(t => t.enabled = isMicOn);

        } catch (err) {
            console.error('Error applying media devices:', err);
            toast.error('خطا در اتصال به دستگاه‌های منتخب');
        }
    }, [selectedVideoDevice, selectedAudioDevice, videoResolution, isCameraOn, isMicOn, mediaStream, setMediaStream]);

    // Enumerate on mount
    useEffect(() => {
        enumerateDevices();
    }, []);

    // Re-apply on selected device or resolution change
    useEffect(() => {
        if (isCameraOn || isMicOn) {
            applySelectedDevices();
        }
    }, [selectedVideoDevice, selectedAudioDevice, videoResolution]);

    // Re-apply on camera/mic toggles
    useEffect(() => {
        applySelectedDevices();
    }, [isCameraOn, isMicOn]);

    // Auto-start camera on first console load
    useEffect(() => {
        const autoStart = async () => {
            if (!mediaStream && !isCameraOn) {
                // Set default camera states in store
                useBroadcastStore.setState({ isCameraOn: true, isMicOn: true });
            }
        };
        const timer = setTimeout(autoStart, 1000);
        return () => clearTimeout(timer);
    }, []);
    const [savedSessions, setSavedSessions] = React.useState<BroadcastSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);
    const [isGeneratingViewerLink, setIsGeneratingViewerLink] = React.useState(false);
    const [isOpeningViewer, setIsOpeningViewer] = React.useState(false);
    const [isCallersModalOpen, setIsCallersModalOpen] = React.useState(false);
    const [fccCallers, setFccCallers] = React.useState<any[]>([]);
    const [fccConference, setFccConference] = React.useState<any | null>(null);
    const [isModeratingId, setIsModeratingId] = React.useState<string | null>(null);
    const lastKeyTimeRef = React.useRef<number>(0);
    const [isOnline, setIsOnline] = React.useState(true);

    // Auto-load presentation from query parameter
    useEffect(() => {
        if (presentationId) {
            const loadSessionFromUrl = async () => {
                try {
                    const session = await getPresentationById(presentationId);
                    if (session) {
                        setSessionId(session.id);
                        setSlides(session.slides);
                        setActiveSlideIndex(0, true);
                        setInternalPageIndex(0, true);
                        toast.success(`ارائه "${session.title}" با موفقیت بارگذاری شد`);
                    } else {
                        toast.error("ارائه مورد نظر یافت نشد");
                    }
                } catch (err) {
                    console.error("Failed to auto-load presentation:", err);
                    toast.error("خطا در بارگذاری خودکار ارائه");
                }
            };
            loadSessionFromUrl();
        }
    }, [presentationId, setSessionId, setSlides, setActiveSlideIndex, setInternalPageIndex]);

    useEffect(() => {
        setIsOnline(typeof window !== 'undefined' ? window.navigator.onLine : true);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

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
        setActiveSlideIndex(0, true);
        setInternalPageIndex(0, true);
        setIsLoadModalOpen(false);
    };

    const getCurrentPageCount = React.useCallback(() => {
        const current = slides[activeSlideIndex];
        if (!current || current.type !== 'SCRIPTURE') return 1;
        const scripture = current.content as any;
        return Array.isArray(scripture?.pages) && scripture.pages.length > 0 ? scripture.pages.length : 1;
    }, [slides, activeSlideIndex]);

    const goNextStep = React.useCallback(() => {
        const pageCount = getCurrentPageCount();
        if (internalPageIndex < pageCount - 1) {
            setInternalPageIndex(internalPageIndex + 1);
            return;
        }
        nextSlide();
    }, [getCurrentPageCount, internalPageIndex, nextSlide, setInternalPageIndex]);

    const goPrevStep = React.useCallback(() => {
        if (internalPageIndex > 0) {
            setInternalPageIndex(internalPageIndex - 1);
            return;
        }
        prevSlide();
    }, [internalPageIndex, prevSlide, setInternalPageIndex]);

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

    // Poll FreeConferenceCall callers every 4 seconds
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        const pollCallers = async () => {
            try {
                const res = await fetch("/api/broadcast/fcc-participants");
                if (res.ok) {
                    const data = await res.json();
                    setFccCallers(data.participants || []);
                    setFccConference(data.conference || null);
                }
            } catch (err) {
                console.error("Error polling FCC participants:", err);
            }
        };

        pollCallers();
        timer = setInterval(pollCallers, 4000);

        return () => clearInterval(timer);
    }, []);

    const handleModerateCaller = async (participantId: string, action: 'mute' | 'unmute' | 'kick') => {
        if (!fccConference?.id) {
            toast.error("کنفرانس فعالی در دیتابیس یافت نشد.");
            return;
        }
        
        setIsModeratingId(participantId);
        try {
            const res = await fetch("/api/broadcast/fcc-control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    conferenceId: fccConference.id,
                    participantId
                })
            });

            if (res.ok) {
                toast.success(
                    action === 'mute' ? 'کاربر بی‌صدا شد' : 
                    action === 'unmute' ? 'صدای کاربر فعال شد' : 'اتصال کاربر قطع شد'
                );
                // Update local state quickly for visual response
                setFccCallers(prev => prev.map(c => 
                    c.id === participantId 
                        ? { ...c, muted: action === 'mute' ? true : action === 'unmute' ? false : c.muted }
                        : c
                ).filter(c => action !== 'kick' || c.id !== participantId));
            } else {
                const data = await res.json();
                throw new Error(data.error || "Failed to moderate");
            }
        } catch (err: any) {
            toast.error(err.message || "خطا در برقراری ارتباط با FreeConferenceCall");
        } finally {
            setIsModeratingId(null);
        }
    };

    const handleOpenViewer = async () => {
        if (!sessionId) {
            window.open('/broadcast/view', '_blank');
            return;
        }

        setIsOpeningViewer(true);
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
            
            // Screen Details API for auto secondary monitor placement
            try {
                if ('getScreenDetails' in window) {
                    const screenDetails = await (window as any).getScreenDetails();
                    const secondary = screenDetails.screens.find((s: any) => !s.isPrimary);
                    if (secondary) {
                        window.open(
                            viewerUrl,
                            '_blank',
                            `left=${secondary.left},top=${secondary.top},width=${secondary.width},height=${secondary.height},fullscreen=yes,noopener,noreferrer`
                        );
                        return;
                    }
                }
            } catch (e) {
                console.warn("[LiveConsole] Access to Screen Details API denied or unsupported:", e);
            }
            
            // Fallback to standard window open
            window.open(viewerUrl, '_blank', 'noopener,noreferrer');
        } catch (error: any) {
            toast.error(error?.message || "خطا در ساخت لینک امن Viewer");
            
            // Standard fallback
            try {
                if ('getScreenDetails' in window) {
                    const screenDetails = await (window as any).getScreenDetails();
                    const secondary = screenDetails.screens.find((s: any) => !s.isPrimary);
                    if (secondary) {
                        window.open(
                            `/broadcast/view?session=${encodeURIComponent(sessionId)}`,
                            '_blank',
                            `left=${secondary.left},top=${secondary.top},width=${secondary.width},height=${secondary.height},fullscreen=yes,noopener,noreferrer`
                        );
                        return;
                    }
                }
            } catch (e) {}
            
            window.open(`/broadcast/view?session=${encodeURIComponent(sessionId)}`, '_blank', 'noopener,noreferrer');
        } finally {
            setIsOpeningViewer(false);
        }
    };

    useEffect(() => {
        // Automatically start listening for Remote Control (iPad) commands via Supabase Realtime
        initRemoteSync();
        return () => disconnectSync();
    }, [initRemoteSync, disconnectSync]);

    const stateRef = React.useRef({ slides, activeSlideIndex, internalPageIndex, config });
    useEffect(() => {
        stateRef.current = { slides, activeSlideIndex, internalPageIndex, config };
    }, [slides, activeSlideIndex, internalPageIndex, config]);

    useEffect(() => {
        if (!sessionId) {
            viewerChannelRef.current?.close();
            viewerChannelRef.current = null;
            return;
        }

        const channel = new BroadcastChannel(`broadcast-console-${sessionId}`);
        viewerChannelRef.current = channel;

        const pushFullState = () => {
            const current = stateRef.current;
            const currentSlide = current.slides[current.activeSlideIndex] || null;
            channel.postMessage({
                type: 'full_state',
                payload: {
                    currentSlide,
                    slideIndex: current.activeSlideIndex,
                    internalPageIndex: current.internalPageIndex,
                    config: current.config
                }
            });
        };

        channel.onmessage = (event) => {
            if (event.data?.type === 'viewer_ready') {
                pushFullState();
            }
        };

        pushFullState();

        return () => {
            channel.close();
            viewerChannelRef.current = null;
        };
    }, [sessionId]); // Depends ONLY on sessionId

    useEffect(() => {
        if (!sessionId || !viewerChannelRef.current) return;
        const currentSlide = slides[activeSlideIndex] || null;
        viewerChannelRef.current.postMessage({
            type: 'slide_change',
            payload: {
                slide: currentSlide,
                index: activeSlideIndex,
                internalPageIndex
            }
        });
    }, [activeSlideIndex, internalPageIndex]); // Triggers only on index changes

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const now = Date.now();
            if (now - lastKeyTimeRef.current < 250) return; // Prevent double firing duplicate slide jumps

            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable=true]')) {
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
                event.preventDefault();
                lastKeyTimeRef.current = now;
                goNextStep();
            } else if (event.key === 'ArrowLeft' || event.key === 'PageUp' || event.key === 'Backspace') {
                event.preventDefault();
                lastKeyTimeRef.current = now;
                goPrevStep();
            } else if (event.key === 'Home') {
                event.preventDefault();
                lastKeyTimeRef.current = now;
                setActiveSlideIndex(0);
                setInternalPageIndex(0);
            } else if (event.key === 'End') {
                event.preventDefault();
                lastKeyTimeRef.current = now;
                const lastIndex = Math.max(0, slides.length - 1);
                setActiveSlideIndex(lastIndex);
                setInternalPageIndex(0);
            }
        };

        window.addEventListener('keydown', onKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
    }, [goNextStep, goPrevStep, setActiveSlideIndex, setInternalPageIndex, slides.length]);

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
                        {!isOnline && (
                            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ml-2 flex items-center gap-1 uppercase" title="Network Disconnected">
                                <RadioReceiver className="w-3 h-3" /> Offline (DB Sync Paused)
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
                {/* Global Asset Preloader for 0-latency live transitions */}
                <div className="hidden" aria-hidden="true">
                    {slides.map(s => {
                        if (s.type === 'MEDIA') {
                            const c = s.content as any;
                            if (c.mediaType === 'image') return <img key={s.id} src={c.url} alt="preload" />;
                            if (c.mediaType === 'video') return <video key={s.id} src={c.url} preload="auto" />;
                        }
                        if (s.type === 'GENERIC' || s.type === 'LIVEDATA') {
                            const c = s.content as any;
                            const bg = c.background;
                            if (bg?.type === 'image') return <img key={s.id + 'bg'} src={bg.value} alt="preload" />;
                            if (bg?.type === 'video') return <video key={s.id + 'bg'} src={bg.value} preload="auto" />;
                        }
                        if (s.type === 'LYRICS') {
                            const c = s.content as any;
                            if (c.displayOptions?.backgroundType === 'image' && c.displayOptions.backgroundUrl) {
                                return <img key={s.id} src={c.displayOptions.backgroundUrl} alt="preload" />;
                            }
                        }
                        return null;
                    })}
                </div>

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

                    {/* FreeConferenceCall Live Control Widget */}
                    <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 font-[Vazirmatn] text-white backdrop-blur-md mt-2">
                        {/* Farsi content: Active Callers count & List */}
                        <div className="flex-1 flex flex-col gap-3 text-right">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Phone className="text-emerald-500 w-4 h-4 animate-pulse" />
                                    <span>شرکت‌کنندگان تماس زنده (تلفنی و تصویری وب)</span>
                                    {fccCallers.length > 0 && (
                                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                                            {fccCallers.length} نفر فعال
                                        </span>
                                    )}
                                </h3>
                            </div>
                            
                            {fccCallers.length === 0 ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                                    <PhoneOff className="w-4 h-4 opacity-40 animate-pulse" />
                                    <span>هیچ تماسی در حال حاضر فعال نیست. منتظر اتصال کاربران روی خط کلیسا...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[140px] p-1">
                                    {fccCallers.map((caller: any) => (
                                        <div key={caller.id} className="flex items-center justify-between p-2.5 bg-neutral-950/60 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg flex items-center justify-center",
                                                    caller.muted ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                                                )}>
                                                    {caller.muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-xs block truncate max-w-[120px]">{caller.display_name || caller.name || 'شرکت‌کننده'}</span>
                                                    <span className="text-[9px] text-muted-foreground font-mono font-bold" dir="ltr">{caller.caller_number || caller.phone_number || '-'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleModerateCaller(caller.id, caller.muted ? 'unmute' : 'mute')}
                                                    disabled={isModeratingId === caller.id}
                                                    className={cn(
                                                        "p-1.5 rounded-md text-[10px] font-bold transition flex items-center justify-center",
                                                        caller.muted 
                                                            ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" 
                                                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                                                    )}
                                                    title={caller.muted ? 'وصل صدا' : 'قطع صدا'}
                                                >
                                                    {isModeratingId === caller.id ? <Loader2 className="w-3 h-3 animate-spin" /> : caller.muted ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                                </button>
                                                <button
                                                    onClick={() => handleModerateCaller(caller.id, 'kick')}
                                                    disabled={isModeratingId === caller.id}
                                                    className="p-1.5 bg-neutral-800 hover:bg-red-950/40 text-muted-foreground hover:text-red-400 rounded-md transition"
                                                    title="قطع تماس"
                                                >
                                                    <PhoneOff className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Static connection information */}
                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-r border-white/5 pt-3 md:pt-0 md:pr-4 flex flex-col justify-center gap-2.5 text-xs text-right shrink-0">
                            <div className="text-white/60 font-bold border-b border-white/5 pb-1 mb-1">📞 اطلاعات اتصال خط کنفرانس تلفنی:</div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold tracking-wide font-mono select-all text-emerald-400" dir="ltr">(605) 313-9689</span>
                                <span className="text-white/50">:شماره تماس خط آمریکا</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-amber-400 font-mono select-all">1036379#</span>
                                <span className="text-white/50">:کد دسترسی (Access Code)</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-cyan-400 font-mono select-all truncate max-w-[140px]" dir="ltr">iranianchurchdcus</span>
                                <span className="text-white/50">:شناسه آنلاین (Meeting ID)</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="h-16 shrink-0 flex items-center gap-4 border-t border-border/10 justify-center mt-2 p-2 font-[Vazirmatn]">
                        <button
                            onClick={() => {
                                setActiveSlideIndex(0);
                                setInternalPageIndex(0);
                            }}
                            disabled={slides.length === 0}
                            className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20 font-[Vazirmatn]"
                            title="First Slide"
                        >
                            <SkipBack className="w-4 h-4" /> {t.first || 'First'}
                        </button>
                        <button
                            onClick={goPrevStep}
                            disabled={slides.length === 0}
                            className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20 font-[Vazirmatn]"
                            title="Previous"
                        >
                            <ChevronLeft className="w-4 h-4" /> {t.prev || 'Prev'}
                        </button>
                        <div className="px-4 py-2 rounded-lg border border-border/20 bg-neutral-900 text-xs text-muted-foreground min-w-[140px] text-center font-mono">
                            Slide {slides.length === 0 ? 0 : activeSlideIndex + 1}/{slides.length} | Page {internalPageIndex + 1}/{getCurrentPageCount()}
                        </div>
                        <button
                            onClick={goNextStep}
                            disabled={slides.length === 0}
                            className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20 font-[Vazirmatn]"
                            title="Next"
                        >
                            {t.next || 'Next'} <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                const lastIndex = Math.max(0, slides.length - 1);
                                setActiveSlideIndex(lastIndex);
                                setInternalPageIndex(0);
                            }}
                            disabled={slides.length === 0}
                            className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20 font-[Vazirmatn]"
                            title="Last Slide"
                        >
                            {t.last || 'Last'} <SkipForward className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={cn(
                                "px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm tracking-wide font-[Vazirmatn]",
                                isLive ? "bg-neutral-800 text-white border border-border/20 hover:bg-neutral-700" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                            )}>
                            <Power className="w-4 h-4" /> {isLive ? (t.endStream || 'Stop') : (t.goLive || 'Go Live')}
                        </button>
                        <Link href="/broadcast/builder" className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm border border-border/20 font-[Vazirmatn]" title="Builder">
                            <Edit3 className="w-4 h-4" /> {t.slideBuilder || 'Slide Builder'}
                        </Link>
                        <button onClick={handleOpenLoadModal} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm font-[Vazirmatn]">
                            <CloudDownload className="w-4 h-4" /> {t.cloudLoad || 'Cloud Load'}
                        </button>
                        <button
                            onClick={handleCopyViewerLink}
                            disabled={!sessionId || isGeneratingViewerLink}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm font-[Vazirmatn]"
                        >
                            {isGeneratingViewerLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <RadioReceiver className="w-4 h-4" />} {t.viewerLink || 'Viewer Link'}
                        </button>
                        <button
                            onClick={() => setIsCallersModalOpen(true)}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm font-[Vazirmatn]"
                            title="تماس‌های فعال"
                        >
                            <Phone className="w-4 h-4" /> 
                            <span>تماس زنده</span>
                            {fccCallers.length > 0 && (
                                <span className="bg-white text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                                    {fccCallers.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleOpenViewer}
                            disabled={isOpeningViewer}
                            className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm font-[Vazirmatn]"
                        >
                            {isOpeningViewer ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} {t.viewer || 'Viewer'}
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
                                                    <span dir="ltr">{new Date(session.date).toLocaleDateString("en-US")}</span>
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

            {/* Device Settings Modal */}
            <DeviceSettingsModal
                isOpen={showDeviceSelector}
                onClose={() => setShowDeviceSelector(false)}
                videoDevices={videoDevices}
                audioDevices={audioDevices}
                selectedVideoDevice={selectedVideoDevice}
                selectedAudioDevice={selectedAudioDevice}
                onVideoDeviceChange={setVideoDevice}
                onAudioDeviceChange={setAudioDevice}
                onRefreshDevices={enumerateDevices}
                videoResolution={videoResolution}
                onResolutionChange={setVideoResolution}
                isMirrored={isMirrored}
                onMirrorChange={setIsMirrored}
                isBlur={isBlur}
                onBlurChange={setIsBlur}
                isRTL={true}
            />

            {/* Live Callers / FreeConferenceCall Moderation Modal */}
            {isCallersModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-border/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] font-[Vazirmatn] text-white">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Phone className="text-emerald-500 w-5 h-5 animate-pulse" /> 
                                شرکت‌کنندگان تماس صوتی/تصویری زنده
                                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-sans font-bold">
                                    {fccCallers.length} نفر
                                </span>
                            </h2>
                            <button onClick={() => setIsCallersModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {fccCallers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                                    <PhoneOff className="w-12 h-12 mb-4 opacity-20" />
                                    <p>هیچ تماسی در حال حاضر فعال نیست.</p>
                                    <p className="text-xs mt-1">منتظر اتصال اولین شرکت‌کننده روی خط...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fccCallers.map((caller: any) => (
                                        <div key={caller.id} className="flex items-center justify-between p-3.5 bg-neutral-950/40 rounded-xl border border-white/5 transition hover:border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg flex items-center justify-center",
                                                    caller.muted ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                                                )}>
                                                    {caller.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-sm block tracking-wide">{caller.display_name || caller.name || 'شرکت‌کننده ناشناس'}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono font-bold" dir="ltr">{caller.caller_number || caller.phone_number || '-'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleModerateCaller(caller.id, caller.muted ? 'unmute' : 'mute')}
                                                    disabled={isModeratingId === caller.id}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
                                                        caller.muted 
                                                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30" 
                                                            : "bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30"
                                                    )}
                                                >
                                                    {isModeratingId === caller.id ? <Loader2 className="w-3 h-3 animate-spin" /> : caller.muted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                                                    <span>{caller.muted ? 'وصل صدا' : 'قطع صدا'}</span>
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleModerateCaller(caller.id, 'kick')}
                                                    disabled={isModeratingId === caller.id}
                                                    className="p-1.5 bg-neutral-800 hover:bg-red-950/40 text-muted-foreground hover:text-red-400 rounded-lg transition border border-white/5"
                                                    title="قطع تماس"
                                                >
                                                    <PhoneOff className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
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
