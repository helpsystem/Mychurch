"use client";

import React, { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { User, Shield, Key, Camera, Sparkles, Download, Expand, X, Save, CheckCircle, Loader2 } from "lucide-react";

interface Props {
    isAiAvatarEnabled: boolean;
}

export default function ProfilePageClient({ isAiAvatarEnabled }: Props) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedToProfile, setSavedToProfile] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setUploadPreviewUrl(URL.createObjectURL(file));
            setGeneratedImageUrl(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedFile) return;
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("gender", gender);
            const res = await fetch("/api/ai/avatar", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate AI avatar");
            setGeneratedImageUrl(data.url);
        } catch (error: any) {
            alert("خطا در ساخت تصویر: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!generatedImageUrl) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/ai/avatar/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: generatedImageUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSavedToProfile(true);
            setTimeout(() => setSavedToProfile(false), 3000);
        } catch (err: any) {
            alert("خطا در ذخیره: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImageUrl) return;
        const a = document.createElement('a');
        a.href = generatedImageUrl;
        a.download = 'christian-ai-profile.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const displayImageUrl = generatedImageUrl || uploadPreviewUrl;

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans flex flex-col">
            <PublicHeader />

            {/* Lightbox Modal */}
            {lightboxOpen && generatedImageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title="بستن" onClick={() => setLightboxOpen(false)}>
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={generatedImageUrl} alt="Generated AI Avatar" className="w-full h-auto rounded-2xl shadow-2xl" />
                        <div className="flex gap-3 mt-4 justify-center">
                            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-colors">
                                <Download className="w-4 h-4" /> دریافت عکس
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[10%] w-[35%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto w-full">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-2">حساب کاربری من</h1>
                    <p className="text-muted-foreground">تنظیمات پروفایل و تصویر هوش مصنوعی شما.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / Avatar Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
                            {/* Avatar display */}
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-800 bg-neutral-950 flex items-center justify-center">
                                    {displayImageUrl ? (
                                        <img src={displayImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                {isAiAvatarEnabled && (
                                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform z-20" title="آپلود عکس">
                                        <Camera className="w-5 h-5" />
                                        <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} />
                                    </label>
                                )}
                                {generatedImageUrl && (
                                    <button className="absolute bottom-0 left-0 w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform z-20" title="مشاهده تمام صفحه" onClick={() => setLightboxOpen(true)}>
                                        <Expand className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <h2 className="text-xl font-bold mb-1">سامان آبیار</h2>
                            <p className="text-sm text-primary font-bold flex items-center justify-center gap-1.5 mb-4">
                                <Shield className="w-4 h-4" /> Admin
                            </p>

                            {generatedImageUrl && (
                                <div className="flex gap-2 w-full mb-4">
                                    <button onClick={() => setLightboxOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors">
                                        <Expand className="w-3.5 h-3.5" /> مشاهده کامل
                                    </button>
                                    <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-bold transition-colors border border-indigo-500/20">
                                        <Download className="w-3.5 h-3.5" /> دریافت
                                    </button>
                                </div>
                            )}

                            <div className="w-full h-px bg-white/10 my-4" />

                            {/* AI Avatar Section — gated by admin widget */}
                            {isAiAvatarEnabled ? (
                                <div className="w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
                                    <Sparkles className="absolute -top-4 -right-4 w-16 h-16 text-indigo-500/20 opacity-50 group-hover:opacity-100 transition-all" />
                                    <h3 className="font-bold text-sm mb-3 text-indigo-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> پروفایل مسیحی با هوش مصنوعی
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-right">
                                        یک عکس واضح از چهره خود آپلود کنید، جنسیت را انتخاب کنید و دکمه را بزنید.
                                    </p>
                                    <div className="flex gap-2 mb-4">
                                        <button onClick={() => setGender('male')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${gender === 'male' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-neutral-800 border-white/10 text-muted-foreground'}`}>
                                            👨 مرد
                                        </button>
                                        <button onClick={() => setGender('female')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${gender === 'female' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-neutral-800 border-white/10 text-muted-foreground'}`}>
                                            👩 زن
                                        </button>
                                    </div>
                                    <button onClick={handleGenerate} disabled={!selectedFile || isGenerating} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isGenerating ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>در حال پردازش...</span></>
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> ایجاد تصویر با AI</>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl p-5 text-center">
                                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground font-[Vazirmatn]">
                                        قابلیت تصویر هوش مصنوعی توسط مدیریت غیرفعال است.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Settings Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> اطلاعات شخصی
                            </h3>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="fullname" className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی</label>
                                        <input id="fullname" type="text" title="نام و نام خانوادگی" className="w-full bg-neutral-950 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground" defaultValue="سامان آبیار" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">آدرس ایمیل</label>
                                        <input id="email" type="email" disabled title="آدرس ایمیل" className="w-full bg-neutral-950/50 border border-white/5 rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed text-left" dir="ltr" defaultValue="saman@example.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="bio" className="text-sm font-medium text-muted-foreground">درباره من (Bio)</label>
                                    <textarea id="bio" rows={4} title="درباره من" className="w-full bg-neutral-950 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground resize-none" placeholder="معرفی کوتاهی از خود بنویسید..."></textarea>
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors">ذخیره اطلاعات</button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Key className="w-5 h-5 text-amber-500" /> تغییر رمز عبور
                            </h3>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="current-password" className="text-sm font-medium text-muted-foreground">رمز عبور فعلی</label>
                                        <input id="current-password" type="password" title="رمز عبور فعلی" placeholder="••••••••" className="w-full bg-neutral-950 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-foreground text-left" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">رمز عبور جدید</label>
                                        <input id="new-password" type="password" title="رمز عبور جدید" placeholder="••••••••" className="w-full bg-neutral-950 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-foreground text-left" dir="ltr" />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors">بروزرسانی رمز عبور</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
