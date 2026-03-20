"use client";

import React, { useState, useTransition } from "react";
import { updateWidgetConfig, DashboardWidget } from "@/actions/widgets";
import { X, Save, Image as ImageIcon, Type, RefreshCw, Code2 } from "lucide-react";

interface Props {
    widget: DashboardWidget;
    onClose: () => void;
}

export function WidgetSettingsModal({ widget, onClose }: Props) {
    const config = widget.config || {};
    
    // Popup specific state
    const [title, setTitle] = useState(config.title || "نوروز خـجـسـتـه بـاد");
    const [imageUrl, setImageUrl] = useState(config.imageUrl || "/images/nowruz-bg.png");
    const [date1, setDate1] = useState(config.date1 || "۱ فروردین ۱۴۰۵ خورشیدی");
    const [date2, setDate2] = useState(config.date2 || "۲۵۸۵ شاهنشاهی");
    const [date3, setDate3] = useState(config.date3 || "March 21, 2026");
    const [message, setMessage] = useState(config.message || "به امید آزادی ایران عزیز و سربلندی ملت");
    const [subMessage, setSubMessage] = useState(config.subMessage || "با آرزوی برکت، صلح و دوستی برای همراهان مسیحی و تمامی ایرانیان");
    const [buttonText, setButtonText] = useState(config.buttonText || "ورود به سایت");

    // Generic JSON state
    const [jsonStr, setJsonStr] = useState(JSON.stringify(config, null, 2));

    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            let newConfig: any = {};
            
            if (widget.id === 'w_global_popup') {
                newConfig = { title, imageUrl, date1, date2, date3, message, subMessage, buttonText };
            } else {
                try {
                    newConfig = JSON.parse(jsonStr);
                } catch (e) {
                    alert("ساختار JSON نامعتبر است! / Invalid JSON format");
                    return;
                }
            }

            const success = await updateWidgetConfig(widget.id, newConfig);
            if (success) {
                if (widget.id === 'w_global_popup') {
                    localStorage.removeItem("hasSeenNowruz2026");
                }
                onClose();
            } else {
                alert("امکان ذخیره تنظیمات وجود ندارد / Failed to save config.");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-background border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] min-h-[400px]" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Type className="w-5 h-5 text-primary" />
                        تنظیمات ابزار: {widget.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors" title="بستن">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {widget.id === 'w_global_popup' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Type className="w-4 h-4" /> تیتر اصلی
                                </label>
                                <input 
                                    title="تیتر اصلی"
                                    placeholder="نوروز خجسته باد"
                                    value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> مسیر عکس پس‌زمینه
                                </label>
                                <input 
                                    title="مسیر عکس"
                                    placeholder="/images/nowruz-bg.png"
                                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left" dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground mt-1">مسیر عکس در سرور (مانند /images/my-image.png) یا لینک کامل اینترنتی</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ خورشیدی</label>
                                    <input title="خورشیدی" placeholder="وارد کنید..." value={date1} onChange={(e) => setDate1(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ شاهنشاهی</label>
                                    <input title="شاهنشاهی" placeholder="وارد کنید..." value={date2} onChange={(e) => setDate2(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">تاریخ میلادی</label>
                                    <input title="میلادی" placeholder="وارد کنید..." value={date3} onChange={(e) => setDate3(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 text-left" dir="ltr" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">پیام اصلی (قرمز رنگ)</label>
                                <input title="پیام اصلی" placeholder="متن پیام..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">پیام فرعی (توضیحات)</label>
                                <textarea 
                                    title="توضیحات"
                                    placeholder="متن توضیحات تکمیلی..."
                                    value={subMessage} onChange={(e) => setSubMessage(e.target.value)} rows={2}
                                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 resize-none" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">متن دکمه ورود</label>
                                <input title="متن دکمه" placeholder="ورود به سایت" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 w-1/2" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500 text-sm leading-relaxed">
                                این ابزار قالب تنظیمی اختصاصی ندارد. سیستم به صورت خودکار حالت ویرایشگر پیشرفته JSON را برای شما باز کرده است. فقط اگر با ساختار آن آشنایی دارید تغییر ایجاد کنید.
                            </div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> تنظیمات خام (Raw JSON Config)
                            </label>
                            <textarea 
                                title="ویرایشگر JSON"
                                placeholder="{}"
                                value={jsonStr} onChange={(e) => setJsonStr(e.target.value)} 
                                className="w-full flex-1 bg-black/60 border border-white/10 rounded-xl font-mono text-sm px-4 py-3 text-left focus:outline-none focus:border-primary text-emerald-400" 
                                dir="ltr"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-secondary/20 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-muted-foreground hover:bg-white/5 font-medium transition-colors" title="انصراف">
                        انصراف
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isPending}
                        title="ذخیره"
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
