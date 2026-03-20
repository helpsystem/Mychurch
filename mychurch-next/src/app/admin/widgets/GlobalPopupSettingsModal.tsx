"use client";

import React, { useState, useTransition } from "react";
import { updateWidgetConfig, DashboardWidget } from "@/actions/widgets";
import { X, Save, Image as ImageIcon, Type, Link, RefreshCw } from "lucide-react";

interface Props {
    widget: DashboardWidget;
    onClose: () => void;
}

export function GlobalPopupSettingsModal({ widget, onClose }: Props) {
    const config = widget.config || {};
    const [title, setTitle] = useState(config.title || "نوروز خـجـسـتـه بـاد");
    const [imageUrl, setImageUrl] = useState(config.imageUrl || "/images/nowruz-bg.png");
    const [date1, setDate1] = useState(config.date1 || "۱ فروردین ۱۴۰۵ خورشیدی");
    const [date2, setDate2] = useState(config.date2 || "۲۵۸۵ شاهنشاهی");
    const [date3, setDate3] = useState(config.date3 || "March 21, 2026");
    const [message, setMessage] = useState(config.message || "به امید آزادی ایران عزیز و سربلندی ملت");
    const [subMessage, setSubMessage] = useState(config.subMessage || "با آرزوی برکت، صلح و دوستی برای همراهان مسیحی و تمامی ایرانیان");
    const [buttonText, setButtonText] = useState(config.buttonText || "ورود به سایت");

    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            const newConfig = {
                title, imageUrl, date1, date2, date3, message, subMessage, buttonText
            };
            const success = await updateWidgetConfig(widget.id, newConfig);
            if (success) {
                // Clear localstorage so the user testing it can see the new popup!
                localStorage.removeItem("hasSeenNowruz2026");
                onClose();
            } else {
                alert("Failed to save config.");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-background border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Type className="w-5 h-5 text-primary" />
                        ویرایش محتوای پاپ‌آپ
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <Type className="w-4 h-4" /> تیتر اصلی
                            </label>
                            <input 
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> مسیر عکس پس‌زمینه
                            </label>
                            <input 
                                value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left" dir="ltr"
                            />
                            <p className="text-xs text-muted-foreground mt-1">مسیر عکس در سرور (مانند /images/my-image.png) یا لینک کامل اینترنتی</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ خورشیدی</label>
                                <input value={date1} onChange={(e) => setDate1(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ شاهنشاهی</label>
                                <input value={date2} onChange={(e) => setDate2(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ میلادی</label>
                                <input value={date3} onChange={(e) => setDate3(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 text-left" dir="ltr" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">پیام اصلی (قرمز رنگ)</label>
                            <input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">پیام فرعی (توضیحات)</label>
                            <textarea 
                                value={subMessage} onChange={(e) => setSubMessage(e.target.value)} rows={2}
                                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 resize-none" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">متن دکمه ورود</label>
                            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 w-1/2" />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-secondary/20 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-muted-foreground hover:bg-white/5 font-medium transition-colors">
                        انصراف
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isPending}
                        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        ذخیره تنظیمات
                    </button>
                </div>
            </div>
        </div>
    );
}
