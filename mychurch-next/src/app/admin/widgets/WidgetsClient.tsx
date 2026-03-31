"use client";

import React, { useTransition, useState } from "react";
import {
    LayoutTemplate, Puzzle, ToggleLeft, ToggleRight,
    Settings, Music, Calendar, QrCode, BookOpen, AlertCircle, LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWidget, type Widget } from "@/actions/widgets";
import { WatermarkSettingsModal } from "./WatermarkSettingsModal";

const iconMap: Record<string, any> = {
    Music,
    Calendar,
    QrCode,
    BookOpen,
    LayoutTemplate,
    LayoutDashboard
};

export default function WidgetsClient({ initialWidgets }: { initialWidgets: Widget[] }) {
    const [isPending, startTransition] = useTransition();
    const [watermarkModalOpen, setWatermarkModalOpen] = useState(false);

    const handleToggle = (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            await toggleWidget(id, currentStatus);
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                        <LayoutTemplate className="w-8 h-8 text-primary" />
                        Widget Management
                    </h2>
                    <p className="text-white/80 mt-1">Control active extensions and 3rd-party integrations globally.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialWidgets.map(widget => {
                    const IconComponent = iconMap[widget.icon] || Puzzle;
                    return (
                        <div
                            key={widget.id}
                            className={cn(
                                "relative bg-neutral-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300",
                                widget.is_active ? "border-primary/40 shadow-[0_0_22px_rgba(59,130,246,0.10)]" : "border-white/20 opacity-90"
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-xl bg-neutral-950 shadow-inner border border-white/10", widget.color)}>
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => handleToggle(widget.id, widget.is_active)}
                                    disabled={isPending}
                                    className="text-white/75 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {widget.is_active ? (
                                        <ToggleRight className="w-8 h-8 text-primary" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-white/80" />
                                    )}
                                </button>
                            </div>

                            <h3 className="font-bold text-lg mb-2 text-white">{widget.name}</h3>
                            <p className="text-sm text-white/80 line-clamp-2 min-h-[40px] leading-relaxed">
                                {widget.description}
                            </p>

                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5",
                                    widget.is_active ? "bg-primary/20 text-primary-foreground border border-primary/40" : "bg-neutral-800 text-white/80 border border-white/15"
                                )}>
                                    {widget.is_active ? (
                                        <><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active</>
                                    ) : (
                                        <><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Offline</>
                                    )}
                                </span>

                                <button
                                    className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 transition-colors text-white/80 hover:text-white border border-white/15"
                                    title="Settings"
                                    onClick={() => {
                                        if (widget.id === 'w_watermark') {
                                            setWatermarkModalOpen(true);
                                        } else {
                                            alert("Settings page for this widget is coming soon.");
                                        }
                                    }}
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Add New Widget Placeholder */}
                <button className="bg-neutral-900/60 border border-dashed border-white/25 rounded-2xl p-6 flex flex-col items-center justify-center text-white/80 hover:bg-neutral-800 hover:text-white hover:border-white/40 transition-all min-h-[220px]">
                    <Puzzle className="w-12 h-12 mb-4 opacity-50" />
                    <span className="font-bold">Install Component</span>
                    <span className="text-xs mt-2 opacity-70">Browse extensions library</span>
                </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4 mt-8">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-sm text-amber-500/90 font-medium">
                    <strong className="text-amber-500 block mb-1">Warning: Changing widgets restarts the Broadcast feed</strong>
                    If the Live Console is currently active on the VPS, disconnecting a core widget like "Audio-Text-Sync" will cause a momentary frame-drop on the projector output.
                </div>
            </div>

            <WatermarkSettingsModal
                isOpen={watermarkModalOpen}
                onClose={() => setWatermarkModalOpen(false)}
                currentConfig={initialWidgets.find(w => w.id === 'w_watermark')?.config || {}}
            />
        </div>
    );
}
