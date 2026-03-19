"use client";

import React, { useState, useTransition } from "react";
import { SupportTicket, TicketMessage, createTicket } from "@/actions/tickets";
import { MessageCircle, Plus, Send, Clock, User, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientSupport({ initialTickets }: { initialTickets: SupportTicket[] }) {
    const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
    const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // New Ticket State
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createTicket(
                { subject, user_id: 'user_123', user_name: 'کاربر دمو', user_email: 'demo@example.com' }, 
                message
            );
            if (res.success) {
                toast.success("تیکت پشتیبانی ایجاد شد.");
                setIsCreating(false);
                setSubject(""); setMessage("");
                // Mock push to UI
                setTickets([{
                    id: res.id || crypto.randomUUID(),
                    subject, status: 'open', created_at: new Date(), user_id: '123', assigned_leader_id: null
                }, ...tickets]);
            } else {
                toast.error("خطا در ایجاد تیکت");
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 font-[Vazirmatn]" dir="rtl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <MessageCircle className="w-8 h-8 text-indigo-500" />
                        پشتیبانی و پیام‌ها
                    </h1>
                    <p className="text-slate-400 mt-2">Submit feature requests, report issues, or contact church leaders.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" /> تیکت جدید
                </button>
            </div>

            {isCreating ? (
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
                    <button onClick={() => setIsCreating(false)} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
                        بازگشت <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <h2 className="text-xl font-black text-white mb-6">ثبت تیکت جدید</h2>
                    <form onSubmit={handleCreate} className="space-y-5 max-w-2xl">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">موضوع</label>
                            <input 
                                required value={subject} onChange={e => setSubject(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">پیام شما</label>
                            <textarea 
                                required rows={5} value={message} onChange={e => setMessage(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                            />
                        </div>
                        <button disabled={isPending} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>} ارسال تیکت
                        </button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                    {/* Ticket List */}
                    <div className="col-span-1 bg-zinc-950 border border-white/10 rounded-3xl overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex-shrink-0 sticky top-0 z-10">
                            <h3 className="font-black text-white px-2">لیست تیکت‌ها</h3>
                        </div>
                        <div className="divide-y divide-white/5 flex-1">
                            {tickets.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setActiveTicket(t)}
                                    className={`w-full text-right p-5 hover:bg-white/5 transition-colors flex flex-col gap-2 ${activeTicket?.id === t.id ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="font-bold text-slate-200 line-clamp-1">{t.subject}</span>
                                        {t.status === 'open' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Open</span>}
                                        {t.status === 'closed' && <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Closed</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(t.created_at).toLocaleDateString("fa-IR")}
                                    </div>
                                </button>
                            ))}
                            {tickets.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm font-medium">هیچ تیکتی یافت نشد.</div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden relative">
                        {activeTicket ? (
                            <>
                                <div className="p-6 border-b border-white/10 bg-zinc-950/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-white text-lg">{activeTicket.subject}</h3>
                                        <div className="text-xs text-slate-400 mt-1">تیکت #{activeTicket.id.split('-')[0]}</div>
                                    </div>
                                    {activeTicket.status === 'closed' && (
                                        <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-bold">
                                            <CheckCircle2 className="w-4 h-4"/> بسته شده
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col">
                                    {/* Mock First Message showing UI */}
                                    <div className="flex gap-4 max-w-[80%] self-end">
                                        <div className="bg-indigo-600 rounded-2xl p-4 text-white text-sm leading-relaxed rounded-tr-none shadow-lg">
                                            سلام، من نیاز به کمک در مورد... دارم. این یک پیام آزمایشی برای نمایش UI چت است.
                                        </div>
                                    </div>
                                    <div className="flex gap-4 max-w-[80%] self-start">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 font-bold mb-1 block">پاسخ ادمین</span>
                                            <div className="bg-zinc-800 border border-white/5 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed rounded-tl-none shadow-lg">
                                                سلام، با تشکر از پیام شما. بررسی می‌شود.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-zinc-950 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <input 
                                            placeholder="تایپ پیام..." 
                                            disabled={activeTicket.status === 'closed'}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none disabled:opacity-50"
                                        />
                                        <button 
                                            disabled={activeTicket.status === 'closed'}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-5 h-5 -ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="m-auto text-center text-slate-500">
                                <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p>یک تیکت را برای مشاهده گفتگو انتخاب کنید</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
