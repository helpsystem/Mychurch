"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PopupConfig {
    titleFa?: string; titleEn?: string;
    heroIcon?: string;
    heroIconUrl?: string;
    mediaType?: "image" | "video";
    imageUrl?: string;
    imageFit?: "cover" | "contain" | "fill";
    imageHeight?: "sm" | "md" | "lg" | "xl";
    imageBgColor?: string;
    videoUrl?: string;
    videoPosterUrl?: string;
    videoAutoplay?: boolean;
    videoMuted?: boolean;
    videoLoop?: boolean;
    videoControls?: boolean;
    videoPreload?: "auto" | "metadata" | "none";
    particleDensity?: "light" | "medium" | "heavy" | "insane";
    badge1Icon?: string; badge1Fa?: string; badge1En?: string;
    badge2Icon?: string; badge2Fa?: string; badge2En?: string;
    messageFa?: string; messageEn?: string;
    subMessageFa?: string; subMessageEn?: string;
    buttonTextFa?: string; buttonTextEn?: string;
    buttonLink?: string;
    themeColor?: "emerald" | "blue" | "rose" | "amber" | "purple" | "primary";
    showConfetti?: boolean; // Legacy fallback
    particleEffect?: "none" | "confetti" | "blossoms" | "sparkles" | "snow" | "customAsset";
    particleAssetUrl?: string;
    overlayOpacity?: "light" | "medium" | "dark" | "heavy";
    position?: "center" | "top" | "bottom";
    animationStyle?: "spring" | "fade" | "slideUp";
    autoCloseTimer?: number;
    displayDelaySeconds?: number;
    startAt?: string;
    endAt?: string;
    enabledPaths?: string;
    excludedPaths?: string;
    displayFrequency?: "always" | "session" | "24h" | "7d";
    storageKey?: string;
    showCloseButton?: boolean;
    customPresets?: any[];
}

