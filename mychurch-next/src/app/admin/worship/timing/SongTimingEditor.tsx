"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Save, Music, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Tailwind merge util

interface Timepoint {
    time: number;
    word: string;
}

interface SongTimingEditorProps {
    songId: string;
    songTitleFa: string;
    songTitleEn?: string;
    songArtist?: string;
    lyricsFa?: string;
    lyricsEn?: string;
    youtubeId?: string;
    audioUrl?: string;
    existingTimepoints?: Timepoint[];
}

export default function SongTimingEditor({
    songId,
    songTitleFa,
    songTitleEn,
    songArtist,
    lyricsFa,
    lyricsEn,
    youtubeId,
    audioUrl,
    existingTimepoints = []
}: SongTimingEditorProps) {
    // Words parsed from lyrics
    const [words, setWords] = useState<string[]>([]);
    const [wordsEn, setWordsEn] = useState<string[]>([]);
    const [timepoints, setTimepoints] = useState<Timepoint[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    // Audio & Timer state
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Parse lyrics into words on mount
    useEffect(() => {
        if (lyricsFa) {
            const parsedFa = lyricsFa.split(/[\s\n]+/).map(w => w.trim()).filter(w => w.length > 0);
            setWords(parsedFa);
        }
        
        if (lyricsEn) {
            const parsedEn = lyricsEn.split(/[\s\n]+/).map(w => w.trim()).filter(w => w.length > 0);
            setWordsEn(parsedEn);
        }

        // Load existing timepoints if available
        if (existingTimepoints.length > 0) {
            setTimepoints(existingTimepoints);
        }
    }, [lyricsFa, lyricsEn, existingTimepoints]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Audio Controls
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const resetAudio = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentWordIndex(-1);
        setTimepoints([]);
        setSaved(false);
    }, []);

    // Spacebar handler — tap to mark current word's time accurately
    const handleSpacebar = useCallback((e: KeyboardEvent) => {
        if (e.code !== "Space" || e.target instanceof HTMLButtonElement) return;
        e.preventDefault();

        if (!audioRef.current) return;

        if (!isPlaying) {
            audioRef.current.play();
            return;
        }

        const nextIndex = currentWordIndex + 1;
        if (nextIndex >= words.length) {
            audioRef.current.pause();
            return;
        }

        setCurrentWordIndex(nextIndex);
        
        // Use EXACT audio current time for perfect sync
        const exactTime = parseFloat(audioRef.current.currentTime.toFixed(2));
        
        setTimepoints(prev => {
            const updated = [...prev];
            updated[nextIndex] = { time: exactTime, word: words[nextIndex] };
            return updated;
        });
    }, [isPlaying, currentWordIndex, words]);

    useEffect(() => {
        window.addEventListener("keydown", handleSpacebar);
        return () => window.removeEventListener("keydown", handleSpacebar);
    }, [handleSpacebar]);

    // Save timepoints to the server
    const handleSave = async () => {
        if (timepoints.length === 0) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/worship/${songId}/timing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timepoints: timepoints.filter(Boolean) }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setSaved(true);
        } catch (err) {
            alert("خطا در ذخیره: " + (err as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = (t % 60).toFixed(1);
        return `${m}:${Number(s) < 10 ? "0" : ""}${s}`;
    };

    const markedCount = timepoints.filter(Boolean).length;
    const progress = words.length > 0 ? (markedCount / words.length) * 100 : 0;

    return (
        <div className="min-h-[100dvh] bg-background p-6 space-y-6" dir="rtl">
            {/* Audio Element Hidden */}
            {audioUrl && (
                <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/worship" className="p-2 hover:bg-secondary rounded-xl transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black">{songTitleFa}</h1>
                    {(songArtist || songTitleEn) && (
                        <p className="text-muted-foreground text-sm font-serif" dir="ltr">
                            {songArtist} {songArtist && songTitleEn ? " - " : ""} {songTitleEn}
                        </p>
                    )}
                </div>
            </div>

            {/* Error Missing Audio */}
            {!audioUrl && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div>
                        <h2 className="text-red-500 font-bold text-lg">خطا: فایل صوتی یافت نشد</h2>
                        <p className="text-muted-foreground mt-1">این سرود فاقد لینک `audioUrl` می‌باشد. برای استفاده از استودیو کارائوکه، ابتدا باید فایل صوتی این سرود را در صفحه قبل ثبت کنید.</p>
                    </div>
                </div>
            )}

            {/* Instructions Banner */}
            {audioUrl && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-2xl">⌨️</div>
                    <div>
                        <p className="font-bold text-foreground">نحوه استفاده از استودیو:</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            دکمه <kbd className="bg-border/30 border border-border px-2 py-0.5 rounded text-xs font-mono">Space</kbd> را برای پخش آهنگ فشار دهید.
                            سپس با هر بار شنیدن کلمه بعدی، دقیقا در همان لحظه مجددا `Space` را فشار دهید تا سینک شود.
                            در آخر دکمه «ذخیره تایمینگ» را بزنید.
                        </p>
                    </div>
                </div>
            )}

            {/* Timer & Controls */}
            {audioUrl && (
                <div className="bg-card border border-border/20 rounded-2xl p-6 shadow-sm">
                    {/* Big Timer Display */}
                    <div className="text-center mb-6">
                        <div className="text-6xl font-mono font-black text-primary tabular-nums tracking-wider drop-shadow-sm">
                            {formatTime(currentTime)}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground font-medium">
                            {markedCount} از {words.length} کلمه سینک شد
                        </div>
                        {/* Progress bar */}
                        <div className="mt-4 h-2.5 bg-secondary rounded-full overflow-hidden mx-auto max-w-sm border border-border/30">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={resetAudio}
                            className="p-3.5 rounded-xl border border-border/30 hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                            title="شروع مجدد از صفر"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className={cn(
                                "flex items-center gap-2 px-10 py-3.5 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95",
                                isPlaying 
                                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20" 
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                            )}
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            {isPlaying ? "توقف" : "پخش"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || markedCount === 0}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                            title="ذخیره روی دیتابیس بیدرنگ"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {saved ? "ذخیره شد!" : "ذخیره"}
                        </button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-4 opacity-70">
                        یا <kbd className="bg-border/30 border border-border px-1.5 py-0.5 rounded text-xs font-mono shadow-sm">Space</kbd> برای شروع/ثبت کلمه بعد
                    </p>
                </div>
            )}

            {/* Words Display Grid */}
            {words.length > 0 ? (
                <div className="bg-card border border-border/20 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary" /> متن سرود
                    </h3>
                    <div className="flex flex-wrap gap-2.5 leading-loose font-[Vazirmatn] items-end">
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isMarked = timepoints[i] !== undefined;
                            const wordEn = wordsEn[i] || "";

                            return (
                                <span
                                    key={i}
                                    className={cn(
                                        "inline-flex flex-col items-center justify-center min-w-[3rem] px-4 py-3 rounded-2xl transition-all duration-300 cursor-default select-none border border-transparent",
                                        isCurrent && "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/30 scale-[1.15] z-10 font-black translate-y-[-4px]",
                                        isMarked && !isCurrent && "bg-primary/10 text-primary font-bold border-primary/20",
                                        !isMarked && !isCurrent && "bg-secondary/20 text-foreground/60 hover:bg-secondary/50"
                                    )}
                                    title={timepoints[i] ? `${timepoints[i].time}s` : ""}
                                >
                                    <span className="text-[1.5rem] leading-none mb-1.5">{word}</span>
                                    {wordEn && (
                                        <span className={cn(
                                            "text-xs font-serif tracking-wider",
                                            isCurrent ? "text-white/90" : "text-muted-foreground/70"
                                        )} dir="ltr">
                                            {wordEn}
                                        </span>
                                    )}
                                    {timepoints[i] && (
                                        <span className={cn(
                                            "block text-[10px] text-center font-mono mt-1 tracking-wider",
                                            isCurrent ? "opacity-90 text-white" : "opacity-50 text-muted-foreground"
                                        )}>
                                            {timepoints[i].time.toFixed(1)}s
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border/20 rounded-2xl p-12 text-center text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>این سرود متن فارسی ندارد.</p>
                    <p className="text-sm mt-1">ابتدا در ویرایشگر سرود، متن فارسی را وارد کنید.</p>
                </div>
            )}

            {/* Timepoints Preview */}
            {timepoints.length > 0 && (
                <div className="bg-card border border-border/20 rounded-2xl p-6 transition-all">
                    <h3 className="text-sm font-bold text-muted-foreground mb-3">پیش‌نمایش JSON دیتابیس</h3>
                    <pre className="text-xs bg-black/50 text-emerald-400 rounded-xl p-4 overflow-auto max-h-48 font-mono text-left border border-white/5 shadow-inner" dir="ltr">
                        {JSON.stringify(timepoints.filter(Boolean), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
