"use client";

import React, { useState, useTransition } from "react";
import { Users, Mail, Send, Loader2, CheckCircle, Search, Clock, Languages, ArrowRightLeft } from "lucide-react";
import { sendNewsletterCampaign } from "@/actions/newsletter";
import { translateText } from "@/actions/translate";

interface Subscriber {
    id: string;
    email: string;
    status: string;
    subscribed_at: string;
}

export default function NewsletterAdminClient({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
    const [subscribers, setSubscribers] = useState(initialSubscribers);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Form States
    const [subjectFa, setSubjectFa] = useState("");
    const [subjectEn, setSubjectEn] = useState("");
    const [bodyFa, setBodyFa] = useState("");
    const [bodyEn, setBodyEn] = useState("");

    const [isTranslating, setIsTranslating] = useState(false);

    const activeCount = subscribers.filter(s => s.status === 'active').length;

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTranslate = async (sourceText: string, targetLanguage: 'en' | 'fa', setTargetState: (val: string) => void) => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);
        try {
            const res = await translateText(sourceText, targetLanguage);
            if (res.success && res.text) {
                setTargetState(res.text);
            } else {
                alert(res.error || "Translation failed");
            }
        } finally {
            setIsTranslating(false);
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
                    {isTranslating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-white font-bold font-[Vazirmatn]">در حال ترجمه توسط هوش مصنوعی...</p>
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

                    <form onSubmit={handleSendCampaign} className="space-y-8">
                        
                        {/* Subjects */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-emerald-400 font-[Vazirmatn]">موضوع (فارسی)</label>
                                    <button type="button" onClick={() => handleTranslate(subjectFa, 'en', setSubjectEn)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                        ترجمه به انگلیسی <ArrowRightLeft className="w-3 h-3" />
                                    </button>
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
                                    <button type="button" onClick={() => handleTranslate(subjectEn, 'fa', setSubjectFa)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                        Translate to FA <ArrowRightLeft className="w-3 h-3" />
                                    </button>
                                </div>
                                <input 
                                    value={subjectEn} onChange={(e) => setSubjectEn(e.target.value)}
                                    type="text" required dir="ltr"
                                    placeholder="e.g. New Church Updates..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-sans"
                                />
                            </div>
                        </div>

                        {/* Bodies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-emerald-400 font-[Vazirmatn]">متن خبرنامه (فارسی)</label>
                                    <button type="button" onClick={() => handleTranslate(bodyFa, 'en', setBodyEn)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                        ترجمه به انگلیسی <ArrowRightLeft className="w-3 h-3" />
                                    </button>
                                </div>
                                <textarea 
                                    value={bodyFa} onChange={(e) => setBodyFa(e.target.value)}
                                    required rows={12} dir="rtl"
                                    placeholder="متن پیام خود را اینجا بنویسید..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-[Vazirmatn] resize-y leading-relaxed"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-blue-400 font-sans">Newsletter Body (English)</label>
                                    <button type="button" onClick={() => handleTranslate(bodyEn, 'fa', setBodyFa)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                        Translate to FA <ArrowRightLeft className="w-3 h-3" />
                                    </button>
                                </div>
                                <textarea 
                                    value={bodyEn} onChange={(e) => setBodyEn(e.target.value)}
                                    required rows={12} dir="ltr"
                                    placeholder="Write your message here..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-sans resize-y leading-relaxed"
                                />
                            </div>
                        </div>

                        {sendResult && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 font-[Vazirmatn] ${sendResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {sendResult.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
                                <span>{sendResult.msg}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isPending || activeCount === 0 || isTranslating}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-black px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[Vazirmatn] text-lg shadow-lg shadow-primary/20"
                            >
                                {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                ارسال نهایی ایمیل برای {activeCount} عضو فعال
                            </button>
                        </div>
                    </form>
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
