"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Play, Square, Settings, Zap, Database } from 'lucide-react';

interface CronStats {
    total_songs: string;
    eligible_songs: string;
    enriched_songs: string;
}

interface CronLog {
    id: number;
    job_name: string;
    status: string;
    duration_ms: number;
    total_processed: number;
    success_count: number;
    failure_count: number;
    details: any[];
    created_at: string;
}

export default function CronDashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<CronLog[]>([]);
    const [stats, setStats] = useState<CronStats | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [interval, setIntervalVal] = useState("5");
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch PM2 Status & Stats
            const resStatus = await fetch('/api/admin/cron-control');
            if (resStatus.ok) {
                const data = await resStatus.json();
                setStats(data.stats);
                setIsRunning(data.isRunning);
            }

            // Fetch Logs
            const resLogs = await fetch('/api/admin/cron-logs');
            if (resLogs.ok) {
                const data = await resLogs.json();
                setLogs(data.logs || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleAction = async (action: 'start' | 'stop' | 'run_once') => {
        setIsActionLoading(true);
        try {
            const res = await fetch('/api/admin/cron-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, interval })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            // Refresh data
            await fetchData();
        } catch (err: any) {
            alert("خطا در اعمال تغییرات: " + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const eligible = parseInt(stats?.eligible_songs || "0");
    const enriched = parseInt(stats?.enriched_songs || "0");
    const progressPercent = eligible > 0 ? Math.round((enriched / eligible) * 100) : 0;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shadow-sm border border-slate-700 font-bold"
                title="اتاق فرمان پردازش پس‌زمینه"
            >
                <Bot className={`w-5 h-5 ${isRunning ? 'text-emerald-400 rotate-12 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-sm">اتاق فرمان Automation</span>
                {isRunning && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>}
            </button>

            {/* Modal Dashboard */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/80">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                        <Bot className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">اتاق فرمان پردازش مستمر (Cron Manager)</h2>
                                        <p className="text-sm text-slate-400 mt-1">مدیریت لیریک‌ساز و ترجمه با هوش مصنوعی در پس‌زمینه</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={fetchData}
                                        disabled={isLoading}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-slate-600"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    {/* STATUS WIDGET */}
                                    <div className="col-span-1 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-inner">
                                        <h3 className="text-slate-400 text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest"><Settings className="w-4 h-4" /> وضعیت سیستـم (PM2)</h3>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-500'}`}></div>
                                                <span className={`text-xl font-black ${isRunning ? 'text-emerald-400' : 'text-red-400'}`}>{isRunning ? 'روشن (ONLINE)' : 'خاموش (OFF)'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleAction('start')}
                                                    disabled={isRunning || isActionLoading}
                                                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Play className="w-4 h-4" /> روشن کن
                                                </button>
                                                <button 
                                                    onClick={() => handleAction('stop')}
                                                    disabled={!isRunning || isActionLoading}
                                                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Square className="w-4 h-4" /> توقف
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleAction('run_once')}
                                                disabled={isActionLoading}
                                                className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg rounded-xl font-bold transition"
                                            >
                                                <Zap className="w-4 h-4" /> یک بار هم‌اکنون اجرا کن
                                            </button>
                                            
                                            <div className="mt-4 pt-4 border-t border-slate-800">
                                                <label className="text-xs font-bold text-slate-500 mb-2 block">فاصله زمانی اجرا (دقیقه)</label>
                                                <select 
                                                    value={interval}
                                                    onChange={e => setIntervalVal(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 rtl"
                                                    disabled={isRunning}
                                                >
                                                    <option value="5">هر ۵ دقیقه (پیشنهادی)</option>
                                                    <option value="15">هر ۱۵ دقیقه</option>
                                                    <option value="60">هر یک ساعت</option>
                                                </select>
                                                <p className="text-[10px] text-slate-500 mt-2">برای تغییر زمان، ابتدا ربات را خاموش کنید.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PROGRESS WIDGET */}
                                    <div className="col-span-1 lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-inner">
                                        <h3 className="text-slate-400 text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest"><Database className="w-4 h-4" /> پیشرفت غنی‌سازی دیتابیس</h3>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                                                <span className="text-2xl font-mono text-white">{stats?.total_songs || 0}</span>
                                                <span className="text-xs text-slate-500 mt-1 font-bold">کل سرودها</span>
                                            </div>
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                                                <span className="text-2xl font-mono text-blue-400">{eligible}</span>
                                                <span className="text-xs text-slate-500 mt-1 font-bold">آماده پردازش</span>
                                            </div>
                                            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex flex-col items-center">
                                                <span className="text-2xl font-mono text-emerald-400">{enriched}</span>
                                                <span className="text-xs text-emerald-500/80 mt-1 font-bold">سینک شده</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="font-bold text-white text-lg">{progressPercent}% کامل شده</span>
                                                <span className="text-sm font-mono text-slate-400">{enriched} / {eligible}</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-6 border border-slate-800 overflow-hidden relative">
                                                <div 
                                                    className="bg-gradient-to-l from-emerald-400 to-indigo-500 h-6 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                                    style={{ width: `${progressPercent}%` }}
                                                >
                                                    <div className="w-full absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-20 hover:animate-[slide_10s_linear_infinite]"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 text-left" dir="ltr">Songs needing AI processing: {eligible - enriched}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* LOGS TABLE */}
                                <h3 className="text-slate-400 text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest">
                                    <Clock className="w-4 h-4" /> تاریخچه اجرای ربات
                                </h3>
                                
                                {error && (
                                    <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {logs.map((log) => (
                                        <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-colors hover:border-slate-700">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    {log.status === 'Success' ? (
                                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                    ) : log.status === 'Partial Failure' ? (
                                                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-red-400" />
                                                    )}
                                                    <span className="font-bold text-lg text-white">پردازش دسته‌ای</span>
                                                    <span className="text-sm px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                                                        {new Date(log.created_at).toLocaleString('fa-IR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <span className="block text-xs text-slate-500 mb-1">موفق</span>
                                                        <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{log.success_count}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-xs text-slate-500 mb-1">خطا</span>
                                                        <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{log.failure_count}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                                        <Clock className="w-4 h-4" />
                                                        {(log.duration_ms / 1000).toFixed(1)}s
                                                    </div>
                                                </div>
                                            </div>

                                            {log.details && log.details.length > 0 && (
                                                <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden">
                                                    <table className="w-full text-right text-sm">
                                                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                                            <tr>
                                                                <th className="py-2.5 px-4">عنوان سرود</th>
                                                                <th className="py-2.5 px-4 w-28">وضعیت</th>
                                                                <th className="py-2.5 px-4 text-left">خطا در صورت وجود</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/60">
                                                            {log.details.map((detail, idx) => (
                                                                <tr key={idx} className="bg-slate-900/50 hover:bg-slate-800/30">
                                                                    <td className="py-2.5 px-4 text-slate-300 font-medium">{detail.title || 'سیستم'}</td>
                                                                    <td className="py-2.5 px-4">
                                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${detail.status === 'Success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                                                            {detail.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-slate-500 font-mono text-xs text-left" dir="ltr">{detail.error || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
