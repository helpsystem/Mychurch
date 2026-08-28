// src/app/about/page.tsx
"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";
import { Users, Heart, Globe, BookOpen } from "lucide-react";
import { PageVisuals } from "@/components/ui/PageVisuals";

const Flipbook = dynamic(() => import("@/components/ui/Flipbook").then(m => ({ default: m.Flipbook })), { ssr: false });

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-[Vazirmatn] flex flex-col">
            <PublicHeader />

            <PageVisuals soft />

            <main className="relative z-10 flex-1 pt-32 pb-24 px-4 md:px-6 lg:px-12 max-w-7xl mx-auto w-full text-right" dir="rtl">
                {/* Header */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 shadow-sm backdrop-blur-md mb-6">
                        درباره ما
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 leading-[1.3] md:leading-[1.2] drop-shadow-sm mb-6">
                        تاریخچه و ماموریت <br className="hidden md:block" />کلیسای ایرانیان مسیحی واشنگتن دی‌سی
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl leading-relaxed">
                        ما یک خانواده بزرگ از ایمانداران هستیم که با هدف پرستش خداوند، آموزش کلام خدا و محبت به یکدیگر دور هم جمع شده‌ایم. از زمان تاسیس در سال ۱۹۹۰، محوریت ما فقط بازتاب عشق مسیح به جهان بوده است.
                    </p>
                </div>

                {/* Vision & Mission Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-blue-500/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Heart className="w-8 h-8 text-blue-500 mb-6" />
                        <h3 className="text-xl md:text-2xl font-bold mb-4">چشم‌انداز (Vision)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            ما می‌خواهیم جامعه‌ای باشیم که در آن هر فردی اهمیت دارد. شهری روی تپه که نور آن خاموش نمی‌شود، و پناهگاهی امن برای تمام ایرانیان و فارسی‌زبانانی که در جستجوی امید و نجات حقیقی در مسیح هستند.
                        </p>
                    </div>

                    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <BookOpen className="w-8 h-8 text-emerald-500 mb-6" />
                        <h3 className="text-xl md:text-2xl font-bold mb-4">ماموریت (Mission)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            ماموریت ما موعظه کامل انجیل، شاگردسازی، تعلیم سالم بر اساس کلام زنده خدا و تجهیز ایمانداران برای ایجاد تاثیر مثبت در جامعه و خانواده‌هایشان است. ما معتقدیم که با کلام خدا می‌توانیم دنیا را تغییر دهیم.
                        </p>
                    </div>
                </div>

                {/* --- Digital Bulletin Flipbook --- */}
                <div className="mb-24">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="w-2 h-8 bg-purple-500 rounded-full" />
                        <h2 className="text-2xl md:text-3xl font-bold">خبرنامه دیجیتال این هفته</h2>
                    </div>
                    <p className="text-muted-foreground mb-8">نشریه هفتگی کلیسا را ورق بزنید — از برنامه جلسات تا درخواست‌های دعایی:</p>
                    <div className="glass rounded-3xl p-4 md:p-6 flex justify-center overflow-hidden">
                        <Flipbook />
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <h2 className="text-2xl md:text-3xl font-bold">خادمین کلیسا</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Pastor Card */}
                    <div className="bg-secondary/30 border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:bg-secondary/50 transition-colors card-hover">
                        <div className="h-64 relative overflow-hidden">
                            <Image src="/images/pastor-javad-real.jpg" alt="Rev. Javad Pishghadamian" fill className="object-cover object-top" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-black mb-1 text-foreground" dir="rtl">کشیش جواد پیشقدمیان</h3>
                            <span className="text-xs font-bold text-muted-foreground font-serif uppercase tracking-widest block mb-1" dir="ltr">Rev. Javad Pishghadamian</span>
                            <p className="text-primary text-sm font-bold mb-4 uppercase tracking-wider">کشیش ارشد</p>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                کشیش جواد بیش از ۱۵ سال است که با اشتیاق و فداکاری کلیسای ما را رهبری می‌کند و جامعه ما را با حکمت و عشقی عمیق به کلام خدا هدایت می‌نماید.
                            </p>
                        </div>
                    </div>

                    {/* Tech Lead / Admin Card */}
                    <div className="bg-secondary/30 border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:bg-secondary/50 transition-colors card-hover">
                        <div className="h-64 bg-gradient-to-br from-emerald-950/60 via-black to-neutral-900 flex items-center justify-center relative overflow-hidden group">
                            {/* Motion Video Avatar */}
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-contain scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-115 transition-transform duration-700 pointer-events-none"
                            >
                                <source src="https://o3lj3xhtw9tgbtip.public.blob.vercel-storage.com/SAMAN-MOTION-no%20background.webm" type="video/webm" />
                            </video>
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-black mb-1 text-foreground" dir="rtl">سامان آبیار</h3>
                            <span className="text-xs font-bold text-muted-foreground font-serif uppercase tracking-widest block mb-1" dir="ltr">Saman Abyar</span>
                            <p className="text-emerald-400 text-sm font-bold mb-3 uppercase tracking-wider">معاون و مدیریت فنی (Admin)</p>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                طراح و توسعه‌دهنده پلتفرم هوشمند کلیسا، مسئول تیم پخش زنده (Broadcast) و هماهنگی امور تکنیکال و رسانه‌ای ایمانداران.
                            </p>
                            <a
                                href="https://www.abyarsaman.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all"
                            >
                                <span>مشاهده رزومه و وب‌سایت</span>
                                <span dir="ltr">abyarsaman.com ↗</span>
                            </a>
                        </div>
                    </div>

                    {/* Women's Ministry Leader Card */}
                    <div className="bg-secondary/30 border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:bg-secondary/50 transition-colors card-hover">
                        <div className="h-64 relative overflow-hidden">
                            <Image src="/images/leader-nazi-real.jpg" alt="Nazi Rasti" fill className="object-cover object-top" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl md:text-2xl font-black mb-1 text-foreground" dir="rtl">نازی رستی</h3>
                            <span className="text-xs font-bold text-muted-foreground font-serif uppercase tracking-widest block mb-1" dir="ltr">Nazi Raasti</span>
                            <p className="text-purple-500 text-sm font-bold mb-4 uppercase tracking-wider">رهبر مطالعه کتاب مقدس بانوان</p>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                نازی رستی خدمت بانوان ما را با قلبی برای مشارکت و شاگردسازی رهبری می‌کند و فضایی پذیرا برای رشد مشترک بانوان در ایمانشان ایجاد می‌نماید.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
