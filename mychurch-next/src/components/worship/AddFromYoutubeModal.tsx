"use client";

import React, { useState } from "react";
import {
    Youtube,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink,
    Music,
    Plus,
    ListPlus,
    Trash2,
    Play,
    Languages,
    Guitar,
    Save,
    Check
} from "lucide-react";
import { WorshipSong } from "@/actions/worship";

interface AddFromYoutubeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSongAdded?: (song: WorshipSong) => void;
    isPresentationMode?: boolean; // When called from presentation builder
}

interface BatchExtractedItem {
    id: string;
    url: string;
    videoId: string;
    title_fa: string;
    title_en: string;
    artist: string;
    category: string;
    thumbnailUrl: string;
    lyrics_fa: string;
    lyrics_finglish?: string;
    lyrics_en?: string;
    chords?: string;
    status: "pending" | "extracting" | "ready" | "saved" | "error";
    error?: string;
}

const CATEGORIES = [
    "پرستش",
    "مزامیر",
    "شکرگزاری",
    "صلیب و قیام",
    "فیض و نجات",
    "روح‌القدس",
    "تسلی و آرامش",
    "جشن و پیروزی",
    "کودکان و نوجوانان"
];

export default function AddFromYoutubeModal({
    isOpen,
    onClose,
    onSongAdded,
    isPresentationMode = false
}: AddFromYoutubeModalProps) {
    const [mode, setMode] = useState<"single" | "batch">("single");

    // --- Single Song State ---
    const [singleUrl, setSingleUrl] = useState("");
    const [isExtractingSingle, setIsExtractingSingle] = useState(false);
    const [singleError, setSingleError] = useState<string | null>(null);
    const [singleSuccess, setSingleSuccess] = useState<string | null>(null);

    // Form fields
    const [videoId, setVideoId] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [titleFa, setTitleFa] = useState("");
    const [titleEn, setTitleEn] = useState("");
    const [artist, setArtist] = useState("");
    const [category, setCategory] = useState("پرستش");
    const [lyricsFa, setLyricsFa] = useState("");
    const [lyricsFinglish, setLyricsFinglish] = useState("");
    const [lyricsEn, setLyricsEn] = useState("");
    const [chords, setChords] = useState("");

    // AI Assist loading
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Batch Mode State ---
    const [batchUrlsText, setBatchUrlsText] = useState("");
    const [batchItems, setBatchItems] = useState<BatchExtractedItem[]>([]);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchSaveProgress, setBatchSaveProgress] = useState<number | null>(null);

    if (!isOpen) return null;

    // --- Single Extraction Handler ---
    const handleExtractSingle = async (urlToExtract?: string) => {
        const targetUrl = (urlToExtract || singleUrl).trim();
        if (!targetUrl) {
            setSingleError("لطفاً لینک یا شناسه ویدیوی یوتیوب را وارد کنید.");
            return;
        }

        setIsExtractingSingle(true);
        setSingleError(null);
        setSingleSuccess(null);

        try {
            const res = await fetch("/api/worship/extract-youtube", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: targetUrl })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "خطا در استخراج اطلاعات از یوتیوب");
            }

            setVideoId(data.videoId || "");
            setThumbnailUrl(data.thumbnailUrl || "");
            setTitleFa(data.title_fa || "");
            setTitleEn(data.title_en || "");
            setArtist(data.artist || "");
            setCategory(data.category || "پرستش");
            setLyricsFa(data.lyrics_fa || "");
            setLyricsFinglish(data.lyrics_finglish || "");
            setLyricsEn(data.lyrics_en || "");
            setChords(data.chords || "");

            setSingleSuccess("اطلاعات ویدیو با موفقیت از یوتیوب استخراج شد! می‌توانید فیلدها را بازبینی یا ذخیره کنید.");
        } catch (err: any) {
            setSingleError(err.message || "خطا در ارتباط با سرور");
        } finally {
            setIsExtractingSingle(false);
        }
    };

    // --- AI Assist Handlers (Finglish, Translate, Chords) ---
    const handleAiAssist = async (taskMode: "finglish" | "translate" | "chords") => {
        if (!lyricsFa.trim()) {
            setSingleError("ابتدا باید متن فارسی سرود را وارد کنید.");
            return;
        }

        setIsAiLoading(true);
        setSingleError(null);

        try {
            const res = await fetch("/api/ai/worship-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: taskMode,
                    lyricsFA: lyricsFa,
                    titleFA: titleFa
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "خطا در سرویس هوش مصنوعی");
            }

            if (taskMode === "finglish") {
                setLyricsFinglish(data.result || "");
            } else if (taskMode === "translate") {
                setLyricsEn(data.result || "");
            } else if (taskMode === "chords") {
                setChords(data.result || "");
            }
        } catch (err: any) {
            setSingleError(err.message || "خطا در هوش مصنوعی");
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- Save Single Song to DB ---
    const handleSaveSingle = async () => {
        if (!titleFa.trim()) {
            setSingleError("عنوان فارسی سرود الزامی است.");
            return;
        }

        setIsSaving(true);
        setSingleError(null);

        try {
            const songData = {
                title_fa: titleFa.trim(),
                title_en: titleEn.trim() || undefined,
                artist: artist.trim() || undefined,
                youtube_id: videoId || undefined,
                category: category || "پرستش",
                lyrics_fa: lyricsFa.trim() || undefined,
                lyrics_finglish: lyricsFinglish.trim() || undefined,
                lyrics_en: lyricsEn.trim() || undefined,
                chords: chords.trim() || undefined
            };

            const res = await fetch("/api/worship-songs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(songData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "خطا در ثبت سرود");
            }

            const createdSong = data.song as WorshipSong;
            setSingleSuccess("سرود با موفقیت در دیتابیس ثبت شد!");

            if (onSongAdded) {
                onSongAdded(createdSong);
            }

            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err: any) {
            setSingleError(err.message || "خطا در ذخیره‌سازی");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Batch Extraction Handler ---
    const handleStartBatchExtraction = async () => {
        const lines = batchUrlsText
            .split("\n")
            .map(l => l.trim())
            .filter(l => Boolean(l));

        if (lines.length === 0) {
            alert("لطفاً حداقل یک لینک یوتیوب وارد کنید.");
            return;
        }

        setIsBatchProcessing(true);
        const initialItems: BatchExtractedItem[] = lines.map((url, idx) => ({
            id: `item-${idx}-${Date.now()}`,
            url,
            videoId: "",
            title_fa: "",
            title_en: "",
            artist: "",
            category: "پرستش",
            thumbnailUrl: "",
            lyrics_fa: "",
            status: "pending"
        }));

        setBatchItems(initialItems);

        // Process sequentially to be gentle on APIs and update state live
        for (let i = 0; i < initialItems.length; i++) {
            const currentItem = initialItems[i];
            setBatchItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "extracting" } : item));

            try {
                const res = await fetch("/api/worship/extract-youtube", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: currentItem.url })
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "استخراج نشد");
                }

                setBatchItems(prev => prev.map((item, idx) => idx === i ? {
                    ...item,
                    videoId: data.videoId || "",
                    title_fa: data.title_fa || "",
                    title_en: data.title_en || "",
                    artist: data.artist || "",
                    category: data.category || "پرستش",
                    thumbnailUrl: data.thumbnailUrl || "",
                    lyrics_fa: data.lyrics_fa || "",
                    lyrics_finglish: data.lyrics_finglish || "",
                    lyrics_en: data.lyrics_en || "",
                    chords: data.chords || "",
                    status: "ready"
                } : item));
            } catch (err: any) {
                setBatchItems(prev => prev.map((item, idx) => idx === i ? {
                    ...item,
                    status: "error",
                    error: err.message
                } : item));
            }
        }

        setIsBatchProcessing(false);
    };

    // --- Batch Save All to Database ---
    const handleSaveBatchAll = async () => {
        const readyItems = batchItems.filter(i => i.status === "ready" && i.title_fa);
        if (readyItems.length === 0) {
            alert("سرود آماده‌ای برای ذخیره‌سازی یافت نشد.");
            return;
        }

        setIsBatchProcessing(true);
        setBatchSaveProgress(0);

        let savedCount = 0;
        let lastSavedSong: WorshipSong | null = null;

        for (let i = 0; i < readyItems.length; i++) {
            const item = readyItems[i];
            try {
                const res = await fetch("/api/worship-songs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title_fa: item.title_fa,
                        title_en: item.title_en || undefined,
                        artist: item.artist || undefined,
                        youtube_id: item.videoId || undefined,
                        category: item.category || "پرستش",
                        lyrics_fa: item.lyrics_fa || undefined,
                        lyrics_finglish: item.lyrics_finglish || undefined,
                        lyrics_en: item.lyrics_en || undefined,
                        chords: item.chords || undefined
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    savedCount++;
                    lastSavedSong = data.song;
                    setBatchItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "saved" } : p));
                }
            } catch (e) {
                console.error("Failed to save batch item", item, e);
            }
            setBatchSaveProgress(Math.round(((i + 1) / readyItems.length) * 100));
        }

        setIsBatchProcessing(false);
        alert(`🎉 ${savedCount} سرود با موفقیت در دیتابیس ذخیره و در سایت فعال شد!`);

        if (lastSavedSong && onSongAdded) {
            onSongAdded(lastSavedSong);
        }

        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const removeBatchItem = (id: string) => {
        setBatchItems(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div
                className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
                dir="rtl"
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-4 px-6 flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <Youtube className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-[Vazirmatn] flex items-center gap-2">
                                افزودن سرود از یوتیوب
                                <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full font-sans tracking-wide">
                                    {isPresentationMode ? "پرزنتیشن & دیتابیس" : "مدیریت سرودها"}
                                </span>
                            </h2>
                            <p className="text-xs text-white/80 font-[Vazirmatn]">
                                استخراج خودکار متادیتا، کاور، نام کانال و متن سرود همراه با ثبت در دیتابیس
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
                        title="بستن پنجره"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Mode Selector Tabs */}
                <div className="bg-slate-950/60 p-2 border-b border-slate-800 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("single")}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold font-[Vazirmatn] transition flex items-center justify-center gap-2 ${
                            mode === "single"
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <Plus className="w-4 h-4" />
                        افزودن تکی و ویرایش دقیق
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("batch")}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold font-[Vazirmatn] transition flex items-center justify-center gap-2 ${
                            mode === "batch"
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                        <ListPlus className="w-4 h-4" />
                        ثبت دسته‌جمعی لینک‌ها (Batch)
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Error / Success Feedback */}
                    {singleError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl flex items-center gap-3 text-sm font-[Vazirmatn]">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                            <span>{singleError}</span>
                        </div>
                    )}

                    {singleSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl flex items-center gap-3 text-sm font-[Vazirmatn]">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                            <span>{singleSuccess}</span>
                        </div>
                    )}

                    {/* ================= SINGLE MODE ================= */}
                    {mode === "single" && (
                        <div className="space-y-6">
                            {/* URL Input Bar */}
                            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/70 space-y-3">
                                <label className="block text-sm font-bold font-[Vazirmatn] text-slate-200">
                                    لینک ویدیو یا شناسه یوتیوب (YouTube URL):
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={singleUrl}
                                            onChange={e => setSingleUrl(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleExtractSingle();
                                                }
                                            }}
                                            placeholder="مثال: https://youtu.be/rSB2en2gl-Q یا rSB2en2gl-Q"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-red-500 transition"
                                            dir="ltr"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleExtractSingle()}
                                        disabled={isExtractingSingle || !singleUrl.trim()}
                                        className={`px-5 py-3 rounded-xl font-bold font-[Vazirmatn] text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center gap-2 shadow-lg shadow-red-600/20 transition ${
                                            isExtractingSingle || !singleUrl.trim()
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {isExtractingSingle ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                در حال استخراج...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                استخراج اطلاعات
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Video Preview Card (if extracted) */}
                            {videoId && (
                                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row gap-4 items-center">
                                    {thumbnailUrl ? (
                                        <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={thumbnailUrl}
                                                alt={titleFa}
                                                className="w-full h-full object-cover"
                                            />
                                            <a
                                                href={`https://www.youtube.com/watch?v=${videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-bold transition backdrop-blur-[2px]"
                                            >
                                                <Play className="w-4 h-4 fill-white" />
                                                مشاهده در یوتیوب
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="w-full sm:w-48 aspect-video bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                            <Music className="w-8 h-8" />
                                        </div>
                                    )}

                                    <div className="flex-1 text-right space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-mono">
                                                ID: {videoId}
                                            </span>
                                            {artist && (
                                                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-[Vazirmatn]">
                                                    {artist}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-white font-[Vazirmatn]">
                                            {titleFa || "عنوان استخراج شده"}
                                        </h3>
                                        {titleEn && (
                                            <p className="text-xs text-slate-400 font-sans tracking-wide">
                                                {titleEn}
                                            </p>
                                        )}
                                    </div>

                                    <a
                                        href={`https://www.youtube.com/watch?v=${videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 transition"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        یوتیوب
                                    </a>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 font-[Vazirmatn] flex items-center gap-1">
                                        <span>عنوان فارسی سرود</span>
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={titleFa}
                                        onChange={e => setTitleFa(e.target.value)}
                                        placeholder="مثال: یهوه توانایی من"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-[Vazirmatn] text-sm focus:outline-none focus:border-red-500 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 font-[Vazirmatn]">
                                        عنوان انگلیسی / فینگلیش:
                                    </label>
                                    <input
                                        type="text"
                                        value={titleEn}
                                        onChange={e => setTitleEn(e.target.value)}
                                        placeholder="e.g. Yahovah Tavanaieh Man"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-red-500 transition"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 font-[Vazirmatn]">
                                        خواننده / شاعر / خدمت (Artist):
                                    </label>
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={e => setArtist(e.target.value)}
                                        placeholder="مثال: ثمرات روح یا مصطفی فدوی"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-[Vazirmatn] text-sm focus:outline-none focus:border-red-500 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 font-[Vazirmatn]">
                                        دسته‌بندی سرود:
                                    </label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-[Vazirmatn] text-sm focus:outline-none focus:border-red-500 transition"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Lyrics Section */}
                            <div className="space-y-4 pt-2 border-t border-slate-800">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h4 className="text-sm font-bold font-[Vazirmatn] text-slate-200 flex items-center gap-2">
                                        <Music className="w-4 h-4 text-pink-400" />
                                        متن سرود (Lyrics)
                                    </h4>

                                    {/* AI Assist Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => handleAiAssist("finglish")}
                                            disabled={isAiLoading || !lyricsFa.trim()}
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 font-[Vazirmatn] transition disabled:opacity-40"
                                            title="تولید فینگلیش خودکار از متن فارسی"
                                        >
                                            <Languages className="w-3.5 h-3.5 text-amber-400" />
                                            فینگلیش با AI
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleAiAssist("translate")}
                                            disabled={isAiLoading || !lyricsFa.trim()}
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 font-[Vazirmatn] transition disabled:opacity-40"
                                            title="ترجمه انگلیسی با هوش مصنوعی"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                            ترجمه انگلیسی با AI
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleAiAssist("chords")}
                                            disabled={isAiLoading || !lyricsFa.trim()}
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 font-[Vazirmatn] transition disabled:opacity-40"
                                            title="پیشنهاد آکورد با هوش مصنوعی"
                                        >
                                            <Guitar className="w-3.5 h-3.5 text-emerald-400" />
                                            آکورد با AI
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-[Vazirmatn] block mb-1">
                                            متن فارسی سرود (هر بند یا خط در یک سطر):
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={lyricsFa}
                                            onChange={e => setLyricsFa(e.target.value)}
                                            placeholder="متن فارسی سرود..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-[Vazirmatn] text-sm focus:outline-none focus:border-red-500 transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400 font-sans block mb-1" dir="ltr">
                                                Finglish Lyrics (Transliteration):
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={lyricsFinglish}
                                                onChange={e => setLyricsFinglish(e.target.value)}
                                                placeholder="Finglish lyrics..."
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-sans text-xs focus:outline-none focus:border-red-500 transition"
                                                dir="ltr"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-400 font-sans block mb-1" dir="ltr">
                                                English Translation:
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={lyricsEn}
                                                onChange={e => setLyricsEn(e.target.value)}
                                                placeholder="English translation..."
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-sans text-xs focus:outline-none focus:border-red-500 transition"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-sans block mb-1" dir="ltr">
                                            Guitar / Piano Chords:
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={chords}
                                            onChange={e => setChords(e.target.value)}
                                            placeholder="e.g. Am   G   F   E"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-red-500 transition"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= BATCH MODE ================= */}
                    {mode === "batch" && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/70 space-y-3">
                                <label className="block text-sm font-bold font-[Vazirmatn] text-slate-200">
                                    لینک‌های یوتیوب را اینجا بچسبانید (هر لینک در یک خط):
                                </label>
                                <textarea
                                    rows={4}
                                    value={batchUrlsText}
                                    onChange={e => setBatchUrlsText(e.target.value)}
                                    placeholder={`https://youtu.be/rSB2en2gl-Q?is=ZUEJ0rjRUJps-fG2\nhttps://youtu.be/of4BTWyqMTw?is=almHr9p90wri1Ltw\nhttps://youtu.be/jWzvwi22L0A?is=-btHWwUF08jVev9a`}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-red-500 transition"
                                    dir="ltr"
                                />

                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <span className="text-xs text-slate-400 font-[Vazirmatn]">
                                        می‌توانید لینک‌های کوتاه (youtu.be) یا معمولی (watch?v=) را وارد کنید.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleStartBatchExtraction}
                                        disabled={isBatchProcessing || !batchUrlsText.trim()}
                                        className={`px-4 py-2.5 rounded-xl font-bold font-[Vazirmatn] text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center gap-2 shadow-lg shadow-red-600/20 transition ${
                                            isBatchProcessing || !batchUrlsText.trim()
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {isBatchProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                در حال استخراج پی‌درپی...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                استخراج تمام لینک‌ها
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Batch Items List */}
                            {batchItems.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold font-[Vazirmatn] text-slate-200">
                                            سرودهای استخراج‌شده ({batchItems.filter(i => i.status === "ready" || i.status === "saved").length} از {batchItems.length}):
                                        </h4>
                                    </div>

                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {batchItems.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3"
                                            >
                                                <span className="text-xs font-mono text-slate-400 w-5 text-center">
                                                    {idx + 1}
                                                </span>

                                                {item.thumbnailUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.thumbnailUrl}
                                                        alt={item.title_fa}
                                                        className="w-16 h-10 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                                                        <Youtube className="w-5 h-5" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.title_fa}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setBatchItems(prev => prev.map(p => p.id === item.id ? { ...p, title_fa: val } : p));
                                                            }}
                                                            placeholder="عنوان فارسی سرود..."
                                                            className="bg-transparent border-b border-slate-700 hover:border-slate-500 focus:border-red-500 text-sm font-bold font-[Vazirmatn] text-white focus:outline-none w-full truncate"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                        {item.artist && <span>{item.artist}</span>}
                                                        {item.videoId && <span className="font-mono text-slate-500">[{item.videoId}]</span>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {item.status === "extracting" && (
                                                        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                                                    )}
                                                    {item.status === "ready" && (
                                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-[Vazirmatn]">
                                                            آماده ذخیره
                                                        </span>
                                                    )}
                                                    {item.status === "saved" && (
                                                        <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md font-[Vazirmatn] flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> ثبت شد
                                                        </span>
                                                    )}
                                                    {item.status === "error" && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-[Vazirmatn]">
                                                            خطا
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => removeBatchItem(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <div className="bg-slate-950 p-4 px-6 border-t border-slate-800 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold font-[Vazirmatn] text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    >
                        انصراف
                    </button>

                    {mode === "single" ? (
                        <button
                            type="button"
                            onClick={handleSaveSingle}
                            disabled={isSaving || !titleFa.trim()}
                            className={`px-6 py-2.5 rounded-xl font-bold font-[Vazirmatn] text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition ${
                                isSaving || !titleFa.trim()
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isPresentationMode
                                        ? "ذخیره در دیتابیس و ایجاد اسلاید"
                                        : "ذخیره در دیتابیس و ثبت در سایت"}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSaveBatchAll}
                            disabled={
                                isBatchProcessing ||
                                batchItems.filter(i => i.status === "ready").length === 0
                            }
                            className={`px-6 py-2.5 rounded-xl font-bold font-[Vazirmatn] text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition ${
                                isBatchProcessing ||
                                batchItems.filter(i => i.status === "ready").length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isBatchProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {batchSaveProgress !== null
                                        ? `در حال ذخیره (${batchSaveProgress}٪)...`
                                        : "در حال ذخیره‌سازی..."}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    ثبت همه در دیتابیس (
                                    {batchItems.filter(i => i.status === "ready").length} سرود)
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
