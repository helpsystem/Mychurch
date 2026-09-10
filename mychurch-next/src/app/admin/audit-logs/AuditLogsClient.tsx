"use client";

import React, { useState, useTransition } from "react";
import { 
    Search, Filter, Shield, Activity, RotateCcw, 
    FileText, Trash2, ArrowUpRight, User, Calendar, 
    CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import { AuditLogItem, getAuditLogs } from "@/actions/audit";

interface AuditLogsClientProps {
    initialLogs: AuditLogItem[];
    totalCount: number;
    initialStats: {
        totalCount: number;
        todayCount: number;
        trashCount: number;
    };
}

export default function AuditLogsClient({ initialLogs, totalCount, initialStats }: AuditLogsClientProps) {
    const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
    const [total, setTotal] = useState(totalCount);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(Math.ceil(totalCount / 30) || 1);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [resourceFilter, setResourceFilter] = useState("all");
    const [isPending, startTransition] = useTransition();
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const handleFilterChange = (newSearch?: string, newAction?: string, newResource?: string, targetPage: number = 1) => {
        const s = newSearch !== undefined ? newSearch : search;
        const a = newAction !== undefined ? newAction : actionFilter;
        const r = newResource !== undefined ? newResource : resourceFilter;

        startTransition(async () => {
            const result = await getAuditLogs({
                search: s,
                action: a,
                resourceType: r,
                page: targetPage,
                limit: 30
            });
            setLogs(result.logs);
            setTotal(result.totalCount);
            setPage(result.page);
            setTotalPages(result.totalPages);
        });
    };

    const getActionBadge = (action: string) => {
        if (action.includes('UPLOAD')) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">آپلود مدیا</span>;
        }
        if (action.includes('TRASH')) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">انتقال به زباله‌دان</span>;
        }
        if (action.includes('RESTORE')) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">بازیابی مجدد</span>;
        }
        if (action.includes('PERMANENT')) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">حذف قطعی</span>;
        }
        if (action.includes('TELEGRAM')) {
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">ارسال به تلگرام</span>;
        }
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-white/10">{action}</span>;
    };

    const getRoleBadge = (role: string | null) => {
        const r = (role || 'User').toLowerCase();
        if (r === 'admin') {
            return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">ادمین</span>;
        }
        if (r === 'leader') {
            return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">رهبر</span>;
        }
        if (r === 'operator') {
            return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">اپراتور</span>;
        }
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">کاربر</span>;
    };

    const formatPersianDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-[Vazirmatn]">کل وقایع ثبت شده</p>
                        <h3 className="text-2xl font-black text-white mt-1 font-mono">{total.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-[Vazirmatn]">فعالیت‌های امروز</p>
                        <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">{initialStats.todayCount.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-[Vazirmatn]">آیتم‌های در انتظار تائید در زباله‌دان</p>
                        <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">{initialStats.trashCount.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Trash2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[260px] relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            handleFilterChange(e.target.value, undefined, undefined, 1);
                        }}
                        placeholder="جستجو بر اساس نام کاربر، ایمیل، عملیات یا منبع..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            handleFilterChange(undefined, e.target.value, undefined, 1);
                        }}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                    >
                        <option value="all">همه عملیات‌ها</option>
                        <option value="UPLOAD_MEDIA">آپلود مدیا</option>
                        <option value="TRASH_MEDIA">انتقال مدیا به زباله‌دان</option>
                        <option value="RESTORE_MEDIA">بازیابی مدیا</option>
                        <option value="PERMANENT_DELETE_MEDIA">حذف قطعی مدیا</option>
                        <option value="TRASH_PRESENTATION">انتقال پرزنتیشن به زباله‌دان</option>
                        <option value="RESTORE_PRESENTATION">بازیابی پرزنتیشن</option>
                        <option value="EXPORT_TELEGRAM">ارسال به تلگرام</option>
                    </select>

                    <select
                        value={resourceFilter}
                        onChange={(e) => {
                            setResourceFilter(e.target.value);
                            handleFilterChange(undefined, undefined, e.target.value, 1);
                        }}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                    >
                        <option value="all">همه منابع</option>
                        <option value="media">فایل‌های مدیا</option>
                        <option value="presentation">پرزنتیشن‌ها</option>
                        <option value="prayer">درخواست‌های دعا</option>
                        <option value="user">کاربران</option>
                    </select>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-muted-foreground font-[Vazirmatn] text-xs">
                            <tr>
                                <th className="p-4">زمان ثبت</th>
                                <th className="p-4">کاربر / انجام‌دهنده</th>
                                <th className="p-4">سطح دسترسی</th>
                                <th className="p-4">عملیات</th>
                                <th className="p-4">نوع منبع</th>
                                <th className="p-4">جزئیات</th>
                                <th className="p-4 text-center">مشاهده</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-[Vazirmatn]">
                            {isPending ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                        در حال بارگذاری لاگ‌ها...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                        هیچ لاگی با فیلترهای انتخابی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap" dir="ltr">
                                            {formatPersianDate(log.created_at)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-xs">{log.user_name || 'کاربر سیستم'}</span>
                                                <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">{log.user_email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getRoleBadge(log.user_role)}
                                        </td>
                                        <td className="p-4">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-cyan-400">
                                            {log.resource_type}
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground max-w-[200px] truncate" dir="ltr">
                                            {log.details?.fileName || log.details?.title || log.details?.filename || JSON.stringify(log.details || {})}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                                title="نمایش جزئیات کامل"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-[Vazirmatn]">
                            صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')} ({total.toLocaleString('fa-IR')} مورد)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleFilterChange(undefined, undefined, undefined, page - 1)}
                                disabled={page <= 1 || isPending}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFilterChange(undefined, undefined, undefined, page + 1)}
                                disabled={page >= totalPages || isPending}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/15 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="font-bold text-lg text-white font-[Vazirmatn]">جزئیات کامل واقعه</h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-muted-foreground hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 font-[Vazirmatn] text-sm">
                            <div className="grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-xl">
                                <div>
                                    <span className="text-xs text-muted-foreground block">شناسه لاگ:</span>
                                    <span className="text-xs font-mono text-white select-all">{selectedLog.id}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">زمان ثبت:</span>
                                    <span className="text-xs font-mono text-white">{formatPersianDate(selectedLog.created_at)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-xl">
                                <div>
                                    <span className="text-xs text-muted-foreground block">کاربر:</span>
                                    <span className="text-xs font-bold text-white">{selectedLog.user_name} ({selectedLog.user_email})</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">سطح نقش:</span>
                                    <span className="text-xs">{getRoleBadge(selectedLog.user_role)}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">داده‌های ساختاریافته (JSON):</span>
                                <pre className="bg-black/60 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 border border-white/5 select-all" dir="ltr">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-[Vazirmatn] transition-colors"
                            >
                                بستن پنجره
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
