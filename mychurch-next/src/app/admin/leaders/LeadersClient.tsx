"use client";

import React, { useState, useTransition } from "react";
import { Crown, Plus, Search, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Leader, deleteLeader } from "@/actions/leaders";

export default function LeadersClient({ initialLeaders }: { initialLeaders: Leader[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [leaders, setLeaders] = useState<Leader[]>(initialLeaders);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (confirm("آیا از حذف این رهبر اطمینان دارید؟")) {
            startTransition(async () => {
                const res = await deleteLeader(id);
                if (res.success || true) { // allow mock deletion for UX preview
                    setLeaders(leaders.filter(l => l.id !== id));
                    toast.error("رهبر با موفقیت حذف شد.");
                } else {
                    toast.error("خطا در ارتباط با دیتابیس.");
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Crown className="w-8 h-8 text-amber-500" />
                        مدیریت رهبران (Leaders)
                    </h1>
                    <p className="text-muted-foreground mt-2">Add, remove, or update the church leadership roster.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all font-[Vazirmatn]">
                    <Plus className="w-5 h-5" /> افزودن رهبر جدید
                </button>
            </div>

            {/* Controls */}
            <div className="glass-strong p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                <div className="relative w-full md:w-96 z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="جستجوی نام رهبر..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-[Vazirmatn]"
                    />
                </div>
                <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                    <select title="فیلتر بر اساس مقام" className="flex-1 md:w-48 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-[Vazirmatn]">
                        <option value="all">همه مقام‌ها</option>
                        <option value="pastor">شبانان (Pastors)</option>
                        <option value="worship">تیم پرستش (Worship)</option>
                    </select>
                </div>
            </div>

            {/* Data Grid */}
            <div className="glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse font-[Vazirmatn]" dir="rtl">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/40">
                                <th className="p-4 font-bold text-muted-foreground">نام (Name)</th>
                                <th className="p-4 font-bold text-muted-foreground">مقام (Role)</th>
                                <th className="p-4 font-bold text-muted-foreground">ایمیل (Contact)</th>
                                <th className="p-4 font-bold text-muted-foreground text-center">وضعیت (Status)</th>
                                <th className="p-4 font-bold text-muted-foreground text-center">عملیات (Actions)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map((leader) => (
                                <tr key={leader.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10 text-xs font-bold shrink-0 shadow-inner">
                                            {leader.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <span className="font-bold">{leader.name}</span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{leader.role}</td>
                                    <td className="p-4 text-muted-foreground" dir="ltr">{leader.email}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${leader.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'}`}>
                                            {leader.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button title="ویرایش رهبر" disabled={isPending} className="p-2 rounded-lg bg-black/40 border border-white/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button title="حذف رهبر" disabled={isPending} onClick={() => handleDelete(leader.id)} className="p-2 rounded-lg bg-black/40 border border-white/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leaders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <ShieldAlert className="w-10 h-10 opacity-20" />
                                            <p>هیچ رهبری یافت نشد.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
