"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

export function NowruzPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [petals, setPetals] = useState<any[]>([]);

    useEffect(() => {
        const hasSeen = localStorage.getItem("hasSeenNowruz2026");
        if (!hasSeen) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            
            // Generate random petals client-side to avoid hydration mismatch
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
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenNowruz2026", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Falling Petals Background Effect */}
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

                    {/* Popup Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 50 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/40 border-4 border-amber-400"
                        dir="rtl"
                    >
                        {/* Header Image Area */}
                        <div className="relative h-64 w-full bg-emerald-50">
                            {/* Uses the image uploaded by the user */}
                            <Image 
                                src="/images/nowruz-bg.png" 
                                alt="نوروز باستانی" 
                                fill 
                                className="object-cover object-center opacity-90 mix-blend-multiply"
                                unoptimized
                            />
                            {/* Close Button */}
                            <button 
                                onClick={handleClose}
                                className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                        </div>

                        {/* Content Area */}
                        <div className="relative px-8 pb-10 pt-2 text-center z-10 bg-white">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.3 }}
                                className="text-5xl mb-2 -mt-4 text-emerald-600 drop-shadow-sm"
                            >
                                🌱
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.4 }}
                                className="text-4xl font-black text-emerald-800 mb-6 font-vazirmatn drop-shadow-sm"
                            >
                                نوروز خـجـسـتـه بـاد
                            </motion.h1>

                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.5 }}
                                className="flex flex-col gap-2 font-bold text-lg text-slate-700 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner"
                            >
                                <span className="hover:scale-105 hover:text-amber-600 transition-transform cursor-default">۱ فروردین ۱۴۰۵ خورشیدی</span>
                                <span className="hover:scale-105 hover:text-amber-600 transition-transform cursor-default">۲۵۸۵ شاهنشاهی</span>
                                <span className="hover:scale-105 hover:text-amber-600 transition-transform cursor-default font-serif" dir="ltr">March 21, 2026</span>
                            </motion.div>

                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.6 }}
                                className="space-y-3"
                            >
                                <p className="text-xl font-black text-rose-600 animate-pulse">
                                    به امید آزادی ایران عزیز و سربلندی ملت
                                </p>
                                <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-amber-300 to-transparent my-4" />
                                <p className="text-base font-medium text-emerald-700/80 leading-relaxed">
                                    با آرزوی برکت، صلح و دوستی برای همراهان مسیحی و تمامی ایرانیان
                                </p>
                            </motion.div>
                            
                            <motion.button 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                transition={{ delay: 0.8 }}
                                onClick={handleClose}
                                className="mt-8 px-10 py-3 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                            >
                                ورود به سایت
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* CSS Animation Keyframes for Petals */}
                    <style dangerouslySetInnerHTML={{__html: `
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
                    `}} />
                </div>
            )}
        </AnimatePresence>
    );
}
