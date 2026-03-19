"use client";

import React, { useState, useEffect } from "react";
import { type WorshipSong, getWorshipSongs, createWorshipSong, updateWorshipSong, deleteWorshipSong, extractWorshipSongAI } from "@/actions/worship";
import { Plus, Edit2, Trash2, Search, Youtube, Music, Save, X, Loader2, Languages, Guitar, Upload, CheckCircle, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function WorshipAdminClient() {
    const [songs, setSongs] = useState<WorshipSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Editor State
    const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ inserted: number; errors: number } | null>(null);

    // AI State
    const [isTranslating, setIsTranslating] = useState(false);
    const [isGeneratingChords, setIsGeneratingChords] = useState(false);
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
            setEditingSong(prev => prev ? {
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
    
    // Server Action Master AI Extractor
    const handleExtractRowAI = async (id: string) => {
        if (!confirm("آیا می‌خواهید هوش مصنوعی تمام اطلاعات (آکورد، ترجمه، تایمینگ صوتی) این سرود را استخراج کند؟ این پروسه ممکن است ۱ دقیقه زمان ببرد.")) return;
        
        setProcessingAiId(id);
        try {
            const res = await extractWorshipSongAI(id);
            if (!res.success) {
                alert("خطا در استخراج هوش مصنوعی: " + res.message);
            } else {
                alert("اطلاعات با موفقیت استخراج شد!");
                await loadSongs();
            }
        } catch (err: any) {
            alert("خطا: " + err.message);
        } finally {
            setProcessingAiId(null);
        }
    };
    // --- End AI Handlers ---

    const filteredSongs = songs.filter(s =>
        s.title_fa.includes(search) ||
        (s.title_en && s.title_en.toLowerCase().includes(search.toLowerCase())) ||
        (s.artist && s.artist.includes(search))
    );

    return (
        <div className="max-w-7xl mx-auto p-6" dir="rtl">
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

                    {/* Import JSON Button */}
                    <label className={`flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-xl font-bold transition cursor-pointer border border-border/50 ${isImporting ? 'opacity-60 pointer-events-none' : ''}`} title="وارد کردن فایل JSON">
                        {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {isImporting ? 'در حال وارد کردن...' : 'Import JSON'}
                        <input type="file" accept=".json" className="hidden" onChange={handleJsonImport} disabled={isImporting} />
                    </label>

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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-2xl w-full max-w-4xl shadow-2xl border border-border/50 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                            <h2 className="text-xl font-bold">
                                {editingSong.id.startsWith('new-') ? 'افزودن سرود جدید' : 'ویرایش سرود'}
                            </h2>
                            <button onClick={() => setEditingSong(null)} className="p-2 hover:bg-black/10 rounded-full transition" title="بستن">
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
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none font-bold"
                                        placeholder="مثال: عیسی نام تو"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">نام سرود (English)</label>
                                    <input
                                        value={editingSong.title_en || ''}
                                        onChange={e => setEditingSong({ ...editingSong, title_en: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        dir="ltr"
                                        placeholder="e.g. Jesus Your Name"
                                    />
                                </div>
                            </div>

                            {/* Artist / YouTube / Audio row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground">خواننده / گروه</label>
                                    <input
                                        value={editingSong.artist || ''}
                                        onChange={e => setEditingSong({ ...editingSong, artist: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="مثال: پرستندگان"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground flex items-center gap-1"><Youtube className="w-4 h-4 text-red-500" /> شناسه یوتیوب</label>
                                    <input
                                        value={editingSong.youtube_id || ''}
                                        onChange={e => setEditingSong({ ...editingSong, youtube_id: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        dir="ltr"
                                        placeholder="e.g. dQw4w9WgXcQ"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground flex items-center gap-1"><Music className="w-4 h-4 text-blue-500" /> لینک فایل صوتی (Audio)</label>
                                    <input
                                        value={editingSong.audio_url || ''}
                                        onChange={e => setEditingSong({ ...editingSong, audio_url: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        dir="ltr"
                                        placeholder="/worship/audio/123.mp3"
                                    />
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
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed font-[Vazirmatn]"
                                    placeholder="شبان من تویی خداوندم..."
                                />
                            </div>

                            {/* AI Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleAiTranslate}
                                    disabled={isTranslating || !editingSong.lyrics_fa}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTranslating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Languages className="w-4 h-4" />
                                    )}
                                    {isTranslating ? 'در حال ترجمه...' : 'ترجمه به انگلیسی با AI'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAiChords}
                                    disabled={isGeneratingChords || !editingSong.lyrics_fa}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingChords ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Guitar className="w-4 h-4" />
                                    )}
                                    {isGeneratingChords ? 'در حال تولید آکورد...' : 'تولید آکورد گیتار با AI'}
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
                                    className="w-full bg-secondary/50 border border-blue-500/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed font-serif"
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
                                    className="w-full bg-secondary/50 border border-purple-500/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed font-mono text-sm"
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
                        placeholder="جستجوی سرود بر اساس نام یا خواننده..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full font-medium"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-border/50 text-muted-foreground text-sm">
                                <th className="p-4 font-bold">نام سرود</th>
                                <th className="p-4 font-bold">خواننده</th>
                                <th className="p-4 font-bold">مدیا</th>
                                <th className="p-4 font-bold">وضعیت AI / تایمینگ</th>
                                <th className="p-4 font-bold text-left">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />در حال بارگذاری...</td></tr>
                            ) : filteredSongs.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">هیچ سرودی یافت نشد.</td></tr>
                            ) : (
                                filteredSongs.map(song => {
                                    const hasTiming = song.timepoints && song.timepoints.length > 5;
                                    
                                    return (
                                        <tr key={song.id} className="hover:bg-secondary/20 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-foreground">{song.title_fa}</div>
                                                {song.title_en && <div className="text-xs text-muted-foreground font-serif" dir="ltr">{song.title_en}</div>}
                                            </td>
                                            <td className="p-4 text-muted-foreground">{song.artist || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    {song.youtube_id && <Youtube className="w-4 h-4 text-red-500" title="دارای ویدیو یوتیوب" />}
                                                    {song.audio_url && <Music className="w-4 h-4 text-blue-500" title="دارای فایل صوتی محلی" />}
                                                    {(!song.youtube_id && !song.audio_url) && '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {song.lyrics_fa ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20" title="متن فارسی ثبت شده">فارسی ✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20" title="نیاز به ثبت متن فارسی">بدون متن</span>
                                                    )}
                                                    {song.lyrics_en && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20" title="دارای ترجمه انگلیسی">EN ✓</span>
                                                    )}
                                                    {hasTiming ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20" title="کارائوکه تایمینگ فعال است"><Clock className="w-3 h-3" /> تایم ✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20" title="فاقد تایمینگ سینک شده"><Clock className="w-3 h-3" /> تایم ✗</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-left">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    
                                                    {/* AI Wizard Button */}
                                                    <button 
                                                        onClick={() => handleExtractRowAI(song.id)}
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
        </div>
    );
}
