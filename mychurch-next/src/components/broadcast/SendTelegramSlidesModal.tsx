"use client";

import React, { useState, useMemo } from "react";
import { Slide, SlideType, SlideContentScripture, SlideContentLyrics, SlideContentAnnouncement, SlideContentPrayer, SlideContentGeneric, SlideContentMedia } from "@/types/broadcast";
import { X, Send, CheckSquare, Square, BookOpen, Music, Megaphone, Heart, Edit3, Film, Youtube, Volume2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SendTelegramSlidesModalProps {
    isOpen: boolean;
    onClose: () => void;
    slides: Slide[];
    presentationId?: string;
    presentationTitle?: string;
    isRTL?: boolean;
}

export function SendTelegramSlidesModal({
    isOpen,
    onClose,
    slides = [],
    presentationId,
    presentationTitle = "جلسه کلیسا",
    isRTL = true
}: SendTelegramSlidesModalProps) {
    // Default to all slides selected
    const [selectedIndices, setSelectedIndices] = useState<number[]>(() => 
        slides.map((_, idx) => idx)
    );
    const [filterType, setFilterType] = useState<'all' | 'scripture' | 'lyrics' | 'other'>('all');
    const [isSending, setIsSending] = useState(false);

    // Keep selected indices synced if slides change
    React.useEffect(() => {
        setSelectedIndices(slides.map((_, idx) => idx));
    }, [slides]);

    if (!isOpen) return null;

    const toggleSelectAll = () => {
        if (selectedIndices.length === slides.length) {
            setSelectedIndices([]);
        } else {
            setSelectedIndices(slides.map((_, idx) => idx));
        }
    };

    const toggleSlide = (index: number) => {
        setSelectedIndices(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const filteredSlides = slides
        .map((slide, idx) => ({ slide, index: idx }))
        .filter(({ slide }) => {
            if (filterType === 'all') return true;
            if (filterType === 'scripture') return slide.type === SlideType.SCRIPTURE;
            if (filterType === 'lyrics') return slide.type === SlideType.LYRICS;
            if (filterType === 'other') return slide.type !== SlideType.SCRIPTURE && slide.type !== SlideType.LYRICS;
            return true;
        });

    const getSlideSummary = (slide: Slide, index: number) => {
        if (slide.type === SlideType.SCRIPTURE) {
            const content = slide.content as SlideContentScripture;
            const page = content?.pages?.[0];
            const ref = page ? `${page.bookName?.fa || page.book || 'کتاب‌مقدس'} ${page.chapter || ''}:${page.verses || ''}` : `آیه کتاب مقدس`;
            return {
                title: ref,
                sub: page?.textPrimary?.[0] || 'متن آیه کلام خدا',
                badge: 'کتاب مقدس',
                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: <BookOpen className="w-4 h-4 text-amber-400" />
            };
        }
        if (slide.type === SlideType.LYRICS) {
            const content = slide.content as SlideContentLyrics;
            return {
                title: content?.titleFa || content?.title || `سرود پرستشی ${index + 1}`,
                sub: content?.titleEn || `${content?.lines?.length || 0} بند سرود`,
                badge: 'سرود پرستشی',
                badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                icon: <Music className="w-4 h-4 text-pink-400" />,
                hasYoutube: !!content?.youtubeId,
                hasAudio: !!content?.audioUrl
            };
        }
        if (slide.type === SlideType.ANNOUNCEMENT) {
            const content = slide.content as SlideContentAnnouncement;
            return {
                title: content?.title || 'اطلاعیه کلیسا',
                sub: content?.content || '',
                badge: 'اطلاعیه',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: <Megaphone className="w-4 h-4 text-emerald-400" />
            };
        }
        if (slide.type === SlideType.PRAYER) {
            const content = slide.content as SlideContentPrayer;
            return {
                title: content?.title || content?.userName || 'درخواست دعا',
                sub: content?.content || '',
                badge: 'دعا',
                badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                icon: <Heart className="w-4 h-4 text-rose-400" />
            };
        }
        if (slide.type === SlideType.MEDIA) {
            const content = slide.content as SlideContentMedia;
            return {
                title: content?.title || 'مدیا / رسانه',
                sub: content?.url || '',
                badge: 'رسانه',
                badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                icon: <Film className="w-4 h-4 text-blue-400" />
            };
        }
        // Generic / sermon
        const content = slide.content as SlideContentGeneric;
        return {
            title: content?.title || `اسلاید ${index + 1}`,
            sub: content?.htmlContent ? content.htmlContent.replace(/<[^>]+>/g, '').slice(0, 80) : '',
            badge: 'اسلاید',
            badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            icon: <Edit3 className="w-4 h-4 text-purple-400" />
        };
    };

    const handleSend = async () => {
        if (selectedIndices.length === 0) {
            toast.error("لطفاً حداقل یک اسلاید را برای ارسال انتخاب کنید.");
            return;
        }

        setIsSending(true);
        const toastId = toast.loading(isRTL ? `در حال ارسال ${selectedIndices.length} اسلاید به تلگرام...` : `Sending ${selectedIndices.length} slides to Telegram...`);

        try {
            const res = await fetch("/api/admin/presentations/send-telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    presentationId,
                    title: presentationTitle,
                    slides,
                    selectedSlideIndices: selectedIndices
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "خطا در ارسال اسلایدها به تلگرام");
            }

            const successMsg = isRTL
                ? `${data.slidesSent || selectedIndices.length} اسلاید با موفقیت به‌صورت پیام‌های مجزا به تلگرام ارسال گردید! ✈️`
                : `${data.slidesSent || selectedIndices.length} slides sent successfully as individual messages to Telegram! ✈️`;

            toast.success(successMsg, { id: toastId });
            onClose();
        } catch (err: any) {
            console.error("Telegram send error:", err);
            toast.error(err.message || "خطا در ارسال به تلگرام", { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div 
                className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl font-[Vazirmatn] text-white overflow-hidden"
                dir={isRTL ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">
                                {isRTL ? "انتخاب و ارسال اسلایدها به تلگرام" : "Select & Send Slides to Telegram"}
                            </h3>
                            <p className="text-xs text-neutral-400">
                                {isRTL 
                                    ? "هر اسلاید به‌صورت یک پیام مجزا همراه با آیه، سرود، فایل صوتی و اطلاعات کلیسا ارسال می‌شود." 
                                    : "Each slide will be delivered as an individual message with bilingual text & audio."}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter and Quick Select Bar */}
                <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg font-bold text-neutral-200 transition"
                        >
                            {selectedIndices.length === slides.length ? (
                                <>
                                    <CheckSquare className="w-4 h-4 text-blue-400" />
                                    <span>لغو انتخاب همه</span>
                                </>
                            ) : (
                                <>
                                    <Square className="w-4 h-4" />
                                    <span>انتخاب همه ({slides.length})</span>
                                </>
                            )}
                        </button>

                        <span className="text-neutral-400 font-bold mr-2">
                            انتخاب‌شده: <b className="text-blue-400 font-mono">{selectedIndices.length}</b> از {slides.length}
                        </span>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            همه
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('scripture')}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${filterType === 'scripture' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            کتاب مقدس
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('lyrics')}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${filterType === 'lyrics' ? 'bg-pink-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            سرودها
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('other')}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${filterType === 'other' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            سایر
                        </button>
                    </div>
                </div>

                {/* Slides List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
                    {filteredSlides.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 text-xs">
                            اسلایدی در این دسته‌بندی یافت نشد.
                        </div>
                    ) : (
                        filteredSlides.map(({ slide, index }) => {
                            const isSelected = selectedIndices.includes(index);
                            const info = getSlideSummary(slide, index);

                            return (
                                <div
                                    key={slide.id || index}
                                    onClick={() => toggleSlide(index)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                        isSelected 
                                            ? "bg-blue-950/30 border-blue-500/50 shadow-sm" 
                                            : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                            isSelected ? "bg-blue-600 border-blue-500 text-white" : "border-neutral-700 bg-neutral-900 text-transparent"
                                        }`}>
                                            <CheckSquare className="w-3.5 h-3.5" />
                                        </div>

                                        <span className="text-xs font-mono font-bold text-neutral-400 shrink-0">
                                            #{index + 1}
                                        </span>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${info.badgeColor}`}>
                                                {info.icon}
                                                {info.badge}
                                            </span>
                                        </div>

                                        <div className="overflow-hidden">
                                            <h4 className="text-xs font-bold text-white truncate max-w-sm">
                                                {info.title}
                                            </h4>
                                            {info.sub && (
                                                <p className="text-[11px] text-neutral-400 truncate max-w-sm mt-0.5">
                                                    {info.sub}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Song Badges (YouTube, MP3) */}
                                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                                        {info.hasYoutube && (
                                            <span className="p-1 rounded bg-red-600/20 text-red-400 border border-red-500/20" title="لینک یوتیوب موجود است">
                                                <Youtube className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                        {info.hasAudio && (
                                            <span className="p-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" title="فایل صوتی MP3 همراه این اسلاید ارسال خواهد شد">
                                                <Volume2 className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/60">
                    <span className="text-xs text-neutral-400">
                        {selectedIndices.length === 0 ? (
                            <span className="text-amber-400">هیچ اسلایدی انتخاب نشده است.</span>
                        ) : (
                            <span>آماده ارسال <b className="text-white font-mono">{selectedIndices.length}</b> پیام به کانال تلگرام</span>
                        )}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSending}
                            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                        >
                            انصراف
                        </button>

                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={isSending || selectedIndices.length === 0}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>در حال ارسال...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>ارسال {selectedIndices.length} اسلاید به تلگرام</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
