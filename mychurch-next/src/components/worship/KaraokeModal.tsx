"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Zap, Music } from "lucide-react";
import { type WorshipSong } from "@/actions/worship";
import { AppleMusicLyrics } from "./AppleMusicLyrics";
import { SmartWorshipPlayer, getSafeAudioUrl, normalizeTimingData } from "./SmartWorshipPlayer";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";

export function KaraokeModal({ song, onClose }: { song: WorshipSong, onClose: () => void }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [currentTimeSec, setCurrentTimeSec] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Determine which karaoke engine to use
    // Priority: timing_data (word-level from ZIP) > timepoints (legacy Apple Music style)
    const normalizedTimingData = song.timing_data ? normalizeTimingData(song.timing_data) : null;
    const hasSmartTiming = !!(normalizedTimingData?.lines?.length > 0);
    const hasTimepoints = !!(song.timepoints && (song.timepoints as any[]).length > 0);
    const useSmartPlayer = hasSmartTiming;
    const useAppleMusic = !useSmartPlayer && hasTimepoints;
    const hasNoData = !useSmartPlayer && !useAppleMusic;

    useEffect(() => {
        // Auto-play when opened
        if (audioRef.current && !useSmartPlayer) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }, [useSmartPlayer]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTimeMs(audioRef.current.currentTime * 1000);
            setCurrentTimeSec(audioRef.current.currentTime);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    // Prevent scrolling on background when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // ── SmartWorshipPlayer mode (uses timing_data - from ZIP import)
    if (useSmartPlayer && song.timing_data && song.audio_url) {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                <DynamicWatermark defaultSize={800} defaultPosition="center" defaultOpacity={2} className="-z-10" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    title="بستن"
                    className="absolute top-4 right-4 z-[100] p-3 bg-white/10 hover:bg-white/20 hover:text-red-400 text-white rounded-full transition-all border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="absolute top-4 left-4 z-[100] flex flex-col gap-1">
                    <h2 className="text-xl font-black text-white drop-shadow-lg" dir="rtl">{song.title_fa}</h2>
                    {song.title_en && <p className="text-sm text-white/70" dir="ltr">{song.title_en}</p>}
                    {song.artist && <p className="text-xs text-white/50">{song.artist}</p>}
                    <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full w-fit">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Smart Karaoke</span>
                    </div>
                </div>

                {/* SmartWorshipPlayer - Full Screen */}
                <div className="w-full h-full">
                    <SmartWorshipPlayer
                        timingData={normalizedTimingData}
                        audioSrc={getSafeAudioUrl(song.audio_url)}
                        backgroundImage={song.youtube_id
                            ? `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
                            : undefined
                        }
                        backgroundOpacity={50}
                        backgroundBlur={3}
                        textShadow={true}
                        onClose={onClose}
                        showPersian={true}
                        showFinglish={true}
                        showEnglish={true}
                        translations={{
                            finglish: song.lyrics_finglish ? song.lyrics_finglish.split('\n').map(l => l.trim()).filter(Boolean) : undefined,
                            english: song.lyrics_en ? song.lyrics_en.split('\n').map(l => l.trim()).filter(Boolean) : undefined,
                        }}
                    />
                </div>
            </div>
        );
    }

    // ── AppleMusicLyrics mode (uses timepoints - legacy)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            <DynamicWatermark defaultSize={800} defaultPosition="center" defaultOpacity={2} className="-z-10" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-baseline justify-between z-20 bg-gradient-to-b from-black/80 to-transparent" dir="ltr">
                <div className="flex flex-col text-left">
                    <h2 className="text-2xl font-black text-white drop-shadow-lg font-serif">{song.title_en || song.title_fa || 'Unknown Title'}</h2>
                    <h3 className="text-xl text-white/90 drop-shadow-md" dir="rtl">{song.title_fa}</h3>
                    {song.artist && <p className="text-white/70 font-medium mt-1">{song.artist}</p>}
                    {useAppleMusic && (
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-white/10 border border-white/20 rounded-full w-fit">
                            <Music className="w-3 h-3 text-white/70" />
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Apple Lyrics Mode</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    title="Close"
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Lyrics Engine */}
            <div className="w-full h-[70vh] max-w-5xl mx-auto px-4 mt-20">
                {hasNoData ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Music className="w-16 h-16 text-white/20 mb-4" />
                        <p className="text-white/50 text-xl font-bold" dir="rtl">
                            تایمینگ کارائوکه برای این سرود ثبت نشده است
                        </p>
                        <p className="text-white/30 text-sm mt-2" dir="rtl">
                            برای فعال‌سازی کارائوکه، فایل ZIP را در بخش ادمین آپلود کنید
                        </p>
                    </div>
                ) : (
                    <AppleMusicLyrics
                        timepoints={(song.timepoints as any) || []}
                        currentTimeMs={currentTimeMs}
                    />
                )}
            </div>

            {/* Bottom Audio Controller (only for AppleMusicLyrics / legacy mode) */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center z-20 bg-gradient-to-t from-black via-black/80 to-transparent" dir="ltr">
                <button
                    onClick={togglePlay}
                    title={isPlaying ? "Pause" : "Play"}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-6"
                >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                {song.audio_url && (
                    <audio
                        ref={audioRef}
                        src={getSafeAudioUrl(song.audio_url)}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full max-w-2xl hidden"
                        controls
                    />
                )}
            </div>
        </div>
    );
}
