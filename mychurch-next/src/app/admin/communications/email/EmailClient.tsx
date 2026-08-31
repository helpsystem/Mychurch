"use client";

import React, { useState } from "react";
import { Mail, Send, Eye, Users, Calendar, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { sendMassEmail, sendTestMassEmail } from "@/actions/communications";
import Link from "next/link";

export default function EmailClient({ 
    initialEmailLogs
}: { 
    initialEmailLogs: Array<{ id: number, subject: string, body: string, sent_at: string }>
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [emailData, setEmailData] = useState({ subject: "", body: "" });

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await sendMassEmail(emailData.subject, emailData.body);
        setIsSubmitting(false);

        if (res.success) {
            toast.success("ایمیل گروهی با موفقیت در صف ارسال قرار گرفت. (Mass email dispatched)");
            setEmailData({ subject: "", body: "" });
            window.location.reload();
        } else {
            toast.error(res.error || "خطا در ارسال ایمیل.");
        }
    };

    const handleTestEmail = async () => {
        setIsTesting(true);
        const res = await sendTestMassEmail(emailData.subject, emailData.body);
        setIsTesting(false);

        if (res.success) {
            toast.success("ایمیل تستی با موفقیت برای شما ارسال شد. (Test email sent)");
        } else {
            toast.error(res.error || "خطا در ارسال تست ایمیل.");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen font-[Vazirmatn]">
            {/* TopAppbar */}
            <header className="flex items-center px-8 h-20 bg-[#131315]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
                <Link href="/admin/communications" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white mr-4">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#adc6ff] font-[Work Sans]">Email Campaigns</h1>
                    <p className="text-sm text-[#c2c6d6]">ارسال ایمیل‌های گروهی خبرنامه</p>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-y-auto">
                {/* Left Column: Compose & Active Campaigns */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <div className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm font-medium mb-6" dir="rtl">
                            <Users className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
                            <p>این پیام به تمامی کاربران تایید شده سایت (خبرنامه) ارسال خواهد شد. از قالب‌های ایمیل اختصاصی کلیسا برای ارسال امن استفاده می‌شود.</p>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-6" dir="rtl">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#c2c6d6]">موضوع ایمیل (Subject)</label>
                                <input
                                    type="text"
                                    required
                                    value={emailData.subject}
                                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                                    placeholder="Subject Line..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all font-[Vazirmatn]"
                                />
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                                <label className="text-sm font-bold text-[#c2c6d6]">متن پیام (Email Body)</label>
                                <textarea
                                    required
                                    rows={10}
                                    value={emailData.body}
                                    onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                                    placeholder="HTML or Plain text format..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all resize-none font-mono text-sm h-full"
                                    dir="ltr"
                                />
                            </div>

                            <div className="pt-6 flex items-center justify-end gap-4 border-t border-white/10" dir="ltr">
                                <button type="button" disabled={isTesting} onClick={handleTestEmail} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50 border border-white/10">
                                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Send Test to Self
                                </button>
                                <button disabled={isSubmitting} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#e7c26c] to-[#d4af37] text-[#111217] hover:opacity-90 transition-transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? "Dispatching..." : <><Send className="w-4 h-4" /> Dispatch Mass Email</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Email Logs List */}
                    <div className="mt-4">
                        <h2 className="font-bold text-lg text-white mb-4 font-[Work Sans]">Recent Dispatch Logs</h2>
                        <div className="space-y-4 font-[Vazirmatn]" dir="rtl">
                            {initialEmailLogs.length === 0 ? (
                                <p className="text-[#c2c6d6] text-center py-10 bg-[#1c1b1d] rounded-xl border border-white/5">هیچ ایمیل گروهی ثبت نشده است.</p>
                            ) : (
                                initialEmailLogs.map((log, i) => (
                                    <div key={log.id || i} className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-white/10 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-white line-clamp-1">{log.subject}</h3>
                                                <p className="text-sm text-[#c2c6d6] line-clamp-1 max-w-[400px]">{log.body}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#c2c6d6] shrink-0 bg-[#131315] px-3 py-1.5 rounded-lg border border-white/5" dir="ltr">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(log.sent_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Mobile Preview */}
                <div className="xl:col-span-4 hidden xl:flex flex-col h-full pl-8 border-l border-white/5">
                    <h2 className="font-bold text-lg text-white mb-6 font-[Work Sans]">Live Mobile Preview</h2>
                    <div className="flex-1 bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center p-6 relative overflow-hidden">
                        
                        {/* Mobile Device Mockup */}
                        <div className="w-[320px] h-[600px] bg-[#00040F] rounded-[2rem] border-[6px] border-[#353437] mt-4 p-4 shadow-2xl relative flex flex-col">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#353437] rounded-b-xl z-20"></div>
                            
                            {/* Email Content Preview */}
                            <div className="flex-1 mt-6 bg-white text-black rounded-lg p-4 overflow-y-auto">
                                <div className="border-b border-gray-200 pb-2 mb-4" dir="ltr">
                                    <div className="text-xs text-gray-500 mb-1">From: Sanctuary Mail (Admin)</div>
                                    <div className="font-bold text-sm">Subject: {emailData.subject || "Enter subject here..."}</div>
                                </div>
                                <div className="space-y-4 font-sans text-sm text-gray-800" dir="rtl">
                                    <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                        Church Banner Image
                                    </div>
                                    {emailData.body ? (
                                        <div 
                                            className="whitespace-pre-wrap leading-relaxed" 
                                            dangerouslySetInnerHTML={{ __html: emailData.body }} 
                                        />
                                    ) : (
                                        <>
                                            <p>کاربر گرامی،</p>
                                            <p>این یک پیش‌نمایش زنده از ظاهر ایمیل شما در دستگاه موبایل است. مطمئن شوید که متن خوانا است.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
