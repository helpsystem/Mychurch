"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

interface PopupConfig {
    title?: string;
    imageUrl?: string;
    date1?: string;
    date2?: string;
    date3?: string;
    message?: string;
    subMessage?: string;
    buttonText?: string;
}

export function NowruzPopup({ config = {} }: { config?: PopupConfig }) {
    const [isVisible, setIsVisible] = useState(false);
    const [petals, setPetals] = useState<any[]>([]);

    const title = config.title || "نوروز خـجـسـتـه بـاد";
    const imageUrl = config.imageUrl || "/images/nowruz-bg.png";
    const date1 = config.date1 || "۱ فروردین ۱۴۰۵ خورشیدی";
    const date2 = config.date2 || "۲۵۸۵ شاهنشاهی";
    const date3 = config.date3 || "March 21, 2026";
    const message = config.message || "به امید آزادی ایران عزیز و سربلندی ملت";
    const subMessage = config.subMessage || "با آرزوی برکت، صلح و دوستی برای همراهان مسیحی و تمامی ایرانیان";
    const buttonText = config.buttonText || "ورود به سایت";

    useEffect(() => {
        const hasSeen = localStorage.getItem("hasSeenNowruz2026");
        if (!hasSeen) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            
            const generatedPetals = Array.from({ length: 15 }).map((_, i) => ({
                id: i,
                left: (Math.random() * 100) + "%",
                animationDuration: (5 + Math.random() * 5) + "s",
                animationDelay: (Math.random() * 5) + "s",
                transform: "rotate(" + (Math.random() * 360) + "deg) scale(" + (0.5 + Math.random() * 0.7) + ")"
            }));
            setPetals(generatedPetals);
            
            return () => clearTimeout(timer);
        }
    }, [config]); // Re-run if config changes to show updates during testing

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenNowruz2026", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-60">
                        {petals.map((petal) => (
                            <div 
                                key={petal.id}
                                className="absolute -top-10 w-4 h-4 rounded-full bg-pink-300 blur-[1px] shadow-[0_0_10px_rgba(255,182,193,0.8)] animate-fall"
                                style={{
                                    left: petal.left,
                                    animationDuration: petal.animationDuration,
                                    animationDelay: petal.animationDelay,
                                    transform: petal.transform
                                }}
                            />
                        ))}
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 50 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-background border border-white/10 overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/40"
                        dir="rtl"
                    >
                        <div className="relative h-64 w-full bg-black">
                            <Image 
                                src={imageUrl} 
                                alt={title} 
                                fill 
                                className="object-cover object-center opacity-80"
                                unoptimized
                            />
                            <button 
                                onClick={handleClose}
                                title="بستن"
                                className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                        </div>

                        <div className="relative px-8 pb-10 pt-2 text-center z-10 bg-background">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.3 }}
                                className="text-5xl mb-2 -mt-4 text-emerald-500 drop-shadow-sm"
                            >
                                🌱
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.4 }}
                                className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-6 font-vazirmatn drop-shadow-sm"
                            >
                                {title}
                            </motion.h1>

                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.5 }}
                                className="flex flex-col gap-2 font-bold text-lg text-foreground mb-8 bg-secondary/30 p-4 rounded-2xl border border-white/5 shadow-inner"
                            >
                                {date1 && <span className="hover:scale-105 hover:text-amber-500 transition-transform cursor-default">{date1}</span>}
                                {date2 && <span className="hover:scale-105 hover:text-amber-500 transition-transform cursor-default">{date2}</span>}
                                {date3 && <span className="hover:scale-105 hover:text-amber-500 transition-transform cursor-default font-serif" dir="ltr">{date3}</span>}
                            </motion.div>

                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.6 }}
                                className="space-y-3"
                            >
                                <p className="text-xl font-black text-rose-500 animate-pulse">
                                    {message}
                                </p>
                                <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-4" />
                                <p className="text-base font-medium text-muted-foreground leading-relaxed">
                                    {subMessage}
                                </p>
                            </motion.div>
                            
                            <motion.button 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                transition={{ delay: 0.8 }}
                                onClick={handleClose}
                                title={buttonText}
                                className="mt-8 px-10 py-3 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                            >
                                {buttonText}
                            </motion.button>
                        </div>
                    </motion.div>

                    <style dangerouslySetInnerHTML={{__html: \`
                        @keyframes fall {
                            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { transform: translateY(110vh) rotate(360deg) scale(0.5); opacity: 0; }
                        }
                        .animate-fall {
                            animation-name: fall;
                            animation-timing-function: linear;
                            animation-iteration-count: infinite;
                        }
                    \`}} />
                </div>
            )}
        </AnimatePresence>
    );
}
