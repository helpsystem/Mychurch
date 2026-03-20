"use client";

import React, { useState, useRef, useTransition } from "react";
import { updateWidgetConfig, DashboardWidget } from "@/actions/widgets";
import { translateFaToEn } from "@/actions/ai";
import { X, Save, Image as ImageIcon, Type, RefreshCw, Code2, UploadCloud, Sparkles, FolderOpen } from "lucide-react";
import { NowruzPopup } from "@/components/widgets/NowruzPopup";

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

    // Advanced Styling States
    const [themeColor, setThemeColor] = useState<any>(config.themeColor || "primary");
    const [overlayOpacity, setOverlayOpacity] = useState<any>(config.overlayOpacity || "medium");
    const [showConfetti, setShowConfetti] = useState<boolean>(config.showConfetti !== undefined ? config.showConfetti : false);
    const [position, setPosition] = useState<any>(config.position || "center");
    const [animationStyle, setAnimationStyle] = useState<any>(config.animationStyle || "spring");
    const [autoCloseTimer, setAutoCloseTimer] = useState<number | ''>(config.autoCloseTimer || '');

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
                    themeColor, overlayOpacity, showConfetti,
                    position, animationStyle, autoCloseTimer,
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

    const applyPreset = (presetName: string) => {
        if (presetName === 'nowruz') {
            setTitleFa("نوروز خجسته باد");
            setTitleEn("Happy Nowruz");
            setImageUrl("/images/nowruz-bg.png");
            setThemeColor("emerald");
            setOverlayOpacity("medium");
            setShowConfetti(true);
            setPosition("center");
            setAnimationStyle("spring");
            setAutoCloseTimer('');
            setBadge1Fa("۱ فروردین");
            setBadge1En("March 20th");
            setBadge2Fa("عید نوروز");
            setBadge2En("Persian New Year");
            setMessageFa("به امید آزادی، شادی و آبادی ایران");
            setMessageEn("Wishing you joy, freedom, and prosperity");
            setSubMessageFa("با آرزوی بهترین‌ها در سال جدید برای شما و عزیزانتان.");
            setSubMessageEn("Wishing you and your loved ones the best in the new year.");
            setButtonTextFa("ورود به سایت");
            setButtonTextEn("Enter Site");
            setButtonLink("");
        } else if (presetName === 'welcome') {
            setTitleFa("به کلیسای ما خوش آمدید");
            setTitleEn("Welcome to Our Church");
            setImageUrl("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop");
            setThemeColor("blue");
            setOverlayOpacity("dark");
            setShowConfetti(false);
            setPosition("center");
            setAnimationStyle("fade");
            setAutoCloseTimer('');
            setBadge1Fa("خوش‌آمدید");
            setBadge1En("Welcome");
            setBadge2Fa("کلیسا");
            setBadge2En("Church");
            setMessageFa("خداوند شما را برکت دهد");
            setMessageEn("May God bless you");
            setSubMessageFa("از اینکه در کنار ما هستید خوشحالیم. برای آشنایی بیشتر، صفحات سایت را مطالعه کنید.");
            setSubMessageEn("We are glad you are here. Please explore the site to learn more.");
            setButtonTextFa("مشاهده برنامه‌ها");
            setButtonTextEn("View Schedule");
            setButtonLink("/about");
        } else if (presetName === 'empty') {
            setTitleFa(""); setTitleEn(""); setImageUrl(""); setBadge1Fa(""); setBadge1En(""); setBadge2Fa(""); setBadge2En(""); setMessageFa(""); setMessageEn(""); setSubMessageFa(""); setSubMessageEn(""); setButtonTextFa(""); setButtonTextEn(""); setButtonLink(""); setShowConfetti(false); setThemeColor("primary"); setOverlayOpacity("medium"); setPosition("center"); setAnimationStyle("spring"); setAutoCloseTimer('');
        }
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
            
            <div className={`relative bg-background border border-white/10 rounded-3xl w-full shadow-2xl flex flex-col max-h-[95vh] min-h-[400px] ${widget.id === 'w_global_popup' ? 'max-w-[95vw] xl:max-w-7xl' : 'max-w-4xl'}`} dir="rtl">
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                            {/* LEFT SIDE: LIVE PREVIEW */}
                            <div className="bg-black/20 border border-white/5 rounded-[2.5rem] p-4 flex flex-col min-h-[600px] overflow-hidden sticky top-0 shadow-inner">
                                <h3 className="font-bold flex items-center justify-between text-lg mb-4 text-emerald-400 px-2">
                                    <span className="flex items-center gap-2"><Sparkles className="w-5 h-5"/> پیش‌نمایش زنده (Live Preview)</span>
                                </h3>
                                <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 flex items-center justify-center bg-gradient-to-br from-blue-900/10 to-purple-900/10">
                                    <NowruzPopup isPreview config={{
                                        titleFa, titleEn, imageUrl, badge1Fa, badge1En, badge2Fa, badge2En,
                                        messageFa, messageEn, subMessageFa, subMessageEn, buttonTextFa, buttonTextEn, buttonLink,
                                        themeColor, overlayOpacity, showConfetti, position, animationStyle, autoCloseTimer: Number(autoCloseTimer) || 0
                                    }} />
                                    {/* Abstract decor for preview bounds */}
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
                                </div>
                            </div>

                            {/* RIGHT SIDE: CONFIG FORM */}
                            <div className="space-y-6 pr-2">
                                {/* Presets Bar */}
                                <div className="bg-secondary border border-border/50 rounded-2xl p-4 mb-4">
                                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4 text-primary" /> قالب‌های آماده (Presets)
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button onClick={() => applyPreset('nowruz')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">🌱 قالب نوروز</button>
                                        <button onClick={() => applyPreset('welcome')} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">👋 قالب خوش‌آمدگویی</button>
                                        <button onClick={() => applyPreset('empty')} className="bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/5 px-4 py-2 rounded-xl text-sm font-bold transition-all mr-auto">خالی‌کردن همه</button>
                                    </div>
                                </div>

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
                            
                            {/* Advanced Style Options */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" /> استایل‌های حرفه‌ای پیشرفته
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="themeColorSelect">رنگ تم (Theme Color)</label>
                                        <select id="themeColorSelect" title="Theme Color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select">
                                            <option value="primary">اصلی (Primary)</option>
                                            <option value="emerald">سبز (Emerald)</option>
                                            <option value="blue">آبی (Blue)</option>
                                            <option value="rose">قرمز (Rose)</option>
                                            <option value="amber">طلایی (Amber)</option>
                                            <option value="purple">بنفش (Purple)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="overlayOpacitySelect">تیرگی پس‌زمینه (Overlay)</label>
                                        <select id="overlayOpacitySelect" title="Overlay Opacity" value={overlayOpacity} onChange={(e) => setOverlayOpacity(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select">
                                            <option value="light">روشن (Light Blur)</option>
                                            <option value="medium">متوسط (Medium)</option>
                                            <option value="dark">تیره (Dark Glass)</option>
                                            <option value="heavy">بسیار تیره (Heavy)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="positionSelect">موقعیت نمایش (Position)</label>
                                        <select id="positionSelect" title="Position" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select">
                                            <option value="center">مرکز صفحه (Center Modal)</option>
                                            <option value="top">بالای صفحه (Top Banner)</option>
                                            <option value="bottom">پایین صفحه (Bottom Banner)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="animationSelect">انیمیشن ورود (Animation)</label>
                                        <select id="animationSelect" title="Animation Style" value={animationStyle} onChange={(e) => setAnimationStyle(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select">
                                            <option value="spring">جهش دار (Spring Bouncy)</option>
                                            <option value="fade">محو شدن ملایم (Fade In/Out)</option>
                                            <option value="slideUp">لغزش از پایین (Slide Up)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center">زمان بسته شدن خودکار (ثانیه - Auto Close)</label>
                                        <input 
                                            type="number" 
                                            value={autoCloseTimer} 
                                            onChange={(e) => setAutoCloseTimer(e.target.value ? Number(e.target.value) : '')} 
                                            placeholder="برای عدم بسته شدن خودکار، خالی بگذارید یا صفر وارد کنید" 
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center focus:outline-none focus:border-primary transition-colors text-emerald-400 font-mono" dir="ltr" 
                                        />
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <label className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition">
                                            <input type="checkbox" checked={showConfetti} onChange={(e) => setShowConfetti(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
                                            <span className="font-bold">نمایش انیمیشن پارتیکل‌ها (Particle Effects)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

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
                            {/* End of Form Col */}
                            </div> 
                        {/* End of Grid */}
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
