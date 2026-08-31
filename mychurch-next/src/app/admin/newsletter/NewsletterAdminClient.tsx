"use client";

import React, { useState, useTransition } from "react";
import { Users, Mail, Send, Loader2, CheckCircle, Search, Clock, Languages, ArrowRightLeft, Sparkles, History, Calendar } from "lucide-react";
import { sendNewsletterCampaign } from "@/actions/newsletter";
import { translateText, enhanceText } from "@/actions/translate";

interface Subscriber {
    id: string;
    email: string;
    status: string;
    subscribed_at: string;
}

export default function NewsletterAdminClient({ initialSubscribers, initialLogs = [] }: { initialSubscribers: Subscriber[], initialLogs?: any[] }) {
    const [subscribers, setSubscribers] = useState(initialSubscribers);
    const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Form States
    const [subjectFa, setSubjectFa] = useState("");
    const [subjectEn, setSubjectEn] = useState("");
    const [bodyFa, setBodyFa] = useState("");
    const [bodyEn, setBodyEn] = useState("");

    const [isTranslating, setIsTranslating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const activeCount = subscribers.filter(s => s.status === 'active').length;

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTranslate = async (sourceText: string, targetLanguage: 'en' | 'fa', setTargetState: (val: string) => void) => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);
        try {
            const res = await translateText(sourceText, targetLanguage);
            if (res.success && 'text' in res && res.text) {
                setTargetState(res.text as string);
            } else {
                alert(res.error || "Translation failed");
            }
        } finally {
            setIsTranslating(false);
        }
    };

    const handleEnhance = async (sourceText: string, language: 'en' | 'fa', setTargetState: (val: string) => void) => {
        if (!sourceText.trim()) return;
        setIsEnhancing(true);
        try {
            const res = await enhanceText(sourceText, language);
            if (res.success && res.text) {
                setTargetState(res.text);
            } else {
                alert(res.error || "AI Enhancement failed");
            }
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSendCampaign = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSendResult(null);

        if (!confirm(`آیا مطمئن هستید که می‌خواهید این خبرنامه را برای ${activeCount} نفر ارسال کنید؟`)) {
            return;
        }

        const combinedSubject = `${subjectFa} | ${subjectEn}`;

        // Convert simple text to basic HTML (Bilingual)
        const htmlContent = `
            <div style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #fafafa; border-radius: 12px; border: 1px solid #eee;">
                
                <!-- Persian Section -->
                <div dir="rtl" style="margin-bottom: 40px; text-align: right;">
                    <h2 style="color: #000; font-family: 'Tahoma', sans-serif;">${subjectFa}</h2>
                    <div style="font-size: 16px; line-height: 1.8;">
                        ${bodyFa.replace(/\n/g, '<br/>')}
                    </div>
                </div>

                <hr style="border:none; border-top: 1px solid #ddd; margin: 30px 0;" />

                <!-- English Section -->
                <div dir="ltr" style="text-align: left;">
                    <h2 style="color: #000;">${subjectEn}</h2>
                    <div style="font-size: 16px; line-height: 1.6;">
                        ${bodyEn.replace(/\n/g, '<br/>')}
                    </div>
                </div>

                <hr style="border:none; border-top: 1px solid #ddd; margin: 30px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;" dir="rtl">
                    شما این ایمیل را به دلیل عضویت در خبرنامه دریافت کرده‌اید.<br/>
                    You are receiving this email because you subscribed to our newsletter.
                </p>
            </div>
        `;

        startTransition(async () => {
            const result = await sendNewsletterCampaign(combinedSubject, htmlContent);
            if (result.success) {
                setSendResult({ type: 'success', msg: result.message || "با موفقیت ارسال شد!" });
                setSubjectFa(""); setSubjectEn(""); setBodyFa(""); setBodyEn("");
            } else {
                setSendResult({ type: 'error', msg: result.error || "خطا در ارسال" });
            }
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Main Content - Compose Email */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    {(isTranslating || isEnhancing) && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-white font-bold font-[Vazirmatn]">
                                {isTranslating ? "در حال ترجمه توسط هوش مصنوعی..." : "در حال اصلاح متن توسط هوش مصنوعی..."}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Send className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white font-[Vazirmatn]">ارسال خبرنامه دوزبانه</h2>
                        </div>
                    </div>

                    <div className="flex bg-black/50 p-1 rounded-xl w-fit mb-6 border border-white/10">
                        <button 
                            onClick={() => setActiveTab('compose')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'compose' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Send className="w-4 h-4" /> ارسال جدید</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><History className="w-4 h-4" /> تاریخچه</span>
                        </button>
                    </div>

                    {activeTab === 'compose' ? (
                        <form onSubmit={handleSendCampaign} className="space-y-8">
                            
                            {/* Subjects */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-emerald-400 font-[Vazirmatn]">موضوع (فارسی)</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleEnhance(subjectFa, 'fa', setSubjectFa)} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-emerald-500/20">
                                                اصلاح با AI <Sparkles className="w-3 h-3" />
                                            </button>
                                            <button type="button" onClick={() => handleTranslate(subjectFa, 'en', setSubjectEn)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                                ترجمه <ArrowRightLeft className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <input 
                                        value={subjectFa} onChange={(e) => setSubjectFa(e.target.value)}
                                        type="text" required dir="rtl"
                                        placeholder="مثال: اخبار جدید کلیسا..."
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-[Vazirmatn]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-blue-400 font-sans">Subject (English)</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleEnhance(subjectEn, 'en', setSubjectEn)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-blue-500/20">
                                                AI Enhance <Sparkles className="w-3 h-3" />
                                            </button>
                                            <button type="button" onClick={() => handleTranslate(subjectEn, 'fa', setSubjectFa)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                                Translate <ArrowRightLeft className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <input 
                                        value={subjectEn} onChange={(e) => setSubjectEn(e.target.value)}
                                        type="text" required dir="ltr"
                                        placeholder="e.g. Church Weekly News..."
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-sans"
                                    />
                                </div>
                            </div>

                            {/* Bodies */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-emerald-400 font-[Vazirmatn]">متن ایمیل (فارسی)</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleEnhance(bodyFa, 'fa', setBodyFa)} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-emerald-500/20">
                                                اصلاح با AI <Sparkles className="w-3 h-3" />
                                            </button>
                                            <button type="button" onClick={() => handleTranslate(bodyFa, 'en', setBodyEn)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                                ترجمه <ArrowRightLeft className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={bodyFa} onChange={(e) => setBodyFa(e.target.value)}
                                        required dir="rtl" rows={8}
                                        placeholder="متن فارسی خبرنامه..."
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-[Vazirmatn] resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-blue-400 font-sans">Email Body (English)</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleEnhance(bodyEn, 'en', setBodyEn)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-blue-500/20">
                                                AI Enhance <Sparkles className="w-3 h-3" />
                                            </button>
                                            <button type="button" onClick={() => handleTranslate(bodyEn, 'fa', setBodyFa)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                                Translate <ArrowRightLeft className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={bodyEn} onChange={(e) => setBodyEn(e.target.value)}
                                        required dir="ltr" rows={8}
                                        placeholder="English newsletter text..."
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-sans resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-3 transition-all disabled:opacity-50 mt-8"
                            >
                                {isPending ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> در حال ارسال...</>
                                ) : (
                                    <><Send className="w-5 h-5" /> شروع ارسال کمپین</>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden font-[Vazirmatn]">
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <History className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">تاریخچه ارسال‌ها</h2>
                        </div>
                        
                        {initialLogs.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                هیچ کمپین ارسال شده‌ای یافت نشد.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {initialLogs.map((log, i) => (
                                    <div key={log.id || i} className="p-4 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg mb-1 text-white truncate">{log.subject}</h4>
                                            <p className="text-sm text-slate-400 line-clamp-1">گیرندگان: {log.recipient_count} نفر</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0 bg-neutral-950 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span dir="ltr">{new Date(log.sent_at).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>

            {/* Sidebar - Subscribers List */}
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white font-[Vazirmatn]">لیست اعضا</h2>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-sm text-slate-300 font-mono">
                            {activeCount} Active
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="جستجوی ایمیل..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors font-[Vazirmatn]"
                        />
                    </div>

                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredSubscribers.length === 0 ? (
                            <p className="text-center text-slate-500 text-sm py-8 font-[Vazirmatn]">عضوی یافت نشد.</p>
                        ) : (
                            filteredSubscribers.map((sub) => (
                                <div key={sub.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-white truncate max-w-[200px]" dir="ltr" title={sub.email}>
                                            {sub.email}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                                            sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                        <Clock className="w-3 h-3" />
                                        {new Date(sub.subscribed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
