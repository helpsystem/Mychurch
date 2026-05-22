"use client";

import React, { useTransition, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DashboardWidget, toggleWidget } from "@/actions/widgets";
import { Settings } from "lucide-react";
import { WidgetSettingsModal } from "./WidgetSettingsModal";
import { WatermarkSettingsModal } from "./WatermarkSettingsModal";

export function WidgetToggleCard({ widget, icon }: { widget: DashboardWidget; icon: React.ReactNode }) {
    const [isPending, startTransition] = useTransition();
    const [showSettings, setShowSettings] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleWidget(widget.id, widget.is_active);
            if (!result.success) {
                alert('Error updating widget: ' + result.error);
            }
        });
    };

    return (
        <div className={`bg-neutral-900/95 rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group ${widget.is_active ? 'border-primary/30 shadow-[0_4px_30px_rgba(0,0,0,0.35)]' : 'border-white/20 opacity-90 grayscale-[0.2]'}`}>

            {/* Active Ambient Glow */}
            {widget.is_active && (
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${widget.color.replace('text-', 'bg-')}/10 blur-[40px] pointer-events-none`} />
            )}

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center border border-white/5`}>
                    {icon}
                </div>

                <div className="flex items-center gap-3">
                    {/* Settings Button (Available for all widgets) */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/15"
                        title="تنظیمات محتوا"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Custom Toggle Switch */}
                    <button
                        onClick={handleToggle}
                        disabled={isPending}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 disabled:opacity-50 ${widget.is_active ? 'bg-primary' : 'bg-white/10'}`}
                        role="switch"
                        aria-checked={widget.is_active ? "true" : "false"}
                    >
                        <span className="sr-only">Toggle widget</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${widget.is_active ? '-translate-x-7' : 'translate-x-0'}`}
                        />
                    </button>
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">{widget.name}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{widget.description}</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold font-serif uppercase tracking-wider">
                    <span className="text-white/80">ID: {widget.id}</span>
                    <span className={widget.is_active ? 'text-primary' : 'text-white/80'}>
                        {widget.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>
            </div>

            {isPending && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
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
