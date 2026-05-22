"use client";

import React, { useState } from "react";
import { Megaphone, Mail, Send, Save, Eye, Users, History, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { createAnnouncement, sendMassEmail, sendTestMassEmail, Announcement } from "@/actions/communications";

export default function CommunicationsClient({ 
    initialAnnouncements, 
    initialEmailLogs 
}: { 
    initialAnnouncements: Announcement[], 
    initialEmailLogs: Array<{ id: number, subject: string, body: string, sent_at: string }> 
}) {
    const [activeTab, setActiveTab] = useState<"news" | "news_history" | "email" | "email_history">("news");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Form State
    const [newsData, setNewsData] = useState({ title: "", content: "", priority: "normal", status: "published" });
    const [emailData, setEmailData] = useState({ subject: "", body: "" });

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await createAnnouncement(newsData as any);
        setIsSubmitting(false);

        if (res.success) {
            toast.success("اطلاعیه با موفقیت در سایت منتشر شد! (Announcement successfully published)");
            setNewsData({ title: "", content: "", priority: "normal", status: "published" });
            window.location.reload();
        } else {
            toast.error(res.error || "خطا در ارتباط با دیتابیس.");
        }
    };

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-primary" />
                        Communications
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage site announcements, news, and mass email broadcasts.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-neutral-900/50 border border-white/5 rounded-xl w-fit backdrop-blur-md">
                <button
                    onClick={() => setActiveTab("news")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "news" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    <Megaphone className="w-4 h-4" /> New Announcement
                </button>
                <button
                    onClick={() => setActiveTab("news_history")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "news_history" ? "bg-white/20 text-white shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    <History className="w-4 h-4" /> News History
                </button>
                <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
                <button
                    onClick={() => setActiveTab("email")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "email" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    <Mail className="w-4 h-4" /> New Mass Email
                </button>
                <button
                    onClick={() => setActiveTab("email_history")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "email_history" ? "bg-white/20 text-white shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    <History className="w-4 h-4" /> Email Logs
                </button>
            </div>

            {/* Content Area */}
            <div className="glass-strong p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                
                {activeTab === "news" && (
                    <form onSubmit={handleNewsSubmit} className="space-y-6 relative z-10" dir="rtl">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">عنوان اطلاعیه (Title)</label>
                            <input
                                type="text"
                                required
                                value={newsData.title}
                                onChange={(e) => setNewsData({...newsData, title: e.target.value})}
                                placeholder="مثلاً: برنامه زمانی جلسات پرستش زمستانه"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-[Vazirmatn]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">متن اطلاعیه (Content)</label>
                            <textarea
                                required
                                rows={6}
                                value={newsData.content}
                                onChange={(e) => setNewsData({...newsData, content: e.target.value})}
                                placeholder="متن کامل اطلاعیه یا خبر خود را اینجا بنویسید..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-[Vazirmatn] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">اولویت نمایش (Priority)</label>
                                <select 
                                    value={newsData.priority} 
                                    onChange={(e) => setNewsData({...newsData, priority: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-[Vazirmatn] appearance-none"
                                >
                                    <option value="normal">عادی (Normal)</option>
                                    <option value="high">فوری / پین شده (High/Pinned)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground">وضعیت (Status)</label>
                                <select 
                                    value={newsData.status} 
                                    onChange={(e) => setNewsData({...newsData, status: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-[Vazirmatn] appearance-none"
                                >
                                    <option value="published">انتشار فوری (Published)</option>
                                    <option value="draft">پیش‌نویس (Draft)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-4 border-t border-white/10" dir="ltr">
                            <button type="button" onClick={() => setIsPreviewOpen(true)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Preview
                            </button>
                            <button disabled={isSubmitting} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting ? "Publishing..." : <><Save className="w-4 h-4" /> Publish Announcement</>}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "news_history" && (
                    <div className="relative z-10 space-y-4" dir="rtl">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                            <History className="w-5 h-5" /> تاریخچه اطلاعیه‌ها
                        </h2>
                        {initialAnnouncements.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">هیچ اطلاعیه‌ای یافت نشد.</p>
                        ) : (
                            <div className="space-y-3 font-[Vazirmatn]">
                                {initialAnnouncements.map((ann, i) => (
                                    <div key={ann.id || i} className="p-4 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-lg">{ann.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${ann.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {ann.priority === 'high' ? 'فوری' : 'عادی'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "email" && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6 relative z-10" dir="rtl">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm font-medium mb-6 font-[Vazirmatn]">
                            <Users className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
                            <p>این پیام به تمامی کاربران تایید شده سایت (خبرنامه) ارسال خواهد شد. از قالب‌های ایمیل اختصاصی کلیسا برای ارسال امن استفاده می‌شود.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">موضوع ایمیل (Subject)</label>
                            <input
                                type="text"
                                required
                                value={emailData.subject}
                                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                                placeholder="Subject Line..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-[Vazirmatn]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground">متن پیام (Email Body)</label>
                            <textarea
                                required
                                rows={8}
                                value={emailData.body}
                                onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                                placeholder="HTML or Plain text format..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-[Vazirmatn] resize-none"
                            />
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-4 border-t border-white/10" dir="ltr">
                            <button type="button" disabled={isTesting} onClick={handleTestEmail} className="px-6 py-2.5 rounded-xl font-bold text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50">
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Send Test to Self
                            </button>
                            <button disabled={isSubmitting} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting ? "Dispatching..." : <><Send className="w-4 h-4" /> Broadcast Email</>}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "email_history" && (
                    <div className="relative z-10 space-y-4" dir="rtl">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-500">
                            <History className="w-5 h-5" /> تاریخچه ایمیل‌های گروهی
                        </h2>
                        {initialEmailLogs.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">هیچ ایمیل گروهی ثبت نشده است.</p>
                        ) : (
                            <div className="space-y-3 font-[Vazirmatn]">
                                {initialEmailLogs.map((log, i) => (
                                    <div key={log.id || i} className="p-4 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{log.subject}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{log.body}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground shrink-0 bg-neutral-900 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span dir="ltr">{new Date(log.sent_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-[Vazirmatn]" dir="rtl">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/50">
                            <h3 className="font-bold">پیش‌نمایش اطلاعیه</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="sr-only">بستن</span>
                                ✕
                            </button>
                        </div>
                        <div className="p-6 md:p-10 min-h-[300px]">
                            {/* Simulated Public Site Announcement Card */}
                            <div className={`p-6 rounded-2xl border ${newsData.priority === 'high' ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${newsData.priority === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{newsData.title || "عنوان اطلاعیه شما"}</h2>
                                        <p className="text-xs text-muted-foreground mt-1">همین الان • توسط مدیریت</p>
                                    </div>
                                </div>
                                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                                    {newsData.content || "متن اطلاعیه شما در اینجا نمایش داده خواهد شد..."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
