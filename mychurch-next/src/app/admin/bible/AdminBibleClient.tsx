"use client";

import React, { useState } from "react";
import { syncBibleChapterAudioAI } from "@/actions/bible";
import { Sparkles, Loader2, PlayCircle, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

const USFM = [
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA",
    "1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO",
    "ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO",
    "OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",
    "MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH",
    "PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS",
    "1PE","2PE","1JN","2JN","3JN","JUD","REV",
];

const PERSIAN_NAMES: Record<string, string> = {
    "GEN": "پیدایش (GEN)", "EXO": "خروج (EXO)", "PSA": "مزامیر (PSA)", "PRO": "امثال (PRO)",
    "MAT": "متی (MAT)", "MRK": "مرقس (MRK)", "LUK": "لوقا (LUK)", "JHN": "یوحنا (JHN)",
    "ACT": "اعمال رسولان (ACT)", "ROM": "رومیان (ROM)", "REV": "مکاشفه (REV)"
};

export default function AdminBibleClient() {
    const [bookCode, setBookCode] = useState("JHN");
    const [chapter, setChapter] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Logs
    const [logs, setLogs] = useState<{ type: 'info' | 'success' | 'error', text: string }[]>([]);

    const addLog = (type: 'info' | 'success' | 'error', text: string) => {
        setLogs(prev => [...prev, { type, text }]);
    };

    const handleSync = async () => {
        setIsProcessing(true);
        addLog('info', `درحال آماده‌سازی باب ${chapter} از کتاب ${bookCode}...`);
        addLog('info', `دانلود فایل صوتی از سرور ابری و ارسال به Gemini Multimodal AI...`);
        
        try {
            const result = await syncBibleChapterAudioAI(bookCode, chapter);
            if (result.success) {
                addLog('success', `✅ موفقیت آمیز: ${result.message}`);
            } else {
                addLog('error', `❌ خطا: ${result.message}`);
            }
        } catch (error: any) {
            addLog('error', `❌ خطای سیستمی: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-foreground mb-3 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-indigo-500" />
                    استودیو پردازش صوتی انجیل (Gemini AI)
                </h1>
                <p className="text-muted-foreground text-lg">
                    با یک کلیک، صوت هر باب از کتاب مقدس را به صورت اتوماتیک در سطح میلی‌ثانیه با متن‌ها سینک کنید.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="col-span-1 border border-border/50 bg-secondary/5 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> کتاب (Book)
                        </label>
                        <select 
                            value={bookCode} 
                            onChange={(e) => setBookCode(e.target.value)}
                            className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            dir="ltr"
                        >
                            {USFM.map(code => (
                                <option key={code} value={code}>
                                    {PERSIAN_NAMES[code] || code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> باب (Chapter)
                        </label>
                        <input 
                            type="number"
                            min="1"
                            max="150"
                            value={chapter}
                            onChange={(e) => setChapter(Number(e.target.value))}
                            className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center text-xl tracking-wider"
                        />
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={isProcessing}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-4 rounded-xl font-black text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                در حال پردازش AI...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" /> شروع پردازش هوشمند
                            </>
                        )}
                    </button>
                    
                    <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium leading-relaxed flex gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        توجه: این فرآیند فایل صوتی از سرور دانلود کرده و به هوش مصنوعی گوگل ارسال میکند و ممکن است بین 15 تا 40 ثانیه برای هر باب زمان ببرد. لطفا تا اتمام آن صفحه را نبندید.
                    </div>
                </div>

                {/* Log View */}
                <div className="col-span-1 md:col-span-2 bg-[#0B0F19] rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col font-mono relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-gray-400 font-bold tracking-wider text-sm">TERMINAL LOGS</h3>
                        {isProcessing && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 font-[Vazirmatn] text-sm">
                        {logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-600 italic">
                                منتظر دستور پردازش...
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`flex items-start gap-2 ${
                                    log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'success' ? 'text-emerald-400' :
                                    'text-indigo-200'
                                }`}>
                                    <span className="shrink-0 mt-0.5">
                                        {log.type === 'error' ? '›' : log.type === 'success' ? '✓' : '›'}
                                    </span>
                                    <span>{log.text}</span>
                                </div>
                            ))
                        )}
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-gray-500 mt-4 animate-pulse">
                                <span>›</span> در حال برقراری ارتباط با پلتفرم سرورهای گوگل...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
