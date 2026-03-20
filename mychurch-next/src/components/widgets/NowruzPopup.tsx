"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";

interface PopupConfig {
    titleFa?: string; titleEn?: string;
    imageUrl?: string;
    badge1Fa?: string; badge1En?: string;
    badge2Fa?: string; badge2En?: string;
    messageFa?: string; messageEn?: string;
    subMessageFa?: string; subMessageEn?: string;
    buttonTextFa?: string; buttonTextEn?: string;
    buttonLink?: string;
}

export function NowruzPopup({ config = {} }: { config?: PopupConfig }) {
    const { language } = useLanguage();
    const isEn = language === 'en';
    const alignClass = isEn ? 'text-left' : 'text-center';
    
    const [isVisible, setIsVisible] = useState(false);
    const [petals, setPetals] = useState<any[]>([]);

    const title = (isEn ? config.titleEn : config.titleFa) || "";
    const imageUrl = config.imageUrl || "/images/nowruz-bg.png";
    const badge1 = (isEn ? config.badge1En : config.badge1Fa) || "";
    const badge2 = (isEn ? config.badge2En : config.badge2Fa) || "";
    const message = (isEn ? config.messageEn : config.messageFa) || "";
    const subMessage = (isEn ? config.subMessageEn : config.subMessageFa) || "";
    const buttonText = (isEn ? config.buttonTextEn : config.buttonTextFa) || (isEn ? "Enter" : "ورود");
    const buttonLink = config.buttonLink || "";

    // If it's the Nowruz default, render petals. If it's highly generic, maybe skip petals. 
    // We can infer it's Nowruz if the title contains "نوروز" or "Nowruz" to keep the easter egg alive.
    const isNowruz = title.includes("نوروز") || title.toLowerCase().includes("nowruz");

    useEffect(() => {
        // use 'hasSeenPopupSession' instead of 'hasSeenNowruz2026' to apply generically
        const hasSeen = localStorage.getItem("hasSeenPopupSession");
        if (!hasSeen && title) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            
            if (isNowruz) {
                const generatedPetals = Array.from({ length: 15 }).map((_, i) => ({
                    id: i,
                    left: (Math.random() * 100) + "%",
                    animationDuration: (5 + Math.random() * 5) + "s",
                    animationDelay: (Math.random() * 5) + "s",
                    transform: "rotate(" + (Math.random() * 360) + "deg) scale(" + (0.5 + Math.random() * 0.7) + ")"
                }));
                setPetals(generatedPetals);
            }
            
            return () => clearTimeout(timer);
        }
    }, [config, title, isNowruz]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenPopupSession", "true");
    };

    if (!isVisible) return null;

    const ButtonWrapper = buttonLink ? Link : "button";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={handleClose}
                />

                {isNowruz && (
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
                )}

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 50 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-background border border-white/10 overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/20"
                    dir={isEn ? "ltr" : "rtl"}
                >
                    <div className="relative h-64 w-full bg-black">
                        {imageUrl && (
                            <Image 
                                src={imageUrl} 
                                alt={title} 
                                fill 
                                className="object-cover object-center opacity-80"
                                unoptimized
                            />
                        )}
                        <button 
                            onClick={handleClose}
                            title="بستن"
                            className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all z-10`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </div>

                    <div className={`relative px-8 pb-10 pt-2 z-10 bg-background ${alignClass}`}>
                        {isNowruz && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.3 }}
                                className="text-5xl mb-2 -mt-4 text-emerald-500 drop-shadow-sm text-center"
                            >
                                🌱
                            </motion.div>
                        )}
                        
                        {title && (
                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.4 }}
                                className={`text-4xl font-black text-primary mb-6 drop-shadow-sm ${isEn ? 'font-serif' : 'font-vazirmatn text-center'}`}
                            >
                                {title}
                            </motion.h1>
                        )}

                        {(badge1 || badge2) && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.5 }}
                                className={`flex flex-wrap gap-2 font-bold text-sm text-foreground mb-8 bg-secondary/30 p-4 rounded-xl border border-white/5 shadow-inner ${isEn ? '' : 'justify-center'}`}
                            >
                                {badge1 && <span className="hover:scale-105 transition-transform cursor-default bg-white/5 px-3 py-1 rounded-full">{badge1}</span>}
                                {badge2 && <span className="hover:scale-105 transition-transform cursor-default bg-white/5 px-3 py-1 rounded-full">{badge2}</span>}
                            </motion.div>
                        )}

                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ delay: 0.6 }}
                            className="space-y-3"
                        >
                            {message && (
                                <p className="text-xl font-black text-rose-500">
                                    {message}
                                </p>
                            )}
                            
                            {subMessage && (
                                <>
                                    <div className={`h-px w-3/4 bg-gradient-to-r from-transparent via-primary/50 to-transparent my-4 ${isEn ? 'ml-0' : 'mx-auto'}`} />
                                    <p className="text-base font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {subMessage}
                                    </p>
                                </>
                            )}
                        </motion.div>
                        
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ delay: 0.8 }}
                            className={`mt-8 flex ${isEn ? 'justify-start' : 'justify-center'}`}
                        >
                            <ButtonWrapper 
                                href={buttonLink || "#"}
                                onClick={(e) => {
                                    if (!buttonLink) {
                                        e.preventDefault();
                                        handleClose();
                                    } else {
                                        handleClose();
                                    }
                                }}
                                className="px-10 py-3 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 inline-flex items-center gap-2"
                            >
                                {buttonText}
                                {isEn ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                            </ButtonWrapper>
                        </motion.div>
                    </div>
                </motion.div>

                {isNowruz && (
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
                )}
            </div>
        </AnimatePresence>
    );
}
