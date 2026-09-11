"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Users, Calendar, Loader2, ArrowLeft, PhoneCall, Info, Key, Smartphone, QrCode, ShieldCheck, RefreshCw, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { sendWhatsAppBroadcast, sendTestWhatsAppMessage, WhatsAppLog } from "@/actions/communications";
import Link from "next/link";

export default function WhatsAppClient({ 
    initialWhatsAppLogs
}: { 
    initialWhatsAppLogs: WhatsAppLog[]
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [selectedProvider, setSelectedProvider] = useState<"personal" | "twilio" | "meta">("personal");

    // Personal WhatsApp Linked Device State
    const [personalStatus, setPersonalStatus] = useState<{
        paired: boolean;
        qrCode: string | null;
        userPhone: string | null;
        userName: string | null;
    }>({
        paired: false,
        qrCode: null,
        userPhone: null,
        userName: null
    });
    const [loadingPersonal, setLoadingPersonal] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);
    
    const [whatsappData, setWhatsappData] = useState({
        body: "",
        isTemplate: false,
        templateName: "hello_world",
        langCode: "en_US"
    });

    const checkPersonalStatus = async () => {
        try {
            const res = await fetch("/api/admin/whatsapp/status");
            const data = await res.json();
            setPersonalStatus({
                paired: !!data.paired,
                qrCode: data.qrCode || null,
                userPhone: data.userPhone || null,
                userName: data.userName || null
            });
        } catch {
            // bridge might be starting
        } finally {
            setLoadingPersonal(false);
        }
    };

    useEffect(() => {
        checkPersonalStatus();
        const interval = setInterval(() => {
            if (!personalStatus.paired) {
                checkPersonalStatus();
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [personalStatus.paired]);

    const handleDisconnectPersonal = async () => {
        if (!confirm("آیا مطمئن هستید که می‌خواهید اتصال این خط شخصی را قطع نمایید؟")) return;
        setDisconnecting(true);
        try {
            const res = await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("اتصال خط با موفقیت قطع شد. می‌توانید شماره جدیدی متصل کنید.");
                setPersonalStatus({ paired: false, qrCode: null, userPhone: null, userName: null });
                checkPersonalStatus();
            } else {
                toast.error(data.error || "خطا در قطع اتصال");
            }
        } catch {
            toast.error("خطا در ارتباط با سرور");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await sendWhatsAppBroadcast(
            whatsappData.body,
            whatsappData.isTemplate,
            whatsappData.templateName,
            whatsappData.langCode,
            selectedProvider
        );
        setIsSubmitting(false);

        if (res.success) {
            toast.success(`پیام با موفقیت به ${res.count || 0} کاربر ارسال شد.`);
            setWhatsappData({ body: "", isTemplate: false, templateName: "hello_world", langCode: "en_US" });
            window.location.reload();
        } else {
            toast.error(res.error || "خطا در ارسال پیام واتساپ.");
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testPhone.trim()) {
            toast.error("لطفا شماره تلفن تست را وارد کنید.");
            return;
        }
        setIsTestingWhatsApp(true);
        const res = await sendTestWhatsAppMessage(
            testPhone,
            whatsappData.body,
            whatsappData.isTemplate,
            whatsappData.templateName,
            whatsappData.langCode,
            selectedProvider
        );
        setIsTestingWhatsApp(false);

        if (res.success) {
            toast.success("پیام تستی با موفقیت ارسال شد.");
        } else {
            toast.error(res.error || "خطا در ارسال پیام تستی واتساپ.");
        }
    };

    const openDirectWhatsApp = () => {
        const clean = testPhone.replace(/[^\d]/g, "");
        if (!clean) {
            toast.error("شماره تلفن را وارد کنید.");
            return;
        }
        const text = encodeURIComponent(whatsappData.body || "سلام! از سوی کلیسای ایرانیان واشنگتن 🕊️");
        window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${text}`, "_blank");
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen font-[Vazirmatn]">
            {/* TopAppbar */}
            <header className="flex items-center justify-between px-8 h-20 bg-[#131315]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
                <div className="flex items-center">
                    <Link href="/admin/communications" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white mr-4">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#00dce4] font-[Work Sans]">WhatsApp Campaigns</h1>
                        <p className="text-sm text-[#c2c6d6]">ارسال پیام از خط و شماره شخصی شما یا درگاه‌های ابری</p>
                    </div>
                </div>

                <button
                    onClick={checkPersonalStatus}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#00dce4] border border-white/10 transition"
                    title="بروزرسانی وضعیت"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>بروزرسانی اتصال</span>
                </button>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-y-auto">
                {/* Left Column: Compose & Active Campaigns */}
                <div className="xl:col-span-8 flex flex-col gap-8">

                    {/* Personal WhatsApp Device Status & Pairing Card */}
                    <div className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4" dir="rtl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span>خط شخصی شما (WhatsApp Linked Device)</span>
                                        {personalStatus.paired ? (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">متصل و فعال</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">آماده اسکن</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        ارسال مستقیم پیام‌ها با شماره و پروفایل شخصی خودتان (بدون نیاز به پرداخت دلاری یا تأیید قالب متا)
                                    </p>
                                </div>
                            </div>

                            {personalStatus.paired && (
                                <button
                                    onClick={handleDisconnectPersonal}
                                    disabled={disconnecting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition disabled:opacity-50"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>{disconnecting ? "در حال خروج..." : "قطع اتصال خط"}</span>
                                </button>
                            )}
                        </div>

                        {personalStatus.paired ? (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    <span>
                                        دستگاه متصل: <strong className="font-mono text-white text-sm">{personalStatus.userPhone}</strong>
                                        {personalStatus.userName && <span className="opacity-90 mr-2 font-sans">({personalStatus.userName})</span>}
                                    </span>
                                </div>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 font-bold">Online & Ready</span>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                                <div className="shrink-0 flex justify-center">
                                    {personalStatus.qrCode ? (
                                        <div className="p-2.5 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/30">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={personalStatus.qrCode}
                                                alt="WhatsApp QR Code"
                                                className="w-48 h-48 rounded-xl"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                            <span className="text-[11px]">دریافت بارکد QR...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 text-xs text-slate-300">
                                    <p className="font-bold text-white text-sm mb-1">دستورالعمل اتصال خط شخصی به سامانه:</p>
                                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed">
                                        <li>برنامه <strong className="text-white">WhatsApp</strong> را روی گوشی موبایل خود باز کنید.</li>
                                        <li>به منوی <strong className="text-emerald-400">Settings (تنظیمات)</strong> بروید.</li>
                                        <li>گزینه <strong className="text-emerald-400">Linked Devices (دستگاه‌های متصل)</strong> را انتخاب کنید.</li>
                                        <li>روی <strong className="text-white">Link a Device (اتصال یک دستگاه)</strong> زده و بارکد مقابل را اسکن کنید.</li>
                                    </ol>
                                    <p className="text-[11px] text-emerald-300/80 pt-1">
                                        💡 پس از اسکن، دستگاه برای همیشه ذخیره شده و تمام پیام‌ها از شماره شخصی شما ارسال می‌شوند.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                        <form onSubmit={handleWhatsAppSubmit} className="space-y-6" dir="rtl">
                            {/* Provider Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#c2c6d6]">درگاه فرستنده پیام (Sender Channel)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProvider("personal")}
                                        className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                                            selectedProvider === "personal"
                                                ? "bg-emerald-500/20 border-emerald-500 text-white"
                                                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">📱 خط شخصی شما</div>
                                            <div className="text-[10px] opacity-75">سیم‌کارت / وب بدون هزینه</div>
                                        </div>
                                        {personalStatus.paired && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedProvider("twilio")}
                                        className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                                            selectedProvider === "twilio"
                                                ? "bg-[#00dce4]/20 border-[#00dce4] text-white"
                                                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">☁️ درگاه ابری Twilio</div>
                                            <div className="text-[10px] opacity-75">شماره رسمی سرور</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedProvider("meta")}
                                        className={`p-3 rounded-xl border text-right transition flex items-center justify-between ${
                                            selectedProvider === "meta"
                                                ? "bg-blue-500/20 border-blue-500 text-white"
                                                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">🏢 Meta Cloud API</div>
                                            <div className="text-[10px] opacity-75">قالب‌های رسمی فیس‌بوک</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Mode Select */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#c2c6d6]">نوع پیام (Message Type)</label>
                                    <select 
                                        value={whatsappData.isTemplate ? "template" : "text"} 
                                        onChange={(e) => setWhatsappData({...whatsappData, isTemplate: e.target.value === "template"})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 font-[Vazirmatn] appearance-none"
                                    >
                                        <option value="text" className="bg-[#131315]">پیام متنی آزاد (بدون محدودیت قالب)</option>
                                        {selectedProvider === "meta" && (
                                            <option value="template" className="bg-[#131315]">قالب آماده تأیید شده متا (Meta Template)</option>
                                        )}
                                    </select>
                                </div>

                                {whatsappData.isTemplate ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#c2c6d6]">نام قالب (Template Name)</label>
                                            <input
                                                type="text"
                                                required
                                                value={whatsappData.templateName}
                                                onChange={(e) => setWhatsappData({...whatsappData, templateName: e.target.value})}
                                                placeholder="e.g. hello_world"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#c2c6d6]">کد زبان (Lang Code)</label>
                                            <input
                                                type="text"
                                                required
                                                value={whatsappData.langCode}
                                                onChange={(e) => setWhatsappData({...whatsappData, langCode: e.target.value})}
                                                placeholder="e.g. en_US"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center h-[52px] mt-7">
                                        {selectedProvider === "personal" 
                                            ? "✅ در ارسال با خط شخصی شما، هیچ محدودیت ۲۴ ساعته‌ای وجود ندارد." 
                                            : "ارسال مستقیم به تمام مخاطبان و اعضای ثبت شده."}
                                    </div>
                                )}
                            </div>

                            {!whatsappData.isTemplate && (
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-sm font-bold text-[#c2c6d6]">متن پیام واتساپ (Message Body)</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={whatsappData.body}
                                        onChange={(e) => setWhatsappData({...whatsappData, body: e.target.value})}
                                        placeholder="متن پیام خود را بنویسید..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all resize-none font-[Vazirmatn]"
                                    />
                                </div>
                            )}

                            {/* Test Configuration */}
                            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <PhoneCall className="w-4 h-4 text-[#00dce4]" /> تست تنظیمات قبل از ارسال کلی
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <label className="text-xs text-[#c2c6d6]">شماره تماس تست (همراه با کد کشور)</label>
                                        <input
                                            type="text"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="+17030000000"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                            type="button" 
                                            disabled={isTestingWhatsApp || isSubmitting} 
                                            onClick={handleTestWhatsApp} 
                                            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-neutral-800 hover:bg-neutral-700 text-white transition flex items-center gap-2 disabled:opacity-50 shrink-0 border border-white/10 justify-center flex-1 sm:flex-none"
                                        >
                                            {isTestingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : "ارسال پیام تست"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openDirectWhatsApp}
                                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 shrink-0 justify-center"
                                            title="باز کردن مستقیم چت در واتساپ"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>چت مستقیم</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
                                <div className="text-xs text-[#c2c6d6] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>
                                        ارسال از: <strong>{selectedProvider === "personal" ? "خط شخصی شما" : selectedProvider === "twilio" ? "Twilio ابری" : "Meta API"}</strong>
                                    </span>
                                </div>

                                <button disabled={isSubmitting || isTestingWhatsApp} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00dce4] text-[#003739] hover:opacity-90 transition-transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 disabled:opacity-50 w-full md:w-auto justify-center" dir="ltr">
                                    {isSubmitting ? "Broadcasting..." : <><Send className="w-4 h-4" /> Broadcast via WhatsApp</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* WhatsApp Logs List */}
                    <div className="mt-4">
                        <h2 className="font-bold text-lg text-white mb-4 font-[Work Sans]">Recent Broadcast Logs</h2>
                        <div className="space-y-4 font-[Vazirmatn]" dir="rtl">
                            {initialWhatsAppLogs.length === 0 ? (
                                <p className="text-[#c2c6d6] text-center py-10 bg-[#1c1b1d] rounded-xl border border-white/5">هیچ ارسال واتساپی ثبت نشده است.</p>
                            ) : (
                                initialWhatsAppLogs.map((log, i) => (
                                    <div key={log.id || i} className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-white/10 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.status === 'success' ? 'bg-[#00dce4]/10 text-[#00dce4]' : log.status === 'partial_success' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
                                                    <span>تعداد گیرندگان: {log.recipient_count}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${log.status === 'success' ? 'bg-[#00dce4]/20 text-[#00dce4]' : log.status === 'partial_success' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {log.status === 'success' ? 'موفق' : log.status === 'partial_success' ? 'موفقیت جزئی' : 'ناموفق'}
                                                    </span>
                                                </h3>
                                                <p className="text-sm text-[#c2c6d6] line-clamp-1 max-w-[400px]">{log.body}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#c2c6d6] shrink-0 bg-[#131315] px-3 py-1.5 rounded-lg border border-white/5" dir="ltr">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(log.sent_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Mobile Preview */}
                <div className="xl:col-span-4 hidden xl:flex flex-col h-full pl-8 border-l border-white/5">
                    <h2 className="font-bold text-lg text-white mb-6 font-[Work Sans]">WhatsApp Device Preview</h2>
                    <div className="flex-1 bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center p-6 relative overflow-hidden">
                        
                        {/* Mobile Device Mockup */}
                        <div className="w-[320px] h-[600px] bg-[#00040F] rounded-[2rem] border-[6px] border-[#353437] mt-4 shadow-2xl relative flex flex-col overflow-hidden">
                            {/* WhatsApp Header Mock */}
                            <div className="h-16 bg-[#075e54] text-white flex items-center px-4 shadow-md z-10 shrink-0" dir="ltr">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Church Community</div>
                                    <div className="text-[10px] text-white/80">business account</div>
                                </div>
                            </div>

                            {/* WhatsApp Chat Background */}
                            <div className="flex-1 bg-[#efeae2] p-4 overflow-y-auto relative z-0">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rro_M6-B05F.png')" }}></div>
                                
                                <div className="relative z-10 flex flex-col items-start gap-4 pt-4" dir="rtl">
                                    {/* Received Message Mock */}
                                    <div className="bg-white text-black p-2.5 rounded-xl rounded-tr-none shadow-sm max-w-[85%] text-sm relative self-start border border-gray-200">
                                        <div className="text-[#075e54] text-xs font-bold mb-1">Sanctuary</div>
                                        {whatsappData.isTemplate ? (
                                            <p className="italic text-gray-500">[Template: {whatsappData.templateName}]</p>
                                        ) : whatsappData.body ? (
                                            <p className="whitespace-pre-wrap">{whatsappData.body}</p>
                                        ) : (
                                            <p className="text-gray-400">پیام شما در اینجا نمایش داده می‌شود...</p>
                                        )}
                                        <div className="text-[10px] text-gray-400 text-left mt-1" dir="ltr">10:45 AM</div>
                                        {/* Tail */}
                                        <div className="absolute -top-[1px] -right-[9px] w-0 h-0 border-l-[10px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent"></div>
                                        <div className="absolute -top-[2px] -right-[11px] w-0 h-0 border-l-[12px] border-l-gray-200 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent -z-10"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* WhatsApp Input Mock */}
                            <div className="h-14 bg-[#f0f0f0] flex items-center px-2 shrink-0 z-10 gap-2" dir="ltr">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500">
                                    +
                                </div>
                                <div className="flex-1 h-9 bg-white rounded-full flex items-center px-4 text-gray-400 text-sm">
                                    Type a message
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center text-white">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
