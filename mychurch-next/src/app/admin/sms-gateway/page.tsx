"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Send, RefreshCw, CheckCircle, XCircle, Loader2, Zap, ShieldCheck, QrCode, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function SMSGatewayPage() {
    const [activeTab, setActiveTab] = useState<"google-messages" | "twilio">("google-messages");
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);

    // Google Messages (Personal SIM) State
    const [gmPaired, setGmPaired] = useState(false);
    const [gmQrCode, setGmQrCode] = useState<string | null>(null);

    // Twilio State
    const [twilioConfigured, setTwilioConfigured] = useState(false);
    const [twilioPhone, setTwilioPhone] = useState("");

    // Test sending
    const [testPhone, setTestPhone] = useState("+12029677030");
    const [testMsg, setTestMsg] = useState("✅ سلام! تست موفقیت‌آمیز ارسال پیامک از سیم‌کارت شخصی کلیسای ایرانیان واشنگتن 🕊️");
    const [sending, setSending] = useState(false);
    const [lastDeliverySid, setLastDeliverySid] = useState<string | null>(null);
    const [lastProviderUsed, setLastProviderUsed] = useState<string | null>(null);

    const checkStatus = async () => {
        setPolling(true);
        try {
            const res = await fetch("/api/admin/sms-gateway");
            const data = await res.json();
            
            if (data.error) {
                console.warn("[SMSGateway] Status error:", data.error);
                toast.error(data.error);
            }
            if (data.googleMessages) {
                setGmPaired(!!data.googleMessages.paired);
                setGmQrCode(data.googleMessages.qrCode || null);
            }
            if (data.twilio) {
                setTwilioConfigured(!!data.twilio.configured);
                setTwilioPhone(data.twilio.phoneNumber || "");
            }
        } catch (err) {
            toast.error("خطا در دریافت وضعیت درگاه‌های پیامک");
        } finally {
            setLoading(false);
            setPolling(false);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(() => {
            if (!gmPaired) {
                checkStatus();
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [gmPaired]);

    const sendTest = async () => {
        if (!testPhone.trim()) {
            toast.error("لطفا شماره تلفن گیرنده را وارد کنید.");
            return;
        }
        setSending(true);
        setLastDeliverySid(null);
        setLastProviderUsed(null);
        try {
            const res = await fetch("/api/admin/sms-gateway", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    phone: testPhone, 
                    message: testMsg,
                    provider: activeTab 
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ پیامک با موفقیت از ${activeTab === 'google-messages' ? 'سیم‌کارت شخصی شما' : 'درگاه ابری'} به ${testPhone} ارسال شد!`);
                if (data.sid) setLastDeliverySid(data.sid);
                setLastProviderUsed(data.provider || activeTab);
            } else {
                toast.error(data.error || "ارسال ناموفق بود. خطایی رخ داد.");
            }
        } catch {
            toast.error("خطا در برقراری ارتباط با سرور");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 font-[Vazirmatn]" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">درگاه پیامک کلیسا (SMS Gateway)</h1>
                        <p className="text-sm text-slate-400">ارسال پیامک از سیم‌کارت و خط شخصی شما یا درگاه ابری سرور</p>
                    </div>
                </div>
                <button
                    onClick={checkStatus}
                    disabled={polling}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 border border-white/10 transition"
                    title="بروزرسانی وضعیت"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${polling ? "animate-spin text-amber-400" : ""}`} />
                    <span>بروزرسانی</span>
                </button>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
                <button
                    onClick={() => setActiveTab("google-messages")}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        activeTab === "google-messages"
                            ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Smartphone className="w-4 h-4" />
                    <span>سیم‌کارت شخصی (Google Messages)</span>
                    {gmPaired ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono">نیاز به اسکن</span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("twilio")}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        activeTab === "twilio"
                            ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Cpu className="w-4 h-4" />
                    <span>درگاه ابری پشتیبان (Twilio)</span>
                    {twilioConfigured ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono">آفلاین</span>
                    )}
                </button>
            </div>

            {/* Tab 1: Google Messages (Personal SIM Card) */}
            {activeTab === "google-messages" && (
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                        gmPaired
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                    }`}>
                        {loading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : gmPaired ? (
                            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                        ) : (
                            <QrCode className="w-8 h-8 text-amber-400 shrink-0" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base">
                                    {gmPaired ? "✅ سیم‌کارت شخصی متصل و فعال است" : "📱 آماده اسکن بارکد QR با گوشی اندروید"}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    gmPaired ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                                }`}>
                                    {gmPaired ? "Connected to SIM" : "Awaiting Pairing"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {gmPaired 
                                    ? "پیامک‌ها بدون هیچ هزینه ابری مستقیماً از طریق سیم‌کارت و شماره شخصی شما ارسال می‌شوند."
                                    : "برای ارسال پیامک با خط شخصی خودتان، بارکد زیر را با گوشی اسکن کنید."}
                            </p>
                        </div>
                    </div>

                    {/* QR Code Card if not paired */}
                    {!gmPaired && (
                        <div className="bg-[#141824] border border-white/10 rounded-2xl p-6 text-center space-y-6 shadow-xl">
                            <div className="space-y-1">
                                <h3 className="font-bold text-white text-lg">اتصال سیم‌کارت شخصی به سرور</h3>
                                <p className="text-xs text-slate-400">اپلیکیشن Messages گوگل را در گوشی باز کرده و بارکد زیر را اسکن فرمایید.</p>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-3">
                                {gmQrCode ? (
                                    <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-amber-500/30">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={gmQrCode}
                                            alt="Google Messages Pairing QR Code"
                                            className="w-64 h-64 rounded-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-64 h-64 mx-auto bg-black/40 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 p-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                                        <span className="text-xs">در حال بارگذاری بارکد QR از سرور...</span>
                                        <span className="text-[10px] text-slate-500 text-center">چند ثانیه طول می‌کشد تا مرورگر سرور بارکد را از گوگل دریافت کند</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => checkStatus()}
                                    disabled={polling}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${polling ? "animate-spin text-amber-400" : ""}`} />
                                    <span>تازه‌سازی بارکد</span>
                                </button>
                            </div>

                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-right text-xs text-slate-300 space-y-2 max-w-md mx-auto">
                                <p className="font-bold text-white flex items-center gap-1.5">
                                    <span>راهنمای ۳ مرحله‌ای در گوشی:</span>
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                    <li>اپلیکیشن <span className="text-white font-bold">Google Messages</span> (پیام‌ها) را در گوشی باز کنید.</li>
                                    <li>روی تصویر پروفایل بالا سمت راست ضربه زده و <span className="text-amber-400 font-bold">Device pairing (جفت‌سازی دستگاه)</span> را انتخاب کنید.</li>
                                    <li>روی <span className="text-amber-400 font-bold">QR code scanner</span> زده و بارکد بالا را اسکن کنید.</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Twilio Cloud SMS */}
            {activeTab === "twilio" && (
                <div className="space-y-6">
                    <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                        twilioConfigured
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/20 text-red-300"
                    }`}>
                        <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-base">درگاه پیامک ابری کلیسا (Twilio Direct Cloud)</h3>
                            <p className="text-xs text-slate-300 mt-1">
                                خط اختصاصی فرستنده ابری: <span className="font-mono text-amber-300 dir-ltr inline-block px-1.5 py-0.5 bg-black/40 rounded">{twilioPhone || "فعال روی سرور"}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Sending Panel */}
            <div className="bg-[#141824] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-amber-400" />
                        <h2 className="font-bold text-white text-base">ارسال پیامک آزمایشی</h2>
                    </div>
                    <span className="text-xs text-amber-400 font-bold">
                        ارسال از: {activeTab === "google-messages" ? "📱 سیم‌کارت شخصی" : "☁️ درگاه ابری Twilio"}
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">شماره موبایل گیرنده (همراه با کد کشور):</label>
                    <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+12029677030 یا +98..."
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-left focus:outline-none focus:border-amber-400 transition-colors"
                        dir="ltr"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-300">
                        <label className="font-semibold">متن پیامک:</label>
                        <span className="text-[11px] text-slate-400">{testMsg.length} کاراکتر</span>
                    </div>
                    <textarea
                        value={testMsg}
                        onChange={(e) => setTestMsg(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400 transition-colors resize-none text-sm leading-relaxed"
                    />
                </div>

                <button
                    onClick={sendTest}
                    disabled={sending || (activeTab === "google-messages" && !gmPaired && !loading)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending 
                        ? "در حال مخابره پیامک..." 
                        : activeTab === "google-messages" && !gmPaired 
                        ? "ابتدا گوشی را با QR بالا جفت کنید" 
                        : "ارسال پیامک تست"}
                </button>

                {lastDeliverySid && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                        <span>شناسه پیگیری ارسال ({lastProviderUsed}):</span>
                        <span className="font-mono text-white select-all">{lastDeliverySid}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

