"use client";

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Edit2, Trash2, Youtube, Music, Clock,
    Sparkles, Languages, Loader2, Save, X, Upload, CheckCircle,
    Database, Guitar, Eraser, Play, Eye, Zap, Type, Download, Link as LinkIcon
} from "lucide-react";
import { 
    type WorshipSong,
    getWorshipSongs, 
    createWorshipSong, 
    updateWorshipSong, 
    deleteWorshipSong, 
    extractWorshipSongAI
} from "@/actions/worship";
import { uploadToHiDrive, moveExternalToInternal } from "@/actions/hidrive";
import { migrateLegacyWorshipData } from "@/actions/migration";
import { SmartWorshipPlayer, getSafeAudioUrl } from "@/components/worship/SmartWorshipPlayer";
import BulkEnrichmentModal from "./BulkEnrichmentModal";
import CronLogsViewer from "@/components/admin/CronLogsViewer";
import Link from "next/link";

export default function WorshipAdminClient() {
    const [songs, setSongs] = useState<WorshipSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "audio" | "timing" | "missing_lyrics">("all");

    // Editor State
    const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ inserted: number; errors: number } | null>(null);

    // AI State
    const [isTranslating, setIsTranslating] = useState(false);
    const [isGeneratingChords, setIsGeneratingChords] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [previewSong, setPreviewSong] = useState<WorshipSong | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);
    const [showEnrichmentHub, setShowEnrichmentHub] = useState(false);
    const [processingAiId, setProcessingAiId] = useState<string | null>(null);

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async () => {
        setIsLoading(true);
        const data = await getWorshipSongs();
        setSongs(data);
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSong) return;
        setIsSaving(true);
        try {
            if (editingSong.id.startsWith('new-')) {
                // Ensure the id field is omitted so PostgreSQL generates the UUID
                const { id, ...dataToSave } = editingSong; 
                await createWorshipSong(dataToSave);
            } else {
                await updateWorshipSong(editingSong.id, editingSong);
            }
            setEditingSong(null);
            await loadSongs();
        } catch (error) {
            console.error("Failed to save:", error);
            alert("خطا در ذخیره سرود");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("آیا از حذف این سرود اطمینان دارید؟")) return;
        try {
            await deleteWorshipSong(id);
            await loadSongs();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("خطا در حذف سرود");
        }
    };

    // --- Manual JSON Import Handler ---
    const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);
        try {
            const text = await file.text();
            const songs = JSON.parse(text);
            if (!Array.isArray(songs)) throw new Error('فایل باید آرایه JSON باشد');

            const res = await fetch('/api/admin/import-songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setImportResult({ inserted: data.inserted, errors: data.errors });
            await loadSongs();
        } catch (err: any) {
            alert('خطا در وارد کردن فایل: ' + err.message);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };
    const handleLegacyMigrate = async () => {
        if (!confirm("آیا می‌خواهید تمام اطلاعات از پروژه قدیمی (JSON) وارد شده و مشکلات ثبت‌نام اصلاح گردد؟")) return;
        setIsMigrating(true);
        try {
            const res = await migrateLegacyWorshipData();
            if (res.success) {
                alert(`مهاجرت با موفقیت انجام شد: ${res.results?.[1]?.count || 0} سرود بروزرسانی شد.`);
                await loadSongs();
            } else {
                alert("خطا در مهاجرت: " + res.error);
            }
        } catch (err: any) {
            alert("خطا: " + err.message);
        } finally {
            setIsMigrating(false);
        }
    };
    // --- End Import Handler ---

    const openNewSong = () => {
        setEditingSong({
            id: `new-${Date.now()}`,
            title_fa: "",
            title_en: "",
            artist: "",
            youtube_id: "",
            audio_url: "",
            lyrics_fa: "",
            lyrics_finglish: "",
            lyrics_en: "",
            chords: ""
        });
    };

    // --- AI Handlers ---
    const handleAiTranslate = async () => {
        if (!editingSong?.lyrics_fa) {
            alert("ابتدا متن سرود فارسی را وارد کنید.");
            return;
        }
        setIsTranslating(true);
        try {
            const res = await fetch("/api/ai/worship-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "translate",
                    lyricsFA: editingSong.lyrics_fa,
                    titleFA: editingSong.title_fa,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEditingSong((prev: WorshipSong | null) => prev ? {
                ...prev,
                lyrics_en: data.result
            } : prev);
        } catch (err: any) {
            alert("خطا در ترجمه: " + err.message);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleAiChords = async () => {
        if (!editingSong?.lyrics_fa) {
            alert("ابتدا متن سرود فارسی را وارد کنید.");
            return;
        }
        setIsGeneratingChords(true);
        try {
            const res = await fetch("/api/ai/worship-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "chords",
                    lyricsFA: editingSong.lyrics_fa,
                    titleFA: editingSong.title_fa,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEditingSong(prev => prev ? { ...prev, chords: data.result } : prev);
        } catch (err: any) {
            alert("خطا در تولید آکورد: " + err.message);
        } finally {
            setIsGeneratingChords(false);
        }
    };
    
    const handleAiClean = async () => {
        if (!editingSong?.lyrics_fa) {
            alert("ابتدا متن سرود را وارد کنید.");
            return;
        }
        setIsCleaning(true);
        try {
            const res = await fetch("/api/ai/worship-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "clean",
                    lyricsFA: editingSong.lyrics_fa,
                    titleFA: editingSong.title_fa,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEditingSong(prev => prev ? { ...prev, lyrics_fa: data.result } : prev);
        } catch (err: any) {
            alert("خطا در هموارسازی متن: " + err.message);
        } finally {
            setIsCleaning(false);
        }
    };
    
    const handleConvertToInternal = async () => {
        if (!editingSong?.audio_url || !editingSong.audio_url.startsWith('http')) {
            alert("لینک خارجی معتیر یافت نشد.");
            return;
        }
        setIsConverting(true);
        try {
            const res = await moveExternalToInternal(editingSong.audio_url, editingSong.title_fa);
            if (res.success && res.url) {
                setEditingSong(prev => prev ? { ...prev, audio_url: res.url! } : prev);
                alert("✨ فایل با موفقیت به استوریج داخلی منتقل شد!");
            } else {
                throw new Error(res.error);
            }
        } catch (err: any) {
            alert("خطا در انتقال فایل: " + err.message);
        } finally {
            setIsConverting(false);
        }
    };

    const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingSong) return;

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const buffer = Buffer.from(reader.result as ArrayBuffer);
                const res = await uploadToHiDrive(buffer, file.name);
                if (res.success && res.url) {
                    setEditingSong(prev => prev ? { ...prev, audio_url: res.url! } : prev);
                    alert("✨ فایل با موفقیت آپلود شد!");
                } else {
                    alert("خطا در آپلود: " + res.error);
                }
                setIsUploading(false);
            };
            reader.readAsArrayBuffer(file);
        } catch (err: any) {
            alert("خطا در خواندن فایل: " + err.message);
            setIsUploading(false);
        }
    };
    const handleExtractRowAI = async (id: string) => {
        // Removed native window.confirm to prevent browser blocking issues
        setProcessingAiId(id);
        try {
            console.log("[Client] Triggering AI Extraction for:", id);
            const res = await extractWorshipSongAI(id);
            if (!res.success) {
                alert("خطا در استخراج هوش مصنوعی: " + res.message);
            } else {
                alert("✨ اطلاعات (ترجمه انگلیسی، فینگلیش و آکوردها) با موفقیت استخراج شد!");
                await loadSongs();
            }
        } catch (err: any) {
            alert("خطا در فراخوانی سرویس هوش مصنوعی: " + err.message);
        } finally {
            setProcessingAiId(null);
        }
    };
    // --- End AI Handlers ---

    const filteredSongs = songs.filter(s => {
        const matchSearch = s.title_fa.includes(search) ||
        (s.title_en && s.title_en.toLowerCase().includes(search.toLowerCase())) ||
        (s.artist && s.artist.includes(search));

        if (!matchSearch) return false;

        if (filter === "audio") return !!s.audio_url;
        if (filter === "timing") return s.timepoints && s.timepoints.length > 5;
        if (filter === "missing_lyrics") return !s.lyrics_fa;

        return true;
    });

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-6" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground mb-2">مدیریت سرودهای پرستشی</h1>
                    <p className="text-muted-foreground">افزودن، ویرایش و استخراج خودکار با هوش مصنوعی.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Import Result Badge */}
                    {importResult && (
                        <span className="flex items-center gap-1.5 text-sm text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                            <CheckCircle className="w-4 h-4" /> {importResult.inserted} سرود وارد شد
                        </span>
                    )}

                    <button
                        onClick={handleLegacyMigrate}
                        disabled={isMigrating}
                        className={`flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm ${isMigrating ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title="مهاجرت داده‌های قدیمی و اصلاح تریگرهای دیتابیس"
                    >
                        {isMigrating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                        {isMigrating ? 'در حال مهاجرت...' : 'Migrate Legacy'}
                    </button>

                    {/* Import JSON Button */}
                    <label className={`flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-xl font-bold transition cursor-pointer border border-border/50 ${isImporting ? 'opacity-60 pointer-events-none' : ''}`} title="وارد کردن فایل JSON">
                        {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {isImporting ? 'در حال وارد کردن...' : 'Import JSON'}
                        <input type="file" accept=".json" className="hidden" onChange={handleJsonImport} disabled={isImporting} />
                    </label>

                    <button
                        onClick={() => setShowEnrichmentHub(true)}
                        className="flex items-center gap-2 bg-indigo-600 border-indigo-400/20 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm border"
                        title="مرکز هوشمند غنی‌سازی اطلاعات (Bulk AI & Audio Match)"
                    >
                        <Zap className="w-5 h-5" /> هوشمند سازی
                    </button>

                    <CronLogsViewer />

                    <button
                        onClick={openNewSong}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> سرود جدید
                    </button>
                </div>
            </div>

            {/* Editor Modal */}
            {editingSong && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setEditingSong(null)}
                >
                    <div 
                        className="bg-background text-foreground rounded-2xl w-full max-w-4xl shadow-2xl border border-border/50 max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                            <h2 className="text-xl font-bold">
                                {editingSong.id.startsWith('new-') ? 'افزودن سرود جدید' : 'ویرایش سرود'}
                            </h2>
                            <button 
                                type="button" 
                                onClick={() => setEditingSong(null)} 
                                className="p-2 hover:bg-black/10 rounded-full transition" 
                                title="بستن فرم"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Title row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">نام سرود (فارسی) *</label>
                                    <input
                                        required
                                        value={editingSong.title_fa || ''}
                                        onChange={e => setEditingSong({ ...editingSong, title_fa: e.target.value })}
                                        className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none font-bold placeholder-muted-foreground"
                                        placeholder="مثال: عیسی نام تو"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">نام سرود (English)</label>
                                    <input
                                        value={editingSong.title_en || ''}
                                        onChange={e => setEditingSong({ ...editingSong, title_en: e.target.value })}
                                        className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none placeholder-muted-foreground"
                                        dir="ltr"
                                        placeholder="e.g. Jesus Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">دسته‌بندی (Category)</label>
                                    <input
                                        value={(editingSong as any).category || ''}
                                        onChange={e => setEditingSong({ ...editingSong, ...({ category: e.target.value } as any) })}
                                        className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none placeholder-muted-foreground"
                                        placeholder="مثال: پرستشی، جلال، فیض"
                                    />
                                </div>
                            </div>

                            {/* Artist, Audio & Video Links */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">خواننده / گروه</label>
                                    <input
                                        value={editingSong.artist || ''}
                                        onChange={e => setEditingSong({ ...editingSong, artist: e.target.value })}
                                        className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none placeholder-muted-foreground"
                                        placeholder="مثال: پرستندگان"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                                        <Youtube className="w-4 h-4 text-red-500" /> لینک ویدیو (YouTube ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSong.youtube_id || ''}
                                        onChange={(e) => setEditingSong({ ...editingSong, youtube_id: e.target.value })}
                                        className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="e.g. dQw4w9WgXcQ"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="block text-sm font-bold text-muted-foreground flex items-center gap-1">
                                    <Music className="w-4 h-4 text-blue-500" /> لینک فایل صوتی
                                </label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editingSong.audio_url || ''}
                                            onChange={(e) => setEditingSong({ ...editingSong, audio_url: e.target.value })}
                                            className="flex-1 bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none dir-ltr"
                                            dir="ltr"
                                            placeholder="https://webdav.hidrive.ionos.com/.../song.mp3"
                                        />
                                        {editingSong.audio_url?.startsWith('http') && (
                                            <button
                                                type="button"
                                                onClick={handleConvertToInternal}
                                                disabled={isConverting}
                                                className="px-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 whitespace-nowrap text-xs font-bold"
                                                title="انتقال لینک خارجی به استوریج داخلی ما"
                                            >
                                                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                انتقال به استوریج
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className={`flex-1 flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {isUploading ? 'در حال آپلود...' : 'آپلود فایل صوتی مستقیم (HiDrive)'}
                                            <input type="file" accept="audio/*" className="hidden" onChange={handleAudioFileUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/* Persian Lyrics */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-muted-foreground">متن سرود (فارسی)</label>
                                    <p className="text-xs text-muted-foreground">بخش‌ها را با خط خالی جدا کنید</p>
                                </div>
                                <textarea
                                    rows={7}
                                    value={editingSong.lyrics_fa || ''}
                                    onChange={e => setEditingSong({ ...editingSong, lyrics_fa: e.target.value })}
                                    className="w-full bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed font-[Vazirmatn] placeholder-muted-foreground"
                                    placeholder="شبان من تویی خداوندم..."
                                />
                            </div>

                            {/* Finglish Lyrics */}
                            <div className="space-y-2 mt-4">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Type className="w-4 h-4 text-orange-400" />
                                    فینگلیش (Finglish)
                                </label>
                                <textarea
                                    rows={7}
                                    value={editingSong.lyrics_finglish || ''}
                                    onChange={e => setEditingSong({ ...editingSong, lyrics_finglish: e.target.value })}
                                    className="w-full bg-secondary/50 text-foreground border border-orange-500/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none resize-none leading-relaxed font-mono placeholder-muted-foreground"
                                    dir="ltr"
                                    placeholder="Shabane man toyi..."
                                />
                            </div>

                            {/* AI Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={handleAiTranslate}
                                    disabled={isTranslating || !editingSong.lyrics_fa}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                    {isTranslating ? 'ترجمه...' : 'ترجمه انگلیسی'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAiChords}
                                    disabled={isGeneratingChords || !editingSong.lyrics_fa}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingChords ? <Loader2 className="w-4 h-4 animate-spin" /> : <Guitar className="w-4 h-4" />}
                                    {isGeneratingChords ? 'تولید آکورد...' : 'تولید آکورد'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAiClean}
                                    disabled={isCleaning || !editingSong.lyrics_fa}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                                    {isCleaning ? 'در حال تمیزکاری...' : 'پاکسازی متن AI'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewSong(editingSong)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-sm transition"
                                    title="پیش‌نمایش زنده کارائوکه"
                                >
                                    <Eye className="w-4 h-4" />
                                    پیش‌نمایش سه‌زبانه
                                </button>
                            </div>

                            {/* English Lyrics (auto-filled by AI or manual) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-blue-400" />
                                    ترجمه انگلیسی (پر شده توسط AI یا دستی)
                                </label>
                                <textarea
                                    rows={7}
                                    value={editingSong.lyrics_en || ''}
                                    onChange={e => setEditingSong({ ...editingSong, lyrics_en: e.target.value })}
                                    className="w-full bg-secondary/50 text-foreground border border-blue-500/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed font-serif placeholder-muted-foreground"
                                    dir="ltr"
                                    placeholder="AI will fill this in, or type manually..."
                                />
                            </div>

                            {/* Chords (auto-filled by AI) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <Guitar className="w-4 h-4 text-purple-400" />
                                    آکوردها (پر شده توسط AI یا دستی)
                                </label>
                                <textarea
                                    rows={7}
                                    value={(editingSong as any).chords || ''}
                                    onChange={e => setEditingSong({ ...editingSong, ...({ chords: e.target.value } as any) })}
                                    className="w-full bg-secondary/50 text-foreground border border-purple-500/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed font-mono text-sm placeholder-muted-foreground"
                                    dir="ltr"
                                    placeholder="Am    G    C&#10;AI will generate chord chart here..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <button type="button" onClick={() => setEditingSong(null)} className="px-5 py-2.5 rounded-xl font-bold hover:bg-secondary transition">
                                    انصراف
                                </button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition shadow-sm disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Songs Table */}
            <div className="bg-secondary/10 rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-secondary/20">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        title="جستجو"
                        placeholder="جستجوی سرود بر اساس نام، فینگلیش یا خواننده..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full font-medium"
                    />
                </div>
                
                {/* 🎛 Instant Filter Chips */}
                <div className="flex items-center gap-2 p-3 bg-card border-b border-border/50 overflow-x-auto hide-scrollbar">
                    <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition whitespace-nowrap ${filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/50"}`}>همه سرودها</button>
                    <button onClick={() => setFilter("audio")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition whitespace-nowrap ${filter === "audio" ? "bg-blue-500 text-white shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/50"}`}>🎵 دارای فایل صوتی</button>
                    <button onClick={() => setFilter("timing")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition whitespace-nowrap ${filter === "timing" ? "bg-emerald-500 text-white shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/50"}`}>⭐ کارائوکه فعال</button>
                    <button onClick={() => setFilter("missing_lyrics")} className={`px-4 py-1.5 rounded-full text-sm font-bold transition whitespace-nowrap ${filter === "missing_lyrics" ? "bg-yellow-500 text-white shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/50"}`}>⚠️ بدون متن فارسی</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse table-fixed">
                        <thead>
                            <tr className="bg-secondary/30 border-b border-border/10">
                                <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-[35%]">عنوان سرود</th>
                                <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-[15%]">هنرمند</th>
                                <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-[10%]">رسانه</th>
                                <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-[25%]">وضعیت محتوا</th>
                                <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground w-[15%] text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/5">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />در حال بارگذاری...</td></tr>
                            ) : filteredSongs.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">هیچ سرودی یافت نشد.</td></tr>
                            ) : (
                                filteredSongs.map((song) => {
                                    const timingData = (song.timing_data as any) || {};
                                    const hasTiming = timingData?.lines?.length > 0;
                                    const hasFinglishField = !!song.lyrics_finglish;
                                    const hasEnglishField = !!song.lyrics_en;
                                    
                                    return (
                                        <tr key={song.id} className="hover:bg-secondary/20 transition-colors group border-b border-border/10">
                                            <td className="p-4 align-top w-[35%]">
                                                <div className="font-bold text-foreground break-words">{song.title_fa}</div>
                                                {song.title_en && <div className="text-xs text-muted-foreground font-serif mt-1 opacity-70 truncate" dir="ltr">{song.title_en}</div>}
                                            </td>
                                            <td className="p-4 align-top text-muted-foreground w-[15%] overflow-hidden">
                                                <div className="break-all">{song.artist || '-'}</div>
                                            </td>
                                            <td className="p-4 align-top w-[10%]">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    {song.youtube_id && <span title="دارای ویدیو یوتیوب"><Youtube className="w-4 h-4 text-red-500" /></span>}
                                                    {song.audio_url && <span title="دارای فایل صوتی محلی"><Music className="w-4 h-4 text-blue-500" /></span>}
                                                    {(!song.youtube_id && !song.audio_url) && '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top w-[25%]">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {song.lyrics_fa ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20" title="متن فارسی ثبت شده">فارسی ✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20" title="نیاز به ثبت متن فارسی">بدون متن</span>
                                                    )}
                                                    {hasEnglishField && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20" title="دارای ترجمه انگلیسی">EN ✓</span>
                                                    )}
                                                    {hasTiming ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20" title="کارائوکه تایمینگ فعال است">
                                                            <Clock className="w-3 h-3" /> {timingData.lines.length} خط
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/20" title="فاقد تایمینگ سینک شده"><Clock className="w-3 h-3" /> تایم ✗</span>
                                                    )}
                                                    {hasFinglishField && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[10px] font-black border border-orange-500/20 uppercase">Finglish ✓</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-left">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    
                                                    {/* AI Wizard Button */}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExtractRowAI(song.id);
                                                        }}
                                                        disabled={processingAiId === song.id}
                                                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition disabled:opacity-50" 
                                                        title="استخراج خودکار هوش مصنوعی شامل ترجمه، آکورد و زمانبندی دقیق با Audio (AI Wizard)"
                                                    >
                                                        {processingAiId === song.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    </button>
                                                    
                                                    {/* Manual Timing Studio Button */}
                                                    <Link href={`/admin/worship/timing/${song.id}`} className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition" title="استودیو کارائوکه - ثبت دستی زمان‌بندی (Spacebar)">
                                                        <Clock className="w-4 h-4" />
                                                    </Link>
                                                    
                                                    {/* Edit Text Button */}
                                                    <button onClick={() => setEditingSong(song)} className="p-2 rounded-lg bg-secondary text-primary hover:bg-primary/20 transition" title="ویرایش اطلاعات">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {/* Delete Button */}
                                                    <button onClick={() => handleDelete(song.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition" title="حذف">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global AI Processing Toast */}
            {processingAiId && (
                <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                    <div>
                        <h4 className="font-bold">هوش مصنوعی در حال استخراج اطلاعات...</h4>
                        <p className="text-sm text-indigo-100 opacity-90 mt-1">این عملیات ممکن است ۱ دقیقه طول بکشد. لطفا پنجره را نبندید.</p>
                    </div>
                </div>
            )}

            {/* Professional Preview Modal (Requested Feature) */}
            {previewSong && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4">
                    <button 
                        onClick={() => setPreviewSong(null)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[110]"
                        title="بستن پیش‌نمایش"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <div className="w-full max-w-5xl h-[80vh] bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
                        <SmartWorshipPlayer 
                            timingData={previewSong.timing_data as any} 
                            audioSrc={previewSong.audio_url ? getSafeAudioUrl(previewSong.audio_url) : ""}
                            title={previewSong.title_fa}
                            viewOnly={true}
                            onClose={() => setPreviewSong(null)}
                        />
                        
                        {/* Audio fallback message if no URL */}
                        {!previewSong.audio_url && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-8 text-center pointer-events-none">
                                <Music className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-bold">پیش‌نمایش بدون صدا</h3>
                                <p className="text-muted-foreground mt-2">این سرود فاقد فایل صوتی است. پیش‌نمایش فقط شامل نمایش بصری متن‌ها می‌باشد.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-8 text-white/40 text-sm flex items-center gap-2 font-mono uppercase tracking-widest">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Professional Trilingual Preview Mode
                    </div>
                </div>
            )}

            {/* Enrichment Hub Modal */}
            {showEnrichmentHub && (
                <BulkEnrichmentModal onClose={() => {
                    setShowEnrichmentHub(false);
                    loadSongs();
                }} />
            )}

            {/* Pagination / Footer */}
            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground bg-card p-4 rounded-xl border border-border/50">
                <div>نمایش {filteredSongs.length} سرود</div>
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" /> church_worship_songs active
                </div>
            </div>
        </div>
    );
}
