"use client";

import React, { useState, useTransition } from "react";
import { PrayerRequest, createPrayer, incrementPrayerCount } from "@/actions/prayers";
import { Heart, Plus, Loader2, CheckCircle2, User, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function PrayersClient({ initialPrayers }: { initialPrayers: PrayerRequest[] }) {
    const [prayers, setPrayers] = useState<PrayerRequest[]>(initialPrayers);
    const [filter, setFilter] = useState<'active' | 'answered'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const activePrayers = prayers.filter(p => filter === 'active' ? p.status === 'active' : p.status === 'answered');

    const handlePrayClick = async (id: string, currentCount: number) => {
        // Optimistic UI update
        setPrayers(current => current.map(p => p.id === id ? { ...p, prayed_count: p.prayed_count + 1 } : p));
        
        // Very basic fingerprinting for anonymous users hitting the public wall
        // In a real app, you'd use a UUID stored in localStorage or actual user auth token
        let localId = localStorage.getItem('guest_prayer_id');
        if (!localId) {
            localId = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('guest_prayer_id', localId);
        }

        const res = await incrementPrayerCount(id, localId);
        if (!res.success) {
            // Revert on failure (e.g., they already clicked it)
            setPrayers(current => current.map(p => p.id === id ? { ...p, prayed_count: p.prayed_count - 1 } : p));
            toast.error(res.error || 'Failed to register prayer.');
        } else {
            toast.success('ممنون از دعای شما!', { icon: '🙏' });
        }
    };

    return (
        <div dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                    <button 
                        onClick={() => setFilter('active')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        درحال دعا
                    </button>
                    <button 
                        onClick={() => setFilter('answered')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'answered' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        مستجاب شده <CheckCircle2 className="w-4 h-4" />
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white hover:bg-slate-200 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-xl hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    ثبت درخواست دعا
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {activePrayers.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full py-20 text-center"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">پرونده‌ای یافت نشد</h3>
                            <p className="text-slate-400">در حال حاضر درخواست دعایی در این بخش وجود ندارد.</p>
                        </motion.div>
                    ) : (
                        activePrayers.map((prayer) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={prayer.id} 
                                className={`rounded-3xl p-6 relative overflow-hidden flex flex-col ${filter === 'answered' ? 'bg-emerald-950/20 border-emerald-500/30 border' : 'bg-zinc-900/80 border-white/10 border'} shadow-2xl`}
                            >
                                {filter === 'answered' && (
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
                                )}
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className="text-xl font-black text-white leading-tight">{prayer.title}</h3>
                                    {filter === 'answered' && (
                                        <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                            <CheckCircle2 className="w-3 h-3" /> مستجاب شد
                                        </div>
                                    )}
                                </div>
                                
                                <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1 font-medium">{prayer.content}</p>
                                
                                {filter === 'answered' && prayer.answer_text && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative z-10">
                                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <SparkleIcon /> شهادت و پاسخ
                                        </div>
                                        <p className="text-emerald-100 text-sm leading-relaxed">{prayer.answer_text}</p>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200">{prayer.user_name}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(prayer.created_at).toLocaleDateString("fa-IR")}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {filter === 'active' ? (
                                        <button 
                                            onClick={() => handlePrayClick(prayer.id, prayer.prayed_count)}
                                            className="group flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                                        >
                                            <Heart className="w-5 h-5 text-rose-500 group-hover:fill-rose-500 transition-colors" />
                                            <span className="text-rose-500 font-bold text-sm">{prayer.prayed_count}</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                            <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                                            <span className="text-emerald-500 font-bold text-sm">{prayer.prayed_count}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <NewPrayerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

function SparkleIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    )
}

function NewPrayerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createPrayer({ title, content, user_name: name || "ناشناس", email });
            if (res.success) {
                toast.success("درخواست دعای شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود.");
                setTitle(""); setContent(""); setName(""); setEmail("");
                onClose();
            } else {
                toast.error("خطا در ثبت درخواست.");
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-zinc-950 border border-indigo-500/20 rounded-3xl p-8 w-full max-w-xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <h3 className="text-2xl font-black text-white mb-2 relative z-10">ثبت درخواست جدید</h3>
                <p className="text-slate-400 text-sm mb-8 relative z-10">درخواست‌های دعا پس از تأیید شبان‌ها در دیوار دعا منتشر می‌شوند.</p>
                
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">نام شما (اختیاری)</label>
                            <input 
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">ایمیل (محرمانه)</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors text-left dir-ltr"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">موضوع دعا <span className="text-rose-500">*</span></label>
                        <input 
                            required type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="مثال: شفای بیماری مادرم"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">شرح درخواست <span className="text-rose-500">*</span></label>
                        <textarea 
                            required rows={4} value={content} onChange={e => setContent(e.target.value)}
                            placeholder="لطفاً برای..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white">انصراف</button>
                        <button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            ارسال درخواست
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
