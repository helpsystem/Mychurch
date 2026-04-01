"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

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

export default function CronLogsViewer() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<CronLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/cron-logs');
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                title="View Background Job Reports"
            >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium hidden sm:inline">گزارش ربات‌ها</span>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <Bot className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">گزارش پردازش‌های پس‌زمینه (Cron Jobs)</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={fetchLogs}
                                        disabled={isLoading}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                        title="Refresh"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {error && (
                                    <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {!isLoading && logs.length === 0 && !error && (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Bot className="w-12 h-12 mb-4 opacity-20" />
                                        <p>هیچ گزارشی یافت نشد.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {logs.map((log) => (
                                        <div key={log.id} className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 transition-colors hover:bg-slate-800/60">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    {log.status === 'Success' ? (
                                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                    ) : log.status === 'Partial Failure' ? (
                                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <span className="font-semibold text-white tracking-wide">{log.job_name}</span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                                        {new Date(log.created_at).toLocaleString('fa-IR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {(log.duration_ms / 1000).toFixed(1)}s
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mb-4">
                                                <div className="bg-slate-900/50 p-2 rounded justify-center items-center flex flex-col border border-slate-700/50">
                                                    <span className="text-xs text-slate-400 mb-1">کل پردازش</span>
                                                    <span className="font-mono text-lg text-white">{log.total_processed}</span>
                                                </div>
                                                <div className="bg-emerald-500/5 p-2 rounded justify-center items-center flex flex-col border border-emerald-500/10">
                                                    <span className="text-xs text-emerald-400/80 mb-1">موفقیت</span>
                                                    <span className="font-mono text-lg text-emerald-400">{log.success_count}</span>
                                                </div>
                                                <div className="bg-red-500/5 p-2 rounded justify-center items-center flex flex-col border border-red-500/10">
                                                    <span className="text-xs text-red-400/80 mb-1">شکست</span>
                                                    <span className="font-mono text-lg text-red-400">{log.failure_count}</span>
                                                </div>
                                            </div>

                                            {log.details && log.details.length > 0 && (
                                                <div className="mt-2 text-xs border border-slate-700/50 rounded overflow-hidden">
                                                    <table className="w-full text-right">
                                                        <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
                                                            <tr>
                                                                <th className="py-2 px-3">عنوان سرود</th>
                                                                <th className="py-2 px-3 w-24">وضعیت</th>
                                                                <th className="py-2 px-3">خطا (در صورت وجود)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-700/50">
                                                            {log.details.map((detail, idx) => (
                                                                <tr key={idx} className="bg-slate-800/20">
                                                                    <td className="py-2 px-3 text-slate-300 font-medium">{detail.title || 'سیستم'}</td>
                                                                    <td className="py-2 px-3">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${detail.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                            {detail.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-slate-500 font-mono">{detail.error || '-'}</td>
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
