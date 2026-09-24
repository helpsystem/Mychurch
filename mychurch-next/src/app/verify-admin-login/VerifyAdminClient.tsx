"use client";

import React, { useState, useEffect } from "react";
import { sendAdminOTP, verifyAdminOTP } from "@/actions/otp";
import { Shield, Mail, ArrowRight, Loader2, KeyRound, MessageSquare, Smartphone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OtpInput } from "@/components/ui/OtpInput";
import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";

interface VerifyAdminClientProps {
    email: string;
    initialPhone?: string;
    initialWhatsApp?: string;
    initialTelegram?: string;
}

const localDict = {
    en: {
        channelNames: {
            telegram: "Telegram",
            whatsapp: "WhatsApp",
            sms: "SMS",
            email: "Email",
        },
        failoverWarning: (from: string, to: string) => `Sending to ${from} failed. The code was sent to ${to} instead.`,
        sentSuccess: {
            telegram: "The verification code was sent to your Telegram.",
            whatsapp: "The verification code was sent to your WhatsApp.",
            sms: "The verification code was sent by SMS to your mobile number.",
            email: "The verification code was sent to your email.",
        },
        sendCodeError: "Error contacting the server to send the code.",
        codeLengthError: "The code must be 6 digits.",
        verifiedSuccess: "Signed in successfully!",
        verifyCodeError: "Error verifying the code.",
        pageTitle: "Login Security Verification (2FA)",
        pageSubtitle: "Please choose how to receive the verification code, then tap send.",
        telegramInvalidWithValue: (val: string) => `Saved value (${val}) is not valid — it must be a number`,
        telegramNotSet: "No Telegram ID is set in your profile",
        telegramHint: "Receive via Telegram",
        whatsappNotSet: "No WhatsApp number is set in your profile",
        whatsappHint: "Receive via WhatsApp",
        smsNotSet: "No mobile number is set in your profile",
        smsHint: "Receive via SMS",
        emailHint: "Receive via Email",
        telegramLabel: "Telegram",
        whatsappLabel: "WhatsApp",
        smsLabel: "SMS",
        emailLabel: "Email",
        codeWillBeSentTo: "The verification code will be sent to the destination below:",
        telegramInvalid: (val: string) => `⚠️ Invalid: ${val}`,
        notSet: "Not set",
        resendCode: (s: number) => `Resend code (${s}s)`,
        sendCode: "Send Verification Code",
        verifyAndLogin: "Verify and Sign In",
    },
    fa: {
        channelNames: {
            telegram: "تلگرام",
            whatsapp: "واتساپ",
            sms: "پیامک (SMS)",
            email: "ایمیل",
        },
        failoverWarning: (from: string, to: string) => `ارسال به ${from} ناموفق بود. کد به ${to} ارسال گردید.`,
        sentSuccess: {
            telegram: "کد تایید به تلگرام شما ارسال شد.",
            whatsapp: "کد تایید به واتساپ شما ارسال شد.",
            sms: "کد تایید به شماره موبایل شما پیامک شد.",
            email: "کد تایید به ایمیل شما ارسال شد.",
        },
        sendCodeError: "خطا در ارتباط با سرور جهت ارسال کد.",
        codeLengthError: "کد وارد شده باید ۶ رقم باشد.",
        verifiedSuccess: "ورود موفقیت‌آمیز!",
        verifyCodeError: "خطا در تایید کد.",
        pageTitle: "تاییدیه امنیتی ورود (2FA)",
        pageSubtitle: "لطفاً روش دریافت کد تایید را انتخاب کرده و دکمه ارسال را بزنید.",
        telegramInvalidWithValue: (val: string) => `مقدار ذخیره‌شده (${val}) معتبر نیست — باید عدد باشد`,
        telegramNotSet: "شناسه تلگرام در پروفایل شما ثبت نشده است",
        telegramHint: "دریافت از طریق تلگرام",
        whatsappNotSet: "شماره واتساپ در پروفایل شما ثبت نشده است",
        whatsappHint: "دریافت از طریق واتساپ",
        smsNotSet: "شماره موبایل در پروفایل شما ثبت نشده است",
        smsHint: "دریافت از طریق پیامک",
        emailHint: "دریافت از طریق ایمیل",
        telegramLabel: "تلگرام",
        whatsappLabel: "واتساپ",
        smsLabel: "پیامک (SMS)",
        emailLabel: "ایمیل",
        codeWillBeSentTo: "کد تایید به مقصد زیر ارسال خواهد شد:",
        telegramInvalid: (val: string) => `⚠️ نامعتبر: ${val}`,
        notSet: "ثبت نشده",
        resendCode: (s: number) => `ارسال مجدد کد (${s} ثانیه)`,
        sendCode: "ارسال کد تایید",
        verifyAndLogin: "تایید و ورود به سیستم",
    },
    es: {
        channelNames: {
            telegram: "Telegram",
            whatsapp: "WhatsApp",
            sms: "SMS",
            email: "Correo electrónico",
        },
        failoverWarning: (from: string, to: string) => `El envío a ${from} falló. El código se envió a ${to} en su lugar.`,
        sentSuccess: {
            telegram: "El código de verificación se envió a tu Telegram.",
            whatsapp: "El código de verificación se envió a tu WhatsApp.",
            sms: "El código de verificación se envió por SMS a tu número móvil.",
            email: "El código de verificación se envió a tu correo electrónico.",
        },
        sendCodeError: "Error al contactar al servidor para enviar el código.",
        codeLengthError: "El código debe tener 6 dígitos.",
        verifiedSuccess: "¡Inicio de sesión exitoso!",
        verifyCodeError: "Error al verificar el código.",
        pageTitle: "Verificación de Seguridad de Inicio de Sesión (2FA)",
        pageSubtitle: "Por favor elige cómo recibir el código de verificación y presiona enviar.",
        telegramInvalidWithValue: (val: string) => `El valor guardado (${val}) no es válido — debe ser un número`,
        telegramNotSet: "No hay un ID de Telegram registrado en tu perfil",
        telegramHint: "Recibir por Telegram",
        whatsappNotSet: "No hay un número de WhatsApp registrado en tu perfil",
        whatsappHint: "Recibir por WhatsApp",
        smsNotSet: "No hay un número móvil registrado en tu perfil",
        smsHint: "Recibir por SMS",
        emailHint: "Recibir por correo electrónico",
        telegramLabel: "Telegram",
        whatsappLabel: "WhatsApp",
        smsLabel: "SMS",
        emailLabel: "Correo",
        codeWillBeSentTo: "El código de verificación se enviará al siguiente destino:",
        telegramInvalid: (val: string) => `⚠️ Inválido: ${val}`,
        notSet: "No registrado",
        resendCode: (s: number) => `Reenviar código (${s}s)`,
        sendCode: "Enviar Código de Verificación",
        verifyAndLogin: "Verificar e Iniciar Sesión",
    },
};

