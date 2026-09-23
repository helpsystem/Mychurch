"use client";

import React, { useEffect, useState } from "react";
import { ChurchEvent } from "@/actions/events";
import { Calendar, Phone, Video, Users, BellRing, Loader2 } from "lucide-react";
import { subscribeUser } from "@/actions/subscribers";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        subscribeSuccess: "You have been subscribed successfully!",
        subscribeError: "Error registering subscription",
        newsletterTitle: "Subscribe to Meeting Updates",
        newsletterSubtitle: "Sign up to receive the live meeting link",
        namePlaceholder: "Name",
        emailPlaceholder: "Email",
        submit: "Submit",
        subscribeNewsletter: "Subscribe to Newsletter",
        liveNow: "Live Now",
        upcomingMeeting: "Upcoming Meeting",
        days: "Days",
        hrs: "Hrs",
        min: "Min",
        sec: "Sec",
        meetingLive: "The meeting is currently live",
        joinLiveStream: "Join Live Stream",
        phoneConnect: "Connect via phone call",
        accessCode: "Access code:",
        notifyStart: "Notify me when it starts",
        emailPlaceholderFull: "Enter your email...",
        locale: "en-US",
    },
    fa: {
        subscribeSuccess: "عضویت شما با موفقیت ثبت شد!",
        subscribeError: "خطا در ثبت عضویت",
        newsletterTitle: "ثبت‌نام در خبرنامه جلسات",
        newsletterSubtitle: "برای دریافت لینک جلسات لایو ثبت‌نام کنید",
        namePlaceholder: "نام",
        emailPlaceholder: "ایمیل",
        submit: "ثبت",
        subscribeNewsletter: "عضویت در خبرنامه",
        liveNow: "در حال برگزاری (لـایـو)",
        upcomingMeeting: "جلسه آینده",
        days: "Days",
        hrs: "Hrs",
        min: "Min",
        sec: "Sec",
        meetingLive: "جلسه در حال برگزاری است",
        joinLiveStream: "ورود به پخش زنده",
        phoneConnect: "اتصال از طریق تماس تلفنی",
        accessCode: "کد ورود:",
        notifyStart: "اطلاع رسانی زمان شروع",
        emailPlaceholderFull: "ایمیل خود را وارد کنید...",
        locale: "fa-IR",
    },
    es: {
        subscribeSuccess: "¡Te has suscrito con éxito!",
        subscribeError: "Error al registrar la suscripción",
        newsletterTitle: "Suscríbete a las actualizaciones de reuniones",
        newsletterSubtitle: "Regístrate para recibir el enlace de la reunión en vivo",
        namePlaceholder: "Nombre",
        emailPlaceholder: "Correo electrónico",
        submit: "Enviar",
        subscribeNewsletter: "Suscribirse al boletín",
        liveNow: "En vivo ahora",
        upcomingMeeting: "Próxima reunión",
        days: "Días",
        hrs: "Hrs",
        min: "Min",
        sec: "Seg",
        meetingLive: "La reunión está en curso",
        joinLiveStream: "Unirse a la transmisión en vivo",
        phoneConnect: "Conectar por llamada telefónica",
        accessCode: "Código de acceso:",
        notifyStart: "Avisarme cuando comience",
        emailPlaceholderFull: "Ingresa tu correo electrónico...",
        locale: "es-ES",
    },
};

