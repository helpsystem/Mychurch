"use client";

import React, { useState, useTransition, useEffect } from "react";
import { MonitorPlay, Plus, Search, Trash2, Edit2, ShieldAlert, FileJson, Calendar as CalIcon, Share2, Loader2, Play, Video, Clock, MoreVertical, ChevronDown, Check, BookOpen, Eye, Copy, CalendarDays, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { BroadcastSession } from "@/types/broadcast";
import { deletePresentation, savePresentation } from "@/actions/presentations";
import { scheduleEvent } from "@/actions/events";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import ProgramSchedulePanel from "./ProgramSchedulePanel";
import type { ChurchProgramCategory, ChurchProgram } from "@/types/church-programs";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

type ActiveTab = 'presentations' | 'schedule';

export default function PresentationsClient({
    initialPresentations,
    initialCategories,
    initialPrograms,
}: {
    initialPresentations: SerializedBroadcastSession[];
    initialCategories: ChurchProgramCategory[];
    initialPrograms: ChurchProgram[];
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [presentations, setPresentations] = useState<BroadcastSession[]>(() =>
        initialPresentations.map((presentation) => ({
            ...presentation,
            date: new Date(presentation.date),
        }))
    );
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [viewingId, setViewingId] = useState<string | null>(null);
    
    // UI Interaction States
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(true);

    // Scheduling State
    const [schedulingPresId, setSchedulingPresId] = useState<string | null>(null);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<ActiveTab>('presentations');
    const router = useRouter();
    const { t, language } = useLanguage();

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
            title: `${t.newSessionTitle || 'ارائه جدید'} ${new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}`,
            date: new Date(),
            hostName: t.teamWorshipMedia || 'تیم پرستش و رسانه',
            slides: [],
            status: 'draft'
        };

        startTransition(async () => {
             const res = await savePresentation(newSession);
             if (res.success && res.serverSaved) {
                 toast.success("ارائه با موفقیت ساخته شد. در حال هدایت به ویرایشگر...");
                 router.push(`/broadcast/builder?id=${newId}`);
             } else if (res.success && !res.serverSaved) {
                 toast.error(res.error || "Saved locally only. Server save failed.");
             } else {
                 toast.error(res.error || "Failed to create presentation.");
             }
         });
    };

    const handleDelete = (id: string) => {
        if (confirm(t.deleteConfirm || "آیا از حذف این ارائه مطمئن هستید؟")) {
            startTransition(async () => {
                const res = await deletePresentation(id);
                if (res.success) {
                    setPresentations(presentations.filter(p => p.id !== id));
                    toast.success(t.presentationDeleted || "ارائه با موفقیت حذف شد");
                } else {
                    toast.error(t.deleteError || "خطا در حذف ارائه");
                }
            });
        }
    };

    const handleStatusChange = async (presentation: BroadcastSession, newStatus: BroadcastSession['status']) => {
        const updated: BroadcastSession = {
            ...presentation,
            status: newStatus
        };
        
        // Optimistic UI Update
        setPresentations(prev => prev.map(p => p.id === presentation.id ? updated : p));
        
        startTransition(async () => {
            const res = await savePresentation(updated);
            if (res.success) {
                toast.success(`وضعیت ارائه به "${statusLabel[newStatus]}" تغییر یافت`);
            } else {
                // Revert
                setPresentations(prev => prev.map(p => p.id === presentation.id ? presentation : p));
                toast.error(res.error || "خطا در بروزرسانی وضعیت");
            }
        });
    };

    const handleCopyShareLink = async (sessionId: string) => {
        setSharingId(sessionId);
        try {
            const tokenRes = await fetch('/api/broadcast/viewer-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData?.token) {
                throw new Error(tokenData?.error || 'token_failed');
            }

            const viewerUrl = `${window.location.origin}/broadcast/view?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(tokenData.token)}`;
            await navigator.clipboard.writeText(viewerUrl);
            toast.success(language === 'fa' ? 'لینک نمایشگر پروژکتور کپی شد' : 'Viewer projector link copied');
        } catch (error: any) {
            toast.error(error?.message || (language === 'fa' ? 'خطا در ساخت لینک اشتراک' : 'Failed to generate share link'));
        } finally {
            setSharingId(null);
        }
    };

    const handleOpenViewer = async (sessionId: string) => {
        setViewingId(sessionId);
        try {
            const tokenRes = await fetch('/api/broadcast/viewer-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData?.token) {
                throw new Error(tokenData?.error || 'token_failed');
            }
            window.open(`/broadcast/view?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(tokenData.token)}`, '_blank');
            toast.success(language === 'fa' ? 'نمایشگر در تب جدید باز شد' : 'Projector view opened in a new tab');
        } catch (error: any) {
            toast.error(language === 'fa' ? 'خطا در باز کردن نمایشگر' : 'Failed to open presenter');
        } finally {
            setViewingId(null);
        }
    };

    const handleScheduleEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedulingPresId || !scheduleDate || !scheduleTime) return;
        
        setIsScheduling(true);
        const pres = presentations.find(p => p.id === schedulingPresId);
        if (!pres) return;

        const dateTimeStr = `${scheduleDate}T${scheduleTime}:00`;
        const res = await scheduleEvent(pres.title, dateTimeStr, pres.id);
        
        if (res.success) {
            toast.success("جلسه با موفقیت زمان‌بندی شد و ایمیل‌ها ارسال گردید.");
            setSchedulingPresId(null);
        } else {
            toast.error(res.error || "خطا در زمان‌بندی جلسه");
        }
        setIsScheduling(false);
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleOutsideClick = () => {
            setActiveMenuId(null);
            setActiveStatusDropdownId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <MonitorPlay className="w-8 h-8 text-indigo-500" />
                        {t.presentationsManagement || 'مدیریت ارائه‌ها و اسلایدها'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t.presentationsDesc || 'ساخت، ویرایش، زمان‌بندی و مدیریت ارائه‌های پخش زنده کلیسا'}
                    </p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all font-[Vazirmatn] disabled:opacity-50 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> {t.newPresentation || 'ارائه جدید'}
                </button>
            </div>

            {/* ─── Tab Switcher ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1 p-1.5 bg-black/40 border border-white/10 rounded-2xl w-fit" dir="rtl">
                <button
                    onClick={() => setActiveTab('presentations')}
                    className={cn(
                        "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold font-[Vazirmatn] transition-all duration-200",
                        activeTab === 'presentations'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" />
                    ارائه‌ها
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={cn(
                        "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold font-[Vazirmatn] transition-all duration-200",
                        activeTab === 'schedule'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                >
                    <CalendarDays className="w-4 h-4" />
                    برنامه‌ریزی کلیسا
                </button>
            </div>

            {/* ─── Tab: Schedule ────────────────────────────────────────── */}
            {activeTab === 'schedule' && (
                <ProgramSchedulePanel
                    initialCategories={initialCategories}
                    initialPrograms={initialPrograms}
                    presentations={presentations}
                />
            )}

            {/* ─── Tab: Presentations ───────────────────────────────────── */}
            {activeTab === 'presentations' && (<>

            {/* Step-by-Step 0-to-100 Interactive Guide */}
            <div className="glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none" />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowGuide(!showGuide);
                    }}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-right relative z-10"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-[Vazirmatn]">📖 راهنمای تصویری گام‌به‌گام ارائه‌ها (از ۰ تا ۱۰۰)</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">چگونه یک فایل ارائه را بسازید، زمان‌بندی کنید و روی پروژکتور سالن پخش نمایید.</p>
                        </div>
                    </div>
                    <ChevronDown className={cn("w-6 h-6 transition-transform duration-300 text-muted-foreground", showGuide && "rotate-180")} />
                </button>
                {showGuide && (
                    <div className="p-6 border-t border-white/5 bg-black/30 relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-right" dir="rtl">
                            
                            {/* Step 1 */}
                            <div className="glass-strong border border-white/5 p-5 rounded-2xl relative hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">۱</div>
                                    <h3 className="font-bold text-base text-indigo-300 mt-2 font-[Vazirmatn]">ایجاد سند ارائه</h3>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-[Vazirmatn]">
                                        در بالای همین صفحه روی دکمه <strong className="text-white">ارائه جدید</strong> کلیک کنید. یک ارائه پیش‌نویس (Draft) ساخته می‌شود و شما وارد محیط «طراحی اسلایدها» خواهید شد.
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg w-max font-[Vazirmatn]">
                                    <Plus className="w-3.5 h-3.5" /> وضعیت پیش‌فرض: پیش‌نویس
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="glass-strong border border-white/5 p-5 rounded-2xl relative hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">۲</div>
                                    <h3 className="font-bold text-base text-indigo-300 mt-2 font-[Vazirmatn]">طراحی و ویرایش</h3>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-[Vazirmatn]">
                                        در بخش ویرایش اسلایدها، سرودهای پرستشی، اعلانات یا آیات کتاب‌مقدس را اضافه کنید. فونت BHoma یا Roboto را تنظیم کنید و در انتها تغییرات را ذخیره نمایید.
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg w-max font-[Vazirmatn]">
                                    <Edit2 className="w-3.5 h-3.5" /> ابزار قدرتمند اسلایدمیساز
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="glass-strong border border-white/5 p-5 rounded-2xl relative hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">۳</div>
                                    <h3 className="font-bold text-base text-indigo-300 mt-2 font-[Vazirmatn]">آماده‌سازی و زمان‌بندی</h3>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-[Vazirmatn]">
                                        پس از تکمیل، وضعیت آن را به <strong className="text-white">آماده پخش</strong> تغییر دهید. از منوی سه نقطه نیز می‌توانید لایو استریم را زمان‌بندی و دعوتنامه ایمیلی بفرستید.
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg w-max font-[Vazirmatn]">
                                    <Video className="w-3.5 h-3.5" /> همگام با FreeConferenceCall
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="glass-strong border border-white/5 p-5 rounded-2xl relative hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">۴</div>
                                    <h3 className="font-bold text-base text-indigo-300 mt-2 font-[Vazirmatn]">پخش زنده و نمایشگر سالن</h3>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-[Vazirmatn]">
                                        در روز جلسه دکمه بنفش <strong className="text-white">ورود به اتاق کنترل</strong> را بزنید. در نمایشگر سالن کلیسا نیز گزینه «نمایشگر پروژکتور» را باز کنید تا اسلایدها همگام شوند.
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg w-max font-[Vazirmatn]">
                                    <MonitorPlay className="w-3.5 h-3.5" /> کنترل و پخش تمام خودکار
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Filter / Search Controls */}
            <div className="glass-strong p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                <div className="relative w-full z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t.searchPresentations || "جستجوی ارائه‌ها..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-[Vazirmatn]"
                    />
                </div>
            </div>

            {/* Presentations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-[Vazirmatn]" dir="rtl">
                {presentations.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((pres) => (
                    <div 
                        key={pres.id} 
                        className={cn(
                            "glass-strong rounded-3xl border border-white/10 flex flex-col justify-between group hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 relative",
                            (activeMenuId === pres.id || activeStatusDropdownId === pres.id) ? "z-30" : "z-10"
                        )}
                    >
                        <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none rounded-3xl" />
                        
                        <div className="relative z-10 p-6 flex-grow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner shadow-indigo-500/20">
                                    <FileJson className="w-6 h-6" />
                                </div>

                                {/* Dynamic Interactive Status Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null); // close other menu
                                            setActiveStatusDropdownId(activeStatusDropdownId === pres.id ? null : pres.id);
                                        }}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 transition-all bg-neutral-950/60 cursor-pointer hover:bg-neutral-900",
                                            pres.status === 'live' && 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
                                            pres.status === 'ready' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                                            pres.status === 'draft' && 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
                                            pres.status === 'ended' && 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                                        )}
                                    >
                                        <span>{statusLabel[pres.status] || pres.status}</span>
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </button>
                                    
                                    {activeStatusDropdownId === pres.id && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setActiveStatusDropdownId(null)} />
                                            <div className="absolute left-0 mt-2 w-36 rounded-xl bg-neutral-900 border border-white/10 p-1 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-right">
                                                {(['draft', 'ready', 'live', 'ended'] as BroadcastSession['status'][]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(pres, status);
                                                            setActiveStatusDropdownId(null);
                                                        }}
                                                        className={cn(
                                                            "w-full text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between hover:bg-white/5 cursor-pointer",
                                                            pres.status === status ? "text-indigo-400 bg-indigo-500/5" : "text-white/70"
                                                        )}
                                                    >
                                                        <span>{statusLabel[status]}</span>
                                                        {pres.status === status && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2 truncate text-white" title={pres.title}>{pres.title}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{pres.hostName || 'تیم رسانه'}</p>
                            
                            <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <CalIcon className="w-4 h-4 text-indigo-400/80" /> 
                                    {new Date(pres.date).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                                </span>
                                <span className="flex items-center gap-2">
                                    <MonitorPlay className="w-4 h-4 text-indigo-400/80" /> 
                                    {pres.slides?.length || 0} اسلاید
                                </span>
                            </div>
                        </div>

                         {/* Action Buttons Footer */}
                         <div className="flex items-center justify-between p-4 bg-black/40 border-t border-white/10 relative z-10 group-hover:bg-indigo-950/20 transition-colors gap-3 rounded-b-[23px]">
                              
                              {/* Primary & Secondary buttons container */}
                              <div className="flex items-center gap-2 flex-grow">
                                  {/* 🎬 ورود به اتاق کنترل (پخش) */}
                                  <Link
                                      href={`/broadcast?id=${pres.id}`}
                                      className="flex-grow flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg text-xs font-bold shadow-indigo-600/20 active:scale-95 text-center"
                                      title="ورود به اتاق کنترل و پخش زنده"
                                  >
                                      <MonitorPlay className="w-4 h-4" />
                                      <span>اتاق کنترل (پخش)</span>
                                  </Link>

                                  {/* ✏️ ویرایش اسلایدها */}
                                  <Link 
                                      href={`/broadcast/builder?id=${pres.id}`}
                                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 rounded-xl transition-all text-xs font-bold active:scale-95"
                                      title="ویرایش اسلایدها"
                                  >
                                      <Edit2 className="w-4 h-4 opacity-75" />
                                      <span className="hidden md:inline">ویرایش</span>
                                  </Link>

                                  {/* 📂 اطلاعات و فایل‌ها (Assets) */}
                                  <Link 
                                      href={`/admin/presentations/${pres.id}`}
                                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all text-xs font-bold active:scale-95"
                                      title="فایل‌های جلسه و استوریج"
                                  >
                                      <BookOpen className="w-4 h-4" />
                                      <span className="hidden md:inline">جزئیات جلسه</span>
                                  </Link>
                              </div>

                              {/* More Actions Dropdown Toggle */}
                              <div className="relative">
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStatusDropdownId(null); // close other dropdown
                                          setActiveMenuId(activeMenuId === pres.id ? null : pres.id);
                                      }}
                                      className="p-2.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 transition-colors shadow-lg border border-white/10 cursor-pointer"
                                      title="اقدامات بیشتر"
                                  >
                                      <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {activeMenuId === pres.id && (
                                      <>
                                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                                          <div className="absolute left-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-white/10 p-1.5 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-right">
                                              
                                              {/* 📅 زمان‌بندی جلسه لایو */}
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSchedulingPresId(pres.id);
                                                      setActiveMenuId(null);
                                                  }}
                                                  className="w-full text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
                                              >
                                                  <Video className="w-4 h-4 text-indigo-400" />
                                                  <span>زمان‌بندی جلسه لایو (FCC)</span>
                                              </button>

                                              {/* 📺 نمایشگر پروژکتور */}
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenViewer(pres.id);
                                                      setActiveMenuId(null);
                                                  }}
                                                  disabled={viewingId === pres.id}
                                                  className="w-full text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer disabled:opacity-50"
                                              >
                                                  {viewingId === pres.id ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                                                  <span>نمایشگر پروژکتور سالن</span>
                                              </button>

                                              {/* 📤 کپی لینک نمایشگر */}
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCopyShareLink(pres.id);
                                                      setActiveMenuId(null);
                                                  }}
                                                  disabled={sharingId === pres.id}
                                                  className="w-full text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer disabled:opacity-50"
                                              >
                                                  {sharingId === pres.id ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                                                  <span>کپی لینک پروژکتور</span>
                                              </button>

                                              <div className="my-1 border-t border-white/10" />

                                              {/* 🗑️ حذف ارائه */}
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDelete(pres.id);
                                                      setActiveMenuId(null);
                                                  }}
                                                  className="w-full text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                                              >
                                                  <Trash2 className="w-4 h-4 text-red-500" />
                                                  <span>حذف ارائه</span>
                                              </button>
                                              
                                          </div>
                                      </>
                                  )}
                              </div>

                         </div>
                    </div>
                ))}
                
                {presentations.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center text-muted-foreground glass-strong border border-dashed border-white/20 rounded-3xl">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <ShieldAlert className="w-10 h-10 opacity-20" />
                            <p>{t.noPresentations || 'هیچ ارائه‌ای یافت نشد'}</p>
                        </div>
                    </div>
                )}
            </div>

            </>)}{/* end activeTab === 'presentations' */}

            {/* Schedule Modal */}
            {schedulingPresId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-right">
                        <button onClick={() => setSchedulingPresId(null)} className="absolute top-4 left-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full cursor-pointer">✕</button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white">زمان‌بندی جلسه لایو</h3>
                                <p className="text-sm text-muted-foreground">ارسال دعوتنامه و ایجاد کانکشن وب در FreeConferenceCall</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleScheduleEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-white/70 mb-2">تاریخ برگزاری</label>
                                <input 
                                    type="date" 
                                    required
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white/70 mb-2">ساعت شروع (به وقت محلی)</label>
                                <input 
                                    type="time" 
                                    required
                                    value={scheduleTime}
                                    onChange={e => setScheduleTime(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-white"
                                    dir="ltr"
                                />
                            </div>
                            
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 mt-4 leading-relaxed">
                                <strong>توجه:</strong> با ذخیره این فرم، یک جلسه در سیستم FreeConferenceCall ایجاد شده و ایمیل اطلاع‌رسانی حاوی شماره تماس، کد دسترسی و لینک وب زنده به صورت خودکار برای تمامی اعضای خبرنامه ارسال خواهد شد.
                            </div>

                            <button type="submit" disabled={isScheduling} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center mt-6 cursor-pointer">
                                {isScheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ثبت و ارسال دعوتنامه'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
