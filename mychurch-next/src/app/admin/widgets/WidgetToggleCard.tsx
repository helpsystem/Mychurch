"use client";

import React, { useTransition, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DashboardWidget, toggleWidget } from "@/actions/widgets";
import { Settings, CheckCircle2, Power } from "lucide-react";
import { WidgetSettingsModal } from "./WidgetSettingsModal";
import { WatermarkSettingsModal } from "./WatermarkSettingsModal";

export function WidgetToggleCard({ 
    widget, 
    icon, 
    lang = "fa" 
}: { 
    widget: DashboardWidget; 
    icon: React.ReactNode; 
    lang?: "fa" | "en" 
}) {
    const [isPending, startTransition] = useTransition();
    const [showSettings, setShowSettings] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isEn = lang === "en";

    const titlePrimary = isEn ? (widget.name_en || widget.name) : (widget.name_fa || widget.name);
    const titleSecondary = isEn ? (widget.name_fa || widget.name) : (widget.name_en || widget.name);
    const desc = isEn ? (widget.description_en || widget.description) : (widget.description_fa || widget.description);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleWidget(widget.id, widget.is_active);
            if (!result.success) {
                alert('Error updating widget: ' + result.error);
            }
        });
    };

    return (
        <div 
            className={`bg-neutral-900/95 rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between ${
                widget.is_active 
                    ? 'border-primary/40 shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-primary/60' 
                    : 'border-white/15 opacity-80 grayscale-[0.15] hover:opacity-95'
            }`}
            dir={isEn ? "ltr" : "rtl"}
        >
            {/* Active Ambient Glow */}
            {widget.is_active && (
                <div className={`absolute -right-10 -top-10 w-36 h-36 rounded-full ${widget.color.replace('text-', 'bg-')}/15 blur-[45px] pointer-events-none`} />
            )}

            <div>
                {/* Header: Icon & Controls */}
                <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center border border-white/10 shadow-inner">
                        {icon}
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors border border-white/10 shadow-sm"
                            title={isEn ? "Configure Widget Settings" : "تنظیمات و پیکربندی محتوا"}
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {/* Custom Toggle Switch */}
                        <button
                            onClick={handleToggle}
                            disabled={isPending}
                            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 disabled:opacity-50 ${
                                widget.is_active ? 'bg-primary' : 'bg-white/15'
                            }`}
                            role="switch"
                            aria-checked={widget.is_active ? "true" : "false"}
                        >
                            <span className="sr-only">Toggle widget</span>
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    widget.is_active 
                                        ? (isEn ? 'translate-x-7' : '-translate-x-7') 
                                        : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="mb-2">
                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-snug">
                            {titlePrimary}
                        </h3>
                        {titleSecondary && titleSecondary !== titlePrimary && (
                            <span className="text-xs text-muted-foreground/80 font-medium block mt-0.5" dir={isEn ? "rtl" : "ltr"}>
                                {titleSecondary}
                            </span>
                        )}
                    </div>

                    <p className="text-white/80 text-xs leading-relaxed line-clamp-3 min-h-[48px] mt-1.5">
                        {desc}
                    </p>
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] font-bold font-mono uppercase tracking-wider relative z-10">
                <span className="text-white/50">{widget.id}</span>
                <span className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    widget.is_active 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                        : 'bg-neutral-800 text-gray-400 border-white/10'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${widget.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{widget.is_active ? (isEn ? 'ACTIVE' : 'فعال') : (isEn ? 'INACTIVE' : 'غیرفعال')}</span>
                </span>
            </div>

            {isPending && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {showSettings && mounted && widget.id === 'w_watermark' && createPortal(
                <WatermarkSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} currentConfig={widget.config || {}} />,
                document.body
            )}
            
            {showSettings && mounted && widget.id !== 'w_watermark' && createPortal(
                <WidgetSettingsModal widget={widget} onClose={() => setShowSettings(false)} />,
                document.body
            )}
        </div>
    );
}
