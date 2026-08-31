"use client";

import React, { useState } from "react";
import { Megaphone, Save, Eye, History, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createAnnouncement, Announcement } from "@/actions/communications";
import Link from "next/link";

export default function CommunicationsHubClient({ 
    initialAnnouncements 
}: { 
    initialAnnouncements: Announcement[]
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [newsData, setNewsData] = useState({ title: "", content: "", priority: "normal", status: "published" });

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

    return (
        <div className="flex-1 flex flex-col min-h-screen">
            {/* TopAppbar */}
            <header className="flex justify-between items-center px-8 h-20 bg-[#131315]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
                <div>
                    <h1 className="text-2xl font-bold text-[#adc6ff] font-[Work Sans]">Communications Hub</h1>
                    <p className="text-sm text-[#c2c6d6] font-[Vazirmatn]">مرکز ارتباطات کلیسا</p>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-y-auto">
                <div className="xl:col-span-8 flex flex-col gap-8">
                    {/* Quick Actions (Bento Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/admin/communications/email" className="group p-6 rounded-2xl bg-[#1c1b1d] border border-white/5 hover:border-[#adc6ff]/30 transition-all flex flex-col justify-between interactive-spotlight relative overflow-hidden">
                            <div className="text-[#adc6ff]">
                                <span className="material-symbols-outlined text-4xl mb-4 block">forward_to_inbox</span>
                                <h3 className="font-bold text-lg font-[Work Sans]">Email Campaigns</h3>
                                <p className="text-sm text-[#c2c6d6] mt-1 font-[Vazirmatn]">ارسال ایمیل‌های گروهی خبرنامه</p>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#adc6ff] group-hover:text-[#002e6a] flex items-center justify-center transition-colors">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                        
                        <Link href="/admin/communications/whatsapp" className="group p-6 rounded-2xl bg-[#1c1b1d] border border-white/5 hover:border-[#00dce4]/30 transition-all flex flex-col justify-between interactive-spotlight relative overflow-hidden">
                            <div className="text-[#00dce4]">
                                <span className="material-symbols-outlined text-4xl mb-4 block">forum</span>
                                <h3 className="font-bold text-lg font-[Work Sans]">WhatsApp Broadcasts</h3>
                                <p className="text-sm text-[#c2c6d6] mt-1 font-[Vazirmatn]">ارسال پیام گروهی در واتساپ</p>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#00dce4] group-hover:text-[#003739] flex items-center justify-center transition-colors">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Announcement Composer */}
                    <div className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                        <h2 className="text-xl font-bold text-white mb-6 font-[Work Sans] flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-[#adc6ff]" />
                            Publish Site Announcement
                        </h2>
                        <form onSubmit={handleNewsSubmit} className="space-y-6 font-[Vazirmatn]" dir="rtl">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#c2c6d6]">عنوان اطلاعیه (Title)</label>
                                <input
                                    type="text"
                                    required
                                    value={newsData.title}
                                    onChange={(e) => setNewsData({...newsData, title: e.target.value})}
                                    placeholder="مثلاً: برنامه زمانی جلسات پرستش زمستانه"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#c2c6d6]">متن اطلاعیه (Content)</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={newsData.content}
                                    onChange={(e) => setNewsData({...newsData, content: e.target.value})}
                                    placeholder="متن کامل اطلاعیه یا خبر خود را اینجا بنویسید..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#c2c6d6]">اولویت نمایش (Priority)</label>
                                    <select 
                                        value={newsData.priority} 
                                        onChange={(e) => setNewsData({...newsData, priority: e.target.value})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 font-[Vazirmatn] appearance-none"
                                    >
                                        <option value="normal" className="bg-[#131315]">عادی (Normal)</option>
                                        <option value="high" className="bg-[#131315]">فوری / پین شده (High/Pinned)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#c2c6d6]">وضعیت (Status)</label>
                                    <select 
                                        value={newsData.status} 
                                        onChange={(e) => setNewsData({...newsData, status: e.target.value})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 font-[Vazirmatn] appearance-none"
                                    >
                                        <option value="published" className="bg-[#131315]">انتشار فوری (Published)</option>
                                        <option value="draft" className="bg-[#131315]">پیش‌نویس (Draft)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-end gap-4 border-t border-white/10" dir="ltr">
                                <button type="button" onClick={() => setIsPreviewOpen(true)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Preview
                                </button>
                                <button disabled={isSubmitting} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#adc6ff] text-[#001a42] hover:bg-[#adc6ff]/90 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? "Publishing..." : <><Save className="w-4 h-4" /> Publish Announcement</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="xl:col-span-4 flex flex-col bg-[#1c1b1d] rounded-2xl border border-white/5 p-6 h-[800px] overflow-hidden relative">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white font-[Vazirmatn]" dir="rtl">
                        <History className="w-5 h-5 text-[#adc6ff]" /> تاریخچه اطلاعیه‌ها
                    </h2>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-[Vazirmatn]" dir="rtl">
                        {initialAnnouncements.length === 0 ? (
                            <p className="text-[#c2c6d6] text-center py-10 text-sm">هیچ اطلاعیه‌ای یافت نشد.</p>
                        ) : (
                            initialAnnouncements.map((ann, i) => (
                                <div key={ann.id || i} className="p-4 rounded-xl border border-white/5 bg-[#131315]/50 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-base text-white">{ann.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${ann.priority === 'high' ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'bg-[#adc6ff]/20 text-[#adc6ff]'}`}>
                                            {ann.priority === 'high' ? 'فوری' : 'عادی'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#c2c6d6] line-clamp-2">{ann.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-[Vazirmatn]" dir="rtl">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/50">
                            <h3 className="font-bold text-white">پیش‌نمایش اطلاعیه</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                                <span className="sr-only">بستن</span>
                                ✕
                            </button>
                        </div>
                        <div className="p-6 md:p-10 min-h-[300px]">
                            <div className={`p-6 rounded-2xl border ${newsData.priority === 'high' ? 'border-[#ffb4ab]/30 bg-[#ffb4ab]/5' : 'border-[#adc6ff]/30 bg-[#adc6ff]/5'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${newsData.priority === 'high' ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'bg-[#adc6ff]/20 text-[#adc6ff]'}`}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{newsData.title || "عنوان اطلاعیه شما"}</h2>
                                        <p className="text-xs text-[#c2c6d6] mt-1">همین الان • توسط مدیریت</p>
                                    </div>
                                </div>
                                <div className="text-[#c2c6d6] whitespace-pre-wrap leading-relaxed text-sm md:text-base">
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
