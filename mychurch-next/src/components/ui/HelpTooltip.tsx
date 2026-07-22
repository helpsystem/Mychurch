"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpTooltipProps {
    text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative inline-flex items-center justify-center cursor-help"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 w-64 p-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-50 pointer-events-none"
                    >
                        <p className="text-xs text-white leading-relaxed text-right font-vazirmatn" dir="rtl">
                            {text}
                        </p>
                        {/* Triangle pointer */}
                        <div className="absolute top-full right-1/2 translate-x-1/2 -mt-[1px] border-solid border-t-black/90 border-t-8 border-x-transparent border-x-8 border-b-0" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
