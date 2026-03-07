"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause } from "lucide-react";
import { type WorshipSong } from "@/actions/worship";
import { AppleMusicLyrics } from "./AppleMusicLyrics";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";

export function KaraokeModal({ song, onClose }: { song: WorshipSong, onClose: () => void }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Auto-play when opened
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }, []);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            // Convert seconds to milliseconds for AppleMusicLyrics
            setCurrentTimeMs(audioRef.current.currentTime * 1000);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            <DynamicWatermark defaultSize={800} defaultPosition="center" defaultOpacity={2} className="-z-10" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h2 className="text-2xl font-black text-white drop-shadow-lg" dir="rtl">{song.title.fa}</h2>
                    {song.artist && <p className="text-white/70 font-medium" dir="rtl">{song.artist}</p>}
                </div>
                <button
                    onClick={onClose}
                    title="Close"
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Apple Music Lyrics Engine */}
            <div className="w-full h-[70vh] max-w-5xl mx-auto px-4 mt-20">
                <AppleMusicLyrics
                    timepoints={song.timepoints || []}
                    currentTimeMs={currentTimeMs}
                />
            </div>

            {/* Bottom Audio Controller */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
                <button
                    onClick={togglePlay}
                    title={isPlaying ? "Pause" : "Play"}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-6"
                >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                {song.audioUrl && (
                    <audio
                        ref={audioRef}
                        src={song.audioUrl}
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
