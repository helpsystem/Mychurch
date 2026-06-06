"use client";

import React, { useState, useEffect } from "react";
import { sendAdminOTP, verifyAdminOTP } from "@/actions/otp";
import { Shield, Mail, ArrowRight, Loader2, KeyRound, MessageSquare, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface VerifyAdminClientProps {
    email: string;
    initialPhone?: string;
    initialWhatsApp?: string;
}

export default function VerifyAdminClient({ email, initialPhone = "", initialWhatsApp = "" }: VerifyAdminClientProps) {
    // Determine the default channel: WhatsApp if exists, else SMS if exists, else Email
    const defaultChannel = initialWhatsApp.trim() ? "whatsapp" : initialPhone.trim() ? "sms" : "email";
    
    const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">(defaultChannel);
    const [code, setCode] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendCode = async () => {
        setIsSending(true);
        try {
            const res = await sendAdminOTP(channel);
            if (res.error) {
                toast.error(res.error);
            } else {
                if (res.channelUsed && res.channelUsed !== channel) {
                    // Failover happened
                    const channelNames = {
                        whatsapp: "واتساپ",
                        sms: "پیامک (SMS)",
                        email: "ایمیل"
                    };
                    toast.warning(`ارسال به ${channelNames[channel]} ناموفق بود. کد به ${channelNames[res.channelUsed as "whatsapp" | "sms" | "email"]} ارسال گردید.`);
                    setChannel(res.channelUsed as "whatsapp" | "sms" | "email");
                } else {
                    const successMessages = {
                        whatsapp: "کد تایید به واتساپ شما ارسال شد.",
                        sms: "کد تایید به شماره موبایل شما پیامک شد.",
                        email: "کد تایید به ایمیل شما ارسال شد."
                    };
                    toast.success(successMessages[channel]);
                }
                setCooldown(60); // 60 seconds cooldown
            }
        } catch (err) {
            toast.error("خطا در ارتباط با سرور جهت ارسال کد.");
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return toast.error("کد وارد شده باید ۶ رقم باشد.");

        setIsVerifying(true);
        try {
            const res = await verifyAdminOTP(code);
            if (res.error) {
                toast.error(res.error);
                setCode("");
            } else {
                toast.success("ورود موفقیت‌آمیز!");
                router.push("/admin");
            }
        } catch (err) {
            toast.error("خطا در تایید کد.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Helper to mask contact info for privacy
    const maskEmail = (val: string) => {
        const [user, domain] = val.split("@");
        if (!domain) return val;
        return `${user.slice(0, 3)}***@${domain}`;
    };

    const maskPhone = (val: string) => {
        if (!val) return "";
        const clean = val.replace(/\s+/g, "");
        if (clean.length < 7) return val;
        return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
    };

    return (
        <div className="max-w-md w-full bg-[#1c1917] border border-white/10 rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl font-[Vazirmatn] text-right" dir="rtl">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                    <Shield className="w-8 h-8 animate-pulse" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">تاییدیه امنیتی ورود (2FA)</h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-[280px]">
                    لطفاً روش دریافت کد تایید را انتخاب کرده و دکمه ارسال را بزنید.
                </p>
            </div>

            {/* Channel Selection Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 p-1.5 rounded-2xl mb-6">
                <button
                    type="button"
                    disabled={!initialWhatsApp.trim()}
                    onClick={() => setChannel("whatsapp")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "whatsapp"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30 scale-100"
                            : "text-muted-foreground hover:text-white disabled:opacity-40 disabled:hover:text-muted-foreground"
                    }`}
                    title={!initialWhatsApp.trim() ? "شماره واتساپ در پروفایل شما ثبت نشده است" : "دریافت از طریق واتساپ"}
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>واتساپ</span>
                </button>

                <button
                    type="button"
                    disabled={!initialPhone.trim()}
                    onClick={() => setChannel("sms")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "sms"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30 scale-100"
                            : "text-muted-foreground hover:text-white disabled:opacity-40 disabled:hover:text-muted-foreground"
                    }`}
                    title={!initialPhone.trim() ? "شماره موبایل در پروفایل شما ثبت نشده است" : "دریافت از طریق پیامک"}
                >
                    <Smartphone className="w-4 h-4" />
                    <span>پیامک (SMS)</span>
                </button>

                <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "email"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-900/30 scale-100"
                            : "text-muted-foreground hover:text-white"
                    }`}
                    title="دریافت از طریق ایمیل"
                >
                    <Mail className="w-4 h-4" />
                    <span>ایمیل</span>
                </button>
            </div>

            {/* Selected Channel Information */}
            <div className="mb-6 px-4 py-3 bg-black/20 border border-white/5 rounded-2xl text-center">
                <p className="text-xs text-muted-foreground mb-1">کد تایید به مقصد زیر ارسال خواهد شد:</p>
                <div className="font-mono text-sm text-emerald-400 font-bold select-all tracking-wide" dir="ltr">
                    {channel === "whatsapp" && (initialWhatsApp ? maskPhone(initialWhatsApp) : "ثبت نشده")}
                    {channel === "sms" && (initialPhone ? maskPhone(initialPhone) : "ثبت نشده")}
                    {channel === "email" && maskEmail(email)}
                </div>
            </div>

            <button 
                onClick={handleSendCode} 
                disabled={isSending || cooldown > 0}
                className="w-full mb-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white active:scale-98 cursor-pointer"
            >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Shield className="w-4 h-4 text-amber-500" />}
                {cooldown > 0 ? `ارسال مجدد کد (${cooldown} ثانیه)` : "ارسال کد تایید"}
            </button>

            <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                    <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="کد ۶ رقمی"
                        className="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-2xl pr-12 pl-4 py-4 text-center text-2xl font-mono tracking-widest outline-none transition-all placeholder:text-muted-foreground/30 text-white"
                        dir="ltr"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isVerifying || code.length < 6}
                    className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    <span>تایید و ورود به سیستم</span>
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
            </form>
        </div>
    );
}
