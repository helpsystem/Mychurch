"use client";

import React from "react";
import { HeartHandshake, Phone, Globe, User, Radio } from "lucide-react";
import { BroadcastOverlayConfig } from "@/types/broadcast";

interface BroadcastOverlaysProps {
    config?: BroadcastOverlayConfig;
    showLiveTranslation?: boolean;
    liveTranslationText?: string;
    isProgramMonitor?: boolean;
}

export default function BroadcastOverlays({
    config,
    showLiveTranslation,
    liveTranslationText,
    isProgramMonitor = false
}: BroadcastOverlaysProps) {
    if (!config) return null;

    const {
        showLogo,
        logoUrl,
        showLowerThird,
        lowerThirds = [],
        activeLowerThirdIndex = 0,
        lowerThirdTheme = "modern",
        showPrayerTicker,
        prayerRequests = [],
        showLiveMeetingOverlay,
        meetingDialIn = "+1 (605) 313-9689",
        meetingAccessCode = "1036379",
        meetingOnlineId = "iranianchurchdcus"
    } = config;

    // Determine active lower third item
    const activeLowerThird = lowerThirds[activeLowerThirdIndex] || (lowerThirds.length > 0 ? lowerThirds[0] : null);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none font-[Vazirmatn]">
            {/* 1. Official Church Logo */}
            {showLogo && (
                <div 
                    className={`absolute ${isProgramMonitor ? 'top-3 right-3' : 'top-6 right-6'} z-50 transition-all duration-500 animate-fadeIn`}
                >
                    <div className="relative group">
                        <img
                            src={logoUrl || "/logo-transparent.png"}
                            alt="Church Logo"
                            className={`${isProgramMonitor ? 'h-9 md:h-12' : 'h-14 md:h-20'} w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter`}
                            onError={(e) => {
                                // Fallback to /logo.png if /logo-transparent.png fails
                                const target = e.currentTarget;
                                if (target.src !== window.location.origin + "/logo.png") {
                                    target.src = "/logo.png";
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* 2. Lower Third (Speaker / Subtitle) */}
            {showLowerThird && activeLowerThird && (
                <div 
                    className={`absolute ${isProgramMonitor ? 'bottom-10 left-3' : 'bottom-14 left-8'} z-50 max-w-[85%] md:max-w-xl animate-slideInLeft`}
                >
                    {lowerThirdTheme === "modern" ? (
                        /* Modern Glassmorphic Lower Third */
                        <div className="relative flex items-center gap-3 p-3 md:p-4 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/80 overflow-hidden">
                            {/* Neon Left Accent Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 via-indigo-500 to-purple-500" />
                            
                            <div className="pl-3 flex items-center gap-3">
                                {activeLowerThird.imageUrl ? (
                                    <img 
                                        src={activeLowerThird.imageUrl} 
                                        alt={activeLowerThird.title}
                                        className={`${isProgramMonitor ? 'w-9 h-9' : 'w-12 h-12'} rounded-full object-cover border-2 border-cyan-400/50 shadow-md`}
                                    />
                                ) : (
                                    <div className={`${isProgramMonitor ? 'w-8 h-8' : 'w-11 h-11'} rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shrink-0`}>
                                        <User className={`${isProgramMonitor ? 'w-4 h-4' : 'w-6 h-6'}`} />
                                    </div>
                                )}

                                <div className="flex flex-col text-left">
                                    <h4 className={`${isProgramMonitor ? 'text-xs md:text-sm' : 'text-base md:text-xl'} font-black text-white tracking-wide drop-shadow`}>
                                        {activeLowerThird.title}
                                    </h4>
                                    {activeLowerThird.subtitle && (
                                        <p className={`${isProgramMonitor ? 'text-[10px]' : 'text-xs md:text-sm'} text-cyan-300 font-medium opacity-90`}>
                                            {activeLowerThird.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Classic Formal Broadcast Lower Third */
                        <div className="flex flex-col shadow-2xl">
                            <div className="bg-neutral-950/95 border-l-4 border-amber-400 px-4 py-2 border-t border-r border-white/10">
                                <h4 className={`${isProgramMonitor ? 'text-xs md:text-sm' : 'text-lg md:text-2xl'} font-bold text-amber-300 tracking-wider uppercase`}>
                                    {activeLowerThird.title}
                                </h4>
                            </div>
                            {activeLowerThird.subtitle && (
                                <div className="bg-black/90 px-4 py-1 border-l-4 border-amber-600 border-b border-r border-white/10">
                                    <p className={`${isProgramMonitor ? 'text-[10px]' : 'text-xs md:text-sm'} text-neutral-300 font-semibold`}>
                                        {activeLowerThird.subtitle}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Live Meeting Conference Banner */}
            {showLiveMeetingOverlay && (
                <div 
                    className={`absolute ${showPrayerTicker ? (isProgramMonitor ? 'bottom-8' : 'bottom-12') : (isProgramMonitor ? 'bottom-2' : 'bottom-4')} left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl rounded-xl border border-white/20 bg-black/75 backdrop-blur-md shadow-2xl p-2.5 md:p-3 flex flex-row items-center justify-between gap-3 text-white animate-slideInUp`}
                >
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="p-1.5 bg-red-600 rounded-lg animate-pulse flex items-center justify-center">
                            <Radio className={`${isProgramMonitor ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] md:text-[11px] text-neutral-400 block">ارتباط زنده جلسه صوتی/تصویری</span>
                            <span className="text-xs md:text-sm font-bold text-emerald-400">جلسه آنلاین کلیسا</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs">
                        <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-white/70">تماس صوتی:</span>
                            <span className="font-bold tracking-wide font-mono">{meetingDialIn}</span>
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-amber-300">کد: {meetingAccessCode}#</span>
                        </div>

                        <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="text-white/70">تصویری:</span>
                            <span className="font-bold text-cyan-300 font-mono">join.freeconferencecall.com/{meetingOnlineId}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Running Prayer Request Ticker (Marquee) */}
            {showPrayerTicker && prayerRequests.length > 0 && (
                <div 
                    className="absolute bottom-0 left-0 right-0 z-50 h-7 md:h-9 bg-gradient-to-r from-amber-950/90 via-neutral-950/95 to-amber-950/90 border-t border-amber-500/40 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center overflow-hidden"
                    dir="rtl"
                >
                    {/* Fixed Badge on Right */}
                    <div className="h-full bg-amber-600/90 px-3 flex items-center gap-1.5 text-white font-bold text-[11px] md:text-xs shrink-0 z-10 shadow-lg">
                        <HeartHandshake className="w-3.5 h-3.5 animate-pulse" />
                        <span>درخواست‌های دعا:</span>
                    </div>

                    {/* Marquee Content */}
                    <div className="flex-1 overflow-hidden relative h-full flex items-center">
                        <div className="marquee-track flex items-center gap-8 whitespace-nowrap text-[11px] md:text-xs text-amber-100 font-medium">
                            {prayerRequests.map((prayer, idx) => (
                                <span key={prayer.id || idx} className="inline-flex items-center gap-2">
                                    <span className="font-bold text-amber-300">
                                        🙏 {prayer.name || prayer.user_name || "ایماندار"}:
                                    </span>
                                    <span className="text-neutral-200">
                                        {prayer.content}
                                    </span>
                                    <span className="text-amber-500/60 mr-4">•</span>
                                </span>
                            ))}
                            {/* Duplicate set for seamless continuous marquee */}
                            {prayerRequests.map((prayer, idx) => (
                                <span key={`dup-${prayer.id || idx}`} className="inline-flex items-center gap-2">
                                    <span className="font-bold text-amber-300">
                                        🙏 {prayer.name || prayer.user_name || "ایماندار"}:
                                    </span>
                                    <span className="text-neutral-200">
                                        {prayer.content}
                                    </span>
                                    <span className="text-amber-500/60 mr-4">•</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Live Speech Translation Subtitle */}
            {showLiveTranslation && liveTranslationText && (
                <div className={`absolute ${showPrayerTicker ? 'bottom-12' : 'bottom-8'} left-1/2 -translate-x-1/2 z-[60] max-w-[90%] text-center animate-slideInUp`}>
                    <span 
                        className={`bg-black/85 text-yellow-300 font-bold ${isProgramMonitor ? 'text-xs md:text-sm px-3 py-1' : 'text-lg md:text-2xl px-5 py-2.5'} rounded-xl leading-relaxed shadow-2xl backdrop-blur-md border border-yellow-400/30 whitespace-pre-wrap`}
                        style={{ textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
                    >
                        {liveTranslationText}
                    </span>
                </div>
            )}

            <style>{`
                @keyframes marqueeScroll {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(50%);
                    }
                }
                .marquee-track {
                    display: inline-flex;
                    animation: marqueeScroll ${Math.max(20, prayerRequests.length * 8)}s linear infinite;
                }
                .marquee-track:hover {
                    animation-play-state: paused;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-slideInUp {
                    animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
