"use client";

import React from "react";
import { ZoomIn, ZoomOut, Sparkles, RotateCcw } from "lucide-react";
import { Slide, SlideType } from "@/types/broadcast";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        smartSizeSet: (pct: number) => `Smart size set to ${pct}%.`,
        shrinkText: "Shrink text (A-)",
        clickToReset: "Click to reset to 100%",
        enlargeText: "Enlarge text (A+)",
        autoFitContent: "Auto-fit size based on content",
        auto: "Auto",
        fontZoomLabel: "Slide Text Size (Font Zoom)",
        resetTo100: "Reset to 100%",
        autoFitBest: "Automatically calculate the best text size",
    },
    fa: {
        smartSizeSet: (pct: number) => `اندازه هوشمند روی ${pct}% تنظیم شد.`,
        shrinkText: "کوچک‌تر کردن متن (A-)",
        clickToReset: "کلیک برای ریست به ۱۰۰٪",
        enlargeText: "بزرگ‌تر کردن متن (A+)",
        autoFitContent: "تنظیم اندازه خودکار بر اساس محتوا (Auto-fit)",
        auto: "خودکار",
        fontZoomLabel: "اندازه متن اسلاید (Font Zoom)",
        resetTo100: "بازنشانی به ۱۰۰٪",
        autoFitBest: "محاسبه هوشمند بهترین اندازه متن",
    },
    es: {
        smartSizeSet: (pct: number) => `Tamaño inteligente ajustado a ${pct}%.`,
        shrinkText: "Reducir texto (A-)",
        clickToReset: "Haga clic para restablecer a 100%",
        enlargeText: "Aumentar texto (A+)",
        autoFitContent: "Ajustar tamaño automáticamente según el contenido",
        auto: "Automático",
        fontZoomLabel: "Tamaño de texto de la diapositiva (Zoom de fuente)",
        resetTo100: "Restablecer a 100%",
        autoFitBest: "Calcular automáticamente el mejor tamaño de texto",
    },
};

interface SlideFontControlsProps {
    currentZoom: number;
    slide?: Slide | null;
    onChangeZoom: (newZoom: number) => void;
    compact?: boolean;
    className?: string;
}

/**
 * Intelligent Auto-Fit Calculator based on slide type and text length
 */
export function calculateOptimalZoom(slide?: Slide | null): number {
    if (!slide || !slide.content) return 1.0;

    let totalChars = 0;

    switch (slide.type) {
        case SlideType.SCRIPTURE: {
            const content = slide.content as any;
            if (Array.isArray(content.verses)) {
                totalChars = content.verses.reduce((acc: number, v: any) => {
                    const textFa = v.text || v.textFa || "";
                    const textEn = v.textEn || "";
                    return acc + textFa.length + textEn.length;
                }, 0);
            } else if (typeof content.text === "string") {
                totalChars = content.text.length;
            }

            if (totalChars === 0) return 1.15;
            if (totalChars < 160) return 1.35; // Short verse: bold & large
            if (totalChars < 360) return 1.15; // Standard verse
            if (totalChars < 650) return 1.0;  // Medium passage
            if (totalChars < 1000) return 0.88; // Long passage
            return 0.78; // Very dense passage
        }

        case SlideType.LYRICS: {
            const content = slide.content as any;
            const lines = content.lines || [];
            const lineCount = lines.length;
            const maxLineLen = lines.reduce((max: number, l: any) => {
                const len = (l.farsi || l.text || "").length;
                return Math.max(max, len);
            }, 0);

            if (lineCount <= 4 && maxLineLen < 35) return 1.25;
            if (lineCount <= 6 && maxLineLen < 45) return 1.10;
            if (lineCount <= 8) return 1.0;
            if (lineCount <= 12) return 0.90;
            return 0.80;
        }

        case SlideType.ANNOUNCEMENT: {
            const content = slide.content as any;
            totalChars = (content.title || "").length + (content.content || "").length;
            if (totalChars < 80) return 1.30;
            if (totalChars < 250) return 1.10;
            if (totalChars < 500) return 0.95;
            return 0.85;
        }

        case SlideType.PRAYER: {
            const content = slide.content as any;
            totalChars = (content.title || "").length + (content.content || "").length;
            if (totalChars < 120) return 1.25;
            if (totalChars < 300) return 1.10;
            return 0.95;
        }

        case SlideType.GENERIC: {
            const content = slide.content as any;
            totalChars = (content.htmlContent || "").replace(/<[^>]*>/g, "").length;
            if (totalChars < 100) return 1.25;
            if (totalChars < 300) return 1.05;
            return 0.90;
        }

        default:
            return 1.0;
    }
}