export default function EventCountdownWidget({ events }: { events: ChurchEvent[] }) {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [showSubForm, setShowSubForm] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsSubscribing(true);
        const res = await subscribeUser(email, name);
        if (res.success) {
            toast.success(d.subscribeSuccess);
            setShowSubForm(false);
            setEmail("");
            setName("");
        } else {
            toast.error(res.error || d.subscribeError);
        }
        setIsSubscribing(false);
    };

    if (!events || events.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto mt-8 relative z-10 animate-fade-in-up px-4">
                 <div className="bg-secondary/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                             <BellRing className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="font-bold text-lg">{d.newsletterTitle}</h3>
                             <p className="text-muted-foreground text-sm font-medium">{d.newsletterSubtitle}</p>
                         </div>
                     </div>

                     {showSubForm ? (
                         <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full sm:w-auto">
                             <input
                                 type="text"
                                 placeholder={d.namePlaceholder}
                                 value={name} onChange={e => setName(e.target.value)}
                                 className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                             />
                             <input
                                 type="email"
                                 required
                                 placeholder={d.emailPlaceholder}
                                 value={email} onChange={e => setEmail(e.target.value)}
                                 className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                             />
                             <button type="submit" disabled={isSubscribing} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500 transition disabled:opacity-50 flex items-center">
                                 {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : d.submit}
                             </button>
                         </form>
                     ) : (
                         <button onClick={() => setShowSubForm(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-2 rounded-xl text-sm font-bold transition">
                             {d.subscribeNewsletter}
                         </button>
                     )}
                 </div>
            </div>
        );
    }

    const nextEvent = events[0];
    const startTime = new Date(nextEvent.start_time);
    const isLive = currentTime >= startTime && currentTime < new Date(startTime.getTime() + nextEvent.duration_minutes * 60000);
    const hasEnded = currentTime >= new Date(startTime.getTime() + nextEvent.duration_minutes * 60000);

    const timeDiff = startTime.getTime() - currentTime.getTime();
    
    let days = 0, hours = 0, minutes = 0, seconds = 0;
    if (timeDiff > 0) {
        days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        minutes = Math.floor((timeDiff / 1000 / 60) % 60);
        seconds = Math.floor((timeDiff / 1000) % 60);
    }

    const liveDiff = currentTime.getTime() - startTime.getTime();
    const liveMinutes = Math.floor(liveDiff / 60000);

    if (hasEnded) return null;

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 relative z-10 animate-fade-in-up px-4 font-[Vazirmatn]" dir={isRTL ? "rtl" : "ltr"}>
            <div className={`relative overflow-hidden rounded-[2.5rem] border ${isLive ? 'border-red-500/30 shadow-red-500/20' : 'border-indigo-500/20 shadow-indigo-500/10'} bg-secondary/40 backdrop-blur-2xl shadow-2xl p-8`}>

                {isLive && <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow" />}

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Event Info */}
                    <div className="flex-1 text-center md:text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold mb-4">
                            {isLive ? (
                                <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {d.liveNow}</>
                            ) : (
                                <><Calendar className="w-4 h-4 text-indigo-400" /> {d.upcomingMeeting}</>
                            )}
                        </div>
                        <h2 className="text-3xl font-black mb-2">{nextEvent.title}</h2>
                        <p className="text-muted-foreground font-medium">
                            {startTime.toLocaleString(d.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Timer */}
                    {!isLive ? (
                        <div className="flex items-center justify-center gap-4 py-4 px-6 rounded-3xl bg-black/40 border border-white/10" dir="ltr">
                            <div className="text-center">
                                <div className="text-3xl font-black text-white">{days.toString().padStart(2, '0')}</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{d.days}</div>
                            </div>
                            <div className="text-2xl font-bold text-white/20">:</div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-white">{hours.toString().padStart(2, '0')}</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{d.hrs}</div>
                            </div>
                            <div className="text-2xl font-bold text-white/20">:</div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-white">{minutes.toString().padStart(2, '0')}</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{d.min}</div>
                            </div>
                            <div className="text-2xl font-bold text-white/20">:</div>
                            <div className="text-center w-12">
                                <div className="text-3xl font-black text-indigo-400">{seconds.toString().padStart(2, '0')}</div>
                                <div className="text-xs font-bold text-indigo-400/50 uppercase tracking-widest mt-1">{d.sec}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 px-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-center">
                            <p className="text-red-400 font-bold mb-1">{d.meetingLive}</p>
                            <p className="text-3xl font-black text-red-500" dir="ltr">{liveMinutes} <span className="text-sm">min</span></p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        {isLive && nextEvent.fcc_join_url && (
                            <a 
                                href={nextEvent.fcc_join_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 hover:-translate-y-1"
                            >
                                <Video className="w-5 h-5" /> {d.joinLiveStream}
                            </a>
                        )}

                        {(isLive || timeDiff < 3600000) && nextEvent.fcc_dial_in ? ( // Show phone 1 hour before
                            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-xs text-muted-foreground font-bold mb-2">{d.phoneConnect}</p>
                                <a href={`tel:${nextEvent.fcc_dial_in}`} className="flex items-center justify-center gap-2 text-lg font-black text-indigo-400 hover:text-indigo-300" dir="ltr">
                                    <Phone className="w-4 h-4" /> {nextEvent.fcc_dial_in}
                                </a>
                                {nextEvent.fcc_access_code && (
                                    <p className="text-sm mt-1 font-bold text-white/80">{d.accessCode} <span dir="ltr">{nextEvent.fcc_access_code}</span></p>
                                )}
                            </div>
                        ) : (
                            !showSubForm ? (
                                <button onClick={() => setShowSubForm(true)} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all">
                                    <BellRing className="w-5 h-5" /> {d.notifyStart}
                                </button>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex flex-col gap-2 bg-black/40 p-4 rounded-2xl border border-white/10">
                                    <input
                                        type="email" required placeholder={d.emailPlaceholderFull}
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <button type="submit" disabled={isSubscribing} className="bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-500 transition disabled:opacity-50 flex justify-center">
                                        {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : d.subscribeNewsletter}
                                    </button>
                                </form>
                            )
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
