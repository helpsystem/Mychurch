"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
    Play, Pause, RotateCcw, Save, CheckCircle, Music, Clock, 
    AlertCircle, Languages, Layout, Sparkles, ChevronLeft, ChevronRight,
    Type, X, ArrowLeft, Eye, Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    SystemTimingV2, 
    SystemLineV2, 
    SystemWordV2 
} from "@/types/worship-sync";
import SmartWorshipPlayer from "@/components/worship/SmartWorshipPlayer";

interface SongTimingEditorProps {
    songId: string;
    songTitleFa: string;
    songTitleEn?: string;
    songArtist?: string;
    lyricsFa: string | null;
    lyricsEn: string | null;
    lyricsFinglish?: string;
    youtubeId?: string;
    audioUrl?: string;
    existingTimepoints?: { time: number; word: string }[];
    timingData?: any;
    category?: string;
}

export default function SongTimingEditor({
    songId,
    songTitleFa,
    songTitleEn,
    songArtist,
    lyricsFa,
    lyricsEn,
    lyricsFinglish,
    youtubeId,
    audioUrl,
    existingTimepoints = [],
    timingData,
    category
}: SongTimingEditorProps) {
    // Media State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Timing State
    const [currentTiming, setCurrentTiming] = useState<SystemTimingV2 | null>(null);
    const [timepoints, setTimepoints] = useState<{ time: number; word: string }[]>(existingTimepoints);
    const [selectedWord, setSelectedWord] = useState<{ lineIndex: number; wordIndex: number } | null>(null);

    // Editor UI State
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showFullTextEdit, setShowFullTextEdit] = useState(false);
    const [tempFullText, setTempFullText] = useState("");
    const [saved, setSaved] = useState(false);

    // Derived words for legacy recording
    const words = lyricsFa ? lyricsFa.split(/\s+/).filter(Boolean) : [];
    const wordsEn = lyricsEn ? lyricsEn.split(/\s+/).filter(Boolean) : [];
    const currentWordIndex = timepoints.length;

    // Initialization
    useEffect(() => {
        if (timingData && timingData.lines) {
            setCurrentTiming(timingData as SystemTimingV2);
        } else if (lyricsFa) {
            // Initialize basic V2 structure from lyrics
            const lines = lyricsFa.split('\n').filter(l => l.trim().length > 0);
            const initialTiming: SystemTimingV2 = {
                songId: Number(songId),
                version: "2.1",
                totalDuration: 0,
                lines: lines.map(lineText => ({
                    line: lineText,
                    start: 0,
                    end: 0,
                    words: lineText.split(/\s+/).filter(Boolean).map(w => ({
                        word: w,
                        start: 0,
                        end: 0
                    })),
                    translations: { finglish: "", english: "" }
                }))
            };
            setCurrentTiming(initialTiming);
        }
    }, [timingData, lyricsFa, songId]);

    // Sync flat timepoints into currentTiming structure
    useEffect(() => {
        if (!currentTiming || timepoints.length === 0) return;

        // Create a deep copy of currentTiming
        const updated = JSON.parse(JSON.stringify(currentTiming)) as SystemTimingV2;
        
        let flatWordIndex = 0;
        updated.lines = updated.lines.map((line) => {
            let lineStart = line.start;
            let lineEnd = line.end;

            const wordsWithTimes = line.words.map((wordObj) => {
                const tp = timepoints[flatWordIndex];
                let start = wordObj.start;
                let end = wordObj.end;

                if (tp) {
                    start = tp.time;
                    // End time is start of next word, or start + 0.5s for the last word
                    const nextTp = timepoints[flatWordIndex + 1];
                    end = nextTp ? nextTp.time : tp.time + 0.5;
                }

                flatWordIndex++;
                return { ...wordObj, start, end };
            });

            // Update line start and end based on its words
            if (wordsWithTimes.length > 0) {
                const activeWords = wordsWithTimes.filter(w => w.start > 0 || w.end > 0);
                if (activeWords.length > 0) {
                    lineStart = activeWords[0].start;
                    lineEnd = activeWords[activeWords.length - 1].end;
                }
            }

            return {
                ...line,
                words: wordsWithTimes,
                start: lineStart,
                end: lineEnd
            };
        });

        // Calculate totalDuration
        if (timepoints.length > 0) {
            updated.totalDuration = timepoints[timepoints.length - 1].time + 1.0;
        }

        // Only update state if it is structurally different to prevent infinite loops
        if (JSON.stringify(updated) !== JSON.stringify(currentTiming)) {
            setCurrentTiming(updated);
        }
    }, [timepoints]);

    // Media Handlers
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
    };

    const resetAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setTimepoints([]);
        setIsPlaying(false);
        setSaved(false);
    };

    const handleSpacebar = useCallback((e: KeyboardEvent) => {
        if (e.code !== "Space") return;
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        
        e.preventDefault();
        if (!isPlaying) {
            togglePlay();
            return;
        }

        if (!audioRef.current) return;
        if (currentWordIndex >= words.length) return;

        const nextIndex = currentWordIndex;
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

    // Data Handlers
    const handleWordUpdate = (lIdx: number, wIdx: number, fields: Partial<SystemWordV2>) => {
        if (!currentTiming) return;
        const updated = { ...currentTiming };
        updated.lines[lIdx].words[wIdx] = {
            ...updated.lines[lIdx].words[wIdx],
            ...fields
        };
        setCurrentTiming(updated);
        setSaved(false);
    };

    const handleLineUpdate = (lIdx: number, fields: Partial<SystemLineV2>) => {
        if (!currentTiming) return;
        const updated = { ...currentTiming };
        updated.lines[lIdx] = { ...updated.lines[lIdx], ...fields };
        setCurrentTiming(updated);
        setSaved(false);
    };

    const handleLineTextUpdate = (lIdx: number, newText: string) => {
        if (!currentTiming) return;
        const updated = { ...currentTiming };
        const line = updated.lines[lIdx];
        line.line = newText;
        const newWords = newText.split(/\s+/).filter(Boolean);
        if (newWords.length === line.words.length) {
            line.words = line.words.map((w, i) => ({ ...w, word: newWords[i] }));
        }
        setCurrentTiming(updated);
        setSaved(false);
    };

    const handleFullTextSave = () => {
        const lines = tempFullText.split('\n').filter(l => l.trim().length > 0);
        const newTiming: SystemTimingV2 = {
            songId: Number(songId),
            version: "2.1",
            totalDuration: audioRef.current?.duration || 0,
            lines: lines.map(lineText => ({
                line: lineText,
                start: 0,
                end: 0,
                words: lineText.split(/\s+/).filter(Boolean).map(w => ({
                    word: w,
                    start: 0,
                    end: 0
                })),
                translations: { finglish: "", english: "" }
            }))
        };
        setCurrentTiming(newTiming);
        setShowFullTextEdit(false);
        setSaved(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedLyricsFa = currentTiming?.lines.map(l => l.line).join('\n') || lyricsFa;
            const res = await fetch(`/api/admin/worship/${songId}/timing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    timepoints: timepoints.filter(Boolean),
                    timing_data: currentTiming,
                    lyrics_fa: updatedLyricsFa
                }),
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
        <div className="min-h-[100dvh] bg-slate-950 text-slate-200 p-6 space-y-6" dir="rtl">
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
            <div className="flex items-center justify-between gap-4 bg-slate-900/50 border border-white/10 p-4 rounded-[2rem] shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Link href="/admin/worship" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 px-4 transition group" title="بازگشت به مدیریت سرودها">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold">خروج</span>
                    </Link>
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <button
                        onClick={() => {
                            setTempFullText(currentTiming?.lines.map(l => l.line).join('\n') || lyricsFa || "");
                            setShowFullTextEdit(true);
                        }}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-bold border border-white/5 transition-all"
                        title="ویرایش کل متن سرود به صورت یکجا"
                    >
                        <Edit3 className="w-4 h-4" />
                        ویرایش متن
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/20"
                        title="پیش‌نمایش زنده با استایل نهایی"
                    >
                        <Eye className="w-4 h-4" />
                        پیش‌نمایش زنده
                    </button>
                </div>
                
                <div className="text-center">
                    <h1 className="text-lg font-black text-white">{songTitleFa}</h1>
                    {songArtist && <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{songArtist}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => window.history.back()}
                        className="p-2.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl border border-transparent hover:border-rose-500/20"
                        title="بستن و خروج"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                        title="ذخیره تمامی تغییرات در دیتابیس"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        ذخیره
                    </button>
                </div>
            </div>

            {/* Error / Instructions */}
            {!audioUrl ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <div>
                        <h2 className="text-rose-500 font-bold text-lg">خطا: فایل صوتی یافت نشد</h2>
                        <p className="text-muted-foreground mt-1 text-sm">برای استفاده از استودیو، ابتدا فایل صوتی را بارگذاری کنید.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">⌨️</span>
                    <div>
                        <p className="text-xs font-bold text-foreground">کلید Space: پخش / ثبت کلمه بعدی</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">برای کلمات طولانی‌تر، کلید را در ابتدای شنیدن کلمه فشار دهید.</p>
                    </div>
                </div>
            )}

            {/* Timer & Main Controls */}
            {audioUrl && (
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-sm text-center">
                    <div className="text-6xl font-mono font-black text-primary tabular-nums tracking-wider mb-2">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-xs text-slate-400 mb-4 flex items-center justify-center gap-2">
                        <Layout className="w-3 h-3" />
                        <span>{markedCount} از {words.length} کلمه سینک شد</span>
                    </div>

                    {/* Syncing HUD */}
                    {currentWordIndex < words.length && (
                        <div className="bg-slate-950/60 rounded-3xl p-4 max-w-md mx-auto mb-6 border border-white/5 flex flex-col items-center gap-2 animate-in fade-in duration-300">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">کلمه فعلی برای ثبت (Spacebar)</span>
                            <div className="flex items-center justify-center gap-4 dir-ltr" dir="ltr">
                                {currentWordIndex > 0 && (
                                    <span className="text-sm text-slate-600 line-through opacity-50 font-[Vazirmatn]">{words[currentWordIndex - 1]}</span>
                                )}
                                <span className="text-4xl font-black text-primary animate-pulse scale-110 px-4 py-1.5 bg-primary/10 rounded-2xl border border-primary/20 font-[Vazirmatn]">{words[currentWordIndex]}</span>
                                {currentWordIndex + 1 < words.length && (
                                    <span className="text-sm text-slate-400 font-[Vazirmatn]">{words[currentWordIndex + 1]}</span>
                                )}
                            </div>
                        </div>
                    )}
                    {currentWordIndex >= words.length && words.length > 0 && (
                        <div className="bg-emerald-500/10 text-emerald-500 rounded-3xl p-4 max-w-md mx-auto mb-6 border border-emerald-500/20 text-sm font-bold animate-in fade-in duration-300">
                            🎉 تمامی کلمات با موفقیت سینک شدند!
                        </div>
                    )}
                    
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mx-auto max-w-sm mb-8 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button 
                            onClick={resetAudio} 
                            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                            title="شروع مجدد ضبط زمان‌ها از صفر"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={togglePlay} 
                            className={cn("px-12 py-4 rounded-2xl font-black text-xl transition shadow-lg", isPlaying ? "bg-rose-500 text-white" : "bg-primary text-primary-foreground")}
                            title={isPlaying ? "توقف پخش" : "شروع پخش موسیقی"}
                        >
                            {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || markedCount === 0} 
                            className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition"
                            title="ذخیره سریع"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : saved ? <CheckCircle className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Trilingual Grid Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className={cn("bg-slate-900/40 border border-white/5 rounded-3xl p-8 transition-all duration-300", selectedWord ? "lg:col-span-3" : "lg:col-span-4")}>
                    <div className="space-y-16">
                        {(() => {
                            let flatIndexCounter = 0;
                            return currentTiming?.lines.map((lineObj, lIdx) => (
                                <div key={lIdx} className="space-y-6 group/line">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <input 
                                            className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-xl font-bold text-white w-full py-1 transition-colors"
                                            value={lineObj.line}
                                            onChange={(e) => handleLineTextUpdate(lIdx, e.target.value)}
                                            dir="rtl"
                                            title={`ویرایش متن اصلی خط ${lIdx + 1}`}
                                            placeholder="متن فارسی را اینجا بنویسید..."
                                        />
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-x-6 gap-y-10 leading-loose items-end">
                                        {lineObj.words.map((wordObj, wIdx) => {
                                            const flatIndex = flatIndexCounter++;
                                            const isSelected = selectedWord?.lineIndex === lIdx && selectedWord?.wordIndex === wIdx;
                                            const isSynced = flatIndex < currentWordIndex;
                                            const isCurrent = flatIndex === currentWordIndex;
                                            const isUpcoming = flatIndex > currentWordIndex;

                                            return (
                                                <button
                                                    key={wIdx}
                                                    type="button"
                                                    onClick={() => setSelectedWord({ lineIndex: lIdx, wordIndex: wIdx })}
                                                    className={cn(
                                                        "relative flex flex-col items-center group/word transition-all duration-300", 
                                                        isSelected && "scale-110 z-10"
                                                    )}
                                                >
                                                    {wordObj.finglish && (
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-tighter mb-1 drop-shadow-sm transition-colors",
                                                            isCurrent ? "text-blue-300 font-bold" : isSynced ? "text-emerald-400" : "text-slate-500"
                                                        )}>
                                                            {wordObj.finglish}
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "text-2xl font-[Vazirmatn] px-3 py-1.5 rounded-xl transition-all shadow-md border",
                                                        isSelected && "ring-2 ring-primary/60 border-primary shadow-primary/10",
                                                        isCurrent && "bg-gradient-to-r from-primary to-blue-600 text-white font-black ring-4 ring-primary/40 animate-pulse shadow-lg scale-110 border-primary-foreground/30",
                                                        isSynced && !isCurrent && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
                                                        isUpcoming && !isSelected && "text-slate-400 bg-slate-900/40 border-white/5 opacity-50 hover:opacity-80"
                                                    )}>
                                                        {wordObj.word}
                                                    </span>
                                                    {wordObj.english && (
                                                        <span className={cn(
                                                            "text-[9px] font-serif italic mt-1 font-bold transition-colors",
                                                            isCurrent ? "text-emerald-300" : isSynced ? "text-emerald-500" : "text-slate-600"
                                                        )}>
                                                            {wordObj.english}
                                                        </span>
                                                    )}
                                                    <span className={cn(
                                                        "absolute -bottom-6 text-[8px] font-mono transition-colors",
                                                        isCurrent ? "text-primary font-bold animate-pulse" : isSynced ? "text-emerald-400/80" : "text-slate-600"
                                                    )}>
                                                        {(wordObj.start || 0).toFixed(2)}s
                                                    </span>
                                                    {isSelected && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Sidebar */}
                {selectedWord && currentTiming && currentTiming.lines[selectedWord.lineIndex] && (
                    <div className="lg:col-span-1 bg-slate-900 border border-primary/30 rounded-3xl p-6 shadow-2xl h-fit sticky top-6 animate-in slide-in-from-left duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-sm">ویرایش کلمه</h4>
                        <button 
                            onClick={() => setSelectedWord(null)} 
                            className="p-1 hover:bg-secondary rounded-lg"
                            title="بستن پنل ویرایش"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-950/50 p-6 rounded-2xl text-center border border-white/5 ring-1 ring-white/5">
                                <span className="text-3xl font-black text-white">{currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.word}</span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Languages className="w-3 h-3" /> Finglish</label>
                                <input 
                                    value={currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.finglish || ""} 
                                    onChange={(e) => handleWordUpdate(selectedWord.lineIndex, selectedWord.wordIndex, { finglish: e.target.value })} 
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none font-mono focus:border-primary/50 text-white transition-all shadow-inner" 
                                    dir="ltr" 
                                    title="متن فینگلیش کلمه"
                                    placeholder="e.g. Isa"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Languages className="w-3 h-3" /> English</label>
                                <input 
                                    value={currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.english || ""} 
                                    onChange={(e) => handleWordUpdate(selectedWord.lineIndex, selectedWord.wordIndex, { english: e.target.value })} 
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none font-serif focus:border-primary/50 text-white transition-all shadow-inner" 
                                    dir="ltr" 
                                    title="ترجمه انگلیسی کلمه"
                                    placeholder="English translation..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> شروع (Seconds)</label>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleWordUpdate(selectedWord.lineIndex, selectedWord.wordIndex, { start: Math.max(0, (currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.start || 0) - 0.1) })} 
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/5"
                                        title="کاهش زمان شروع (۰.۱ ثانیه)"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.start || 0} 
                                        onChange={(e) => handleWordUpdate(selectedWord.lineIndex, selectedWord.wordIndex, { start: parseFloat(e.target.value) })} 
                                        className="w-full bg-slate-950 text-center text-sm font-mono border-none focus:ring-0 text-white rounded-lg py-1.5" 
                                        title="زمان شروع به ثانیه"
                                        placeholder="0.00"
                                    />
                                    <button 
                                        onClick={() => handleWordUpdate(selectedWord.lineIndex, selectedWord.wordIndex, { start: (currentTiming.lines[selectedWord.lineIndex].words[selectedWord.wordIndex]?.start || 0) + 0.1 })} 
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/5"
                                        title="افزایش زمان شروع (۰.۱ ثانیه)"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedWord(null)} 
                                className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-xs font-black transition-all border border-emerald-500/20"
                                title="تأیید و بستن تنظیمات کلمه"
                            >
                                تأیید
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showFullTextEdit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
                        <div className="p-6 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-black text-xl flex items-center gap-3"><Type className="w-6 h-6 text-primary" /> ویرایش کل متن</h3>
                            <button 
                                onClick={() => setShowFullTextEdit(false)} 
                                className="p-2 hover:bg-secondary rounded-full"
                                title="بستن ویرایشگر متن"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 bg-slate-950">
                            <textarea value={tempFullText} onChange={(e) => setTempFullText(e.target.value)} className="w-full h-full min-h-[400px] bg-transparent border-none text-xl font-[Vazirmatn] text-slate-200 leading-loose outline-none resize-none" dir="rtl" placeholder="متن سرود..." />
                        </div>
                        <div className="p-6 border-t border-border/50 bg-secondary/20 flex justify-end gap-3">
                            <button onClick={() => setShowFullTextEdit(false)} className="px-6 py-2 rounded-xl text-sm font-bold">انصراف</button>
                            <button onClick={handleFullTextSave} className="px-8 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-xl">بازسازی</button>
                        </div>
                    </div>
                </div>
            )}

            {showPreview && currentTiming && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex flex-col animate-in fade-in duration-500">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-500"><Eye className="w-6 h-6" /></div>
                            <div>
                                <h3 className="font-black text-2xl text-white">پیش‌نمایش زنده</h3>
                                <p className="text-xs text-white/50">خروجی سه‌زبانه را در لحظه مشاهده کنید</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowPreview(false)} 
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-sm transition-all"
                                title="خروج از پیش‌نمایش"
                            >
                                بازگشت به ویرایشگر
                            </button>
                            <button 
                                onClick={() => setShowPreview(false)} 
                                className="p-3 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-all scale-110 active:scale-95"
                                title="بستن"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        <SmartWorshipPlayer 
                            title={songTitleFa}
                            audioSrc={audioUrl || ""}
                            timingData={currentTiming}
                            onClose={() => setShowPreview(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function Loader2(props: any) {
    return <RotateCcw {...props} className={cn(props.className, "animate-spin")} />;
}
