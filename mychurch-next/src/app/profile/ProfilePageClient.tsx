"use client";

import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { User, Shield, Camera, Sparkles, Download, Expand, X, CheckCircle, Loader2, MapPin } from "lucide-react";
import { updateUserProfile } from "@/actions/user";
import { AddressAutocomplete, type AddressData } from "@/components/profile/AddressAutocomplete";

interface Props {
    isAiAvatarEnabled: boolean;
    initialUser: any;
}

const emptyAddress: AddressData = {
    address_line1: "", address_line2: "", city: "", state: "",
    country: "", postal_code: "", lat: null, lng: null,
};

export default function ProfilePageClient({ isAiAvatarEnabled, initialUser }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Personal info state
    const [formData, setFormData] = useState({
        name: initialUser?.name || "",
        bio: initialUser?.bio || "",
        phone: initialUser?.phone || "",
        whatsapp_number: initialUser?.whatsapp_number || "",
    });

    // Address state
    const [address, setAddress] = useState<AddressData>({
        address_line1: initialUser?.address_line1 || "",
        address_line2: initialUser?.address_line2 || "",
        city: initialUser?.city || "",
        state: initialUser?.state || "",
        country: initialUser?.country || "",
        postal_code: initialUser?.postal_code || "",
        lat: initialUser?.lat ? parseFloat(initialUser.lat) : null,
        lng: initialUser?.lng ? parseFloat(initialUser.lng) : null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadPreviewUrl(URL.createObjectURL(e.target.files[0]));
            setGeneratedImageUrl(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedFile) return;
        setIsGenerating(true);
        try {
            const fd = new FormData();
            fd.append("file", selectedFile);
            fd.append("gender", gender);
            const res = await fetch("/api/ai/avatar", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setGeneratedImageUrl(data.url);
        } catch (e: any) { alert("خطا: " + e.message); }
        finally { setIsGenerating(false); }
    };

    const handleDownload = () => {
        if (!generatedImageUrl) return;
        const a = document.createElement('a');
        a.href = generatedImageUrl;
        a.download = 'christian-ai-profile.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialUser?.email) return alert("خطا: اطلاعات کاربر یافت نشد");
        setIsSaving(true);
        try {
            const res = await updateUserProfile(initialUser.email, { ...formData, ...address });
            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else { throw new Error("ذخیره‌سازی ناموفق بود"); }
        } catch (err: any) { alert("خطا: " + err.message); }
        finally { setIsSaving(false); }
    };

    const displayImageUrl = generatedImageUrl || uploadPreviewUrl || initialUser?.avatar_url;

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <PublicHeader />

            {/* Lightbox */}
            {lightboxOpen && generatedImageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" title="بستن" onClick={() => setLightboxOpen(false)}>
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={generatedImageUrl} alt="Avatar" className="w-full rounded-2xl shadow-2xl" />
                        <div className="flex justify-center gap-3 mt-4">
                            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold">
                                <Download className="w-4 h-4" /> دریافت عکس
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto w-full">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-2">حساب کاربری من</h1>
                    <p className="text-muted-foreground">تنظیمات پروفایل و ارتباط با کلیسا.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ── Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-secondary flex items-center justify-center">
                                        {displayImageUrl
                                            ? <img src={displayImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            : <User className="w-12 h-12 text-muted-foreground" />}
                                    </div>
                                    {isAiAvatarEnabled && (
                                        <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform z-20" title="آپلود عکس">
                                            <Camera className="w-5 h-5" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} aria-label="آپلود عکس پروفایل" />
                                        </label>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold mb-1 text-foreground">{formData.name || "کاربر جدید"}</h2>
                                <p className="text-sm text-primary font-bold flex items-center justify-center gap-1.5 mb-4">
                                    <Shield className="w-4 h-4" /> {initialUser?.role || "User"}
                                </p>

                                {isAiAvatarEnabled && (
                                    <div className="w-full bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-5">
                                        <h3 className="font-bold text-sm mb-3 text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> پروفایل با هوش مصنوعی
                                        </h3>
                                        <div className="flex gap-2 mb-4">
                                            <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'male' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>👨 مرد</button>
                                            <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'female' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>👩 زن</button>
                                        </div>
                                        <button type="button" onClick={handleGenerate} disabled={!selectedFile || isGenerating}
                                            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isGenerating ? "در حال پردازش..." : "ایجاد تصویر با AI"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Main Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Info */}
                            <div className="bg-card border border-border rounded-3xl p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                                    <User className="w-5 h-5 text-primary" /> اطلاعات شخصی
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="fullname" className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی</label>
                                        <input id="fullname" type="text" value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">آدرس ایمیل</label>
                                        <input id="email" type="email" disabled value={initialUser?.email || ""}
                                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">شماره تماس</label>
                                        <input id="phone" type="tel" value={formData.phone} placeholder="+1..."
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="whatsapp" className="text-sm font-medium text-muted-foreground">شماره واتس‌اپ</label>
                                        <input id="whatsapp" type="tel" value={formData.whatsapp_number} placeholder="+1..."
                                            onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" dir="ltr" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-6">
                                    <label htmlFor="bio" className="text-sm font-medium text-muted-foreground">درباره من (Bio)</label>
                                    <textarea id="bio" rows={3} value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                                        placeholder="معرفی کوتاهی از خود بنویسید..." />
                                </div>
                            </div>

                            {/* ── Address Section ── */}
                            <div className="bg-card border border-border rounded-3xl p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                                    <MapPin className="w-5 h-5 text-emerald-500" /> آدرس پستی
                                </h3>
                                <AddressAutocomplete value={address} onChange={setAddress} />
                            </div>
                        </div>
                    </div>

                    {/* ── Save Bar ── */}
                    <div className="flex justify-end gap-3 items-center pt-2">
                        {saveSuccess && (
                            <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> ذخیره شد
                            </span>
                        )}
                        <button type="submit" disabled={isSaving}
                            className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20">
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            ذخیره تمام تغییرات
                        </button>
                    </div>
                </form>
            </main>

            <PublicFooter />
        </div>
    );
}
