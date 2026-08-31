"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Users, Calendar, Loader2, ArrowLeft, PhoneCall, Info, Key } from "lucide-react";
import { toast } from "sonner";
import { sendWhatsAppBroadcast, sendTestWhatsAppMessage, WhatsAppLog } from "@/actions/communications";
import Link from "next/link";

export default function WhatsAppClient({ 
    initialWhatsAppLogs
}: { 
    initialWhatsAppLogs: WhatsAppLog[]
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    
    const [whatsappData, setWhatsappData] = useState({
        body: "",
        isTemplate: false,
        templateName: "hello_world",
        langCode: "en_US"
    });

    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await sendWhatsAppBroadcast(
            whatsappData.body,
            whatsappData.isTemplate,
            whatsappData.templateName,
            whatsappData.langCode
        );
        setIsSubmitting(false);

        if (res.success) {
            toast.success(`پیام با موفقیت به ${res.count || 0} کاربر ارسال شد. (WhatsApp broadcast sent)`);
            setWhatsappData({ body: "", isTemplate: false, templateName: "hello_world", langCode: "en_US" });
            window.location.reload();
        } else {
            toast.error(res.error || "خطا در ارسال پیام واتساپ.");
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testPhone.trim()) {
            toast.error("لطفا شماره تلفن تست را وارد کنید.");
            return;
        }
        setIsTestingWhatsApp(true);
        const res = await sendTestWhatsAppMessage(
            testPhone,
            whatsappData.body,
            whatsappData.isTemplate,
            whatsappData.templateName,
            whatsappData.langCode
        );
        setIsTestingWhatsApp(false);

        if (res.success) {
            toast.success("پیام تستی با موفقیت ارسال شد. (Test message sent)");
        } else {
            toast.error(res.error || "خطا در ارسال پیام تستی واتساپ.");
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
                    <h1 className="text-2xl font-bold text-[#00dce4] font-[Work Sans]">WhatsApp Campaigns</h1>
                    <p className="text-sm text-[#c2c6d6]">ارسال پیام گروهی در واتساپ</p>
                </div>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-y-auto">
                {/* Left Column: Compose & Active Campaigns */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <div className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6" dir="rtl">
                            <Info className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                            <div className="space-y-1">
                                <p>سیستم ارسال پیام گروهی از طریق **Meta WhatsApp Business API**.</p>
                                <p className="text-xs opacity-80">نکته: بر اساس قوانین فیس‌بوک، ارسال پیام‌های متنی ساده به کاربرانی که طی ۲۴ ساعت گذشته تعاملی با شماره شما نداشته‌اند محدود است. برای شروع مکالمه جدید حتماً باید از پیام قالب (Template) تایید شده استفاده کنید.</p>
                            </div>
                        </div>

                        <form onSubmit={handleWhatsAppSubmit} className="space-y-6" dir="rtl">
                            {/* Mode Select */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#c2c6d6]">نوع پیام (Message Type)</label>
                                    <select 
                                        value={whatsappData.isTemplate ? "template" : "text"} 
                                        onChange={(e) => setWhatsappData({...whatsappData, isTemplate: e.target.value === "template"})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 font-[Vazirmatn] appearance-none"
                                    >
                                        <option value="text" className="bg-[#131315]">پیام متنی آزاد (Text Session Message)</option>
                                        <option value="template" className="bg-[#131315]">قالب آماده متا (Meta Approved Template)</option>
                                    </select>
                                </div>

                                {whatsappData.isTemplate ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#c2c6d6]">نام قالب (Template Name)</label>
                                            <input
                                                type="text"
                                                required
                                                value={whatsappData.templateName}
                                                onChange={(e) => setWhatsappData({...whatsappData, templateName: e.target.value})}
                                                placeholder="e.g. hello_world"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#c2c6d6]">کد زبان (Lang Code)</label>
                                            <input
                                                type="text"
                                                required
                                                value={whatsappData.langCode}
                                                onChange={(e) => setWhatsappData({...whatsappData, langCode: e.target.value})}
                                                placeholder="e.g. en_US"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs flex items-center h-[52px] mt-7">
                                        تنها به کاربرانی ارسال می‌شود که کمتر از ۲۴ ساعت پیش به شماره شما پیام داده باشند.
                                    </div>
                                )}
                            </div>

                            {!whatsappData.isTemplate && (
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-sm font-bold text-[#c2c6d6]">متن پیام واتساپ (Message Body)</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={whatsappData.body}
                                        onChange={(e) => setWhatsappData({...whatsappData, body: e.target.value})}
                                        placeholder="متن پیام خود را بنویسید..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all resize-none font-[Vazirmatn]"
                                    />
                                </div>
                            )}

                            {/* Test Configuration */}
                            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <PhoneCall className="w-4 h-4 text-[#00dce4]" /> تست تنظیمات قبل از ارسال کلی
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <label className="text-xs text-[#c2c6d6]">شماره تماس تست (همراه با کد کشور)</label>
                                        <input
                                            type="text"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="+17030000000"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00dce4]/50 transition-all font-mono"
                                            dir="ltr"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        disabled={isTestingWhatsApp || isSubmitting} 
                                        onClick={handleTestWhatsApp} 
                                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-neutral-800 hover:bg-neutral-700 text-white transition flex items-center gap-2 disabled:opacity-50 shrink-0 border border-white/10 w-full sm:w-auto justify-center"
                                    >
                                        {isTestingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : "ارسال پیام تست"}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
                                {/* Quick Setup Guide link block */}
                                <div className="p-3 rounded-xl bg-neutral-900/50 border border-white/10 text-xs text-[#c2c6d6] flex gap-2 items-center">
                                    <a href="/WHATSAPP_SETUP_GUIDE.md" target="_blank" className="text-[#00dce4] hover:underline font-bold flex items-center gap-1 shrink-0">
                                        <Key className="w-3.5 h-3.5" /> راهنما
                                    </a>
                                    <span>تنظیمات توکن واتساپ نیاز به ست شدن در .env سرور دارد.</span>
                                </div>

                                <button disabled={isSubmitting || isTestingWhatsApp} type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00dce4] text-[#003739] hover:opacity-90 transition-transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 disabled:opacity-50 w-full md:w-auto justify-center" dir="ltr">
                                    {isSubmitting ? "Broadcasting..." : <><Send className="w-4 h-4" /> Broadcast via WhatsApp</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* WhatsApp Logs List */}
                    <div className="mt-4">
                        <h2 className="font-bold text-lg text-white mb-4 font-[Work Sans]">Recent Broadcast Logs</h2>
                        <div className="space-y-4 font-[Vazirmatn]" dir="rtl">
                            {initialWhatsAppLogs.length === 0 ? (
                                <p className="text-[#c2c6d6] text-center py-10 bg-[#1c1b1d] rounded-xl border border-white/5">هیچ ارسال واتساپی ثبت نشده است.</p>
                            ) : (
                                initialWhatsAppLogs.map((log, i) => (
                                    <div key={log.id || i} className="bg-[rgba(15,23,42,0.75)] backdrop-blur-xl rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-white/10 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.status === 'success' ? 'bg-[#00dce4]/10 text-[#00dce4]' : log.status === 'partial_success' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
                                                    <span>تعداد گیرندگان: {log.recipient_count}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${log.status === 'success' ? 'bg-[#00dce4]/20 text-[#00dce4]' : log.status === 'partial_success' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {log.status === 'success' ? 'موفق' : log.status === 'partial_success' ? 'موفقیت جزئی' : 'ناموفق'}
                                                    </span>
                                                </h3>
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
                    <h2 className="font-bold text-lg text-white mb-6 font-[Work Sans]">WhatsApp Device Preview</h2>
                    <div className="flex-1 bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center p-6 relative overflow-hidden">
                        
                        {/* Mobile Device Mockup */}
                        <div className="w-[320px] h-[600px] bg-[#00040F] rounded-[2rem] border-[6px] border-[#353437] mt-4 shadow-2xl relative flex flex-col overflow-hidden">
                            {/* WhatsApp Header Mock */}
                            <div className="h-16 bg-[#075e54] text-white flex items-center px-4 shadow-md z-10 shrink-0" dir="ltr">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Church Community</div>
                                    <div className="text-[10px] text-white/80">business account</div>
                                </div>
                            </div>

                            {/* WhatsApp Chat Background */}
                            <div className="flex-1 bg-[#efeae2] p-4 overflow-y-auto relative z-0">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rro_M6-B05F.png')" }}></div>
                                
                                <div className="relative z-10 flex flex-col items-start gap-4 pt-4" dir="rtl">
                                    {/* Received Message Mock */}
                                    <div className="bg-white text-black p-2.5 rounded-xl rounded-tr-none shadow-sm max-w-[85%] text-sm relative self-start border border-gray-200">
                                        <div className="text-[#075e54] text-xs font-bold mb-1">Sanctuary</div>
                                        {whatsappData.isTemplate ? (
                                            <p className="italic text-gray-500">[Template: {whatsappData.templateName}]</p>
                                        ) : whatsappData.body ? (
                                            <p className="whitespace-pre-wrap">{whatsappData.body}</p>
                                        ) : (
                                            <p className="text-gray-400">پیام شما در اینجا نمایش داده می‌شود...</p>
                                        )}
                                        <div className="text-[10px] text-gray-400 text-left mt-1" dir="ltr">10:45 AM</div>
                                        {/* Tail */}
                                        <div className="absolute -top-[1px] -right-[9px] w-0 h-0 border-l-[10px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent"></div>
                                        <div className="absolute -top-[2px] -right-[11px] w-0 h-0 border-l-[12px] border-l-gray-200 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent -z-10"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* WhatsApp Input Mock */}
                            <div className="h-14 bg-[#f0f0f0] flex items-center px-2 shrink-0 z-10 gap-2" dir="ltr">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500">
                                    +
                                </div>
                                <div className="flex-1 h-9 bg-white rounded-full flex items-center px-4 text-gray-400 text-sm">
                                    Type a message
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center text-white">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
