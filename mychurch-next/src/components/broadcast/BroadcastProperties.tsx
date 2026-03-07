"use client";

import React from "react";
import { Settings } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";

export function BroadcastProperties() {
    const { t } = useLanguage();
    const { config, updateConfig } = useBroadcastStore();

    return (
        <aside className="w-72 bg-neutral-900 border-l border-border/10 flex flex-col">
            <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide">{t.properties}</span>
                <Settings className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">{t.layout || 'Layout'}</label>
                    <select
                        title={t.layout}
                        value={config.layout}
                        onChange={(e) => updateConfig({ layout: e.target.value as any })}
                        className="w-full bg-neutral-800 border border-border/20 rounded pl-2 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="FULL_CAM">{t.fullCam || 'Full Camera'}</option>
                        <option value="PIP">{t.pip || 'Picture in Picture'}</option>
                        <option value="SPLIT">{t.split || 'Split Screen'}</option>
                        <option value="SLIDES_ONLY">{t.slidesOnly || 'Slides Only'}</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">{t.lowerThirdTheme || 'Lower Third Theme'}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="py-2 bg-neutral-800 rounded border border-primary/50 text-xs font-bold text-primary" title={t.modern || 'Modern'}>
                            {t.modern || 'Modern'}
                        </button>
                        <button className="py-2 bg-neutral-800 rounded border border-border/20 text-xs font-bold text-muted-foreground" title={t.classic || 'Classic'}>
                            {t.classic || 'Classic'}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
