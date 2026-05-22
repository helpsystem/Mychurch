"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play, BookOpen, Music, Video, Heart, Mic, Phone, Settings, Globe, Users, Clock, Bell, X, ArrowLeft
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { WorldClock } from "@/components/ui/WorldClock";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { Vortex } from "@/components/ui/aceternity/vortex";
import { getUpcomingEvents } from "@/actions/events";
import EventCountdownWidget from "@/components/events/EventCountdownWidget";


export default function HomePage() {
  const { t } = useLanguage();
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [deployBuildId, setDeployBuildId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getUpcomingEvents().then(setEvents);

    if (typeof window === "undefined") return;
    const buildId = (window as any).__NEXT_DATA__?.buildId as string | undefined;
    if (!buildId) return;

    setDeployBuildId(buildId);
    const storageKey = "mychurch:last-seen-build-id";
    const seenBuildId = window.localStorage.getItem(storageKey);

    if (seenBuildId && seenBuildId !== buildId) {
      setShowUpdateNotice(true);
    }

    window.localStorage.setItem(storageKey, buildId);
  }, []);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans flex flex-col">

      <PageVisuals />


      <div className="relative z-10 flex-1 flex flex-col">

        {/* Unified Navigation Bar */}
        <PublicHeader />
        {showUpdateNotice && (
          <div className="mx-auto mt-4 w-[min(92vw,1100px)] rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-100 backdrop-blur-md shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-emerald-400/20 p-2">
                <Bell className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm md:text-base font-bold">سایت با نسخه جدید بروز شد</p>
                <p className="mt-1 text-xs md:text-sm text-emerald-100/90">
                  آخرین انتشار با موفقیت روی سایت اعمال شده است.
                  {deployBuildId ? ` (Build: ${deployBuildId.slice(0, 8)})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateNotice(false)}
                className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 p-1.5 text-emerald-100 hover:bg-emerald-300/20 transition"
                aria-label="بستن اعلان بروزرسانی"
                title="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="w-full relative overflow-hidden">
            <Vortex particleCount={250} className="w-full flex items-center justify-center">
              <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col justify-center min-h-[85vh]">
                <div className="max-w-3xl space-y-6 animate-fade-in-up relative z-10 bg-background/40 dark:bg-black/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-semibold tracking-widest uppercase shadow-inner">
              <Globe className="w-4 h-4" />
              {t.heroTitle}
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-gradient neon-glow leading-[1.1] pb-2 drop-shadow-sm">
              {t.heroTitle}
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/worship" className="btn-lift flex items-center gap-3 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                <Music className="w-5 h-5" />
                {t.worship}
              </Link>
              <Link href="/bible" className="btn-lift flex items-center gap-3 bg-secondary text-foreground font-bold px-8 py-4 rounded-2xl hover:bg-muted transition-all border border-border/10 hover:shadow-lg shadow-black/5">
                <BookOpen className="w-5 h-5 opacity-80" />
                {t.bible}
              </Link>
            </div>
            </div>
          </header>
        </Vortex>
      </div>

      {/* Live Event Countdown Widget */}
      <EventCountdownWidget events={events} />

      {/* Welcome Section */}
      <section className="px-6 lg:px-12 max-w-4xl mx-auto pb-24 relative z-10 text-center animate-fade-in-up mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
          <Heart className="w-4 h-4" />
          {t.welcomeTitle}
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-gradient">{t.welcomeTitle}</h2>
        <p className="text-lg md:text-2xl text-muted-foreground leading-relaxed font-medium">
          {t.welcomeDesc}
        </p>
      </section>

      {/* Quick Access Grid */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24 relative z-10">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
            <div className="w-3 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
            <h2 className="text-3xl font-bold">{t.quickAccess}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {[
              { title: t.bible, icon: BookOpen, desc: t.descBible, link: "/bible", color: "from-blue-500/20 to-indigo-500/20", iconColor: "text-blue-500" },
              { title: t.worship, icon: Music, desc: t.descWorship, link: "/worship", color: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500" },
              { title: t.sermons, icon: Video, desc: t.descSermons, link: "/sermons", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500" },
              { title: t.broadcast, icon: Mic, desc: t.descBroadcast, link: "/broadcast", color: "from-red-500/20 to-orange-500/20", iconColor: "text-red-500" },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="card-hover animate-fade-in-up group relative overflow-hidden rounded-3xl bg-secondary/30 backdrop-blur-md border border-border/50 p-6 flex flex-col gap-4 hover:shadow-2xl transition-all duration-300">
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${item.color} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner border border-white/5 relative z-10`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>

                <div className="relative z-10 mt-auto pt-4">
                  <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Ministries Grid */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24 relative z-10">
          <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
            <div className="w-3 h-10 bg-pink-500 rounded-full shadow-lg shadow-pink-500/20" />
            <h2 className="text-3xl font-bold">{t.ministriesTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {[
              { title: "پرستش", desc: "رهبری کلیسا در حضور خداوند با سرودهای روحانی", icon: Music, color: "bg-purple-500/10 text-purple-500", borderHover: "hover:border-purple-500/50" },
              { title: "کودکان", desc: "آموزش کلام خدا به کودکان در محیطی شاد", icon: Heart, color: "bg-pink-500/10 text-pink-500", borderHover: "hover:border-pink-500/50" },
              { title: "جوانان", desc: "رشد در ایمان و مشارکت برای نسل جوان", icon: Users, color: "bg-blue-500/10 text-blue-500", borderHover: "hover:border-blue-500/50" }
            ].map((m, i) => (
              <div key={i} className={`group rounded-3xl p-6 bg-secondary/30 border border-border/50 ${m.borderHover} transition-all hover:shadow-2xl`}>
                <div className={`w-14 h-14 rounded-2xl ${m.color} flex items-center justify-center mb-6 shadow-inner`}>
                  <m.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2 group-hover:text-pink-500 transition-colors">{m.title}</h3>
                <p className="text-muted-foreground font-medium">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24 relative z-10">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-3 h-10 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20" />
              <h2 className="text-3xl font-bold">{t.upcomingEvents}</h2>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:border-amber-500/40 transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex flex-col items-center justify-center text-amber-500 shadow-inner border border-amber-500/30 group-hover:scale-105 transition-transform">
                <span className="text-xs font-bold uppercase">یکشنبه</span>
                <span className="text-3xl font-black">۱۵</span>
              </div>
              <div>
                <h3 className="font-bold text-2xl mb-1 text-amber-500">مراسم پرستشی یکشنبه</h3>
                <p className="text-muted-foreground font-medium">پرستش، موعظه و مشارکت - ساعت ۱۰:۳۰ صبح</p>
              </div>
            </div>
            <Link href="/contact" className="btn-lift bg-amber-500 text-black font-black px-8 py-4 rounded-xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20">
              {t.viewAllEvents}
            </Link>
          </div>
        </section>

        {/* Latest Messages Section */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24 relative z-10">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20" />
              <div>
                <h2 className="text-3xl font-bold">{t.latestSermons || "تازه‌ترین پیام‌ها"}</h2>
                <p className="text-muted-foreground text-sm font-medium">موعظه‌ها و آموزش‌های اخیر کلیسا</p>
              </div>
            </div>
            <Link href="/sermons" className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors">
              مشاهده همه <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {[1, 2, 3].map((_, i) => (
              <Link key={i} href="/sermons" className="group rounded-3xl overflow-hidden bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all hover:shadow-2xl flex flex-col">
                <div className="aspect-video relative bg-black/50 overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <Image src={`/gallery/dummy-${i+1}.jpg`} alt="Sermon" fill className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" unoptimized onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=800&auto=format&fit=crop' }} />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all backdrop-blur-md">
                      <Play className="w-6 h-6 ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black tracking-widest px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase">موعظه یکشنبه</span>
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> ۳ روز پیش</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">رشد در کلام خدا و محبت</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">در این پیام به بررسی اهمیت مطالعه روزانه کلام و تاثیر آن در زندگی روزمره می‌پردازیم...</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Support & Giving CTA */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24 relative z-10">
          <div className="w-full rounded-[3rem] bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black border border-white/10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative group shadow-2xl">
            <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none mix-blend-overlay" />
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/30 rounded-full blur-[80px] group-hover:bg-primary/40 transition-colors" />
            
            <div className="relative z-10 flex-1 max-w-2xl text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-purple-300 text-sm font-bold border border-white/10 shadow-sm backdrop-blur-md mb-6">
                <Heart className="w-4 h-4 text-pink-500" /> حمایت از کلیسا
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight text-white drop-shadow-md">در پیشبرد پادشاهی خدا شریک شوید</h2>
              <p className="text-lg text-white/70 font-medium leading-relaxed mb-8">هدایا و نذورات شما به ما کمک می‌کند تا پیام انجیل را به گوش انسان‌های بیشتری برسانیم و برنامه‌های پرستشی و آموزشی را با کیفیت بالاتری ارائه دهیم.</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link href="/payment" className="flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-xl hover:scale-105 active:scale-95">
                  <Heart className="w-5 h-5 text-red-500" /> پرداخت آنلاین
                </Link>
                <Link href="/contact" className="flex items-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
                  راه‌های ارتباطی
                </Link>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-1/3 flex justify-center md:justify-end">
               <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-4 border-white/10 flex items-center justify-center p-8 backdrop-blur-xl shadow-2xl relative animate-pulse-slow">
                 <div className="absolute inset-0 bg-noise opacity-20 rounded-full mix-blend-overlay pointer-events-none" />
                 <Heart className="w-full h-full text-white drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]" strokeWidth={1} />
               </div>
            </div>
          </div>
        </section>

        {/* Dynamic Stats & Daily Verse */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-32 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Daily Verse CTA */}
          <div className="lg:col-span-2 mt-12 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

            {/* Background Watermark Logo (Admin Configurable) */}
            <DynamicWatermark
              defaultSize={400}
              defaultOpacity={4}
              defaultPosition="custom"
              className="-left-20 md:-left-12 -bottom-24 group-hover:scale-105 group-hover:rotate-12"
            />

            <div className="relative glass p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 justify-between">
              <div className="flex-1 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 shadow-sm backdrop-blur-md">
                  <Image
                    src="/logo-transparent.png"
                    alt="Logo"
                    width={18}
                    height={18}
                    className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  />
                  {t.dailyVerseTitle}
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black leading-tight text-foreground/90 text-right leading-relaxed" dir="rtl">
                    "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود."
                  </h3>
                  <h3 className="text-xl md:text-2xl font-bold leading-tight text-foreground/70 text-left font-serif italic" dir="ltr">
                    "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."
                  </h3>
                </div>

                <p className="text-primary font-bold text-lg bg-black/20 inline-block px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm shadow-inner mt-4">
                  یوشع ۱:۹ | Joshua 1:9
                </p>
              </div>
              <Link href="/bible" className="shrink-0">
                <button className="px-8 py-4 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-primary/30 hover:-translate-y-1" title="Read Bible">
                  {t.readMore}
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-col gap-6 stagger">
            {[
              { label: t.statsMembers, value: "12,400+", icon: Users },
              { label: t.statsGroups, value: "150+", icon: Box },
              { label: t.statsCountries, value: "34", icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="card-hover animate-fade-in-up flex-1 bg-secondary/40 backdrop-blur-sm border border-border/50 rounded-3xl p-6 flex flex-col justify-center hover:bg-secondary/60 transition-colors">
                <stat.icon className="w-8 h-8 text-primary/50 mb-4" />
                <div className="text-4xl font-black tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-muted-foreground tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

        </section>

        {/* World Clocks */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24">
          <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
            <div className="w-3 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
            <div>
              <h2 className="text-3xl font-bold">{t.worldTimeTitle}</h2>
              <p className="text-muted-foreground text-sm font-medium">{t.worldTimeSubtitle}</p>
            </div>
          </div>
          <WorldClock />
        </section>

      </div>

      {/* Unified Footer */}
      <PublicFooter />
    </div>
  );
}

// Quick placeholder for Box icon
function Box(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
}

