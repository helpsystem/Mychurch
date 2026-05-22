"use client";

import React, { useState, useEffect } from "react";
import { saveConferenceConfig, testFccConnection, exchangeFccCodeForToken, ConferenceConfig } from "@/actions/conference-config";
import { 
    Video, Key, Phone, Save, CheckCircle2, 
    AlertCircle, Sparkles, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ConferenceSettingsClientProps {
    initialConfig: ConferenceConfig;
}

export default function ConferenceSettingsClient({ initialConfig }: ConferenceSettingsClientProps) {
    const [config, setConfig] = useState<ConferenceConfig>(initialConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isExchanging, setIsExchanging] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Handle code exchange on load
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            const exchangeCode = async () => {
                setIsExchanging(true);
                setTestResult(null);
                const redirectUri = window.location.origin + window.location.pathname;
                
                toast.loading("در حال تکمیل فرآیند احراز هویت با FCC...", { id: "fcc-auth" });
                try {
                    const res = await exchangeFccCodeForToken(code, redirectUri);
                    if (res.success) {
                        toast.success("اتصال به حساب کاربری FCC با موفقیت برقرار شد!", { id: "fcc-auth" });
                        setTestResult({ success: true, message: "احراز هویت با موفقیت انجام شد! اتصال سرور فعال است." });
                        
                        // Clean up URL and reload settings config
                        setTimeout(() => {
                            window.location.href = window.location.origin + window.location.pathname;
                        }, 1500);
                    } else {
                        toast.error(res.error || "خطا در احراز هویت", { id: "fcc-auth" });
                        setTestResult({ success: false, message: res.error || "خطا در فرآیند احراز هویت با سرور FCC" });
                    }
                } catch (err: any) {
                    toast.error(err.message || "خطای سیستمی در احراز هویت", { id: "fcc-auth" });
                    setTestResult({ success: false, message: err.message || "خطا در ارتباط با سرور جهت تبادل توکن" });
                } finally {
                    setIsExchanging(false);
                }
            };
            exchangeCode();
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setTestResult(null);
        try {
            const res = await saveConferenceConfig(config);
            if (res.success) {
                toast.success("تنظیمات FreeConferenceCall با موفقیت ذخیره شد");
            } else {
                toast.error(res.error || "خطا در ذخیره تنظیمات");
            }
        } catch (error: any) {
            toast.error(error.message || "خطا در ذخیره تنظیمات");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAuthorize = () => {
        if (!config.fcc_public_key || !config.fcc_private_key) {
            toast.error("لطفاً ابتدا کلیدهای عمومی و خصوصی API را ذخیره کنید.");
            return;
        }
        const redirectUri = window.location.origin + window.location.pathname;
        const authUrl = `https://www.freeconferencecall.com/api/v4/authorize?client_id=${config.fcc_public_key.trim()}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        window.location.href = authUrl;
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await testFccConnection();
            if (res.success) {
                setTestResult({ success: true, message: res.message || "اتصال برقرار شد!" });
                toast.success("تست اتصال موفقیت‌آمیز بود");
            } else {
                setTestResult({ success: false, message: res.error || "خطا در اتصال" });
                toast.error("خطا در تست اتصال");
            }
        } catch (error: any) {
            setTestResult({ success: false, message: error.message || "خطای غیرمنتظره در شبکه" });
            toast.error("خطا در تست اتصال");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <section className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group text-right font-[Vazirmatn]" dir="rtl">
            <div className="absolute top-0 left-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Video size={120} className="text-indigo-400" />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Video className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">تنظیمات ارتباط آنلاین (FreeConferenceCall)</h2>
                    <p className="text-xs text-muted-foreground mt-1 font-[Vazirmatn]">مدیریت کلیدهای API برای زمان‌بندی زنده و ارسال خودکار دعوت‌نامه‌ها</p>
                </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-950/40 border border-white/5 rounded-2xl mb-6">
                <div>
                    <h3 className="font-bold text-sm text-white font-[Vazirmatn]">فعال‌سازی یکپارچه‌سازی API</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-[Vazirmatn]">در صورت فعال بودن، اطلاعات جلسه مستقیماً از سرور FCC واکشی می‌شود.</p>
                </div>
                <button
                    onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        config.enabled ? "bg-indigo-600" : "bg-neutral-800"
                    }`}
                    title={config.enabled ? "غیرفعال کردن" : "فعال کردن"}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.enabled ? "-translate-x-6" : "-translate-x-1"
                        }`}
                    />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credentials block */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2 font-[Vazirmatn]">
                            <Key className="w-4 h-4" /> کلیدهای API و احراز هویت
                        </h3>
                        {config.fcc_access_token === "PRESENT" && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                                حساب متصل است
                            </span>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 block pl-1 font-[Vazirmatn]">کلید عمومی (Public Key / Client ID)</label>
                        <input
                            type="text"
                            value={config.fcc_public_key}
                            onChange={(e) => setConfig({ ...config, fcc_public_key: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs text-left"
                            placeholder="fcc_pub_..."
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 block pl-1 font-[Vazirmatn]">کلید خصوصی (Private Key / Client Secret)</label>
                        <input
                            type="password"
                            value={config.fcc_private_key}
                            onChange={(e) => setConfig({ ...config, fcc_private_key: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs text-left"
                            placeholder="••••••••••••••••"
                            dir="ltr"
                        />
                    </div>

                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-3 text-[10px] leading-relaxed text-neutral-400 font-[Vazirmatn]">
                        <strong>نکته مهم:</strong> برای اتصال موفق، باید آدرس زیر را در پنل توسعه‌دهندگان FreeConferenceCall خود به عنوان <strong>Redirect URI</strong> ثبت کرده باشید:
                        <div className="font-mono text-left text-indigo-400 bg-neutral-900 px-2 py-1.5 rounded mt-1 select-all break-all overflow-auto max-h-12 text-[10px]" dir="ltr">
                            {typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://www.iranianchurchdc.com/admin/settings'}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleAuthorize}
                            disabled={isExchanging || !config.fcc_public_key || !config.fcc_private_key}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold text-xs disabled:opacity-50 cursor-pointer active:scale-95 border border-indigo-500/30 shadow-lg font-[Vazirmatn]"
                            title="اتصال به حساب کاربری FCC"
                        >
                            {isExchanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                            اتصال به حساب FCC
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={isTesting || isExchanging}
                            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all font-bold text-xs disabled:opacity-50 cursor-pointer active:scale-95 border border-white/10 shadow-lg font-[Vazirmatn]"
                            title="تست ارتباط با کلیدهای فعلی"
                        >
                            {isTesting ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                            تست اتصال به سرور FCC
                        </button>
                    </div>

                    <AnimatePresence>
                        {testResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed mt-2 font-[Vazirmatn] ${
                                    testResult.success 
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}
                            >
                                {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                                <span>{testResult.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Fallback Inputs */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2 border-b border-white/5 pb-2 font-[Vazirmatn]">
                        <Phone className="w-4 h-4" /> اطلاعات دستی و پشتیبان (Fallback)
                    </h3>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 block pl-1 font-[Vazirmatn]">شماره تماس کنفرانس (Dial-in Number)</label>
                        <input
                            type="text"
                            value={config.dial_in_number}
                            onChange={(e) => setConfig({ ...config, dial_in_number: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm text-left"
                            placeholder="+1 605-562-0400"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 block pl-1 font-[Vazirmatn]">کد دسترسی یا شناسه جلسه (Access Code / Meeting ID)</label>
                        <input
                            type="text"
                            value={config.access_code}
                            onChange={(e) => setConfig({ ...config, access_code: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm text-left"
                            placeholder="mychurchroom"
                            dir="ltr"
                        />
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-[11px] leading-relaxed text-indigo-300/80 font-[Vazirmatn]">
                        <strong>راهنمای مکانیزم پشتیبان:</strong> در صورت عدم دسترسی به اینترنت یا نامعتبر بودن کلیدهای API، سیستم به صورت پیش‌فرض از این شماره تماس و کد دسترسی برای ساخت لینک وب زنده و ارسال ایمیل‌ها استفاده خواهد کرد.
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end border-t border-white/5 pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:scale-95 cursor-pointer active:scale-95 text-sm font-[Vazirmatn]"
                    title="ذخیره تنظیمات FreeConferenceCall"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    ذخیره تنظیمات کنفرانس
                </button>
            </div>
        </section>
    );
}
