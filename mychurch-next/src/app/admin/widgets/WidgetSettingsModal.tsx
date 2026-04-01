"use client";

import React, { useState, useRef, useTransition } from "react";
import { updateWidgetConfig, DashboardWidget } from "@/actions/widgets";
import { translateFaToEn, translateEnToFa } from "@/actions/ai";
import { X, Save, Image as ImageIcon, Type, RefreshCw, Code2, UploadCloud, Sparkles, FolderOpen, Film } from "lucide-react";
import { NowruzPopup } from "@/components/widgets/NowruzPopup";

interface Props {
    widget: DashboardWidget;
    onClose: () => void;
}

const COMMON_PATH_OPTIONS = [
    "/",
    "/about",
    "/contact",
    "/worship",
    "/calendar",
    "/sermons",
    "/documents",
    "/gallery",
    "/bible",
    "/broadcast",
    "/profile",
    "/admin",
    "/login",
    "/signup",
];

export function WidgetSettingsModal({ widget, onClose }: Props) {
    const config = widget.config || {};
    
    // Popup specific state
    const [titleFa, setTitleFa] = useState(config.titleFa || "اطلاعیه مهم");
    const [titleEn, setTitleEn] = useState(config.titleEn || "Important Announcement");
    const [heroIcon, setHeroIcon] = useState(config.heroIcon || "🌱");
    const [heroIconUrl, setHeroIconUrl] = useState(config.heroIconUrl || "");
    
    const [imageUrl, setImageUrl] = useState(config.imageUrl || "/images/nowruz-bg.png");
    const [mediaType, setMediaType] = useState<any>(config.mediaType || "image");
    const [videoUrl, setVideoUrl] = useState(config.videoUrl || "");
    const [videoPosterUrl, setVideoPosterUrl] = useState(config.videoPosterUrl || "");
    const [videoAutoplay, setVideoAutoplay] = useState<boolean>(config.videoAutoplay !== false);
    const [videoMuted, setVideoMuted] = useState<boolean>(config.videoMuted !== false);
    const [videoLoop, setVideoLoop] = useState<boolean>(config.videoLoop !== false);
    const [videoControls, setVideoControls] = useState<boolean>(config.videoControls === true);
    const [videoPreload, setVideoPreload] = useState<any>(config.videoPreload || "metadata");
    const [imageFit, setImageFit] = useState<any>(config.imageFit || "cover");
    const [imageHeight, setImageHeight] = useState<any>(config.imageHeight || "md");
    const [imageBgColor, setImageBgColor] = useState<string>(config.imageBgColor || "#000000");
    const [particleDensity, setParticleDensity] = useState<any>(config.particleDensity || "medium");
    const [particleAssetUrl, setParticleAssetUrl] = useState(config.particleAssetUrl || "");
    
    const [badge1Icon, setBadge1Icon] = useState(config.badge1Icon || "🌿");
    const [badge1Fa, setBadge1Fa] = useState(config.badge1Fa || "");
    const [badge1En, setBadge1En] = useState(config.badge1En || "");
    const [badge2Icon, setBadge2Icon] = useState(config.badge2Icon || "✨");
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
    const [particleEffect, setParticleEffect] = useState<any>(config.particleEffect || (config.showConfetti ? 'confetti' : 'none'));
    const [position, setPosition] = useState<any>(config.position || "center");
    const [animationStyle, setAnimationStyle] = useState<any>(config.animationStyle || "spring");
    const [autoCloseTimer, setAutoCloseTimer] = useState<number | ''>(config.autoCloseTimer || '');
    const [displayDelaySeconds, setDisplayDelaySeconds] = useState<number | ''>(config.displayDelaySeconds || '');
    const [startAt, setStartAt] = useState(config.startAt || "");
    const [endAt, setEndAt] = useState(config.endAt || "");
    const [enabledPaths, setEnabledPaths] = useState(config.enabledPaths || "");
    const [excludedPaths, setExcludedPaths] = useState(config.excludedPaths || "");
    const [displayFrequency, setDisplayFrequency] = useState<any>(config.displayFrequency || "session");
    const [storageKey, setStorageKey] = useState(config.storageKey || "");
    const [showCloseButton, setShowCloseButton] = useState<boolean>(config.showCloseButton !== false);
    const [customPresets, setCustomPresets] = useState<any[]>(config.customPresets || []);
    const [newPresetName, setNewPresetName] = useState("");

    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const heroIconFileInputRef = useRef<HTMLInputElement>(null);
    const particleAssetFileInputRef = useRef<HTMLInputElement>(null);

    const parsePathList = (raw: string) =>
        raw
            .split(/[\n,]/g)
            .map((p) => p.trim())
            .filter(Boolean);

    const formatPathList = (list: string[]) =>
        Array.from(new Set(list.map((p) => p.trim()).filter(Boolean))).join(",");

    const togglePathValue = (
        path: string,
        source: string,
        setter: (value: string) => void
    ) => {
        const set = new Set(parsePathList(source));
        if (set.has(path)) {
            set.delete(path);
        } else {
            set.add(path);
        }
        setter(formatPathList(Array.from(set)));
    };

    const removePathValue = (
        path: string,
        source: string,
        setter: (value: string) => void
    ) => {
        setter(formatPathList(parsePathList(source).filter((p) => p !== path)));
    };

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
                if (data.mediaType === 'video') {
                    setMediaType('video');
                    setVideoUrl(data.url);
                    if (!videoPosterUrl) setVideoPosterUrl('');
                } else {
                    setMediaType('image');
                    setImageUrl(data.url);
                }
            } else {
                alert('آپلود مدیا با خطا مواجه شد: ' + data.error);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('متاسفانه ارتباط با سرور قطع شد.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleHeroIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'popup-icons');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setHeroIconUrl(data.url);
            } else {
                alert('آپلود آیکن با خطا مواجه شد: ' + data.error);
            }
        } catch (error) {
            console.error('Icon Upload Error:', error);
            alert('متاسفانه ارتباط با سرور قطع شد.');
        } finally {
            setIsUploading(false);
            if (heroIconFileInputRef.current) heroIconFileInputRef.current.value = "";
        }
    };

    const handleParticleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'popup-particles');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setParticleAssetUrl(data.url);
                setParticleEffect('customAsset');
            } else {
                alert('آپلود فایل ذره با خطا مواجه شد: ' + data.error);
            }
        } catch (error) {
            console.error('Particle Upload Error:', error);
            alert('متاسفانه ارتباط با سرور قطع شد.');
        } finally {
            setIsUploading(false);
            if (particleAssetFileInputRef.current) particleAssetFileInputRef.current.value = "";
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            let newConfig: any = {};
            
            if (widget.id === 'w_global_popup') {
                newConfig = { 
                    titleFa, titleEn, heroIcon, heroIconUrl,
                    imageUrl, imageFit, imageHeight, imageBgColor,
                    mediaType, videoUrl, videoPosterUrl, videoAutoplay, videoMuted, videoLoop, videoControls, videoPreload,
                    themeColor, overlayOpacity, particleEffect, particleDensity, particleAssetUrl,
                    position, animationStyle, autoCloseTimer,
                    displayDelaySeconds,
                    startAt, endAt,
                    enabledPaths, excludedPaths,
                    displayFrequency, storageKey, showCloseButton,
                    badge1Icon, badge1Fa, badge1En, badge2Icon, badge2Fa, badge2En, 
                    messageFa, messageEn, 
                    subMessageFa, subMessageEn, 
                    buttonTextFa, buttonTextEn, buttonLink,
                    customPresets
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
                    // Bust seen caches so latest popup config is testable immediately.
                    localStorage.removeItem("hasSeenPopupSession");
                    sessionStorage.removeItem("hasSeenPopupSession");

                    const clearSeenKeys = (storage: Storage) => {
                        const keysToRemove: string[] = [];
                        for (let i = 0; i < storage.length; i += 1) {
                            const key = storage.key(i);
                            if (key && (key.startsWith("popup_seen_") || key.startsWith("popup_seen_auto_"))) {
                                keysToRemove.push(key);
                            }
                        }
                        keysToRemove.forEach((key) => storage.removeItem(key));
                    };

                    clearSeenKeys(localStorage);
                    clearSeenKeys(sessionStorage);
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
            setHeroIcon("🌱");
            setHeroIconUrl("");
            setMediaType("image");
            setImageUrl("/images/nowruz-bg.png");
            setVideoUrl("");
            setVideoPosterUrl("");
            setThemeColor("emerald");
            setOverlayOpacity("medium");
            setParticleEffect("blossoms");
            setParticleAssetUrl("");
            setPosition("center");
            setAnimationStyle("spring");
            setAutoCloseTimer('');
            setDisplayDelaySeconds('');
            setStartAt("");
            setEndAt("");
            setEnabledPaths("");
            setExcludedPaths("");
            setDisplayFrequency("session");
            setStorageKey("");
            setShowCloseButton(true);
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
            setHeroIcon("✨");
            setHeroIconUrl("");
            setMediaType("image");
            setImageUrl("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop");
            setVideoUrl("");
            setVideoPosterUrl("");
            setThemeColor("blue");
            setOverlayOpacity("dark");
            setParticleEffect("sparkles");
            setParticleAssetUrl("");
            setPosition("center");
            setAnimationStyle("fade");
            setAutoCloseTimer('');
            setDisplayDelaySeconds('');
            setStartAt("");
            setEndAt("");
            setEnabledPaths("");
            setExcludedPaths("");
            setDisplayFrequency("session");
            setStorageKey("");
            setShowCloseButton(true);
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
            setTitleFa(""); setTitleEn(""); setHeroIcon(""); setHeroIconUrl(""); setMediaType("image"); setImageUrl(""); setVideoUrl(""); setVideoPosterUrl(""); setBadge1Fa(""); setBadge1En(""); setBadge2Fa(""); setBadge2En(""); setMessageFa(""); setMessageEn(""); setSubMessageFa(""); setSubMessageEn(""); setButtonTextFa(""); setButtonTextEn(""); setButtonLink(""); setParticleEffect("none"); setParticleAssetUrl(""); setThemeColor("primary"); setOverlayOpacity("medium"); setPosition("center"); setAnimationStyle("spring"); setAutoCloseTimer(''); setDisplayDelaySeconds(''); setStartAt(""); setEndAt(""); setEnabledPaths(""); setExcludedPaths(""); setDisplayFrequency("session"); setStorageKey(""); setShowCloseButton(true);
        }
    };

    const handleSaveCustomPreset = () => {
        if (!newPresetName.trim()) return alert("لطفا نامی برای قالب وارد کنید");
        const newPreset = {
            name: newPresetName.trim(),
            settings: {
                titleFa, titleEn, heroIcon, heroIconUrl, imageUrl, imageFit, imageHeight, imageBgColor, mediaType, videoUrl, videoPosterUrl, videoAutoplay, videoMuted, videoLoop, videoControls, videoPreload, themeColor, overlayOpacity, particleEffect, particleDensity, particleAssetUrl,
                position, animationStyle, autoCloseTimer, displayDelaySeconds, startAt, endAt, enabledPaths, excludedPaths, displayFrequency, storageKey, showCloseButton,
                badge1Icon, badge1Fa, badge1En, badge2Icon, badge2Fa, badge2En,
                messageFa, messageEn, subMessageFa, subMessageEn, buttonTextFa, buttonTextEn, buttonLink
            }
        };
        setCustomPresets([...customPresets, newPreset]);
        setNewPresetName("");
        alert("قالب با موفقیت موقتاً در لیست اضافه شد. برای ذخیره نهایی تنظیمات ابزار را ذخیره کنید.");
    };

    const loadCustomPreset = (preset: any) => {
        const s = preset.settings;
        setTitleFa(s.titleFa || ""); setTitleEn(s.titleEn || ""); setHeroIcon(s.heroIcon || ""); setHeroIconUrl(s.heroIconUrl || ""); setImageUrl(s.imageUrl || "");
        setMediaType(s.mediaType || "image");
        setVideoUrl(s.videoUrl || "");
        setVideoPosterUrl(s.videoPosterUrl || "");
        setVideoAutoplay(s.videoAutoplay !== false);
        setVideoMuted(s.videoMuted !== false);
        setVideoLoop(s.videoLoop !== false);
        setVideoControls(s.videoControls === true);
        setVideoPreload(s.videoPreload || "metadata");
        setImageFit(s.imageFit || "cover"); setImageHeight(s.imageHeight || "md");
        setImageBgColor(s.imageBgColor || "#000000");
        setThemeColor(s.themeColor || "primary"); setOverlayOpacity(s.overlayOpacity || "medium");
        setParticleEffect(s.particleEffect || "none"); setParticleDensity(s.particleDensity || "medium");
        setParticleAssetUrl(s.particleAssetUrl || "");
        setPosition(s.position || "center");
        setAnimationStyle(s.animationStyle || "spring"); setAutoCloseTimer(s.autoCloseTimer || '');
        setDisplayDelaySeconds(s.displayDelaySeconds || '');
        setStartAt(s.startAt || "");
        setEndAt(s.endAt || "");
        setEnabledPaths(s.enabledPaths || "");
        setExcludedPaths(s.excludedPaths || "");
        setDisplayFrequency(s.displayFrequency || "session");
        setStorageKey(s.storageKey || "");
        setShowCloseButton(s.showCloseButton !== false);
        setBadge1Fa(s.badge1Fa || ""); setBadge1En(s.badge1En || ""); setBadge2Fa(s.badge2Fa || ""); setBadge2En(s.badge2En || "");
        setMessageFa(s.messageFa || ""); setMessageEn(s.messageEn || ""); setSubMessageFa(s.subMessageFa || ""); setSubMessageEn(s.subMessageEn || "");
        setButtonTextFa(s.buttonTextFa || ""); setButtonTextEn(s.buttonTextEn || ""); setButtonLink(s.buttonLink || "");
    };

    const deleteCustomPreset = (idx: number) => {
        if (!confirm("آیا از حذف این قالب اطمینان دارید؟")) return;
        const updated = [...customPresets];
        updated.splice(idx, 1);
        setCustomPresets(updated);
    };

    const DualField = ({ 
        label, faValue, enValue, setFaValue, setEnValue, isTextarea = false, placeholderFa = "", placeholderEn = "" 
    }: any) => {
        const [isTranslatingFaToEn, setIsTranslatingFaToEn] = useState(false);
        const [isTranslatingEnToFa, setIsTranslatingEnToFa] = useState(false);

        const handleTranslateFaToEn = async () => {
            if (!faValue) return;
            setIsTranslatingFaToEn(true);
            const translated = await translateFaToEn(faValue);
            setEnValue(translated);
            setIsTranslatingFaToEn(false);
        };

        const handleTranslateEnToFa = async () => {
            if (!enValue) return;
            setIsTranslatingEnToFa(true);
            const translated = await translateEnToFa(enValue);
            setFaValue(translated);
            setIsTranslatingEnToFa(false);
        };

        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        {label}
                    </label>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleTranslateFaToEn}
                            disabled={isTranslatingFaToEn || !faValue}
                            title="ترجمه هوشمند فارسی به انگلیسی"
                            className="text-xs flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 font-bold font-vazirmatn"
                        >
                            {isTranslatingFaToEn ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {isTranslatingFaToEn ? "در حال ترجمه..." : "FA → EN"}
                        </button>
                        <button
                            onClick={handleTranslateEnToFa}
                            disabled={isTranslatingEnToFa || !enValue}
                            title="ترجمه هوشمند انگلیسی به فارسی"
                            className="text-xs flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 font-bold font-vazirmatn"
                        >
                            {isTranslatingEnToFa ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            {isTranslatingEnToFa ? "در حال ترجمه..." : "EN → FA"}
                        </button>
                    </div>
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
                                        titleFa, titleEn, heroIcon, heroIconUrl, imageUrl, imageFit, imageHeight, imageBgColor,
                                        mediaType, videoUrl, videoPosterUrl, videoAutoplay, videoMuted, videoLoop, videoControls, videoPreload,
                                        badge1Icon, badge1Fa, badge1En, badge2Icon, badge2Fa, badge2En,
                                        messageFa, messageEn, subMessageFa, subMessageEn, buttonTextFa, buttonTextEn, buttonLink,
                                        themeColor, overlayOpacity, particleEffect, particleDensity, particleAssetUrl, position, animationStyle, autoCloseTimer: Number(autoCloseTimer) || 0
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
                                        <button onClick={() => applyPreset('nowruz')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0">🌱 قالب نوروز</button>
                                        <button onClick={() => applyPreset('welcome')} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0">👋 قالب خوش‌آمدگویی</button>
                                        
                                        {/* Dynamic Presets */}
                                        {customPresets.map((preset, idx) => (
                                            <div key={idx} className="flex items-center group shrink-0">
                                                <button onClick={() => loadCustomPreset(preset)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 border-l-0 px-3 py-2 rounded-r-xl text-sm font-bold transition-all truncate max-w-[150px]">
                                                    🔮 {preset.name}
                                                </button>
                                                <button onClick={() => deleteCustomPreset(idx)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2 py-2 rounded-l-xl text-xs transition-all" title="حذف">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <button onClick={() => applyPreset('empty')} className="bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/5 px-4 py-2 rounded-xl text-sm font-bold transition-all mr-auto shrink-0">خالی‌کردن همه</button>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 w-full">
                                        <input 
                                            value={newPresetName} 
                                            onChange={(e) => setNewPresetName(e.target.value)} 
                                            placeholder="نام قالب سفارشی جدید..." 
                                            className="flex-1 bg-background/50 border border-white/5 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary"
                                        />
                                        <button onClick={handleSaveCustomPreset} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 px-4 py-1.5 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap">
                                            + ذخیره طرح در قالب‌ها
                                        </button>
                                    </div>
                                </div>

                                {/* Image Upload Section */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <label className="block text-sm font-bold text-foreground mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        {mediaType === 'video' ? <Film className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />} مدیا پس‌زمینه پاپ‌آپ
                                    </span>
                                    
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        {isUploading ? "درحال آپلود..." : "آپلود مستقیم عکس/ویدیو"}
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" />
                                </label>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setMediaType('image')}
                                        className={`px-3 py-2 rounded-xl text-sm font-bold border transition ${mediaType === 'image' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary border-white/10 text-muted-foreground'}`}
                                    >
                                        تصویر
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMediaType('video')}
                                        className={`px-3 py-2 rounded-xl text-sm font-bold border transition ${mediaType === 'video' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary border-white/10 text-muted-foreground'}`}
                                    >
                                        ویدیو
                                    </button>
                                </div>
                                
                                {mediaType === 'image' ? (
                                <input 
                                    title="مسیر عکس"
                                    placeholder="می‌توانید لینک اینترنتی عکس را اینجا پیست کنید یا از دکمه آپلود استفاده کنید"
                                    value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-secondary/80 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left font-mono text-sm" dir="ltr"
                                />
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            title="مسیر ویدیو"
                                            placeholder="URL ویدیو (mp4/webm/mov)"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className="w-full bg-secondary/80 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left font-mono text-sm"
                                            dir="ltr"
                                        />
                                        <input
                                            title="پوستر ویدیو"
                                            placeholder="URL تصویر پوستر ویدیو (اختیاری)"
                                            value={videoPosterUrl}
                                            onChange={(e) => setVideoPosterUrl(e.target.value)}
                                            className="w-full bg-secondary/80 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left font-mono text-sm"
                                            dir="ltr"
                                        />
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                            <label className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2"><input type="checkbox" checked={videoAutoplay} onChange={(e) => setVideoAutoplay(e.target.checked)} className="accent-primary" /> Autoplay</label>
                                            <label className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2"><input type="checkbox" checked={videoMuted} onChange={(e) => setVideoMuted(e.target.checked)} className="accent-primary" /> Muted</label>
                                            <label className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2"><input type="checkbox" checked={videoLoop} onChange={(e) => setVideoLoop(e.target.checked)} className="accent-primary" /> Loop</label>
                                            <label className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2"><input type="checkbox" checked={videoControls} onChange={(e) => setVideoControls(e.target.checked)} className="accent-primary" /> Controls</label>
                                            <select value={videoPreload} onChange={(e) => setVideoPreload(e.target.value)} className="bg-secondary border border-white/10 rounded-xl px-3 py-2 col-span-1 md:col-span-2">
                                                <option value="none">Preload: none</option>
                                                <option value="metadata">Preload: metadata</option>
                                                <option value="auto">Preload: auto</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {mediaType === 'image' && imageUrl && (
                                    <div className="mt-3 relative w-full rounded-xl overflow-hidden border border-white/10 opacity-70 flex items-center justify-center" style={{ backgroundColor: imageBgColor, height: imageHeight === 'sm' ? '160px' : imageHeight === 'md' ? '256px' : imageHeight === 'lg' ? '320px' : '384px' }}>
                                        <img src={imageUrl} alt="Preview" className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : imageFit === 'fill' ? 'object-fill' : 'object-cover'} object-center`} />
                                    </div>
                                )}

                                {mediaType === 'video' && videoUrl && (
                                    <div className="mt-3 relative w-full rounded-xl overflow-hidden border border-white/10 flex items-center justify-center" style={{ backgroundColor: imageBgColor, height: imageHeight === 'sm' ? '160px' : imageHeight === 'md' ? '256px' : imageHeight === 'lg' ? '320px' : '384px' }}>
                                        <video
                                            src={videoUrl}
                                            poster={videoPosterUrl || undefined}
                                            className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : imageFit === 'fill' ? 'object-fill' : 'object-cover'} object-center`}
                                            preload="metadata"
                                            muted
                                            playsInline
                                        />
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="block text-xs font-bold text-foreground mb-2 text-center text-blue-400">نحوه نمایش عکس (Image Fit)</label>
                                        <select title="Image Fit" value={imageFit} onChange={(e) => setImageFit(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-lg px-2 py-1.5 text-xs text-center focus:border-primary outline-none">
                                            <option value="cover">پوشش کامل (برش‌خورده / Cover)</option>
                                            <option value="contain">نمایش کامل (بدون برش / Contain)</option>
                                            <option value="fill">کشش عکس (Fill)</option>
                                        </select>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="block text-xs font-bold text-foreground mb-2 text-center text-emerald-400">ارتفاع بخش عکس (Height)</label>
                                        <select title="Image Height" value={imageHeight} onChange={(e) => setImageHeight(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-lg px-2 py-1.5 text-xs text-center focus:border-primary outline-none">
                                            <option value="sm">کوچک</option>
                                            <option value="md">متوسط (پیش‌فرض)</option>
                                            <option value="lg">بزرگ</option>
                                            <option value="xl">بسیار بزرگ</option>
                                        </select>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="block text-xs font-bold text-foreground mb-2 text-center text-purple-400">رنگ پس‌زمینه (Background)</label>
                                        <div className="flex items-center gap-1 bg-secondary border border-white/5 rounded-lg h-[30px] pr-1 overflow-hidden" dir="ltr">
                                            <input type="color" value={imageBgColor} onChange={(e) => setImageBgColor(e.target.value)} className="w-8 h-8 cursor-pointer rounded border-[3px] border-secondary outline-none p-0 shrink-0" />
                                            <input type="text" value={imageBgColor} onChange={(e) => setImageBgColor(e.target.value)} className="w-full bg-transparent text-xs text-center focus:outline-none uppercase font-mono tracking-wider" />
                                        </div>
                                    </div>
                                </div>
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
                                    <div className="col-span-2">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center">تاخیر نمایش اولیه (ثانیه - Initial Delay)</label>
                                        <input
                                            type="number"
                                            value={displayDelaySeconds}
                                            onChange={(e) => setDisplayDelaySeconds(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="مثال: 1.5"
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center focus:outline-none focus:border-primary transition-colors text-emerald-400 font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="particleSelect">افکت ذرات معلق (Particles)</label>
                                        <select id="particleSelect" title="Particle Effect" value={particleEffect} onChange={(e) => setParticleEffect(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select font-bold">
                                            <option value="none" className="font-normal text-muted-foreground">بدون افکت (None)</option>
                                            <option value="blossoms" className="text-pink-400">🌸 شکوفه‌های بهاری (Spring Blossoms)</option>
                                            <option value="sparkles" className="text-amber-400">✨ ستاره‌های درخشان (Sparkles)</option>
                                            <option value="confetti" className="text-emerald-400">🎉 کاغذ رنگی (Confetti)</option>
                                            <option value="snow" className="text-blue-300">❄️ بارش برف (Snow)</option>
                                            <option value="customAsset" className="text-violet-300">🖼️ فایل سفارشی (Custom Asset)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center" htmlFor="particleDensitySelect">تراکم ذرات (Density)</label>
                                        <select id="particleDensitySelect" title="Particle Density" value={particleDensity} onChange={(e) => setParticleDensity(e.target.value)} className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center custom-select font-bold">
                                            <option value="light" className="text-muted-foreground">کم (Light)</option>
                                            <option value="medium" className="text-foreground">متوسط (Medium)</option>
                                            <option value="heavy" className="text-emerald-400">زیاد (Heavy)</option>
                                            <option value="insane" className="text-rose-400">جنون‌آمیز (Insane!)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-foreground mb-2 bg-black/20 p-2 rounded-lg text-center">فایل ذرات سفارشی (PNG/WebP/SVG)</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={particleAssetUrl}
                                                onChange={(e) => setParticleAssetUrl(e.target.value)}
                                                placeholder="URL فایل ذره یا از دکمه آپلود استفاده کنید"
                                                className="flex-1 bg-secondary border border-white/5 rounded-xl px-4 py-2 text-left font-mono text-xs"
                                                dir="ltr"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => particleAssetFileInputRef.current?.click()}
                                                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
                                            >
                                                آپلود
                                            </button>
                                            <input type="file" ref={particleAssetFileInputRef} onChange={handleParticleAssetUpload} accept="image/*" className="hidden" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <h4 className="text-sm font-bold text-foreground">هدف‌گذاری نمایش و زمان‌بندی</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">شروع نمایش (Start At - اختیاری)</span>
                                        <input
                                            type="datetime-local"
                                            value={startAt}
                                            onChange={(e) => setStartAt(e.target.value)}
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">پایان نمایش (End At - اختیاری)</span>
                                        <input
                                            type="datetime-local"
                                            value={endAt}
                                            onChange={(e) => setEndAt(e.target.value)}
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <span className="text-xs text-muted-foreground">نمایش فقط در مسیرها (Enabled Paths)</span>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {COMMON_PATH_OPTIONS.map((path) => {
                                                const active = parsePathList(enabledPaths).includes(path);
                                                return (
                                                    <button
                                                        key={`enabled-${path}`}
                                                        type="button"
                                                        onClick={() => togglePathValue(path, enabledPaths, setEnabledPaths)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-secondary border-white/10 text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        {path}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <input
                                            value={enabledPaths}
                                            onChange={(e) => setEnabledPaths(e.target.value)}
                                            placeholder="مثال: /,/worship,/calendar"
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-left"
                                            dir="ltr"
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {parsePathList(enabledPaths).map((path) => (
                                                <button
                                                    key={`enabled-chip-${path}`}
                                                    type="button"
                                                    onClick={() => removePathValue(path, enabledPaths, setEnabledPaths)}
                                                    className="px-2 py-1 rounded-md text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                                                    title="حذف از لیست"
                                                >
                                                    {path} ×
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <span className="text-xs text-muted-foreground">عدم نمایش در مسیرها (Excluded Paths)</span>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {COMMON_PATH_OPTIONS.map((path) => {
                                                const active = parsePathList(excludedPaths).includes(path);
                                                return (
                                                    <button
                                                        key={`excluded-${path}`}
                                                        type="button"
                                                        onClick={() => togglePathValue(path, excludedPaths, setExcludedPaths)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${active ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-secondary border-white/10 text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        {path}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <input
                                            value={excludedPaths}
                                            onChange={(e) => setExcludedPaths(e.target.value)}
                                            placeholder="مثال: /admin,/login,/signup"
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-left"
                                            dir="ltr"
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {parsePathList(excludedPaths).map((path) => (
                                                <button
                                                    key={`excluded-chip-${path}`}
                                                    type="button"
                                                    onClick={() => removePathValue(path, excludedPaths, setExcludedPaths)}
                                                    className="px-2 py-1 rounded-md text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300"
                                                    title="حذف از لیست"
                                                >
                                                    {path} ×
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">فرکانس نمایش</span>
                                        <select
                                            value={displayFrequency}
                                            onChange={(e) => setDisplayFrequency(e.target.value)}
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2"
                                        >
                                            <option value="always">هر بار بازدید (Always)</option>
                                            <option value="session">یکبار در هر سشن (Session)</option>
                                            <option value="24h">یکبار در 24 ساعت</option>
                                            <option value="7d">یکبار در 7 روز</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">کلید ذخیره‌سازی سفارشی (اختیاری)</span>
                                        <input
                                            value={storageKey}
                                            onChange={(e) => setStorageKey(e.target.value)}
                                            placeholder="مثال: easter_2026_campaign"
                                            className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showCloseButton}
                                        onChange={(e) => setShowCloseButton(e.target.checked)}
                                        className="accent-primary"
                                    />
                                    نمایش دکمه بستن (X)
                                </label>
                            </div>

                            <DualField label="تیتر درشت اصلی" faValue={titleFa} enValue={titleEn} setFaValue={setTitleFa} setEnValue={setTitleEn} placeholderFa="نوروز خجسته باد / جلسه مهم" placeholderEn="Happy Nowruz / Important Meeting" />

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                <label className="block text-sm font-bold text-foreground">آیکن اصلی (مانند 🌱)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        value={heroIcon}
                                        onChange={(e) => setHeroIcon(e.target.value)}
                                        placeholder="🌱 یا ✨"
                                        className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-2 text-center"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            value={heroIconUrl}
                                            onChange={(e) => setHeroIconUrl(e.target.value)}
                                            placeholder="URL آیکن تصویری (اختیاری)"
                                            className="flex-1 bg-secondary border border-white/5 rounded-xl px-4 py-2 text-left font-mono text-xs"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => heroIconFileInputRef.current?.click()}
                                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                        >
                                            آپلود
                                        </button>
                                        <input type="file" ref={heroIconFileInputRef} onChange={handleHeroIconUpload} accept="image/*" className="hidden" />
                                    </div>
                                </div>
                            </div>
                            
                            <DualField label="پیام متنی (اندازه متوسط)" faValue={messageFa} enValue={messageEn} setFaValue={setMessageFa} setEnValue={setMessageEn} placeholderFa="به امید آزادی..." placeholderEn="Wishing you freedom..." />
                            
                            <DualField label="توضیحات تکمیلی" faValue={subMessageFa} enValue={subMessageEn} setFaValue={setSubMessageFa} setEnValue={setSubMessageEn} isTextarea placeholderFa="با آرزوی برکت..." placeholderEn="Wishing blessings..." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="space-y-3">
                                    <DualField label="بج ۱ (نوار هشدار اول)" faValue={badge1Fa} enValue={badge1En} setFaValue={setBadge1Fa} setEnValue={setBadge1En} placeholderFa="مثال: ۱ فروردین" placeholderEn="March 20" />
                                    <div className="flex gap-2 items-center px-1">
                                       <span className="text-xs text-muted-foreground mr-2 px-2 py-1 bg-black/40 border border-white/10 rounded-md">آیکن بج ۱:</span>
                                       <input value={badge1Icon} onChange={(e) => setBadge1Icon(e.target.value)} placeholder="🌿" className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-center font-bold focus:outline-none focus:border-primary" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <DualField label="بج ۲ (نوار هشدار دوم)" faValue={badge2Fa} enValue={badge2En} setFaValue={setBadge2Fa} setEnValue={setBadge2En} placeholderFa="۲۵۸۵ شاهنشاهی" placeholderEn="Persian Year 2585" />
                                    <div className="flex gap-2 items-center px-1">
                                       <span className="text-xs text-muted-foreground mr-2 px-2 py-1 bg-black/40 border border-white/10 rounded-md">آیکن بج ۲:</span>
                                       <input value={badge2Icon} onChange={(e) => setBadge2Icon(e.target.value)} placeholder="✨" className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-center font-bold focus:outline-none focus:border-primary" />
                                    </div>
                                </div>
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
