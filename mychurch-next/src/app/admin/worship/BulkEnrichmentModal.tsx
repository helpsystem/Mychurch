"use client";

import React, { useState, useEffect } from "react";
import { 
    X, Sparkles, Music, Languages, Clock, 
    CheckCircle, AlertCircle, Loader2, Play, 
    Link as LinkIcon, RefreshCw, Zap
} from "lucide-react";
import { 
    getWorshipEnrichmentStats, 
    scanMissingAudio, 
    linkWorshipAudio,
    extractWorshipSongAI,
    getWorshipSongs
} from "@/actions/worship";

interface Suggestion {
    songId: string;
    title: string;
    fileName: string;
    score: number;
}

interface Stats {
    total: number;
    missing_audio: number;
    missing_lyrics: number;
    missing_timing: number;
}

export default function BulkEnrichmentModal({ onClose }: { onClose: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAction, setCurrentAction] = useState("");
    const [linkedCount, setLinkedCount] = useState(0);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const data = await getWorshipEnrichmentStats();
        setStats(data);
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const res = await scanMissingAudio();
            if (res.success && res.suggestions) {
                setSuggestions(res.suggestions);
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleLinkAll = async () => {
        setIsProcessing(true);
        setCurrentAction("در حال اتصال فایل‌های صوتی متناظر...");
        let count = 0;
        for (let i = 0; i < suggestions.length; i++) {
            const s = suggestions[i];
            await linkWorshipAudio(s.songId, s.fileName);
            count++;
            setProgress(Math.round(((i + 1) / suggestions.length) * 100));
        }
        setLinkedCount(count);
        setSuggestions([]);
        await loadStats();
        setIsProcessing(false);
        setProgress(0);
        setCurrentAction("");
    };

    const handleLinkSingle = async (songId: string, fileName: string) => {
        await linkWorshipAudio(songId, fileName);
        setSuggestions(prev => prev.filter(s => s.songId !== songId));
        setLinkedCount(prev => prev + 1);
        await loadStats();
    };

    const handleBulkAI = async () => {
        const allSongs = await getWorshipSongs();
        const pendingSongs = allSongs.filter(s => 
            s.lyrics_fa && 
            (!s.timing_data || !((s.timing_data as any)?.lines?.length > 0))
        );

        if (pendingSongs.length === 0) {
            alert("تلفن همراه: تمام سرودهای دارای متن، قبلاً پردازش شده‌اند.");
            return;
        }

        if (!confirm(`آیا می‌خواهید ${pendingSongs.length} سرود را برای استخراج خودکار (ترجمه و تایمینگ) در صف قرار دهید؟`)) return;

        setIsProcessing(true);
        setProgress(0);
        
        for (let i = 0; i < pendingSongs.length; i++) {
            const song = pendingSongs[i];
            setCurrentAction(`در حال پردازش: ${song.title_fa}...`);
            await extractWorshipSongAI(song.id);
            setProgress(Math.round(((i + 1) / pendingSongs.length) * 100));
        }

        await loadStats();
        setIsProcessing(false);
        setProgress(0);
        setCurrentAction("");
        alert("✨ عملیات غنی‌سازی دسته‌جمعی با موفقیت به پایان رسید!");
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">مرکز هوشمند غنی‌سازی اطلاعات</h2>
                            <p className="text-xs text-slate-400 mt-0.5">مدیریت خودکار فایل‌های صوتی، ترجمه و تایمینگ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={<Music className="text-blue-400" />} label="بدون فایل صوتی" value={stats?.missing_audio || 0} color="blue" />
                        <StatCard icon={<Languages className="text-amber-400" />} label="بدون متن فارسی" value={stats?.missing_lyrics || 0} color="amber" />
                        <StatCard icon={<Clock className="text-rose-400" />} label="بدون تایمینگ" value={stats?.missing_timing || 0} color="rose" />
                        <StatCard icon={<CheckCircle className="text-emerald-400" />} label="کل سرودها" value={stats?.total || 0} color="emerald" />
                    </div>

                    {/* Actions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Audio Linking Card */}
                        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Music className="w-5 h-5 text-indigo-400" /> اتصال خودکار مدیا
                                </h3>
                                {linkedCount > 0 && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{linkedCount} فایل متصل شد</span>}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                اسکن پوشه <code className="text-xs bg-black/30 px-1 rounded text-indigo-300">/audio/kalameh</code> و یافتن فایل‌های صوتی که نام‌شان با سرودها همخوانی دارد.
                            </p>
                            
                            {suggestions.length === 0 ? (
                                <button 
                                    onClick={handleScan}
                                    disabled={isScanning || isProcessing}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    اسکن فایل‌های صوتی
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {suggestions.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5 text-xs group">
                                                <div className="flex flex-col truncate max-w-[70%]">
                                                    <span className="text-white font-bold truncate">{s.title}</span>
                                                    <span className="text-slate-500 truncate">{s.fileName}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleLinkSingle(s.songId, s.fileName)}
                                                    className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-md transition"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleLinkAll}
                                        disabled={isProcessing}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                    >
                                        اتصال تمام {suggestions.length} مورد
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bulk AI Card */}
                        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" /> استخراج هوشمند (Batch)
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                تمام سرودهایی که «فایل صوتی» و «متن فارسی» دارند اما فاقد ترجمه یا تایمینگ هستند را به صورت خودکار با Gemini پردازش کنید.
                            </p>
                            <button 
                                onClick={handleBulkAI}
                                disabled={isProcessing}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                شروع عملیات دسته‌جمعی
                            </button>
                            <div className="text-[10px] text-center text-slate-500 italic">
                                پردازش هر سرود حدود ۳۰ تا ۶۰ ثانیه زمان می‌برد.
                            </div>
                        </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl animate-in slide-in-from-bottom-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-indigo-400">{currentAction}</span>
                                <span className="text-sm font-black text-indigo-400">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900/80 border-t border-white/5 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "border-blue-500/20 bg-blue-500/5",
        amber: "border-amber-500/20 bg-amber-500/5",
        rose: "border-rose-500/20 bg-rose-500/5",
        emerald: "border-emerald-500/20 bg-emerald-500/5",
    };

    return (
        <div className={`p-4 rounded-2xl border ${colorClasses[color]} flex flex-col items-center justify-center text-center`}>
            <div className="mb-2">{icon}</div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold mt-1">{label}</div>
        </div>
    );
}
