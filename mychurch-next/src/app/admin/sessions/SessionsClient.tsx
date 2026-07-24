"use client";

import React, { useState } from 'react';
import { Play, CheckCircle2, Share2, Music, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionsClient({ initialSessions }: { initialSessions: any[] }) {
    const [sessions, setSessions] = useState(initialSessions);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    const handlePublish = async (sessionId: string) => {
        if (!confirm('آیا از انتشار این جلسه در کانال عمومی تلگرام اطمینان دارید؟')) return;

        setPublishingId(sessionId);
        try {
            const res = await fetch('/api/admin/sessions/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to publish');

            toast.success('جلسه با موفقیت در کانال عمومی منتشر شد!');
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'published', telegram_public_message_id: data.publicMessageId } : s));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setPublishingId(null);
        }
    };

    if (sessions.length === 0) {
        return (
            <div className="bg-neutral-900 border border-border/10 rounded-2xl p-12 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold font-[Vazirmatn] text-white">هیچ جلسه‌ای ضبط نشده است</h3>
                <p className="text-muted-foreground mt-2 font-[Vazirmatn]">
                    برای ضبط جلسه، در بخش Live Console گزینه رکورد را فعال کنید.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-[Vazirmatn]">
            {sessions.map(session => (
                <div key={session.id} className="bg-neutral-900 border border-border/10 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-5 border-b border-border/5 bg-neutral-950/30 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-white">{session.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1" dir="ltr">
                                <Clock className="w-3 h-3" />
                                {new Date(session.session_date).toLocaleString('fa-IR')}
                            </div>
                        </div>
                        {session.status === 'published' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                منتشر شده
                            </span>
                        ) : (
                            <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-xs border border-amber-500/20">
                                در انتظار انتشار
                            </span>
                        )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-4">
                        {/* Audio Player */}
                        {session.media_library ? (
                            <audio 
                                controls 
                                className="w-full h-10 custom-audio" 
                                src={`/api/serve/cloud/${session.media_library.id}`} 
                            />
                        ) : (
                            <div className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> فایل صوتی یافت نشد
                            </div>
                        )}

                        {/* Metadata summary */}
                        <div className="space-y-3 mt-2 text-sm bg-black/20 p-3 rounded-xl border border-white/5">
                            <div>
                                <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5"><Music className="w-4 h-4" /> سرودها:</h4>
                                <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1 pr-2">
                                    {(session.metadata || []).filter((m: any) => m.type === 'song').map((m: any, i: number) => (
                                        <li key={i}>{m.title} <span className="opacity-50">({m.details})</span></li>
                                    ))}
                                    {(session.metadata || []).filter((m: any) => m.type === 'song').length === 0 && <li>سرودی ثبت نشده</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-indigo-400 font-bold mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> آیات خوانده شده:</h4>
                                <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1 pr-2">
                                    {(session.metadata || []).filter((m: any) => m.type === 'scripture').map((m: any, i: number) => (
                                        <li key={i} dir="ltr" className="text-right">{m.title}</li>
                                    ))}
                                    {(session.metadata || []).filter((m: any) => m.type === 'scripture').length === 0 && <li>آیه‌ای ثبت نشده</li>}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border/10 bg-neutral-900 flex justify-end">
                        {session.status !== 'published' ? (
                            <button
                                onClick={() => handlePublish(session.id)}
                                disabled={publishingId === session.id || !session.media_library}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all w-full justify-center"
                            >
                                <Share2 className="w-4 h-4" />
                                {publishingId === session.id ? 'در حال انتشار...' : 'انتشار در کانال عمومی'}
                            </button>
                        ) : (
                            <div className="text-xs text-muted-foreground flex justify-center w-full p-2">
                                این جلسه قبلا منتشر شده است.
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