export default function VerifyAdminClient({ email, initialPhone = "", initialWhatsApp = "", initialTelegram = "" }: VerifyAdminClientProps) {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;

    // telegram_id must be a pure number — reject emails or other invalid values saved in DB
    const validTelegram = initialTelegram.trim() && /^\d+$/.test(initialTelegram.trim()) ? initialTelegram.trim() : "";

    // Determine the default channel: Telegram if valid numeric ID, else WhatsApp, else SMS, else Email
    const defaultChannel = validTelegram ? "telegram" : initialWhatsApp.trim() ? "whatsapp" : initialPhone.trim() ? "sms" : "email";

    const [channel, setChannel] = useState<"telegram" | "whatsapp" | "sms" | "email">(defaultChannel);
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
                    toast.warning(d.failoverWarning(d.channelNames[channel], d.channelNames[res.channelUsed as keyof typeof d.channelNames]));
                    setChannel(res.channelUsed as "telegram" | "whatsapp" | "sms" | "email");
                } else {
                    toast.success(d.sentSuccess[channel]);
                }
                setCooldown(60); // 60 seconds cooldown
            }
        } catch (err) {
            toast.error(d.sendCodeError);
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return toast.error(d.codeLengthError);

        setIsVerifying(true);
        try {
            const res = await verifyAdminOTP(code);
            if (res.error) {
                toast.error(res.error);
                setCode("");
            } else {
                toast.success(d.verifiedSuccess);
                router.push("/admin");
            }
        } catch (err) {
            toast.error(d.verifyCodeError);
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-md w-full bg-[#1c1917] border border-white/10 rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl font-[Vazirmatn] text-right"
            dir={isRTL ? "rtl" : "ltr"}
        >
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                    <Shield className="w-8 h-8 animate-pulse" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">{d.pageTitle}</h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-[280px]">
                    {d.pageSubtitle}
                </p>
            </div>

            {/* Channel Selection Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 border border-white/5 p-1.5 rounded-2xl mb-6">
                <button
                    type="button"
                    disabled={!validTelegram}
                    onClick={() => setChannel("telegram")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "telegram"
                            ? "bg-sky-600 text-white shadow-md shadow-sky-900/30 scale-100"
                            : "text-muted-foreground hover:text-white disabled:opacity-40 disabled:hover:text-muted-foreground"
                    }`}
                    title={!validTelegram ? (initialTelegram ? d.telegramInvalidWithValue(initialTelegram) : d.telegramNotSet) : d.telegramHint}
                >
                    <Send className="w-4 h-4" />
                    <span>{d.telegramLabel}</span>
                </button>

                <button
                    type="button"
                    disabled={!initialWhatsApp.trim()}
                    onClick={() => setChannel("whatsapp")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "whatsapp"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30 scale-100"
                            : "text-muted-foreground hover:text-white disabled:opacity-40 disabled:hover:text-muted-foreground"
                    }`}
                    title={!initialWhatsApp.trim() ? d.whatsappNotSet : d.whatsappHint}
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>{d.whatsappLabel}</span>
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
                    title={!initialPhone.trim() ? d.smsNotSet : d.smsHint}
                >
                    <Smartphone className="w-4 h-4" />
                    <span>{d.smsLabel}</span>
                </button>

                <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        channel === "email"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-900/30 scale-100"
                            : "text-muted-foreground hover:text-white"
                    }`}
                    title={d.emailHint}
                >
                    <Mail className="w-4 h-4" />
                    <span>{d.emailLabel}</span>
                </button>
            </div>

            {/* Selected Channel Information */}
            <div className="mb-6 px-4 py-3 bg-black/20 border border-white/5 rounded-2xl text-center">
                <p className="text-xs text-muted-foreground mb-1">{d.codeWillBeSentTo}</p>
                <div className="font-mono text-sm text-emerald-400 font-bold select-all tracking-wide" dir="ltr">
                    {channel === "telegram" && (validTelegram ? `Chat ID: ${validTelegram}` : initialTelegram ? d.telegramInvalid(initialTelegram) : d.notSet)}
                    {channel === "whatsapp" && (initialWhatsApp ? maskPhone(initialWhatsApp) : d.notSet)}
                    {channel === "sms" && (initialPhone ? maskPhone(initialPhone) : d.notSet)}
                    {channel === "email" && maskEmail(email)}
                </div>
            </div>

            <button
                onClick={handleSendCode}
                disabled={isSending || cooldown > 0}
                className="w-full mb-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white active:scale-98 cursor-pointer"
            >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Shield className="w-4 h-4 text-amber-500" />}
                {cooldown > 0 ? d.resendCode(cooldown) : d.sendCode}
            </button>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="py-2">
                    <OtpInput
                        length={6}
                        value={code}
                        onChange={setCode}
                        disabled={isVerifying}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isVerifying || code.length < 6}
                    className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    <span>{d.verifyAndLogin}</span>
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
            </form>
        </motion.div>
    );
}
