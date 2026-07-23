"use client";

import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { User, Shield, Camera, Sparkles, Download, Expand, X, CheckCircle, Loader2, MapPin, FileText, Send, Eye, Clock, AlertTriangle, Printer } from "lucide-react";
import { updateUserProfile } from "@/actions/user";
import { AddressAutocomplete, type AddressData } from "@/components/profile/AddressAutocomplete";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/providers/LanguageProvider";

interface Props {
    isAiAvatarEnabled: boolean;
    initialUser: any;
}

const emptyAddress: AddressData = {
    address_line1: "", address_line2: "", city: "", state: "",
    country: "", postal_code: "", lat: null, lng: null,
};

export default function ProfilePageClient({ isAiAvatarEnabled, initialUser }: Props) {
    const { language } = useLanguage();
    const isFa = language === "fa";

    // Documents and Requests state
    const [documents, setDocuments] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [reqDocType, setReqDocType] = useState("Membership Letter");
    const [reqDetails, setReqDetails] = useState("");
    const [isSubmittingReq, setIsSubmittingReq] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Password state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Personal info state
    const [formData, setFormData] = useState({
        name: initialUser?.name || "",
        bio: initialUser?.bio || "",
        phone: initialUser?.phone || "",
        whatsapp_number: initialUser?.whatsapp_number || "",
        telegram_id: initialUser?.telegram_id || "",
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

    const fetchDocsAndRequests = async () => {
        setIsLoadingDocs(true);
        try {
            const { getUserDocuments } = await import("@/actions/documents");
            const { getMyDocumentRequests } = await import("@/actions/documentRequests");

            const [docsRes, reqsRes] = await Promise.all([
                getUserDocuments(),
                getMyDocumentRequests()
            ]);

            if (docsRes.data) setDocuments(docsRes.data);
            if (reqsRes.data) setRequests(reqsRes.data);
        } catch (err) {
            console.error("Failed to load documents/requests", err);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    React.useEffect(() => {
        fetchDocsAndRequests();
    }, []);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reqDetails.trim()) return;

        setIsSubmittingReq(true);
        try {
            const { createDocumentRequest } = await import("@/actions/documentRequests");
            const res = await createDocumentRequest(reqDocType, reqDetails);
            if (res.success) {
                setReqDetails("");
                const { getMyDocumentRequests } = await import("@/actions/documentRequests");
                const reqsRes = await getMyDocumentRequests();
                if (reqsRes.data) setRequests(reqsRes.data);
                alert(isFa ? "درخواست شما با موفقیت ثبت شد." : "Your request has been successfully submitted.");
            } else {
                alert(res.error || (isFa ? "خطایی رخ داد" : "An error occurred"));
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmittingReq(false);
        }
    };

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
        } catch (e: any) { alert((isFa ? "خطا: " : "Error: ") + e.message); }
        finally { setIsGenerating(false); }
    };

    const handleDownload = () => {
        if (!generatedImageUrl) return;
        const a = document.createElement('a');
        a.href = generatedImageUrl;
        a.download = 'christian-ai-profile.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert(isFa ? "رمز عبور و تکرار آن یکسان نیستند" : "Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            alert(isFa ? "رمز عبور باید حداقل ۶ کاراکتر باشد" : "Password must be at least 6 characters");
            return;
        }
        setIsChangingPassword(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert(isFa ? "رمز عبور با موفقیت تغییر کرد" : "Password changed successfully");
            setNewPassword("");
            setConfirmPassword("");
        } catch (e: any) {
            alert((isFa ? "خطا در تغییر رمز عبور: " : "Error changing password: ") + e.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialUser?.email) return alert(isFa ? "خطا: اطلاعات کاربر یافت نشد" : "Error: User details not found");
        setIsSaving(true);
        try {
            const res = await updateUserProfile(initialUser.email, { ...formData, ...address });
            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else { throw new Error(isFa ? "ذخیره‌سازی ناموفق بود" : "Failed to save profile"); }
        } catch (err: any) { alert((isFa ? "خطا: " : "Error: ") + err.message); }
        finally { setIsSaving(false); }
    };

    const displayImageUrl = generatedImageUrl || uploadPreviewUrl || initialUser?.avatar_url;

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <PublicHeader />

            {/* Lightbox */}
            {lightboxOpen && generatedImageUrl && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" title={isFa ? "بستن" : "Close"} onClick={() => setLightboxOpen(false)}>
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={generatedImageUrl} alt="Avatar" className="w-full rounded-2xl shadow-2xl" />
                        <div className="flex justify-center gap-3 mt-4">
                            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold">
                                <Download className="w-4 h-4" /> {isFa ? "دریافت عکس" : "Download Image"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto w-full" dir={isFa ? "rtl" : "ltr"}>
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-2">{isFa ? "حساب کاربری من" : "My Profile"}</h1>
                    <p className="text-muted-foreground">{isFa ? "تنظیمات پروفایل و ارتباط با کلیسا." : "Profile settings and communication with the church."}</p>
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
                                        <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform z-20" title={isFa ? "آپلود عکس" : "Upload Photo"}>
                                            <Camera className="w-5 h-5" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} aria-label={isFa ? "آپلود عکس پروفایل" : "Upload Profile Photo"} />
                                        </label>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold mb-1 text-foreground">{formData.name || (isFa ? "کاربر جدید" : "New User")}</h2>
                                <p className="text-sm text-primary font-bold flex items-center justify-center gap-1.5 mb-4">
                                    <Shield className="w-4 h-4" /> {initialUser?.role || "User"}
                                </p>
                                
                                <button type="button" onClick={() => {
                                    import('@/actions/auth').then(m => m.logout());
                                }} className="w-full py-2 mb-6 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" /> {isFa ? "خروج از حساب" : "Logout"}
                                </button>

                                {isAiAvatarEnabled && (
                                    <div className="w-full bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-5">
                                        <h3 className="font-bold text-sm mb-3 text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> {isFa ? "پروفایل با هوش مصنوعی" : "AI Avatar Generator"}
                                        </h3>
                                        <div className="flex gap-2 mb-4">
                                            <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'male' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>{isFa ? "👨 مرد" : "👨 Male"}</button>
                                            <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'female' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>{isFa ? "👩 زن" : "👩 Female"}</button>
                                        </div>
                                        <button type="button" onClick={handleGenerate} disabled={!selectedFile || isGenerating}
                                            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {isGenerating ? (isFa ? "در حال پردازش..." : "Processing...") : (isFa ? "ایجاد تصویر با AI" : "Generate AI Avatar")}
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
                                    <User className="w-5 h-5 text-primary" /> {isFa ? "اطلاعات شخصی" : "Personal Information"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="fullname" className="text-sm font-medium text-muted-foreground">{isFa ? "نام و نام خانوادگی" : "Full Name"}</label>
                                        <input id="fullname" type="text" value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">{isFa ? "آدرس ایمیل" : "Email Address"}</label>
                                        <input id="email" type="email" disabled value={initialUser?.email || ""}
                                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">{isFa ? "شماره تماس" : "Phone Number"}</label>
                                        <input id="phone" type="tel" value={formData.phone} placeholder="+1..."
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="whatsapp" className="text-sm font-medium text-muted-foreground">{isFa ? "شماره واتس‌اپ" : "WhatsApp Number"}</label>
                                        <input id="whatsapp" type="tel" value={formData.whatsapp_number} placeholder="+1..."
                                            onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" dir="ltr" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="telegram_id" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Send className="w-4 h-4 text-sky-400" />
                                            {isFa ? "شناسه تلگرام (Chat ID) — برای دریافت کد تایید ۲FA" : "Telegram Chat ID — for 2FA verification codes"}
                                        </label>
                                        <input
                                            id="telegram_id"
                                            type="text"
                                            value={formData.telegram_id}
                                            placeholder={isFa ? "مثال: 123456789" : "e.g. 123456789"}
                                            onChange={e => setFormData({ ...formData, telegram_id: e.target.value })}
                                            className="w-full bg-secondary border border-sky-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors text-foreground placeholder:text-muted-foreground" 
                                            dir="ltr"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {isFa 
                                                ? "برای دریافت Chat ID خود، ربات @userinfobot را در تلگرام پیدا کنید و /start بزنید. عدد نشان داده شده را اینجا وارد کنید."
                                                : "Find your Chat ID: Message @userinfobot on Telegram and type /start. Enter the number shown here."
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-6">
                                    <label htmlFor="bio" className="text-sm font-medium text-muted-foreground">{isFa ? "درباره من (Bio)" : "About Me (Bio)"}</label>
                                    <textarea id="bio" rows={3} value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                                        placeholder={isFa ? "معرفی کوتاهی از خود بنویسید..." : "Write a short bio..."} />
                                </div>
                            </div>

                            {/* ── Security / Password Section ── */}
                            <div className="bg-card border border-border rounded-3xl p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                                    <Shield className="w-5 h-5 text-indigo-500" /> {isFa ? "تغییر رمز عبور" : "Change Password"}
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">{isFa ? "رمز عبور جدید" : "New Password"}</label>
                                            <input 
                                                type="password" 
                                                placeholder={isFa ? "حداقل ۶ کاراکتر" : "At least 6 characters"}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" 
                                                dir="ltr" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">{isFa ? "تکرار رمز عبور جدید" : "Confirm New Password"}</label>
                                            <input 
                                                type="password" 
                                                placeholder={isFa ? "تکرار رمز عبور" : "Confirm password"}
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground" 
                                                dir="ltr" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                                        className="mt-4 px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isFa ? "تغییر رمز عبور" : "Change Password"}
                                    </button>
                                </div>
                            </div>

                            {/* ── Address Section ── */}
                            <div className="bg-card border border-border rounded-3xl p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                                    <MapPin className="w-5 h-5 text-emerald-500" /> {isFa ? "آدرس پستی" : "Postal Address"}
                                </h3>
                                <AddressAutocomplete value={address} onChange={setAddress} />
                            </div>

                            {/* ── Documents & Requests Section ── */}
                            <div className="bg-card border border-border rounded-3xl p-8 space-y-8">
                                <div className="flex items-center gap-3 border-b border-border pb-4">
                                    <FileText className="w-6 h-6 text-primary" />
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isFa ? "درخواست‌ها و اسناد من" : "My Documents & Requests"}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-[Vazirmatn]">
                                            {isFa ? "ثبت درخواست جدید و مشاهده مدارک رسمی صادر شده" : "Request official documents and view issued letters/receipts"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {/* Request form */}
                                    <div className="space-y-4 bg-secondary/35 border border-border/50 rounded-2xl p-6">
                                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                            <Send className="w-4 h-4 text-primary" />
                                            {isFa ? "ثبت درخواست جدید" : "New Document Request"}
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">
                                                    {isFa ? "نوع سند درخواستی" : "Requested Document Type"}
                                                </label>
                                                <select
                                                    value={reqDocType}
                                                    onChange={(e) => setReqDocType(e.target.value)}
                                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-[Vazirmatn]"
                                                >
                                                    <option value="Membership Letter">{isFa ? "گواهی عضویت (Membership Letter)" : "Membership Letter"}</option>
                                                    <option value="Baptism Certificate">{isFa ? "گواهی غسل تعمید (Baptism Certificate)" : "Baptism Certificate"}</option>
                                                    <option value="Donation Receipt">{isFa ? "رسید رسمی کمک‌های مالی (Donation Receipt)" : "Donation Receipt"}</option>
                                                    <option value="Other">{isFa ? "سایر موارد (Other)" : "Other"}</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">
                                                    {isFa ? "جزئیات و دلایل درخواست" : "Request Details & Reason"}
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={reqDetails}
                                                    onChange={(e) => setReqDetails(e.target.value)}
                                                    placeholder={isFa ? "لطفا نام دقیق، هدف گواهی یا جزئیات مبالغ اهدایی را بنویسید..." : "Please specify details, name, purpose, or donation amount/date..."}
                                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSubmitRequest}
                                                disabled={isSubmittingReq || !reqDetails.trim()}
                                                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                            >
                                                {isSubmittingReq ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {isFa ? "ارسال درخواست سند" : "Submit Document Request"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Requests List */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            {isFa ? "تاریخچه درخواست‌های من" : "My Request History"}
                                        </h4>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                            {isLoadingDocs ? (
                                                <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    {isFa ? "در حال بارگذاری..." : "Loading requests..."}
                                                </p>
                                            ) : requests.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">
                                                    {isFa ? "هیچ درخواستی ثبت نشده است." : "No requests found."}
                                                </p>
                                            ) : (
                                                requests.map((req) => (
                                                    <div key={req.id} className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h5 className="font-bold text-sm text-foreground">
                                                                    {req.document_type === "Membership Letter" && (isFa ? "گواهی عضویت" : "Membership Letter")}
                                                                    {req.document_type === "Baptism Certificate" && (isFa ? "گواهی تعمید" : "Baptism Certificate")}
                                                                    {req.document_type === "Donation Receipt" && (isFa ? "رسید کمک مالی" : "Donation Receipt")}
                                                                    {req.document_type === "Other" && (isFa ? "سایر موارد" : "Other")}
                                                                </h5>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {new Date(req.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                                                req.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                            }`}>
                                                                {req.status === "approved" && (isFa ? "تایید شده" : "Approved")}
                                                                {req.status === "rejected" && (isFa ? "رد شده" : "Rejected")}
                                                                {req.status === "pending" && (isFa ? "در انتظار بررسی" : "Pending")}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground/90 whitespace-pre-wrap">{req.details}</p>
                                                        {req.admin_notes && (
                                                            <div className="bg-background/40 border-l-2 border-primary/50 p-2 rounded text-[11px] text-foreground mt-2">
                                                                <span className="font-bold block mb-0.5">{isFa ? "پاسخ مدیریت:" : "Admin Notes:"}</span>
                                                                <span className="italic">{req.admin_notes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border/60 pt-6 space-y-4">
                                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-500" />
                                        {isFa ? "اسناد و مدارک رسمی صادر شده من" : "My Officially Issued Documents"}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {isLoadingDocs ? (
                                            <p className="text-sm text-muted-foreground italic col-span-full flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                {isFa ? "در حال بارگذاری..." : "Loading documents..."}
                                            </p>
                                        ) : documents.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic col-span-full">
                                                {isFa ? "هیچ سندی برای شما صادر نشده است." : "No documents issued yet."}
                                            </p>
                                        ) : (
                                            documents.map((doc) => (
                                                <div key={doc.id} className="bg-secondary/15 border border-border rounded-xl p-4 flex justify-between items-center hover:border-primary/30 transition-all">
                                                    <div>
                                                        <h5 className="font-bold text-sm text-foreground">{doc.title}</h5>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            {new Date(doc.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className="p-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {isFa ? "مشاهده" : "View"}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Document Viewer Modal ── */}
                    {selectedDoc && (
                        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900 z-10">
                                    <span className="font-bold text-white text-sm">
                                        {isFa ? "مشاهده سند رسمی" : "View Official Document"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-white/10"
                                        >
                                            <Printer className="w-4 h-4" />
                                            {isFa ? "چاپ سند" : "Print Document"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDoc(null)}
                                            className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-white flex justify-center overflow-x-auto min-h-[500px]">
                                    <div className="w-full max-w-2xl bg-white text-slate-800 p-8 rounded-lg shadow-inner">
                                        {(() => {
                                            const type = selectedDoc.document_type;
                                            const content = selectedDoc.document_content || {};

                                            if (type === "letter") {
                                                return (
                                                    <div className="space-y-6 font-sans text-slate-800 text-sm leading-relaxed" dir={content.isRtl ? "rtl" : "ltr"}>
                                                        <div className="flex justify-between items-start border-b pb-4 mb-4 border-slate-200">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{isFa ? "تاریخ:" : "Date:"} <span className="font-normal">{content.date || new Date(selectedDoc.created_at).toLocaleDateString()}</span></p>
                                                                <p className="font-bold text-slate-900">{isFa ? "شماره مرجع:" : "Ref No:"} <span className="font-normal font-mono">{content.refNo || "N/A"}</span></p>
                                                            </div>
                                                            <div className="text-right">
                                                                <h4 className="font-black text-slate-900 text-base">Iranian Christian Church</h4>
                                                                <p className="text-xs text-slate-500">Washington D.C. Metro Area</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{isFa ? "به:" : "To:"} <span className="font-normal">{content.recipient || selectedDoc.recipient_name}</span></p>
                                                            {content.recipientAddress && (
                                                                <p className="font-bold text-slate-900">{isFa ? "آدرس:" : "Address:"} <span className="font-normal text-xs">{content.recipientAddress}</span></p>
                                                            )}
                                                        </div>
                                                        <div className="mt-4">
                                                            <h3 className="text-base font-bold text-slate-900 border-b pb-1 mb-3">{content.subject || selectedDoc.title}</h3>
                                                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-[Vazirmatn] text-sm">{content.body || selectedDoc.description}</p>
                                                        </div>
                                                        {content.signatureTitle && (
                                                            <div className="mt-8 pt-4 flex flex-col items-end">
                                                                <p className="font-bold text-slate-900">{content.signatureTitle}</p>
                                                                <p className="text-xs text-slate-500">{isFa ? "کلیسا ایرانیان واشینگتن" : "Iranian Christian Church"}</p>
                                                                {selectedDoc.church_seal_image_url && (
                                                                    <img src={selectedDoc.church_seal_image_url} alt="Seal" className="h-16 w-auto mt-2 object-contain opacity-80" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (type === "receipt" || type === "inkind") {
                                                return (
                                                    <div className="space-y-6 font-sans text-slate-800 text-sm leading-relaxed" dir={isFa ? "rtl" : "ltr"}>
                                                        <div className="flex justify-between items-start border-b pb-4 mb-4 border-slate-200">
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-900">{isFa ? "رسید رسمی کمک مالی" : "Donation Receipt"}</h3>
                                                                <p className="text-xs text-slate-500">Official Tax Receipt</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-slate-900">{isFa ? "تاریخ:" : "Date:"} <span className="font-normal">{content.date || new Date(selectedDoc.created_at).toLocaleDateString()}</span></p>
                                                                <p className="font-bold text-slate-900">{isFa ? "شماره رسید:" : "Receipt No:"} <span className="font-normal font-mono">{content.refNo || "N/A"}</span></p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <div>
                                                                <p className="text-xs text-slate-500">{isFa ? "نام پرداخت کننده:" : "Donor Name:"}</p>
                                                                <p className="font-bold text-slate-800 text-sm">{content.donorName || selectedDoc.recipient_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500">{isFa ? "مبلغ:" : "Amount:"}</p>
                                                                <p className="font-black text-emerald-600 text-lg">${content.amount || 0}</p>
                                                            </div>
                                                            {content.paymentMethod && (
                                                                <div>
                                                                    <p className="text-xs text-slate-500">{isFa ? "روش پرداخت:" : "Payment Method:"}</p>
                                                                    <p className="font-bold text-slate-800 text-sm">{content.paymentMethod}</p>
                                                                </div>
                                                            )}
                                                            {content.amountWords && (
                                                                <div className="col-span-2">
                                                                    <p className="text-xs text-slate-500">{isFa ? "مبلغ به حروف:" : "Amount in Words:"}</p>
                                                                    <p className="font-medium text-slate-800 text-xs italic">{content.amountWords}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {type === "inkind" && content.inKindItems && (
                                                            <div className="mt-4">
                                                                <h4 className="font-bold text-slate-900 mb-2">{isFa ? "اقلام غیرنقدی:" : "In-Kind Items:"}</h4>
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="bg-slate-100 border-b border-slate-200">
                                                                            <th className="p-2 font-bold text-slate-700">{isFa ? "شرح" : "Description"}</th>
                                                                            <th className="p-2 font-bold text-slate-700 text-right">{isFa ? "تعداد" : "Qty"}</th>
                                                                            <th className="p-2 font-bold text-slate-700 text-right">{isFa ? "ارزش واحد" : "Unit Value"}</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {content.inKindItems.map((item: any, idx: number) => (
                                                                            <tr key={idx} className="border-b border-slate-100">
                                                                                <td className="p-2">{item.description}</td>
                                                                                <td className="p-2 text-right">{item.qty || item.quantity || 1}</td>
                                                                                <td className="p-2 text-right">${item.value || item.amount || 0}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}

                                                        <div className="text-xs text-slate-500 border-t pt-4 mt-4 space-y-1">
                                                            <p>Iranian Christian Church of Washington D.C. is a 501(c)(3) organization.</p>
                                                            <p>No goods or services were provided in exchange for this contribution other than intangible religious benefits.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (type === "invoice") {
                                                return (
                                                    <div className="space-y-6 font-sans text-slate-800 text-sm leading-relaxed" dir={isFa ? "rtl" : "ltr"}>
                                                        <div className="flex justify-between items-start border-b pb-4 mb-4 border-slate-200">
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-900">{isFa ? "صورتحساب رسمی" : "Invoice"}</h3>
                                                                <p className="font-mono text-xs text-slate-500">#{content.invoiceNo || "N/A"}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-slate-900">{isFa ? "تاریخ صدور:" : "Date:"} <span className="font-normal">{content.invoiceDate || new Date(selectedDoc.created_at).toLocaleDateString()}</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs text-slate-500">{isFa ? "صادر کننده:" : "From:"}</p>
                                                                <p className="font-bold text-slate-800">Iranian Christian Church</p>
                                                                <p className="text-xs text-slate-500">info@iranianchurchdc.com</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500">{isFa ? "به نام:" : "Bill To:"}</p>
                                                                <p className="font-bold text-slate-800">{content.invoiceTo || selectedDoc.recipient_name}</p>
                                                            </div>
                                                        </div>

                                                        {content.invoiceItems && (
                                                            <table className="w-full text-left border-collapse text-xs mt-4">
                                                                <thead>
                                                                    <tr className="bg-slate-100 border-b border-slate-200">
                                                                        <th className="p-2 font-bold text-slate-700">{isFa ? "شرح خدمات / کالا" : "Description"}</th>
                                                                        <th className="p-2 font-bold text-slate-700 text-right">{isFa ? "تعداد" : "Qty"}</th>
                                                                        <th className="p-2 font-bold text-slate-700 text-right">{isFa ? "قیمت واحد" : "Unit Price"}</th>
                                                                        <th className="p-2 font-bold text-slate-700 text-right">{isFa ? "جمع کل" : "Total"}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {content.invoiceItems.map((item: any, idx: number) => (
                                                                        <tr key={idx} className="border-b border-slate-100">
                                                                            <td className="p-2">{item.description}</td>
                                                                            <td className="p-2 text-right">{item.qty || item.quantity || 1}</td>
                                                                            <td className="p-2 text-right">${item.value || item.amount || 0}</td>
                                                                            <td className="p-2 text-right">${(item.qty || item.quantity || 1) * (item.value || item.amount || 0)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}

                                                        <div className="flex justify-end pt-4 border-t">
                                                            <div className="text-right space-y-1">
                                                                <p className="text-xs text-slate-500">{isFa ? "جمع کل نهایی:" : "Total Amount:"}</p>
                                                                <p className="text-xl font-black text-slate-900">${content.invoiceTotalAmount || 0}</p>
                                                            </div>
                                                        </div>

                                                        {content.invoiceNotes && (
                                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-xs font-[Vazirmatn]">
                                                                <p className="font-bold text-slate-700 mb-1">{isFa ? "توضیحات صورتحساب:" : "Invoice Notes:"}</p>
                                                                <p className="text-slate-600">{content.invoiceNotes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h3>
                                                    <p className="text-xs text-slate-500 font-mono">Type: {type}</p>
                                                    <p className="whitespace-pre-wrap text-slate-700">{selectedDoc.description}</p>
                                                    <div className="bg-slate-50 p-4 rounded-xl border font-mono text-xs overflow-x-auto text-slate-800">
                                                        {JSON.stringify(content, null, 2)}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Save Bar ── */}
                    <div className="flex justify-end gap-3 items-center pt-2">
                        {saveSuccess && (
                            <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> {isFa ? "ذخیره شد" : "Saved Successfully"}
                            </span>
                        )}
                        <button type="submit" disabled={isSaving}
                            className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20">
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isFa ? "ذخیره تمام تغییرات" : "Save All Changes"}
                        </button>
                    </div>
                </form>
            </main>

            <PublicFooter />
        </div>
    );
}
