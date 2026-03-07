"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Save, Music, Loader2, CheckCircle, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";

interface Timepoint {
    time: number;
    word: string;
}

interface SongTimingEditorProps {
    songId: string;
    songTitleFa: string;
    songArtist?: string;
    lyricsFa?: string;
    youtubeId?: string;
    existingTimepoints?: Timepoint[];
}

export default function SongTimingEditor({
    songId,
    songTitleFa,
    songArtist,
    lyricsFa,
    youtubeId,
    existingTimepoints = []
}: SongTimingEditorProps) {
    // Words parsed from lyrics
    const [words, setWords] = useState<string[]>([]);
    const [timepoints, setTimepoints] = useState<Timepoint[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Parse lyrics into words on mount
    useEffect(() => {
        if (!lyricsFa) return;
        // Split by whitespace and newlines, filter empty
        const parsed = lyricsFa
            .split(/[\s\n]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);
        setWords(parsed);

        // Load existing timepoints if available
        if (existingTimepoints.length > 0) {
            setTimepoints(existingTimepoints);
        }
    }, [lyricsFa, existingTimepoints]);

    // Timer logic
    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        intervalRef.current = setInterval(() => {
            setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }, 50);
        setIsRunning(true);
    }, [elapsedTime]);

    const pauseTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
    }, []);

    const resetTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setElapsedTime(0);
        setCurrentWordIndex(-1);
        setTimepoints([]);
        setSaved(false);
    }, []);

    // Spacebar handler — tap to mark current word's time
    const handleSpacebar = useCallback((e: KeyboardEvent) => {
        if (e.code !== "Space") return;
        e.preventDefault();

        if (!isRunning) {
            startTimer();
            return;
        }

        const nextIndex = currentWordIndex + 1;
        if (nextIndex >= words.length) {
            pauseTimer();
            return;
        }

        setCurrentWordIndex(nextIndex);
        setTimepoints(prev => {
            const updated = [...prev];
            updated[nextIndex] = { time: parseFloat(elapsedTime.toFixed(2)), word: words[nextIndex] };
            return updated;
        });
    }, [isRunning, currentWordIndex, words, elapsedTime, startTimer, pauseTimer]);

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
                body: JSON.stringify({ timepoints }),
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
        <div className="min-h-screen bg-background p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/worship" className="p-2 hover:bg-secondary rounded-xl transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black">{songTitleFa}</h1>
                    {songArtist && <p className="text-muted-foreground text-sm">{songArtist}</p>}
                </div>
            </div>

            {/* Instructions Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="text-2xl">⌨️</div>
                <div>
                    <p className="font-bold text-foreground">نحوه استفاده:</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        دکمه <kbd className="bg-border/30 border border-border px-2 py-0.5 rounded text-xs font-mono">Space</kbd> را برای شروع تایمر فشار دهید.
                        سپس با هر بار فشار Space، زمان کلمه بعدی ثبت می‌شود.
                        در آخر دکمه «ذخیره» را بزنید.
                    </p>
                </div>
            </div>

            {/* Timer & Controls */}
            <div className="bg-card border border-border/20 rounded-2xl p-6">
                {/* Big Timer Display */}
                <div className="text-center mb-6">
                    <div className="text-6xl font-mono font-black text-primary tabular-nums">
                        {formatTime(elapsedTime)}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                        {markedCount} / {words.length} کلمه ثبت شد
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden mx-auto max-w-xs">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={resetTimer}
                        className="p-3 rounded-xl border border-border/30 hover:bg-secondary transition"
                        title="ریست"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={isRunning ? pauseTimer : startTimer}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition shadow-lg"
                    >
                        {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isRunning ? "توقف" : "شروع"}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || markedCount === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                        title="ذخیره"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? "ذخیره شد!" : "ذخیره"}
                    </button>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-3">
                    یا <kbd className="bg-border/30 border border-border px-1.5 py-0.5 rounded text-xs font-mono">Space</kbd> برای شروع/ثبت کلمه بعد
                </p>
            </div>

            {/* Words Display */}
            {words.length > 0 ? (
                <div className="bg-card border border-border/20 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                        <Music className="w-4 h-4" /> متن سرود
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xl leading-loose font-[Vazirmatn]">
                        {words.map((word, i) => {
                            const isCurrent = i === currentWordIndex;
                            const isMarked = timepoints[i] !== undefined;
                            const isPast = i < currentWordIndex;

                            return (
                                <span
                                    key={i}
                                    className={`inline-block px-2 py-1 rounded-xl transition-all duration-200 cursor-default
                                        ${isCurrent ? "bg-primary text-primary-foreground scale-125 shadow-lg font-bold" : ""}
                                        ${isMarked && !isCurrent ? "bg-primary/20 text-primary" : ""}
                                        ${!isMarked && !isCurrent ? "bg-secondary/50 text-muted-foreground" : ""}
                                    `}
                                    title={timepoints[i] ? `${timepoints[i].time}s` : ""}
                                >
                                    {word}
                                    {timepoints[i] && (
                                        <span className="block text-[9px] text-center opacity-60 font-mono">{timepoints[i].time}s</span>
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
                <div className="bg-card border border-border/20 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-muted-foreground mb-3">پیش‌نمایش JSON تایمینگ</h3>
                    <pre className="text-xs bg-secondary/50 rounded-xl p-4 overflow-auto max-h-48 font-mono text-left" dir="ltr">
                        {JSON.stringify(timepoints.filter(Boolean), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
