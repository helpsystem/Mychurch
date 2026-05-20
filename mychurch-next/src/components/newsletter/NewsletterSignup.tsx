"use client";

import React, { useState, useTransition } from "react";
import { Mail, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { subscribeToNewsletter } from "@/actions/newsletter";

export function NewsletterSignup() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await subscribeToNewsletter(formData);
            if (result.success) {
                setMessage({ text: result.message || "با موفقیت ثبت شد!", type: 'success' });
                (e.target as HTMLFormElement).reset();
            } else {
                setMessage({ text: result.error || "خطا در ثبت ایمیل", type: 'error' });
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl" dir="rtl">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-[Vazirmatn] mb-2">عضویت در خبرنامه کلیسا</h3>
                <p className="text-sm text-slate-400 font-[Vazirmatn]">
                    با وارد کردن ایمیل خود، از جدیدترین اخبار، رویدادها و موعظه‌های کلیسا باخبر شوید.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="email"
                        name="email"
                        placeholder="ایمیل خود را وارد کنید..."
                        required
                        dir="ltr"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans text-left"
                    />
                </div>

                {message && (
                    <div className={`flex items-center gap-2 text-sm p-3 rounded-lg font-[Vazirmatn] ${
                        message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        {message.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 font-[Vazirmatn]"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            در حال ثبت...
                        </>
                    ) : (
                        <>
                            عضویت
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </>
                    )}
                </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-4 font-[Vazirmatn]">
                ما به حریم خصوصی شما احترام می‌گذاریم و هرگز ایمیل شما را با کسی به اشتراک نمی‌گذاریم.
            </p>
        </div>
    );
}
