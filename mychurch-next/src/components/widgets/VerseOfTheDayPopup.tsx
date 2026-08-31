"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageSquare, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface VerseWidgetConfig {
    verseFa?: string;
    verseEn?: string;
    refFa?: string;
    refEn?: string;
    displayFrequency?: "always" | "session" | "24h" | "7d";
    showDelaySeconds?: number;
    enabledPaths?: string;
    excludedPaths?: string;
}

interface VerseOfTheDayPopupProps {
    config: VerseWidgetConfig;
}

export function VerseOfTheDayPopup({ config }: VerseOfTheDayPopupProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const isEn = language === "en";

    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState("");

    const verseFa = config.verseFa || "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.";
    const verseEn = config.verseEn || "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.";
    const refFa = config.refFa || "یوشع ۱:۹";
    const refEn = config.refEn || "Joshua 1:9";
    const delaySeconds = config.showDelaySeconds ?? 2;

    const parsePathList = (raw?: string) => {
        if (!raw) return [] as string[];
        return raw.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);
    };

    const routeAllowed = React.useMemo(() => {
        const normalize = (p: string) => {
            let clean = p.trim();
            if (!clean) return "";
            if (!clean.startsWith("/")) clean = "/" + clean;
            if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
            return clean;
        };

        const currentPath = normalize(pathname || "/");
        const includes = parsePathList(config.enabledPaths).map(normalize).filter(Boolean);
        const excludes = parsePathList(config.excludedPaths).map(normalize).filter(Boolean);

        const matchesPath = (p: string) => {
            if (p === "/") return currentPath === "/";
            return currentPath === p || currentPath.startsWith(`${p}/`);
        };

        const inEnabled = includes.length === 0 || includes.some(matchesPath);
        const inExcluded = excludes.some(matchesPath);
        return inEnabled && !inExcluded;
    }, [config.enabledPaths, config.excludedPaths, pathname]);

    const makeSeenKey = () => {
        const signature = `${verseFa.slice(0, 20)}|${refFa}`;
        return `verse_seen_${encodeURIComponent(signature).slice(0, 100)}`;
    };

    useEffect(() => {
        if (!routeAllowed) {
            setIsVisible(false);
            return;
        }

        const seenKey = makeSeenKey();
        const frequency = config.displayFrequency || "session";
        const currentTs = Date.now();

        let hasSeen = false;
        try {
            if (frequency === "always") {
                hasSeen = false;
            } else if (frequency === "session") {
                hasSeen = sessionStorage.getItem(seenKey) === "true";
            } else {
                const lastSeen = localStorage.getItem(seenKey);
                if (lastSeen) {
                    const delta = currentTs - Number(lastSeen);
                    const ttl = frequency === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
                    hasSeen = delta < ttl;
                }
            }
        } catch {
            hasSeen = false;
        }

        if (!hasSeen) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                // Save immediately so it doesn't reappear on route change
                const seenKeyLocal = makeSeenKey();
                const freqLocal = config.displayFrequency || "session";
                try {
                    if (freqLocal === "always") {
                        sessionStorage.setItem(seenKeyLocal, "true"); // 'always' should still be at most once per session to avoid SPA spam
                    } else if (freqLocal === "session") {
                        sessionStorage.setItem(seenKeyLocal, "true");
                    } else if (freqLocal === "24h" || freqLocal === "7d") {
                        localStorage.setItem(seenKeyLocal, String(Date.now()));
                    }
                } catch {}
            }, Math.max(0, delaySeconds) * 1000);
            return () => clearTimeout(timer);
        }

        setIsVisible(false);
    }, [config, routeAllowed, delaySeconds]);

    const handleClose = () => {
        setIsVisible(false);
        const seenKey = makeSeenKey();
        const frequency = config.displayFrequency || "session";
        try {
            if (frequency === "session") {
                sessionStorage.setItem(seenKey, "true");
            } else if (frequency === "24h" || frequency === "7d") {
                localStorage.setItem(seenKey, String(Date.now()));
            }
        } catch {}
    };

    const handleDonateRedirect = () => {
        handleClose();
        const paymentUrl = `/payment${message.trim() ? `?message=${encodeURIComponent(message.trim())}` : ""}`;
        router.push(paymentUrl);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
                    onClick={handleClose}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative z-10 w-[95%] sm:w-full max-w-2xl bg-neutral-950/80 border border-white/10 rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-6"
                    dir={isEn ? "ltr" : "rtl"}
                >
                    {/* Background glows */}
                    <div className="absolute -right-32 -top-32 w-80 h-80 rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
                    <div className="absolute -left-32 -bottom-32 w-80 h-80 rounded-full bg-rose-500/10 blur-[90px] pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        title={isEn ? "Close" : "بستن"}
                        className={`absolute top-4 sm:top-6 ${isEn ? "right-4 sm:right-6" : "left-4 sm:left-6"} p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/5`}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header: Verse of the Day Badge */}
                    <div className="flex items-center justify-start">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black border border-primary/20 shadow-sm backdrop-blur-md">
                            <Image
                                src="/logo-transparent.png"
                                alt="Logo"
                                width={18}
                                height={18}
                                className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                            />
                            {isEn ? "Verse of the Day" : "آیه روز"}
                        </div>
                    </div>

                    {/* Verse Translation Block */}
                    <div className="space-y-4">
                        <h3 className="text-[clamp(1.25rem,4vw,1.875rem)] font-black leading-relaxed text-foreground/90 text-right font-[Vazirmatn]" dir="rtl">
                            "{verseFa}"
                        </h3>
                        <h3 className="text-[clamp(1.1rem,3.5vw,1.5rem)] font-bold leading-relaxed text-foreground/70 text-left font-serif italic" dir="ltr">
                            "{verseEn}"
                        </h3>
                    </div>

                    {/* Verse Reference Tag */}
                    <div>
                        <span className="text-primary font-bold text-base bg-black/30 inline-block px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm shadow-inner">
                            {isEn ? refEn : refFa}
                        </span>
                    </div>

                    {/* Message section */}
                    <div className="mt-2 space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            {isEn ? "Write an inspiring message of blessing or gift:" : "نوشتن پیغامی الهام‌بخش برای برکت و هدیه دادن:"}
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={isEn ? "Write your message of blessing here..." : "پیام محبت‌آمیز یا دعای برکت خود را در اینجا بنویسید..."}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium leading-relaxed resize-none font-sans"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-2 flex flex-col gap-4 border-t border-white/5 pt-4">
                        <p className={`text-xs text-muted-foreground text-center ${isEn ? "sm:text-left" : "sm:text-right"} font-medium leading-relaxed`}>
                            {isEn 
                                ? "Your message will be sent to the church along with your support gift." 
                                : "پیغام شما به همراه هدیه حمایتی شما برای کلیسا ارسال و ثبت خواهد شد."}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:justify-end">
                            <button
                                onClick={handleClose}
                                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-bold px-6 py-4 rounded-2xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] shrink-0 font-sans"
                            >
                                {isEn ? "Later" : "بعداً انجام می‌دهم"}
                            </button>
                            <button
                                onClick={handleDonateRedirect}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-neutral-200 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] shrink-0 font-sans"
                            >
                                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                {isEn ? "Donate & Send Blessing" : "پرداخت هدیه و ارسال پیام"}
                                {!isEn && <ArrowLeft className="w-4 h-4 mr-1" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
