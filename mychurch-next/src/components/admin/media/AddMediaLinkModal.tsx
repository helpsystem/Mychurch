"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Link2, Eye, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, Video as VideoIcon, Music, Copy, RefreshCw } from "lucide-react";
import { addMediaLink, type MediaAsset } from "@/actions/media";
import { toast } from "sonner";

interface AddMediaLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (asset: MediaAsset) => void;
    onSelectAndApply?: (url: string, type: 'image' | 'video' | 'audio' | 'other') => void;
    isRTL?: boolean;
    defaultCategory?: string;
}

export function AddMediaLinkModal({
    isOpen,
    onClose,
    onSuccess,
    onSelectAndApply,
    isRTL = true,
    defaultCategory = "پس‌زمینه اسلاید"
}: AddMediaLinkModalProps) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
    const [category, setCategory] = useState(defaultCategory);
    const [showInGallery, setShowInGallery] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Live preview states
    const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Detect YouTube
    const youtubeInfo = useMemo(() => {
        if (!url) return null;
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(ytRegex);
        if (match && match[1]) {
            return {
                id: match[1],
                embedUrl: `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`,
                thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
            };
        }
        return null;
    }, [url]);

    // Auto-detect type from URL changes
    useEffect(() => {
        const clean = url.trim().toLowerCase();
        if (!clean) {
            setPreviewStatus('idle');
            setPreviewError(null);
            return;
        }

        if (clean.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i) || youtubeInfo || clean.includes('vimeo.com')) {
            setMediaType('video');
        } else if (clean.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i)) {
            setMediaType('audio');
        } else if (clean.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i) || clean.includes('images.unsplash.com')) {
            setMediaType('image');
        }

        // Test loading preview
        setPreviewStatus('loading');
        setPreviewError(null);
    }, [url, youtubeInfo]);

    if (!isOpen) return null;

    const handlePaste = async () => {
        try {
            const clipText = await navigator.clipboard.readText();
            if (clipText) {
                setUrl(clipText.trim());
            }
        } catch {
            toast.error("امکان خواندن خودکار کلیپ‌بورد وجود ندارد. لطفاً دستی Paste کنید.");
        }
    };

    const handleSave = async (shouldApply = false) => {
        let cleanUrl = url.trim();
        if (cleanUrl.startsWith('://')) cleanUrl = 'https' + cleanUrl;
        else if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
        else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        if (!cleanUrl) {
            toast.error("لطفاً آدرس مدیا را وارد نمایید.");
            return;
        }

        setIsSaving(true);
        try {
            const finalTitle = title.trim() || (mediaType === 'video' ? 'ویدیو پس‌زمینه' : 'تصویر پس‌زمینه');
            const res = await addMediaLink({
                url: cleanUrl,
                title: finalTitle,
                mediaType,
                category,
                visibility: showInGallery ? 'public' : 'admin'
            });

            if (!res.success || !res.asset) {
                throw new Error(res.error || "خطا در ذخیره‌سازی لینک مدیا");
            }

            toast.success("مدیا با موفقیت در گالری ذخیره شد! 🎉", {
                description: finalTitle
            });

            if (onSuccess) onSuccess(res.asset);

            if (shouldApply && onSelectAndApply) {
                onSelectAndApply(res.asset.url, res.asset.type);
            }

            onClose();
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error(err.message || "خطا در ثبت مدیا");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
                className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
                dir={isRTL ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                            <Link2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base font-[Vazirmatn]">
                                {isRTL ? "افزودن مدیا با لینک (عکس / ویدیو)" : "Add Media via Link (Image / Video)"}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isRTL ? "پیش‌نمایش زنده و ذخیره در گالری جهت استفاده در اسلایدها و پس‌زمینه" : "Live preview and save to gallery for slides and backgrounds"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 flex-1">
                    {/* URL Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 font-[Vazirmatn]">
                            {isRTL ? "آدرس اینترنتی مدیا (عکس / ویدیو / یوتیوب):" : "Media URL (Direct Image / Video / YouTube):"}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/background.mp4 or https://images.unsplash.com/..."
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition dir-ltr"
                                />
                                {url && (
                                    <button
                                        type="button"
                                        onClick={() => setUrl("")}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handlePaste}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                {isRTL ? "چسباندن (Paste)" : "Paste"}
                            </button>
                        </div>
                    </div>

                    {/* Media Type Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold ml-1 font-[Vazirmatn]">
                            {isRTL ? "نوع مدیا:" : "Media Type:"}
                        </span>
                        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setMediaType('image')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                                    mediaType === 'image' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                {isRTL ? "تصویر" : "Image"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMediaType('video')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                                    mediaType === 'video' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <VideoIcon className="w-3.5 h-3.5" />
                                {isRTL ? "ویدیو" : "Video"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMediaType('audio')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                                    mediaType === 'audio' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <Music className="w-3.5 h-3.5" />
                                {isRTL ? "صوت" : "Audio"}
                            </button>
                        </div>
                    </div>

                    {/* LIVE PREVIEW WINDOW */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                {isRTL ? "پیش‌نمایش زنده (Live Preview):" : "Live Preview:"}
                            </span>
                            {url && (
                                <span className="text-[11px] font-bold flex items-center gap-1 text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {isRTL ? "آماده پیش‌نمایش" : "Ready"}
                                </span>
                            )}
                        </div>

                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900/80 border border-slate-800/80 flex items-center justify-center">
                            {!url ? (
                                <div className="text-center p-6 text-slate-500">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                    <p className="text-xs">
                                        {isRTL
                                            ? "آدرس عکس یا ویدیو را در کادر بالا وارد کنید تا پیش‌نمایش در اینجا نمایش یابد."
                                            : "Enter image or video URL above to see real-time preview."}
                                    </p>
                                </div>
                            ) : youtubeInfo ? (
                                <iframe
                                    src={youtubeInfo.embedUrl}
                                    title="YouTube video preview"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : mediaType === 'video' ? (
                                <video
                                    src={url}
                                    controls
                                    muted
                                    autoPlay
                                    loop
                                    className="w-full h-full object-cover"
                                    onLoadedData={() => setPreviewStatus('success')}
                                    onError={() => {
                                        setPreviewStatus('error');
                                        setPreviewError(isRTL ? "خطا در پخش فایل ویدیو. لطفاً مطمئن شوید لینک مستقیم فایل (MP4 / WebM) است." : "Failed to load video. Ensure direct MP4/WebM URL.");
                                    }}
                                />
                            ) : mediaType === 'audio' ? (
                                <div className="w-full p-6 text-center space-y-3">
                                    <Music className="w-12 h-12 mx-auto text-indigo-400 animate-pulse" />
                                    <audio src={url} controls className="w-full" />
                                </div>
                            ) : (
                                <img
                                    src={url}
                                    alt="Live preview"
                                    className="w-full h-full object-cover"
                                    onLoad={() => setPreviewStatus('success')}
                                    onError={() => {
                                        setPreviewStatus('error');
                                        setPreviewError(isRTL ? "خطا در بارگذاری تصویر. لطفاً از صحت لینک اطمینان حاصل فرمایید." : "Image failed to load. Please verify URL.");
                                    }}
                                />
                            )}
                        </div>

                        {previewError && (
                            <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-[Vazirmatn]">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {previewError}
                            </p>
                        )}
                    </div>

                    {/* Title and Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1 font-[Vazirmatn]">
                                {isRTL ? "عنوان / نام مدیا (اختیاری):" : "Title / Label (Optional):"}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isRTL ? "مثال: پس‌زمینه ستایش یکشنبه" : "e.g. Sunday Worship Background"}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1 font-[Vazirmatn]">
                                {isRTL ? "دسته‌بندی (Category):" : "Category:"}
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-[Vazirmatn]"
                            >
                                <option value="پس‌زمینه اسلاید">پس‌زمینه اسلاید (Slide Background)</option>
                                <option value="ویدیو پس‌زمینه">ویدیو پس‌زمینه (Video Background)</option>
                                <option value="کلیسا">کلیسا (Church)</option>
                                <option value="رویداد">رویداد (Event)</option>
                                <option value="طبیعت">طبیعت (Nature)</option>
                                <option value="پرستش">پرستش و سرود (Worship)</option>
                            </select>
                        </div>
                    </div>

                    {/* Visibility Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                        <input
                            type="checkbox"
                            checked={showInGallery}
                            onChange={(e) => setShowInGallery(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-300 font-bold font-[Vazirmatn]">
                            {isRTL ? "نمایش در گالری عمومی سایت (/gallery)" : "Show in Public Website Gallery (/gallery)"}
                        </span>
                    </label>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                    >
                        {isRTL ? "انصراف" : "Cancel"}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSave(false)}
                        disabled={isSaving || !url.trim()}
                        className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        {isRTL ? "ذخیره در گالری" : "Save to Gallery"}
                    </button>

                    {onSelectAndApply && (
                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !url.trim()}
                            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50 font-[Vazirmatn]"
                        >
                            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {isRTL ? "ذخیره و انتخاب به عنوان پس‌زمینه اسلاید" : "Save & Apply as Background"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
