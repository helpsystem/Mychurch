"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageSquare, ArrowLeft, Sparkles, CheckCircle2, Globe, Bookmark } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getTodayVerse } from "@/lib/daily-verses";

interface VerseWidgetConfig {
    useCustomVerse?: boolean;
    verseFa?: string;
    verseEn?: string;
    refFa?: string;
    refEn?: string;
    displayFrequency?: "always" | "session" | "24h" | "7d";
    showDelaySeconds?: number;
    enabledPaths?: string;
    excludedPaths?: string;
    givingPromptFa?: string;
    givingPromptEn?: string;
}

interface VerseOfTheDayPopupProps {
    config: VerseWidgetConfig;
}

export function VerseOfTheDayPopup({ config }: VerseOfTheDayPopupProps) {
    const { language, setLanguage } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();

    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [activeLang, setActiveLang] = useState<"fa" | "en">(language === "en" ? "en" : "fa");

    const isEn = activeLang === "en";

    // Obtain dynamic daily verse based on today's calendar day
    const activeVerse = useMemo(() => {
        return getTodayVerse(config);
    }, [config]);

    const delaySeconds = config.showDelaySeconds ?? 2;

    const parsePathList = (raw?: string) => {
        if (!raw) return [] as string[];
        return raw.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);
    };

    const routeAllowed = useMemo(() => {
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
        const todayDate = new Date().toISOString().split("T")[0];
        return `verse_seen_${todayDate}_${activeVerse.id}`;
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
                const seenKeyLocal = makeSeenKey();
                const freqLocal = config.displayFrequency || "session";
                try {
                    if (freqLocal === "always" || freqLocal === "session") {
                        sessionStorage.setItem(seenKeyLocal, "true");
                    } else if (freqLocal === "24h" || freqLocal === "7d") {
                        localStorage.setItem(seenKeyLocal, String(Date.now()));
                    }
                } catch {}
            }, Math.max(0, delaySeconds) * 1000);
            return () => clearTimeout(timer);
        }

        setIsVisible(false);
    }, [config, routeAllowed, delaySeconds, activeVerse.id]);

    const handleClose = () => {
        setIsVisible(false);
        const seenKey = makeSeenKey();
        const frequency = config.displayFrequency || "session";
        try {
            if (frequency === "session" || frequency === "always") {
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
            <div className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                    onClick={handleClose}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 25 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 25 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-[#161a26] via-[#10131d] to-[#0c0e17] border border-amber-500/25 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-9 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 my-auto"
                    dir={isEn ? "ltr" : "rtl"}
                >
                    {/* Ambient Glow Accents */}
                    <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
                    <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-purple-500/15 blur-[80px] pointer-events-none" />

                    {/* Top Controls Header */}
                    <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-black border border-amber-500/30 shadow-sm backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isEn ? "Verse of the Day" : "آیه روز کلام خدا"}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 hidden sm:inline-block font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                {isEn ? activeVerse.themeEn : activeVerse.themeFa}
                            </span>
                        </div>

                        {/* Language Switcher & Close */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-bold">
                                <button
                                    type="button"
                                    onClick={() => setActiveLang("fa")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        !isEn ? "bg-amber-500 text-black shadow-sm font-black" : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    فارسی
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveLang("en")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        isEn ? "bg-amber-500 text-black shadow-sm font-black" : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    EN
                                </button>
                            </div>

                            <button
                                onClick={handleClose}
                                title={isEn ? "Close" : "بستن"}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all border border-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Dual Scripture Display */}
                    <div className="relative z-10 space-y-3.5 bg-black/30 p-5 rounded-2xl border border-white/10 shadow-inner">
                        {/* Persian Verse */}
                        <p className="text-base sm:text-lg md:text-xl font-black leading-relaxed text-white text-right font-[Vazirmatn]" dir="rtl">
                            «{activeVerse.verseFa}»
                        </p>

                        {/* English Verse */}
                        <p className="text-xs sm:text-sm md:text-base font-semibold leading-relaxed text-gray-300/90 text-left font-serif italic" dir="ltr">
                            "{activeVerse.verseEn}"
                        </p>

                        {/* Scripture Reference Tag */}
                        <div className="pt-2 flex items-center justify-between border-t border-white/5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
                                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                                <span>{activeVerse.refFa} • {activeVerse.refEn}</span>
                            </div>

                            <span className="text-[11px] text-gray-400">
                                {isEn ? "Iranian Presbyterian Church of D.C." : "کلیسای ایرانیان واشنگتن دی‌سی"}
                            </span>
                        </div>
                    </div>

                    {/* Voluntary Blessing & Giving Encouragement (بدون تحمیل و با محبت شادمانه) */}
                    <div className="relative z-10 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/30">
                                <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-0.5">
                                    {isEn ? "Voluntary Offering & Prayer Blessing" : "مشارکت در برکت و هدایای شکرگزاری (کاملاً اختیاری)"}
                                </h4>
                                <p className="text-xs text-rose-200/90 leading-relaxed font-serif italic">
                                    {isEn 
                                        ? "“Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.” (2 Corinthians 9:7)" 
                                        : "«هر کس چنانکه در دل خود قرار داده است بدهد، نه با اکراه یا به اجبار؛ زیرا خدا بخشنده شادمان را دوست دارد.» (۲ قرنتیان ۹:۷)"}
                                </p>
                            </div>
                        </div>

                        {/* Optional prayer / blessing message input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isEn ? "Send a prayer request or note of blessing with your gift (Optional):" : "پیام محبت‌آمیز، دعا یا شکرگزاری خود برای کلیسا (اختیاری):"}</span>
                            </label>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={isEn ? "e.g. Prayer for church leaders, gratitude for this week's blessings..." : "مثال: دعای برکت برای خادمین کلیسا، شکرگزاری برای سلامتی خانواده..."}
                                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 outline-none"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="relative z-10 pt-1 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                        {/* Respectful Dismiss / Receive Word */}
                        <button
                            onClick={handleClose}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{isEn ? "Amen, I Received the Word" : "آمین، فیض کلام را دریافت کردم"}</span>
                        </button>

                        {/* Cheerful Voluntary Gift Button */}
                        <button
                            onClick={handleDonateRedirect}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95 shrink-0"
                        >
                            <Heart className="w-4 h-4 fill-black text-black" />
                            <span>{isEn ? "Give a Voluntary Gift" : "پرداخت هدیه اختیاری و برکت"}</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