export default function SlideFontControls({
    currentZoom,
    slide,
    onChangeZoom,
    compact = false,
    className = ""
}: SlideFontControlsProps) {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const zoomPct = Math.round((currentZoom || 1) * 100);

    const handleZoomStep = (delta: number) => {
        const next = Math.max(0.5, Math.min(2.5, Number((currentZoom + delta).toFixed(2))));
        onChangeZoom(next);
    };

    const handleAutoFit = () => {
        const optimal = calculateOptimalZoom(slide);
        onChangeZoom(optimal);
        toast.success(d.smartSizeSet(Math.round(optimal * 100)));
    };

    const handleReset = () => {
        onChangeZoom(1.0);
    };

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-lg font-[Vazirmatn] select-none ${className}`}>
                {/* Decrement Button A- */}
                <button
                    type="button"
                    onClick={() => handleZoomStep(-0.05)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition active:scale-95"
                    title={d.shrinkText}
                >
                    <span className="text-[11px] font-mono font-black">A-</span>
                </button>

                {/* Current Value Display & Reset on click */}
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-2 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-neutral-800 text-indigo-300 hover:text-white font-mono text-xs font-bold transition"
                    title={d.clickToReset}
                >
                    {zoomPct}%
                </button>

                {/* Increment Button A+ */}
                <button
                    type="button"
                    onClick={() => handleZoomStep(0.05)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition active:scale-95"
                    title={d.enlargeText}
                >
                    <span className="text-[11px] font-mono font-black">A+</span>
                </button>

                {/* Auto-fit Button */}
                <button
                    type="button"
                    onClick={handleAutoFit}
                    className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition active:scale-95"
                    title={d.autoFitContent}
                >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span className="hidden sm:inline text-[11px]">{d.auto}</span>
                </button>
            </div>
        );
    }

    // Expanded view for builder sidebars or modals
    return (
        <div className={`p-3 bg-neutral-950/70 rounded-xl border border-white/10 space-y-2.5 font-[Vazirmatn] ${className}`}>
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                    <span>{d.fontZoomLabel}</span>
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-indigo-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-white/5">
                        {zoomPct}%
                    </span>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
                        title={d.resetTo100}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Slider */}
            <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={currentZoom || 1}
                onChange={(e) => onChangeZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                title={d.fontZoomLabel}
            />

            {/* Action Buttons Row */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                    type="button"
                    onClick={() => handleZoomStep(-0.05)}
                    className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                    <ZoomOut className="w-3 h-3" />
                    <span>A-</span>
                </button>

                <button
                    type="button"
                    onClick={() => onChangeZoom(1.0)}
                    className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center transition"
                >
                    100%
                </button>

                <button
                    type="button"
                    onClick={() => handleZoomStep(0.05)}
                    className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                    <ZoomIn className="w-3 h-3" />
                    <span>A+</span>
                </button>

                <button
                    type="button"
                    onClick={handleAutoFit}
                    className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                    title={d.autoFitBest}
                >
                    <Sparkles className="w-3 h-3" />
                    <span>{d.auto}</span>
                </button>
            </div>
        </div>
    );
}
