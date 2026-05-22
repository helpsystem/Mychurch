"use client";

import React, { useState, useTransition, useRef } from "react";
import { X, Save, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import { updateWidgetConfig } from "@/actions/widgets";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { cn } from "@/lib/utils";
import { MediaPickerModal } from "@/components/broadcast/MediaPickerModal";

export type WatermarkPosition =
    | 'top-left' | 'top-right' | 'top-center'
    | 'bottom-left' | 'bottom-right' | 'bottom-center'
    | 'center'
    | 'custom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: any;
}

const POSITIONS: { id: WatermarkPosition, label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' }
];

export function WatermarkSettingsModal({ isOpen, onClose, currentConfig }: Props) {
    const [isPending, startTransition] = useTransition();

    // Fallback to default values if config is empty or missing
    const [size, setSize] = useState<number>(currentConfig?.size || 400);
    const [opacity, setOpacity] = useState<number>(currentConfig?.opacity || 4);
    const [position, setPosition] = useState<WatermarkPosition>(currentConfig?.position || 'bottom-right');
    const [customOffsets, setCustomOffsets] = useState<{ x: number, y: number }>(currentConfig?.customOffsets || { x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(currentConfig?.imageUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.url) {
                setImageUrl(data.url);
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed. Check console.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || position !== 'custom') return;
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate percentage (0-100) within the preview box
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setCustomOffsets({ x, y });
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (position !== 'custom') return;
        setIsDragging(true);
        // Jump to the clicked position immediately
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setCustomOffsets({ x, y });
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (e) { }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (e) { }
    };

    const handleSave = () => {
        startTransition(async () => {
            const success = await updateWidgetConfig("w_watermark", { size, opacity, position, customOffsets, imageUrl });
            if (success) {
                onClose();
            } else {
                alert("Failed to save settings. Check console for details.");
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-border/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/10 bg-neutral-950/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Watermark Configuration
                    </h2>
                    <button onClick={onClose} aria-label="Close" title="Close" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* Live Preview Box */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                            <span>Live Preview</span>
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Real-time</span>
                        </label>
                        <div
                            className={cn(
                                "relative w-full aspect-[2/1] bg-neutral-900 border border-border/20 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center select-none touch-none",
                                position === 'custom' ? "cursor-move" : "cursor-default"
                            )}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            onPointerLeave={(e) => {
                                if (isDragging) handlePointerUp(e);
                            }}
                        >
                            {/* Colorful background so mix-blend-overlay is visible */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background to-purple-500/20 pointer-events-none" />
                            <span className="font-black text-foreground/20 z-10 tracking-[0.2em] text-2xl select-none relative pointer-events-none">PAGE PREVIEW</span>

                            {position === 'custom' && (
                                <span className="absolute top-2 right-4 text-[10px] font-bold text-primary animate-pulse select-none pointer-events-none">
                                    DRAG TO MOVE
                                </span>
                            )}

                            {/* Scaled down dynamically for the preview window. Add !opacity-100 if user sets 100 opacity to bypass any css overrides */}
                            <WatermarkLogo
                                size={size / 2.5}
                                opacity={opacity}
                                position={position}
                                imageUrl={imageUrl}
                                customOffsets={customOffsets}
                                className="!mix-blend-normal !grayscale-0 z-0 drop-shadow-md pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* Custom Image Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Watermark Image</label>
                        <div className="flex gap-3">
                            <div className="flex-1 px-4 py-3 bg-neutral-950 border border-border/10 rounded-xl flex items-center gap-3 overflow-hidden text-sm">
                                <ImageIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                                <span className="truncate text-muted-foreground flex-1">
                                    {imageUrl ? imageUrl.split('/').pop() : "Default Logo (logo-transparent.png)"}
                                </span>
                                {imageUrl && (
                                    <button
                                        onClick={() => setImageUrl('')}
                                        className="text-xs text-red-400 hover:text-red-300 font-bold shrink-0"
                                    >
                                        RESET
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsGalleryOpen(true)}
                                    className="px-4 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 font-bold rounded-xl whitespace-nowrap flex items-center gap-2 transition-colors text-sm"
                                    title="گالری"
                                >
                                    <ImageIcon className="w-4 h-4" /> Gallery
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-foreground font-bold rounded-xl whitespace-nowrap flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                                    title="آپلود مستقیم"
                                >
                                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Position Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Position</label>
                        <div className="grid grid-cols-4 gap-2 p-4 bg-neutral-950 rounded-xl border border-border/5">
                            <button
                                onClick={() => setPosition('custom')}
                                className={cn(
                                    "col-span-4 py-3 text-xs font-bold rounded-lg border transition-all duration-200 flex items-center justify-center gap-2",
                                    position === 'custom'
                                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                                        : "bg-neutral-900 border-border/10 text-muted-foreground hover:bg-neutral-800 hover:border-border/30"
                                )}
                            >
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse opacity-70" />
                                Custom Drag (Use Live Preview box)
                            </button>
                            {POSITIONS.map(pos => (
                                <button
                                    key={pos.id}
                                    onClick={() => setPosition(pos.id)}
                                    className={cn(
                                        "col-span-1 py-3 text-[10px] md:text-xs font-medium rounded-lg border transition-all duration-200",
                                        position === pos.id
                                            ? "bg-primary/20 border-primary/50 text-primary shadow-sm"
                                            : "bg-neutral-900 border-border/10 text-muted-foreground hover:bg-neutral-800 hover:border-border/30"
                                    )}
                                >
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Size (Width px)</label>
                            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{size}px</span>
                        </div>
                        <input
                            type="range"
                            title="Size in pixels"
                            aria-label="Watermark Size"
                            min="100"
                            max="1200"
                            step="50"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            className="w-full accent-primary bg-neutral-800 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>100px</span>
                            <span>1200px</span>
                        </div>
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Opacity (%)</label>
                            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{opacity}%</span>
                        </div>
                        <input
                            type="range"
                            title="Opacity in percentage"
                            aria-label="Watermark Opacity"
                            min="1"
                            max="100"
                            value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="w-full accent-primary bg-neutral-800 h-2 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Invisible (1%)</span>
                            <span>Solid (100%)</span>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/10 bg-neutral-950/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-6 py-2.5 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isPending ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>

            <MediaPickerModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onSelect={(url) => setImageUrl(url)}
                allowedTypes={['image']}
                isRTL={true}
                title="انتخاب لوگو (واترمارک)"
            />
        </div>
    );
}
