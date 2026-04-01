"use client";

import React, { useState, useTransition } from "react";
import { MonitorPlay, Plus, Search, Trash2, Edit2, ShieldAlert, FileJson, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { BroadcastSession } from "@/types/broadcast";
import { deletePresentation, savePresentation } from "@/actions/presentations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

export default function PresentationsClient({ initialPresentations }: { initialPresentations: BroadcastSession[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [presentations, setPresentations] = useState<BroadcastSession[]>(initialPresentations);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { t, language } = useLanguage();

    const statusHelp: Array<{ key: BroadcastSession['status']; label: string; desc: string }> = [
        {
            key: 'draft',
            label: 'پیش نویس',
            desc: 'مناسب برای ساخت اولیه اسلایدها، تغییرات سریع، و بازبینی داخلی.',
        },
        {
            key: 'ready',
            label: 'آماده پخش',
            desc: 'جلسه تایید شده و آماده شروع در زمان برنامه است.',
        },
        {
            key: 'live',
            label: 'زنده',
            desc: 'جلسه در حال اجرا است و برای پخش/نمایش لحظه ای استفاده می شود.',
        },
        {
            key: 'ended',
            label: 'آرشیو',
            desc: 'جلسه پایان یافته و برای رجوع بعدی، گزارش و استفاده مجدد نگهداری می شود.',
        },
    ];

    const statusLabel: Record<BroadcastSession['status'], string> = {
        draft: 'پیش نویس',
        ready: 'آماده پخش',
        live: 'زنده',
        ended: 'آرشیو',
    };

    const handleCreateNew = () => {
        const newId = crypto.randomUUID();
        const newSession: BroadcastSession = {
            id: newId,
            title: `${t.newSessionTitle} ${new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}`,
            date: new Date(),
            hostName: t.teamWorshipMedia,
            slides: [],
            status: 'draft'
        };

        startTransition(async () => {
             const res = await savePresentation(newSession);
             if (res.success && res.serverSaved) {
                 toast.success("Presentation Created. Routing to builder...");
                 router.push(`/broadcast/builder?id=${newId}`);
             } else if (res.success && !res.serverSaved) {
                 toast.error(res.error || "Saved locally only. Server save failed.");
             } else {
                 toast.error(res.error || "Failed to create presentation.");
             }
        });
    };

    const handleDelete = (id: string) => {
        if (confirm(t.deleteConfirm || "Are you sure?")) {
            startTransition(async () => {
                const res = await deletePresentation(id);
                if (res.success) {
                    setPresentations(presentations.filter(p => p.id !== id));
                    toast.success(t.presentationDeleted || "Deleted");
                } else {
                    toast.error(t.deleteError || "Error deleting");
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <MonitorPlay className="w-8 h-8 text-indigo-500" />
                        {t.presentationsManagement || 'Presentations Management'}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t.presentationsDesc || 'Manage slide sessions'}</p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-500 transition-all font-[Vazirmatn] disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" /> {t.newPresentation || 'New Presentation'}
                </button>
            </div>

            {/* Controls */}
            <div className="glass-strong p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                <div className="relative w-full z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t.searchPresentations || "Search..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-[Vazirmatn]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" dir="rtl">
                {statusHelp.map((item) => (
                    <div key={item.key} className="glass-strong border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-bold text-indigo-300">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-6">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Presentations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-[Vazirmatn]" dir="rtl">
                {presentations.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((pres) => (
                    <div key={pres.id} className="glass-strong rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between group hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 relative">
                        <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none" />
                        
                        <div className="relative z-10 p-6 flex-grow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner shadow-indigo-500/20">
                                    <FileJson className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] tracking-widest px-3 py-1 rounded-full font-bold border ${pres.status === 'live' ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'}`}>
                                    {statusLabel[pres.status] || pres.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 truncate" title={pres.title}>{pres.title}</h3>
                            
                            <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2"><CalIcon className="w-4 h-4" /> {new Date(pres.date).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                                <span className="flex items-center gap-2"><MonitorPlay className="w-4 h-4" /> {pres.slides?.length || 0} Slides</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/40 border-t border-white/10 relative z-10 group-hover:bg-indigo-950/20 transition-colors">
                             <div className="flex items-center gap-2">
                                <Link href={`/broadcast/builder?id=${pres.id}`} title={t.openInPresenter} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg">
                                    <MonitorPlay className="w-4 h-4" />
                                </Link>
                             </div>
                             <div className="flex items-center gap-2">
                                <Link href={`/broadcast/builder?id=${pres.id}`} title={t.editOutput} className="p-2 text-muted-foreground hover:text-white transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </Link>
                                <button title={t.delete} onClick={() => handleDelete(pres.id)} disabled={isPending} className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {presentations.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center text-muted-foreground glass-strong border border-dashed border-white/20 rounded-3xl">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <ShieldAlert className="w-10 h-10 opacity-20" />
                            <p>{t.noPresentations}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
