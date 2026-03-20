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
    themeColor?: "emerald" | "blue" | "rose" | "amber" | "purple" | "primary";
    showConfetti?: boolean;
    overlayOpacity?: "light" | "medium" | "dark" | "heavy";
    position?: "center" | "top" | "bottom";
    animationStyle?: "spring" | "fade" | "slideUp";
    autoCloseTimer?: number;
}

export function NowruzPopup({ config = {}, isPreview = false }: { config?: PopupConfig, isPreview?: boolean }) {
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

    // Infer Nowruz strictly for fallback
    const isNowruz = title.includes("نوروز") || title.toLowerCase().includes("nowruz");
    const showConfetti = config.showConfetti !== undefined ? config.showConfetti : isNowruz;

    const themeColor = config.themeColor || "primary";
    const colors = {
        emerald: { text: "text-emerald-500", shadow: "shadow-emerald-500/20", glow: "shadow-[0_0_15px_rgba(16,185,129,0.8)]", confetti: "bg-emerald-300" },
        primary: { text: "text-primary", shadow: "shadow-primary/20", glow: "shadow-[0_0_15px_rgba(var(--primary),0.8)]", confetti: "bg-primary/50" },
        blue: { text: "text-blue-500", shadow: "shadow-blue-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.8)]", confetti: "bg-blue-300" },
        rose: { text: "text-rose-500", shadow: "shadow-rose-500/20", glow: "shadow-[0_0_15px_rgba(244,63,94,0.8)]", confetti: "bg-rose-300" },
        purple: { text: "text-purple-500", shadow: "shadow-purple-500/20", glow: "shadow-[0_0_15px_rgba(168,85,247,0.8)]", confetti: "bg-purple-300" },
        amber: { text: "text-amber-500", shadow: "shadow-amber-500/20", glow: "shadow-[0_0_15px_rgba(245,158,11,0.8)]", confetti: "bg-amber-300" }
    };
    const activeTheme = colors[themeColor] || colors.primary;

    const overlayOpacity = config.overlayOpacity || "medium";
    const opacities = {
        light: "bg-black/40 backdrop-blur-sm",
        medium: "bg-black/60 backdrop-blur-md",
        dark: "bg-black/80 backdrop-blur-lg",
        heavy: "bg-black/95 backdrop-blur-2xl"
    };
    const activeOverlay = opacities[overlayOpacity];

    const positionValue = config.position || "center";
    const positionClasses = {
        center: "items-center justify-center p-4",
        top: "items-start justify-center pt-10 px-4",
        bottom: "items-end justify-center pb-10 px-4"
    };
    const activePosition = positionClasses[positionValue];

    const animStyle = config.animationStyle || "spring";
    const animations: Record<string, any> = {
        spring: {
            initial: { opacity: 0, scale: 0.8, y: 50 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 30 },
            transition: { type: "spring", damping: 25, stiffness: 300 }
        },
        fade: {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.95 },
            transition: { duration: 0.3 }
        },
        slideUp: {
            initial: { opacity: 0, y: 150 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 150 },
            transition: { type: "spring", damping: 30, stiffness: 400 }
        }
    };
    const activeAnimation = animations[animStyle];

    useEffect(() => {
        if (isPreview) {
            setIsVisible(true);
            return;
        }
        // use 'hasSeenPopupSession' instead of 'hasSeenNowruz2026' to apply generically
        const hasSeen = sessionStorage.getItem("hasSeenPopupSession");
        if (!hasSeen && title) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            
            if (showConfetti) {
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
    }, [config, title, showConfetti, isPreview]);

    // Auto-close handling
    useEffect(() => {
        if (!isVisible || isPreview) return;
        const timerSeconds = config.autoCloseTimer ? Number(config.autoCloseTimer) : 0;
        if (timerSeconds > 0) {
            const timeout = setTimeout(() => {
                setIsVisible(false);
                sessionStorage.setItem("hasSeenPopupSession", "true");
            }, timerSeconds * 1000);
            return () => clearTimeout(timeout);
        }
    }, [isVisible, isPreview, config.autoCloseTimer]);

    const handleClose = () => {
        if (isPreview) return; // Don't close preview
        setIsVisible(false);
        sessionStorage.setItem("hasSeenPopupSession", "true");
    };

    if (!isVisible) return null;

    const ButtonWrapper = buttonLink ? Link : "button";

    return (
        <AnimatePresence>
            <div className={isPreview ? `relative w-full h-[600px] flex ${activePosition} bg-black/40 rounded-3xl overflow-hidden` : `fixed inset-0 z-[99999] flex ${activePosition}`}>
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className={`absolute inset-0 ${activeOverlay} cursor-pointer`}
                    onClick={handleClose}
                />

                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-60">
                        {petals.map((petal) => (
                            <div 
                                key={petal.id}
                                className={`absolute -top-10 w-4 h-4 rounded-full ${activeTheme.confetti} blur-[1px] ${activeTheme.glow} animate-fall`}
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
                    initial={activeAnimation.initial} 
                    animate={activeAnimation.animate} 
                    exit={activeAnimation.exit}
                    transition={activeAnimation.transition}
                    className={`relative w-full max-w-lg bg-background border border-white/10 overflow-hidden rounded-[2rem] shadow-2xl ${activeTheme.shadow} ${isPreview ? 'scale-90 transform-origin-center max-h-full overflow-y-auto custom-scrollbar' : ''}`}
                    dir={isEn ? "ltr" : "rtl"}
                >
                    <div className="relative h-64 w-full bg-black shrink-0">
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
                                {isNowruz ? "🌱" : "✨"}
                            </motion.div>
                        )}
                        
                        {title && (
                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.4 }}
                                className={`text-4xl font-black ${activeTheme.text} mb-6 drop-shadow-sm ${isEn ? 'font-serif' : 'font-vazirmatn text-center'}`}
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
                                <p className={`text-xl font-black ${activeTheme.text}`}>
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

                {showConfetti && (
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
