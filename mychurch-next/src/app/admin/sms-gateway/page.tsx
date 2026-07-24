"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Send, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function SMSGatewayPage() {
    const [status, setStatus] = useState<"loading" | "paired" | "unpaired">("loading");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [testPhone, setTestPhone] = useState("+12029677030");
    const [testMsg, setTestMsg] = useState("✅ تست سرویس پیامک MyChurch");
    const [sending, setSending] = useState(false);
    const [polling, setPolling] = useState(false);

    const checkStatus = async () => {
        setPolling(true);
        try {
            const res = await fetch("/api/admin/sms-gateway");
            const data = await res.json();
            if (data.paired) {
                setStatus("paired");
                setQrCode(null);
            } else {
                setStatus("unpaired");
                if (data.qrCode) setQrCode(data.qrCode);
            }
        } catch (err) {
            toast.error("خطا در دریافت وضعیت سرویس");
        } finally {
            setPolling(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Auto-refresh QR every 30 seconds if unpaired
        const interval = setInterval(() => {
            if (status === "unpaired") checkStatus();
        }, 30000);
        return () => clearInterval(interval);
    }, [status]);

    const sendTest = async () => {
        setSending(true);
        try {
            const res = await fetch("/api/admin/sms-gateway", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: testPhone, message: testMsg }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`✅ پیامک به ${testPhone} ارسال شد!`);
            } else {
                toast.error("ارسال ناموفق بود. مطمئن شوید گوشی متصل است.");
            }
        } catch {
            toast.error("خطا در ارسال پیامک");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 font-[Vazirmatn]" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">دروازه پیامک (Google Messages)</h1>
                    <p className="text-sm text-muted-foreground">ارسال SMS از طریق گوشی اندرویدی متصل</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                status === "paired"
                    ? "bg-green-500/10 border-green-500/20"
                    : status === "unpaired"
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-white/5 border-white/10"
            }`}>
                {status === "loading" && <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />}
                {status === "paired" && <CheckCircle className="w-8 h-8 text-green-400" />}
                {status === "unpaired" && <XCircle className="w-8 h-8 text-amber-400" />}
                <div>
                    <p className="font-bold text-white">
                        {status === "loading" && "در حال بررسی..."}
                        {status === "paired" && "✅ متصل و آماده ارسال"}
                        {status === "unpaired" && "❌ گوشی متصل نیست — نیاز به اسکن QR"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {status === "paired" && "Google Messages با گوشی اندرویدی شما Pair شده است."}
                        {status === "unpaired" && "با گوشی اندرویدی خود QR Code را اسکن کنید."}
                    </p>
                </div>
                <button
                    onClick={checkStatus}
                    disabled={polling}
                    className="mr-auto p-2 hover:bg-white/10 rounded-xl transition"
                    title="بروزرسانی وضعیت"
                >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${polling ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* QR Code Section */}
            {status === "unpaired" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
                    <div className="flex items-center gap-2 justify-center mb-4">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <h2 className="font-bold text-white">اتصال گوشی اندرویدی</h2>
                    </div>

                    {qrCode ? (
                        <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrCode}
                                alt="Google Messages QR Code"
                                className="w-64 h-64 rounded-2xl bg-white p-2"
                            />
                        </div>
                    ) : (
                        <div className="w-64 h-64 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    <div className="text-right space-y-2 bg-black/20 rounded-xl p-4 text-sm">
                        <p className="font-bold text-white mb-2">مراحل اتصال:</p>
                        <p className="text-muted-foreground">۱. اپ Google Messages را در گوشی اندرویدی باز کنید</p>
                        <p className="text-muted-foreground">۲. روی منو (سه نقطه) → Device Pairing ضربه بزنید</p>
                        <p className="text-muted-foreground">۳. QR Code بالا را اسکن کنید</p>
                        <p className="text-muted-foreground">۴. گزینه «Remember this device» را تیک بزنید</p>
                    </div>

                    <button
                        onClick={checkStatus}
                        disabled={polling}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition flex items-center justify-center gap-2"
                    >
                        {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        بررسی مجدد اتصال
                    </button>
                </div>
            )}

            {/* Test Send Section */}
            {status === "paired" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Send className="w-4 h-4 text-green-400" />
                        ارسال پیامک تست
                    </h2>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">شماره مقصد</label>
                            <input
                                type="text"
                                value={testPhone}
                                onChange={e => setTestPhone(e.target.value)}
                                dir="ltr"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-green-500 transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">متن پیام</label>
                            <textarea
                                value={testMsg}
                                onChange={e => setTestMsg(e.target.value)}
                                rows={3}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition resize-none"
                            />
                        </div>
                        <button
                            onClick={sendTest}
                            disabled={sending || !testPhone}
                            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? "در حال ارسال..." : "ارسال پیامک تست"}
                        </button>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-300 space-y-1">
                <p className="font-bold mb-2">⚡ نکات مهم:</p>
                <p>• گوشی اندرویدی باید همیشه روشن و متصل به اینترنت باشد</p>
                <p>• پیامک‌ها از شماره شخصی شما ارسال می‌شوند (بدون هزینه اضافه)</p>
                <p>• در صورت Expire شدن session، نیاز به اسکن مجدد QR است</p>
                <p>• این سرویس به عنوان جایگزین Twilio در سیستم OTP فعال است</p>
            </div>
        </div>
    );
}
