"use client";

import React, { useState, useTransition } from "react";
import { BroadcastSession } from "@/types/broadcast";
import { savePresentation } from "@/actions/presentations";
import { ArrowRight, Save, Mic, Music, BookOpen, UploadCloud, Play, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default function MeetingAssetsClient({ presentation }: { presentation: SerializedBroadcastSession }) {
    const [isPending, startTransition] = useTransition();
    const { t, language } = useLanguage();
    
    const [jalaliDate, setJalaliDate] = useState(presentation.jalaliDate || "");
    const [audioFileId, setAudioFileId] = useState(presentation.audioFileId || "");
    const [uploading, setUploading] = useState(false);

    const handleSave = () => {
        startTransition(async () => {
            const res = await savePresentation({
                ...presentation,
                date: new Date(presentation.date),
                jalaliDate,
                audioFileId
            });
            if (res.success) {
                toast.success("جزئیات جلسه با موفقیت ذخیره شد");
            } else {
                toast.error("خطا در ذخیره جزئیات");
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", `${presentation.title} - Recorded Audio`);

        try {
            const res = await fetch("/api/telegram/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setAudioFileId(data.fileId);
            toast.success("فایل با موفقیت در فضای ابری تلگرام ذخیره شد");
            
            // Auto save
            await savePresentation({
                ...presentation,
                date: new Date(presentation.date),
                jalaliDate,
                audioFileId: data.fileId
            });
        } catch (error: any) {
            toast.error(error.message || "خطا در آپلود فایل");
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const verses = presentation.metadata?.verses || [];
    const songs = presentation.metadata?.songs || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto font-[Vazirmatn]" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/presentations" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white">{presentation.title}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">جزئیات و فایل‌های جلسه (Meeting Assets)</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    ذخیره تغییرات
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Telegram Audio Card */}
                <div className="glass-strong border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                            <Mic className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">فایل صوتی ضبط شده</h2>
                            <p className="text-xs text-blue-400">ذخیره‌سازی رایگان در تلگرام کلود</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {audioFileId ? (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-4">
                                <div className="flex items-center gap-3 text-sm text-blue-300">
                                    <UploadCloud className="w-5 h-5" />
                                    <span>فایل با موفقیت به فضای ابری متصل است</span>
                                </div>
                                <audio controls className="w-full h-10 rounded-lg">
                                    <source src={`/api/telegram/media/${audioFileId}`} type="audio/mpeg" />
                                </audio>
                                <button 
                                    onClick={() => setAudioFileId("")}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    حذف و تغییر فایل
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="audio/*,video/mp4" 
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-colors ${uploading ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/20 hover:border-blue-500/50 bg-black/20'}`}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                                            <p className="text-sm font-bold text-blue-400">در حال آپلود به تلگرام...</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-3" />
                                            <p className="text-sm font-bold text-white mb-1">انتخاب فایل صوتی موعظه</p>
                                            <p className="text-xs text-muted-foreground">پشتیبانی از MP3 و M4A</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metadata & Date Card */}
                <div className="glass-strong border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">زمان و دسته‌بندی</h2>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-2">تاریخ شمسی جلسه (مثال: ۱۴۰۳/۰۵/۲۴)</label>
                            <input 
                                type="text"
                                value={jalaliDate}
                                onChange={(e) => setJalaliDate(e.target.value)}
                                placeholder="۱۴۰۳/۰۵/۲۴"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-2">تاریخ میلادی سیستم</label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-muted-foreground">
                                {new Date(presentation.date).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extracted Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verses */}
                <div className="glass-strong border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">آیات استفاده شده</h2>
                        </div>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">{verses.length} آیه</span>
                    </div>
                    {verses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {verses.map((v, i) => (
                                <span key={i} className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-amber-100">
                                    {v}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">هنوز آیه‌ای در اسلایدها وارد نشده است. (سیستم به‌طور خودکار هنگام ذخیره اسلایدها آیات را استخراج می‌کند)</p>
                    )}
                </div>

                {/* Songs */}
                <div className="glass-strong border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                                <Music className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">سرودهای پرستشی</h2>
                        </div>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">{songs.length} سرود</span>
                    </div>
                    {songs.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {songs.map((s, i) => (
                                <span key={i} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-purple-100 flex items-center gap-2">
                                    <Play className="w-4 h-4 text-purple-400/50" /> {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">هنوز سرودی در اسلایدها وارد نشده است.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
