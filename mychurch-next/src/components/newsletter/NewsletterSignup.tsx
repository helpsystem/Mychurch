"use client";

import React, { useState, useTransition } from "react";
import { Mail, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        title: "Subscribe to the Church Newsletter",
        subtitle: "Enter your email to stay up to date with the latest church news, events, and sermons.",
        emailPlaceholder: "Enter your email...",
        submitting: "Submitting...",
        submit: "Subscribe",
        defaultSuccess: "Successfully subscribed!",
        defaultError: "Error submitting email",
        privacyNote: "We respect your privacy and will never share your email with anyone.",
    },
    fa: {
        title: "عضویت در خبرنامه کلیسا",
        subtitle: "با وارد کردن ایمیل خود، از جدیدترین اخبار، رویدادها و موعظه‌های کلیسا باخبر شوید.",
        emailPlaceholder: "ایمیل خود را وارد کنید...",
        submitting: "در حال ثبت...",
        submit: "عضویت",
        defaultSuccess: "با موفقیت ثبت شد!",
        defaultError: "خطا در ثبت ایمیل",
        privacyNote: "ما به حریم خصوصی شما احترام می‌گذاریم و هرگز ایمیل شما را با کسی به اشتراک نمی‌گذاریم.",
    },
    es: {
        title: "Suscríbete al Boletín de la Iglesia",
        subtitle: "Ingrese su correo electrónico para mantenerse al día con las últimas noticias, eventos y sermones de la iglesia.",
        emailPlaceholder: "Ingrese su correo electrónico...",
        submitting: "Enviando...",
        submit: "Suscribirse",
        defaultSuccess: "¡Suscripción exitosa!",
        defaultError: "Error al enviar el correo electrónico",
        privacyNote: "Respetamos su privacidad y nunca compartiremos su correo electrónico con nadie.",
    },
};

export function NewsletterSignup() {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await subscribeToNewsletter(formData);
            if (result.success) {
                setMessage({ text: result.message || d.defaultSuccess, type: 'success' });
                (e.target as HTMLFormElement).reset();
            } else {
                setMessage({ text: result.error || d.defaultError, type: 'error' });
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl" dir={isRTL ? "rtl" : "ltr"}>
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-[Vazirmatn] mb-2">{d.title}</h3>
                <p className="text-sm text-slate-400 font-[Vazirmatn]">
                    {d.subtitle}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="email"
                        name="email"
                        placeholder={d.emailPlaceholder}
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
                            {d.submitting}
                        </>
                    ) : (
                        <>
                            {d.submit}
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </>
                    )}
                </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-4 font-[Vazirmatn]">
                {d.privacyNote}
            </p>
        </div>
    );
}
