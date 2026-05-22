"use client";

import React, { useState, useRef, useTransition } from "react";
import { PrayerRequest, getPrayers, updatePrayerStatus, answerPrayer } from "@/actions/prayers";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { 
    Heart, CheckCircle2, Clock, Printer, Send, Filter,
    CheckSquare, Square, Trash2, Edit, Sparkles, User, BadgeAlert, Loader2
} from "lucide-react";

export default function AdminPrayersClient({ initialPrayers }: { initialPrayers: PrayerRequest[] }) {
    const [prayers, setPrayers] = useState<PrayerRequest[]>(initialPrayers);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isPending, startTransition] = useTransition();
    
    // Answering Modal State
    const [answeringUrl, setAnsweringUrl] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState("");

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Prayer_Requests_${new Date().toISOString().split('T')[0]}`,
    });

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const filteredPrayers = prayers.filter(p => statusFilter === 'all' || p.status === statusFilter);

    const toggleAll = () => {
        if (selectedIds.size === filteredPrayers.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredPrayers.map(p => p.id)));
    };

    const approvePrayer = (id: string) => {
        startTransition(async () => {
            const res = await updatePrayerStatus(id, 'active');
            if (res.success) {
                setPrayers(cur => cur.map(p => p.id === id ? { ...p, status: 'active' } : p));
                toast.success("Prayer request approved and published.");
            } else {
                toast.error(res.error || "Failed to approve prayer.");
            }
        });
    };

    const markAnswered = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answeringUrl) return;
        
        startTransition(async () => {
            const res = await answerPrayer(answeringUrl, answerText);
            if (res.success) {
                setPrayers(cur => cur.map(p => p.id === answeringUrl ? { ...p, status: 'answered', answer_text: answerText } : p));
                setAnsweringUrl(null);
                setAnswerText("");
                toast.success("Testimony added! Prayer marked as answered.");
            } else {
                toast.error(res.error || "Failed to record answer.");
            }
        });
    };
    const selectedPrayers = prayers.filter(p => selectedIds.has(p.id));

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto font-[Vazirmatn]" dir="rtl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Heart className="w-8 h-8 text-indigo-500" />
                        مدیریت درخواست‌های دعا
                    </h1>
                    <p className="text-slate-400 mt-2">Approve, print, and track answers to congregation prayers.</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        disabled={selectedPrayers.length === 0}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        چاپ لیست ({selectedPrayers.length})
                    </button>
                    {/* Placeholder for Email Dispatching feature */}
                    <button 
                        disabled={selectedPrayers.length === 0}
                        className="flex items-center gap-2 bg-slate-800 text-slate-400 cursor-not-allowed px-5 py-2.5 rounded-xl font-bold"
                    >
                        <Send className="w-4 h-4" />
                        ارسال گروهی (به زودی)
                    </button>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-6 w-max">
                {['all', 'pending', 'active', 'answered'].map(s => (
                    <button 
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-white/10 text-xs uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <button onClick={toggleAll}>
                                    {selectedIds.size > 0 && selectedIds.size === filteredPrayers.length 
                                        ? <CheckSquare className="w-5 h-5 text-indigo-500" /> 
                                        : <Square className="w-5 h-5" />
                                    }
                                </button>
                            </th>
                            <th className="p-4 text-right">عنوان درخواست / شرح</th>
                            <th className="p-4 text-right">کاربر</th>
                            <th className="p-4 text-right">تاریخ</th>
                            <th className="p-4 text-center">تعداد دعا</th>
                            <th className="p-4 text-center">وضعیت / عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPrayers.map(p => (
                            <tr key={p.id} className={`hover:bg-white/5 transition-colors ${selectedIds.has(p.id) ? 'bg-indigo-900/10' : ''}`}>
                                <td className="p-4 text-center">
                                    <button onClick={() => toggleSelect(p.id)}>
                                        {selectedIds.has(p.id) 
                                            ? <CheckSquare className="w-5 h-5 text-indigo-500" /> 
                                            : <Square className="w-5 h-5 text-slate-600" />
                                        }
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-bold text-white text-base">{p.title}</div>
                                    <div className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-md">{p.content}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">{p.user_name}</div>
                                            {p.email && <div className="text-[10px] text-slate-500 font-mono tracking-wider">{p.email}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="text-sm font-medium text-slate-300">
                                        {new Date(p.created_at).toLocaleDateString("fa-IR")}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full font-bold text-sm">
                                        <Heart className="w-3.5 h-3.5 fill-rose-500 border-none" /> {p.prayed_count}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {p.status === 'pending' && (
                                            <button 
                                                onClick={() => approvePrayer(p.id)}
                                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all"
                                            >
                                                تأیید و انتشار
                                            </button>
                                        )}
                                        {p.status === 'active' && (
                                            <button 
                                                onClick={() => setAnsweringUrl(p.id)}
                                                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                            >
                                                <Sparkles className="w-3 h-3" /> ثبت اجابت
                                            </button>
                                        )}
                                        {p.status === 'answered' && (
                                            <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 justify-center">
                                                <CheckCircle2 className="w-4 h-4" /> اجابت شده
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredPrayers.length === 0 && (
                    <div className="p-12 text-center text-slate-500">موردی یافت نشد.</div>
                )}
            </div>

            {/* Answer Prayer Modal */}
            {answeringUrl && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-indigo-500/20 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> ثبت اجابت دعا
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">این دعا مستجاب شد! شهادت کوتاهی از عملکرد خدا را وارد کنید تا روی دیوار دعا نمایش داده شود.</p>
                        
                        <form onSubmit={markAnswered}>
                            <textarea
                                required
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="خدا را شکر بابت عمل عظیمش..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none mb-6 h-32 resize-none"
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setAnsweringUrl(null)} className="px-5 py-2 hover:bg-white/5 rounded-xl font-bold text-slate-400">انصراف</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> ذخیره شهادت
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invisible Print Layout */}
            <div className="hidden">
                <style type="text/css" media="print">
                    {`
                        @page { size: portrait; margin: 20mm; }
                        body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        * { color: black !important; }
                    `}
                </style>
                <div ref={componentRef} className="print-area p-8 bg-white text-black font-[Vazirmatn]" dir="rtl">
                    <div className="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 className="text-3xl font-black">لیست دعای کلیسای ایرانیان واشنگتن</h1>
                        <p className="text-sm mt-2 font-mono">Date Printed: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                        {selectedPrayers.map((p, i) => (
                            <div key={p.id} className="border border-gray-300 rounded-xl p-4 avoid-break">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold">{i + 1}. {p.title}</h3>
                                    <div className="text-xs font-mono text-gray-500">[{p.status.toUpperCase()}]</div>
                                </div>
                                <p className="text-gray-800 leading-relaxed mb-4 text-sm">{p.content}</p>
                                <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-100 pt-2">
                                    <span>درخواست دهنده: {p.user_name}</span>
                                    <span>تاریخ: {new Date(p.created_at).toLocaleDateString("fa-IR")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {selectedPrayers.length === 0 && (
                        <div className="text-center text-gray-400 py-10 font-bold border-2 border-dashed border-gray-200 rounded-xl">
                            هیچ دعایی برای چاپ انتخاب نشده است.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
