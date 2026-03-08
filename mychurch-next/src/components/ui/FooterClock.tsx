"use client";

import React, { useState, useEffect } from "react";
import { Clock, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FooterClock() {
    const [time, setTime] = useState<Date | null>(null);
    const [isAnalog, setIsAnalog] = useState(true);

    useEffect(() => {
        setTime(new Date());
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Prevent hydration mismatch by returning a skeleton during SSR
    if (!time) {
        return (
            <div className="flex items-center gap-4 bg-background/30 backdrop-blur-md border border-border/10 px-4 py-2 rounded-full h-[58px] min-w-[200px] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-secondary/50" />
                <div className="w-10 h-10 rounded-full bg-secondary/50" />
                <div className="flex flex-col gap-2">
                    <div className="h-3 w-24 bg-secondary/50 rounded" />
                    <div className="h-2 w-16 bg-secondary/50 rounded" />
                </div>
            </div>
        );
    }

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Analog calculations
    const secondsDegrees = (seconds / 60) * 360;
    const minsDegrees = ((minutes + seconds / 60) / 60) * 360;
    const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

    // Date/Time formatting
    const formattedDateFa = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(time);

    const formattedTimeEn = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).format(time);

    return (
        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md border border-border/20 px-4 py-2 rounded-full shadow-lg shadow-black/5 hover:border-primary/30 transition-colors">
            {/* Toggle Button */}
            <button
                onClick={() => setIsAnalog(!isAnalog)}
                className="relative shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all focus:outline-none ring-1 ring-border/50 hover:ring-primary/50"
                title="تغییر نمای ساعت"
            >
                <Clock className="w-4 h-4" />
            </button>

            {/* Clock Face container */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {isAnalog ? (
                        <motion.div
                            key="analog"
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full border-[1.5px] border-primary/40 bg-secondary/10 flex items-center justify-center shadow-inner"
                        >
                            {/* Center Dot */}
                            <div className="w-[3px] h-[3px] bg-primary rounded-full z-20" />

                            {/* Hour Hand */}
                            <div
                                className="absolute bottom-1/2 left-1/2 w-[1.5px] h-3 bg-foreground/90 rounded-t-full z-10"
                                style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)`, transformOrigin: 'bottom center' }}
                            />
                            {/* Minute Hand */}
                            <div
                                className="absolute bottom-1/2 left-1/2 w-[1px] h-4 bg-muted-foreground rounded-t-full z-10"
                                style={{ transform: `translateX(-50%) rotate(${minsDegrees}deg)`, transformOrigin: 'bottom center' }}
                            />
                            {/* Second Hand */}
                            <div
                                className="absolute bottom-1/2 left-1/2 w-[1px] h-[18px] bg-red-500 rounded-t-full z-10"
                                style={{ transform: `translateX(-50%) rotate(${secondsDegrees}deg)`, transformOrigin: 'bottom center' }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="digital"
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute flex flex-col items-center justify-center inset-0 rounded-full border border-border/20 bg-secondary/20"
                        >
                            <span className="text-[11px] font-black tracking-tighter text-foreground leading-none mt-1" dir="ltr">
                                {formattedTimeEn.split(' ')[0]}
                            </span>
                            <span className="text-[8px] font-bold text-primary tracking-widest leading-none mt-0.5" dir="ltr">
                                {formattedTimeEn.split(' ')[1]}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Date Display */}
            <div className="flex flex-col justify-center border-r border-border/20 pr-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarDays className="w-3 h-3 text-primary/70" />
                    {formattedDateFa}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 whitespace-nowrap opacity-80" dir="ltr">
                    {formattedTimeEn} (Local)
                </span>
            </div>
        </div>
    );
}