export function NowruzPopup({ config = {}, isPreview = false }: { config?: PopupConfig, isPreview?: boolean }) {
    const { language } = useLanguage();
    const pathname = usePathname();
    const isEn = language === 'en';
    const alignClass = isEn ? 'text-left' : 'text-center';
    
    const [isVisible, setIsVisible] = useState(false);
    const [petals, setPetals] = useState<any[]>([]);

    const title = (isEn ? config.titleEn : config.titleFa) || "";
    const imageUrl = config.imageUrl || "/images/nowruz-bg.png";
    const mediaType = config.mediaType || "image";
    const rawVideoUrl = (config.videoUrl || "").trim();
    const rawVideoPosterUrl = (config.videoPosterUrl || "").trim();
    const badge1 = (isEn ? config.badge1En : config.badge1Fa) || "";
    const badge2 = (isEn ? config.badge2En : config.badge2Fa) || "";
    const message = (isEn ? config.messageEn : config.messageFa) || "";
    const subMessage = (isEn ? config.subMessageEn : config.subMessageFa) || "";
    const buttonText = (isEn ? config.buttonTextEn : config.buttonTextFa) || (isEn ? "Enter" : "ورود");
    const buttonLink = config.buttonLink || "";
    const heroIconValue = (config.heroIcon || "").trim();
    const heroIconUrl = (config.heroIconUrl || "").trim();

    const isIconUrl = (value: string) => /^(https?:\/\/|\/|data:image\/)/i.test(value);

    // Infer Nowruz strictly for fallback
    const isNowruz = title.includes("نوروز") || title.toLowerCase().includes("nowruz");
    
    // Resolve which effect to show. Priority: explicit particleEffect -> legacy showConfetti -> inferred Nowruz
    const effect = config.particleEffect || (config.showConfetti || (config.showConfetti === undefined && isNowruz) ? 'confetti' : 'none');

    const themeColor = config.themeColor || "primary";
    const imageFitClass = config.imageFit === "contain" ? "object-contain" : (config.imageFit === "fill" ? "object-fill" : "object-cover");
    
    // Map heights (responsive: smaller on mobile)
    const heightMap: Record<string, string> = {
        sm: "h-32 md:h-40",
        md: "h-48 md:h-64",
        lg: "h-56 md:h-80",
        xl: "h-64 md:h-96"
    };
    const imageHeightClass = heightMap[config.imageHeight || "md"];

    // Ensure robust URL resolution for various path types
    const displayUrl = React.useMemo(() => {
        if (!config.imageUrl) return "/images/nowruz-bg.png";
        if (config.imageUrl.startsWith('http') || config.imageUrl.startsWith('data:')) return config.imageUrl;
        if (config.imageUrl.startsWith('/api/serve/')) return config.imageUrl;
        if (config.imageUrl.startsWith('/uploads/')) return config.imageUrl.replace('/uploads/', '/api/serve/');
        if (config.imageUrl.startsWith('/images/')) return config.imageUrl;
        if (!config.imageUrl.startsWith('/')) return `/api/serve/${config.imageUrl}`;
        return config.imageUrl;
    }, [config.imageUrl]);

    const resolveMediaUrl = React.useCallback((value?: string) => {
        if (!value) return "";
        if (value.startsWith('http') || value.startsWith('data:')) return value;
        if (value.startsWith('/api/serve/')) return value;
        if (value.startsWith('/uploads/')) return value.replace('/uploads/', '/api/serve/');
        if (value.startsWith('/images/')) return value;
        if (!value.startsWith('/')) return `/api/serve/${value}`;
        return value;
    }, []);

    const resolvedVideoUrl = React.useMemo(() => resolveMediaUrl(rawVideoUrl), [rawVideoUrl, resolveMediaUrl]);
    const resolvedVideoPosterUrl = React.useMemo(() => resolveMediaUrl(rawVideoPosterUrl), [rawVideoPosterUrl, resolveMediaUrl]);
    const resolvedParticleAssetUrl = React.useMemo(() => resolveMediaUrl(config.particleAssetUrl), [config.particleAssetUrl, resolveMediaUrl]);

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

    const parsePathList = (raw?: string) => {
        if (!raw) return [] as string[];
        return raw
            .split(/[\n,]/g)
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const routeAllowed = React.useMemo(() => {
        if (isPreview) return true;
        
        const normalize = (p: string) => {
            let clean = p.trim();
            if (!clean) return "";
            if (!clean.startsWith("/")) {
                clean = "/" + clean;
            }
            if (clean.length > 1 && clean.endsWith("/")) {
                clean = clean.slice(0, -1);
            }
            return clean;
        };

        const currentPath = normalize(pathname || "/");
        const includes = parsePathList(config.enabledPaths).map(normalize).filter(Boolean);
        const excludes = parsePathList(config.excludedPaths).map(normalize).filter(Boolean);

        const matchesPath = (p: string) => {
            if (p === "/") {
                return currentPath === "/";
            }
            return currentPath === p || currentPath.startsWith(`${p}/`);
        };

        const inEnabled = includes.length === 0 || includes.some(matchesPath);
        const inExcluded = excludes.some(matchesPath);
        return inEnabled && !inExcluded;
    }, [config.enabledPaths, config.excludedPaths, pathname, isPreview]);


    const makeSeenKey = () => {
        const userKey = (config.storageKey || "").trim();
        if (userKey) return `popup_seen_${userKey}`;
        const signature = `${title}|${config.startAt || ""}|${config.endAt || ""}`;
        return `popup_seen_auto_${encodeURIComponent(signature).slice(0, 120)}`;
    };

    useEffect(() => {
        if (isPreview) {
            setIsVisible(true);
            return;
        }

        const currentTs = Date.now();
        const startTs = config.startAt ? new Date(config.startAt).getTime() : null;
        const endTs = config.endAt ? new Date(config.endAt).getTime() : null;
        const inScheduleWindow = (startTs === null || currentTs >= startTs) && (endTs === null || currentTs <= endTs);

        if (!title || !routeAllowed || !inScheduleWindow) {
            setIsVisible(false);
            return;
        }

        const seenKey = makeSeenKey();
        const frequency = config.displayFrequency || "session";

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
            const delaySeconds = Number(config.displayDelaySeconds || 1.5);
            const timer = setTimeout(() => setIsVisible(true), Math.max(0, delaySeconds) * 1000);
            
            if (effect !== 'none') {
                const baseCount = effect === 'snow' ? 30 : effect === 'sparkles' ? 25 : 18;
                const multiplier = config.particleDensity === 'light' ? 0.3 : config.particleDensity === 'heavy' ? 2 : config.particleDensity === 'insane' ? 4 : 1;
                const count = Math.floor(baseCount * multiplier);
                
                const generatedPetals = Array.from({ length: count }).map((_, i) => ({
                    id: i,
                    left: (Math.random() * 100) + "%",
                    top: effect === 'sparkles' ? `${Math.random() * 100}%` : '-10%',
                    animationDuration: (effect === 'snow' ? 8 + Math.random() * 7 : effect === 'sparkles' ? 1.5 + Math.random() * 2 : 5 + Math.random() * 5) + "s",
                    animationDelay: (Math.random() * 5) + "s",
                    transform: "rotate(" + (Math.random() * 360) + "deg) scale(" + (0.5 + Math.random() * (effect === 'snow' ? 0.3 : 0.7)) + ")"
                }));
                setPetals(generatedPetals);
            }
            
            return () => clearTimeout(timer);
        }

        setIsVisible(false);
    }, [config, title, effect, isPreview, routeAllowed]);

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

        const seenKey = makeSeenKey();
        const frequency = config.displayFrequency || "session";
        try {
            if (frequency === "session") {
                sessionStorage.setItem(seenKey, "true");
            } else if (frequency === "24h" || frequency === "7d") {
                localStorage.setItem(seenKey, String(Date.now()));
            }
        } catch {
            // no-op
        }
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

                {effect !== 'none' && (
                    <div className={`absolute inset-0 pointer-events-none overflow-hidden opacity-90 z-[60] ${effect === 'sparkles' || effect === 'snow' ? 'mix-blend-screen' : 'mix-blend-normal'}`}>
                        {petals.map((petal) => {
                            if (effect === 'blossoms') {
                                return (
                                    <div key={petal.id} className="absolute w-5 h-5 bg-gradient-to-br from-pink-200 to-rose-300 shadow-[0_0_15px_rgba(244,114,182,0.8)] animate-fall" 
                                        style={{ left: petal.left, top: petal.top, borderRadius: '100% 0 100% 0', animationDuration: petal.animationDuration, animationDelay: petal.animationDelay, transform: petal.transform }} />
                                );
                            } else if (effect === 'sparkles') {
                                // Shimmering Star SVG
                                return (
                                    <div key={petal.id} className="absolute text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-sparkle" 
                                        style={{ left: petal.left, top: petal.top, animationDuration: petal.animationDuration, animationDelay: petal.animationDelay }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>
                                    </div>
                                );
                            } else if (effect === 'snow') {
                                return (
                                    <div key={petal.id} className="absolute w-3 h-3 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-snow" 
                                        style={{ left: petal.left, top: petal.top, animationDuration: petal.animationDuration, animationDelay: petal.animationDelay, transform: petal.transform }} />
                                );
                            } else if (effect === 'customAsset' && resolvedParticleAssetUrl) {
                                return (
                                    <img
                                        key={petal.id}
                                        src={resolvedParticleAssetUrl}
                                        alt="particle"
                                        className="absolute w-4 h-4 animate-fall object-contain"
                                        style={{ left: petal.left, top: petal.top, animationDuration: petal.animationDuration, animationDelay: petal.animationDelay, transform: petal.transform }}
                                        loading="lazy"
                                    />
                                );
                            } else {
                                // Confetti
                                return (
                                    <div key={petal.id} className={`absolute w-3 h-4 rounded-sm ${activeTheme.confetti} blur-[1px] ${activeTheme.glow} animate-fall`} 
                                        style={{ left: petal.left, top: petal.top, animationDuration: petal.animationDuration, animationDelay: petal.animationDelay, transform: petal.transform }} />
                                );
                            }
                        })}
                    </div>
                )}

                <motion.div 
                    initial={activeAnimation.initial}
                    animate={activeAnimation.animate}
                    exit={activeAnimation.exit}
                    transition={activeAnimation.transition}
                    className={`relative z-20 w-[95%] sm:w-full max-w-lg bg-background border border-white/10 overflow-hidden rounded-[2rem] shadow-2xl ${activeTheme.shadow} ${isPreview ? 'scale-90 transform-origin-center max-h-[90vh] overflow-y-auto custom-scrollbar' : 'max-h-[85vh] overflow-y-auto custom-scrollbar'}`}
                    dir={isEn ? "ltr" : "rtl"}
                >
                    <div className={`relative w-full ${imageHeightClass} shrink-0 transition-all duration-300 flex items-center justify-center`} style={{ backgroundColor: config.imageBgColor || '#000000' }}>
                        {mediaType === 'video' && resolvedVideoUrl ? (
                            <video
                                src={resolvedVideoUrl}
                                poster={resolvedVideoPosterUrl || undefined}
                                className={`absolute inset-0 w-full h-full ${imageFitClass} z-0`}
                                autoPlay={config.videoAutoplay !== false}
                                muted={config.videoMuted !== false}
                                loop={config.videoLoop !== false}
                                controls={config.videoControls === true}
                                preload={config.videoPreload || 'metadata'}
                                playsInline
                            />
                        ) : displayUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={displayUrl}
                                alt="Popup Media"
                                className={`absolute inset-0 w-full h-full ${imageFitClass} z-0`}
                                loading="eager"
                            />
                        ) : null}
                        {config.showCloseButton !== false && (
                            <button 
                                onClick={handleClose}
                                title="بستن"
                                className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all z-10`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </div>

                    <div className={`relative px-8 pb-10 pt-2 z-10 bg-background ${alignClass}`}>
                        {(isNowruz || heroIconValue || heroIconUrl) && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 0.3 }}
                                className="text-5xl mb-2 -mt-4 text-emerald-500 drop-shadow-sm text-center"
                            >
                                {heroIconUrl ? (
                                    <img src={heroIconUrl} alt="hero icon" className="w-14 h-14 mx-auto object-contain" loading="lazy" />
                                ) : (
                                    <span>{heroIconValue || (isNowruz ? "🌱" : "✨")}</span>
                                )}
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
                                {badge1 && (
                                    <span className="hover:scale-105 transition-transform cursor-default bg-white/5 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                                        {config.badge1Icon && (isIconUrl(config.badge1Icon) ? <img src={config.badge1Icon} alt="badge1" className="w-4 h-4 object-contain" loading="lazy" /> : <span>{config.badge1Icon}</span>)}
                                        <span>{badge1}</span>
                                    </span>
                                )}
                                {badge2 && (
                                    <span className="hover:scale-105 transition-transform cursor-default bg-white/5 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                                        {config.badge2Icon && (isIconUrl(config.badge2Icon) ? <img src={config.badge2Icon} alt="badge2" className="w-4 h-4 object-contain" loading="lazy" /> : <span>{config.badge2Icon}</span>)}
                                        <span>{badge2}</span>
                                    </span>
                                )}
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

                {effect !== 'none' && (
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes fall {
                            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { transform: translateY(110vh) rotate(360deg) scale(0.5); opacity: 0; }
                        }
                        @keyframes snow {
                            0% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
                            10% { opacity: 0.9; }
                            100% { transform: translateY(110vh) scale(0.6); opacity: 0; }
                        }
                        @keyframes sparkle {
                            0% { transform: scale(0) rotate(0deg); opacity: 0; }
                            50% { transform: scale(1.2) rotate(90deg); opacity: 1; filter: brightness(1.5); }
                            100% { transform: scale(0) rotate(180deg); opacity: 0; }
                        }
                        .animate-fall {
                            animation-name: fall;
                            animation-timing-function: linear;
                            animation-iteration-count: infinite;
                        }
                        .animate-snow {
                            animation-name: snow;
                            animation-timing-function: linear;
                            animation-iteration-count: infinite;
                        }
                        .animate-sparkle {
                            animation-name: sparkle;
                            animation-timing-function: ease-in-out;
                            animation-iteration-count: infinite;
                        }
                    `}} />
                )}
            </div>
        </AnimatePresence>
    );
}
