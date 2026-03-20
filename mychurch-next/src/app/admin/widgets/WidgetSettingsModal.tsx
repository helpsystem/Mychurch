"use client";

import React, { useState, useRef, useTransition } from "react";
import { updateWidgetConfig, DashboardWidget } from "@/actions/widgets";
import { translateFaToEn } from "@/actions/ai";
import { X, Save, Image as ImageIcon, Type, RefreshCw, Code2, UploadCloud, Sparkles } from "lucide-react";

interface Props {
    widget: DashboardWidget;
    onClose: () => void;
}

export function WidgetSettingsModal({ widget, onClose }: Props) {
    const config = widget.config || {};
    
    // Popup specific state
    const [titleFa, setTitleFa] = useState(config.titleFa || "اطلاعیه مهم");
    const [titleEn, setTitleEn] = useState(config.titleEn || "Important Announcement");
    
    const [imageUrl, setImageUrl] = useState(config.imageUrl || "/images/nowruz-bg.png");
    
    const [badge1Fa, setBadge1Fa] = useState(config.badge1Fa || "");
    const [badge1En, setBadge1En] = useState(config.badge1En || "");
    const [badge2Fa, setBadge2Fa] = useState(config.badge2Fa || "");
    const [badge2En, setBadge2En] = useState(config.badge2En || "");
    
    const [messageFa, setMessageFa] = useState(config.messageFa || "پیام اصلی پاپ آپ را اینجا بنویسید");
    const [messageEn, setMessageEn] = useState(config.messageEn || "Write the main popup message here");
    
    const [subMessageFa, setSubMessageFa] = useState(config.subMessageFa || "توضیحات تکمیلی اطلاعیه در این بخش قرار می‌گیرد.");
    const [subMessageEn, setSubMessageEn] = useState(config.subMessageEn || "Additional details for the announcement go here.");
    
    const [buttonTextFa, setButtonTextFa] = useState(config.buttonTextFa || "ورود به سایت");
    const [buttonTextEn, setButtonTextEn] = useState(config.buttonTextEn || "Enter Site");
    const [buttonLink, setButtonLink] = useState(config.buttonLink || "");

    // Generic JSON state
    const [jsonStr, setJsonStr] = useState(JSON.stringify(config, null, 2));

    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            if (data.success) {
                setImageUrl(data.url);
            } else {
                alert('آپلود تصویر با خطا مواجه شد: ' + data.error);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('متاسفانه ارتباط با سرور قطع شد.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            let newConfig: any = {};
            
            if (widget.id === 'w_global_popup') {
                newConfig = { 
                    titleFa, titleEn, 
                    imageUrl, 
                    badge1Fa, badge1En, badge2Fa, badge2En, 
                    messageFa, messageEn, 
                    subMessageFa, subMessageEn, 
                    buttonTextFa, buttonTextEn, buttonLink
                };
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
                    // Bust caching so testing reveals popup immediately
                    localStorage.removeItem("hasSeenPopupSession");
                }
                onClose();
            } else {
                alert("امکان ذخیره تنظیمات وجود ندارد / Failed to save config.");
            }
        });
    };

    const DualField = ({ 
        label, faValue, enValue, setFaValue, setEnValue, isTextarea = false, placeholderFa = "", placeholderEn = "" 
    }: any) => {
        const [isTranslating, setIsTranslating] = useState(false);
        const handleTranslate = async () => {
            if (!faValue) return;
            setIsTranslating(true);
            const translated = await translateFaToEn(faValue);
            setEnValue(translated);
            setIsTranslating(false);
        };

        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        {label}
                    </label>
                    <button 
                        onClick={handleTranslate}
                        disabled={isTranslating || !faValue}
                        title="ترجمه هوشمند به انگلیسی"
                        className="text-xs flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 font-bold font-vazirmatn"
                    >
                        {isTranslating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isTranslating ? "در حال ترجمه..." : "ترجمه خودکار به انگلیسی"}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground mr-2 px-1 bg-secondary rounded-md">فارسی (FA)</span>
                        {isTextarea ? (
                            <textarea 
                                value={faValue} onChange={(e) => setFaValue(e.target.value)}
                                placeholder={placeholderFa} rows={2}
                                className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:border-primary transition-colors text-right font-vazirmatn resize-none" dir="rtl"
                            />
                        ) : (
                            <input 
                                value={faValue} onChange={(e) => setFaValue(e.target.value)}
                                placeholder={placeholderFa}
                                className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:border-primary transition-colors text-right font-vazirmatn" dir="rtl"
                            />
                        )}
                    </div>
                    
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-2 px-1 bg-secondary rounded-md">English (EN)</span>
                        {isTextarea ? (
                            <textarea 
                                value={enValue} onChange={(e) => setEnValue(e.target.value)}
                                placeholder={placeholderEn} rows={2}
                                className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:border-primary transition-colors text-left resize-none" dir="ltr"
                            />
                        ) : (
                            <input 
                                value={enValue} onChange={(e) => setEnValue(e.target.value)}
                                placeholder={placeholderEn}
                                className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:border-primary transition-colors text-left" dir="ltr"
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-background border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] min-h-[400px]" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Type className="w-5 h-5 text-primary" />
                        تنظیمات ابزار: {widget.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors" title="بستن">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                    {widget.id === 'w_global_popup' ? (
                        <div className="space-y-6">
                            {/* Image Upload Section */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <label className="block text-sm font-bold text-foreground mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-emerald-400" /> تصویر پس‌زمینه پاپ‌آپ
                                    </span>
                                    
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        {isUploading ? "درحال آپلود..." : "آپلود مستقیم تصویر (انتخاب فایل)"}
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
                                </label>
                                
                                <input 
                                    title="مسیر عکس"
                                    placeholder="شماره میتوانید لینک اینترنتی عکس را اینجا پیست کنید و یا از دکمه آپلود استفاده کنید..."
                                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-secondary/80 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left font-mono text-sm" dir="ltr"
                                />
                                {imageUrl && (
                                    <div className="mt-3 relative h-32 w-full rounded-xl overflow-hidden border border-white/10 opacity-70">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            {/* Bilingual Text Fields */}
                            <DualField label="تیتر درشت اصلی" faValue={titleFa} enValue={titleEn} setFaValue={setTitleFa} setEnValue={setTitleEn} placeholderFa="نوروز خجسته باد / جلسه مهم" placeholderEn="Happy Nowruz / Important Meeting" />
                            
                            <DualField label="پیام متنی (اندازه متوسط)" faValue={messageFa} enValue={messageEn} setFaValue={setMessageFa} setEnValue={setMessageEn} placeholderFa="به امید آزادی..." placeholderEn="Wishing you freedom..." />
                            
                            <DualField label="توضیحات تکمیلی" faValue={subMessageFa} enValue={subMessageEn} setFaValue={setSubMessageFa} setEnValue={setSubMessageEn} isTextarea placeholderFa="با آرزوی برکت..." placeholderEn="Wishing blessings..." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DualField label="بج / نوار ۱ (اختیاری)" faValue={badge1Fa} enValue={badge1En} setFaValue={setBadge1Fa} setEnValue={setBadge1En} placeholderFa="مثال: ۱ فروردین" placeholderEn="March 20" />
                                <DualField label="بج / نوار ۲ (اختیاری)" faValue={badge2Fa} enValue={badge2En} setFaValue={setBadge2Fa} setEnValue={setBadge2En} placeholderFa="۲۵۸۵ شاهنشاهی" placeholderEn="Persian Year 2585" />
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <label className="block text-sm font-bold text-foreground">تنظیمات دکمه اکشن</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground mr-2 px-1 bg-secondary rounded-md">آدرس لینک (URL)</span>
                                        <input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="مثال: /contact یا خالی رها کنید تا فقط بسته شود" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-left" dir="ltr" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground mr-2 px-1 bg-secondary rounded-md">متن دکمه (FA)</span>
                                        <input value={buttonTextFa} onChange={(e) => setButtonTextFa(e.target.value)} placeholder="ورود به سایت" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-right" dir="rtl" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground ml-2 px-1 bg-secondary rounded-md">متن دکمه (EN)</span>
                                        <input value={buttonTextEn} onChange={(e) => setButtonTextEn(e.target.value)} placeholder="Enter Site" className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-left" dir="ltr" />
                                    </div>
                                </div>
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

                <div className="p-6 border-t border-white/5 bg-secondary/80 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-muted-foreground hover:bg-white/5 font-medium transition-colors" title="انصراف">
                        انصراف
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isPending}
                        title="ذخیره"
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/30"
                    >
                        {isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        ذخیره تنظیمات پویا
                    </button>
                </div>
            </div>
        </div>
    );
}
