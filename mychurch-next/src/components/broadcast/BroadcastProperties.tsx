"use client";

import React from "react";
import { Settings, Camera, Mic, LayoutGrid, Tv, Layers, MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { cn } from "@/lib/utils";

export function BroadcastProperties() {
    const { t } = useLanguage();
    const config = useBroadcastStore(state => state.config);
    const updateConfig = useBroadcastStore(state => state.updateConfig);
    const isCameraOn = useBroadcastStore(state => state.isCameraOn);
    const toggleCamera = useBroadcastStore(state => state.toggleCamera);
    const isMicOn = useBroadcastStore(state => state.isMicOn);
    const toggleMic = useBroadcastStore(state => state.toggleMic);
    const setShowDeviceSelector = useBroadcastStore(state => state.setShowDeviceSelector);

    return (
        <aside className="w-72 bg-neutral-900 border-l border-border/10 flex flex-col font-[Vazirmatn]">
            <div className="h-14 p-4 border-b border-border/10 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wide">{t.properties || 'تنظیمات پخش'}</span>
                <Settings className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                
                {/* 1. Hardware Toggles Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-white/5 pb-1">
                        <Camera className="w-3.5 h-3.5" /> {t.hardwareSources || 'ورودی‌های سخت‌افزار'}
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={toggleCamera}
                            className={cn(
                                "py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                isCameraOn 
                                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" 
                                    : "bg-neutral-800 border-white/5 text-muted-foreground hover:bg-neutral-800/80"
                            )}
                            title="Toggle Camera"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isCameraOn ? 'دوربین روشن' : 'دوربین خاموش'}</span>
                        </button>

                        <button
                            onClick={toggleMic}
                            className={cn(
                                "py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                isMicOn 
                                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" 
                                    : "bg-neutral-800 border-white/5 text-muted-foreground hover:bg-neutral-800/80"
                            )}
                            title="Toggle Microphone"
                        >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isMicOn ? 'صدا فعال' : 'صدا قطع'}</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowDeviceSelector(true)}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <Settings className="w-3.5 h-3.5 text-indigo-400" />
                        <span>تنظیمات دستگاه‌ها (دوربین/صدا)</span>
                    </button>
                </div>

                {/* 2. Broadcast Layout selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-white/5 pb-1">
                        <Tv className="w-3.5 h-3.5" /> {t.layout || 'قالب نمایش'}
                    </label>
                    <select
                        title={t.layout}
                        value={config.layout}
                        onChange={(e) => updateConfig({ layout: e.target.value as any })}
                        className="w-full bg-neutral-800 border border-border/20 rounded-lg pl-2 pr-8 py-2 text-sm focus:outline-none focus:border-primary text-white"
                    >
                        <option value="FULL_CAM">{t.fullCam || 'دوربین تمام‌صفحه + متن روی آن'}</option>
                        <option value="PIP">{t.pip || 'اسلاید تمام‌صفحه + تصویر دوربین کوچک'}</option>
                        <option value="SPLIT">{t.split || 'صفحه نصف دوربین نصف اسلاید'}</option>
                        <option value="SLIDES_ONLY">{t.slidesOnly || 'فقط اسلایدها (بدون دوربین)'}</option>
                    </select>
                </div>

                {/* 3. PIP Settings (Conditional) */}
                {config.layout === 'PIP' && (
                    <div className="space-y-4 p-3 bg-neutral-950/40 rounded-xl border border-white/5 animate-in slide-in-from-top-2 duration-200">
                        <span className="text-xs font-black text-indigo-400 block">تنظیمات پنجره تصویر کوچک (PIP)</span>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">شکل قاب تصویر</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['rectangle', 'square', 'circle'] as const).map(shape => (
                                    <button
                                        key={shape}
                                        onClick={() => updateConfig({ leaderVideoShape: shape })}
                                        className={cn(
                                            "py-1.5 rounded text-[10px] font-bold capitalize transition",
                                            config.leaderVideoShape === shape
                                                ? "bg-indigo-600 text-white font-black"
                                                : "bg-neutral-800 hover:bg-neutral-700 text-muted-foreground"
                                        )}
                                    >
                                        {shape === 'rectangle' ? 'مستطیل' : shape === 'square' ? 'مربع' : 'دایره'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">موقعیت روی صفحه</label>
                            <select
                                title="PIP Position"
                                value={config.pipPosition || 'bottom-right'}
                                onChange={(e) => updateConfig({ pipPosition: e.target.value as any })}
                                className="w-full bg-neutral-850 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                            >
                                <option value="top-left">بالا سمت چپ</option>
                                <option value="top-center">بالا وسط</option>
                                <option value="top-right">بالا سمت راست</option>
                                <option value="center-left">وسط سمت چپ</option>
                                <option value="center">وسط صفحه</option>
                                <option value="center-right">وسط سمت راست</option>
                                <option value="bottom-left">پایین سمت چپ</option>
                                <option value="bottom-center">پایین وسط</option>
                                <option value="bottom-right">پایین سمت راست</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* 4. Overlay Widgets switches */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-white/5 pb-1">
                        <Layers className="w-3.5 h-3.5" /> {t.overlays || 'لایه‌های جانبی و ابزارک‌ها'}
                    </label>

                    <div className="space-y-2">
                        {/* Logo Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-slate-300">نمایش لوگوی کلیسا</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.showLogo}
                                    onChange={() => updateConfig({ showLogo: !config.showLogo })}
                                    title="Show Logo"
                                />
                                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Lower Third Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-slate-300">پخش زیرنویس / اسامی گویندگان</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.showLowerThird}
                                    onChange={() => updateConfig({ showLowerThird: !config.showLowerThird })}
                                    title="Show Lower Third"
                                />
                                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Prayer Ticker Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-slate-300">نمایش تیکر روان درخواست‌های دعا</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.showPrayerTicker}
                                    onChange={() => updateConfig({ showPrayerTicker: !config.showPrayerTicker })}
                                    title="Show Prayer Ticker"
                                />
                                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 5. Lower Third Theme */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-white/5 pb-1">
                        <LayoutGrid className="w-3.5 h-3.5" /> {t.lowerThirdTheme || 'پوسته زیرنویس'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => updateConfig({ lowerThirdTheme: 'modern' })}
                            className={cn(
                                "py-2 rounded-lg border text-xs font-bold transition-all",
                                config.lowerThirdTheme === 'modern'
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-neutral-800 border-white/5 text-muted-foreground hover:bg-neutral-800/80"
                            )} 
                            title={t.modern || 'Modern'}
                        >
                            {t.modern || 'مدرن'}
                        </button>
                        <button 
                            onClick={() => updateConfig({ lowerThirdTheme: 'classic' })}
                            className={cn(
                                "py-2 rounded-lg border text-xs font-bold transition-all",
                                config.lowerThirdTheme === 'classic'
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-neutral-800 border-white/5 text-muted-foreground hover:bg-neutral-800/80"
                            )} 
                            title={t.classic || 'Classic'}
                        >
                            {t.classic || 'کلاسیک'}
                        </button>
                    </div>
                </div>

            </div>
        </aside>
    );
}
