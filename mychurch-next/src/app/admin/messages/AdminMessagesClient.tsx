"use client";

import React, { useState } from "react";
import { SupportTicket } from "@/actions/tickets";
import { Inbox, Filter, Send, User, ChevronLeft, CheckCircle2, Search, Mail } from "lucide-react";

export default function AdminMessagesClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
    const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = tickets.filter(t => t.subject.includes(searchQuery) || (t.user_name && t.user_name.includes(searchQuery)));

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto font-[Vazirmatn] h-[calc(100vh-80px)] overflow-hidden flex flex-col" dir="rtl">
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-indigo-500" />
                        صندوق پیام‌ها (CRM)
                    </h1>
                    <p className="text-slate-400 mt-2">Manage user support tickets and public contact inquiries.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Inbox List */}
                <div className="col-span-1 bg-zinc-950 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/10 bg-zinc-900/50">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="جستجو در تیکت‌ها..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                        {filtered.map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className={`w-full text-right p-4 rounded-2xl hover:bg-white/5 transition-colors flex flex-col gap-2 ${selectedTicket?.id === t.id ? 'bg-indigo-900/30' : ''}`}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className="font-bold text-slate-200 line-clamp-1">{t.subject}</span>
                                    {t.status === 'open' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Open</span>}
                                    {t.status === 'closed' && <span className="text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Closed</span>}
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 w-full mt-2">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {t.user_name || 'ناشناس'}</span>
                                    <span>{new Date(t.created_at).toLocaleDateString("fa-IR")}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thread Triage */}
                <div className="col-span-1 lg:col-span-2 bg-zinc-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-white/10 bg-zinc-950/80 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-black text-white mb-2">{selectedTicket.subject}</h2>
                                    <div className="flex gap-4 text-xs font-medium text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg w-max border border-white/5">
                                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5"/> فرستنده:  {selectedTicket.user_name}</span>
                                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5"/> {selectedTicket.user_email || '—'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-all">بستن تیکت</button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col bg-[url('/noise.png')] bg-repeat opacity-95">
                                {/* Simulated Messages */}
                                <div className="flex gap-4 max-w-[80%] self-start">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400 font-bold">{selectedTicket.user_name}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">{new Date(selectedTicket.created_at).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="bg-zinc-800 border border-white/5 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed rounded-tr-none shadow-lg whitespace-pre-wrap">
                                            {/* In reality, we fetch messages from DB */}
                                            شرح درخواست اولیه کاربر در اینجا نمایش داده می‌شود. به دلیل اینکه دیتابیس پیام‌ها هنوز توسط کاربر پر نشده است این متن نمایشی جایگزین می‌شود.
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 max-w-[80%] self-end">
                                    <div className="text-left w-full">
                                        <div className="flex items-center justify-end mb-1">
                                            <span className="text-[10px] text-slate-500 uppercase mr-2 text-right">NOW</span>
                                            <span className="text-xs text-indigo-400 font-bold text-right">You (Admin)</span>
                                        </div>
                                        <div className="bg-indigo-600 rounded-2xl p-4 text-white text-sm leading-relaxed rounded-tl-none shadow-lg ml-auto whitespace-pre-wrap">
                                            پاسخ شما به عنوان یک لیدر/ادمین با رنگ متمایز و در سمت راست چت نقش می‌بندد تا ظاهر یک CRM حرفه‌ای پیدا کند.
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-950 border-t border-white/10 shrink-0">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded-lg mb-3 flex items-center gap-2 font-bold uppercase tracking-widest">
                                    <Mail className="w-3.5 h-3.5" /> با ارسال پیام، یک ایمیل اطلاع‌رسانی به صورت خودکار برای کاربر ارسال خواهد شد.
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <textarea 
                                        rows={2}
                                        placeholder="تایپ پاسخ برای کاربر..."
                                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                                    />
                                    <button 
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-12 rounded-xl flex items-center justify-center gap-2 font-bold shrink-0 transition-colors shadow-lg"
                                    >
                                        ارسال <Send className="w-4 h-4 -mr-1" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="m-auto text-center p-8">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                                <Inbox className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">صندوق پیام‌ها</h3>
                            <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">Select a ticket from the left panel to review the conversation and securely reply to the user.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
