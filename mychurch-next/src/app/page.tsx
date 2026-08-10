"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Music, Video, Mic, ArrowLeft, Globe, Heart, Play, Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PingPongVideo } from "@/components/ui/PingPongVideo";

type MediaAssets = {
  hero_video?: string;
  hero_fallback?: string;
  globe_bg?: string;
  prayer_bg?: string;
  live_stage?: string;
  bible_cover?: string;
};

export default function HomePage() {
  const { t } = useLanguage();
  const [media, setMedia] = useState<MediaAssets>({
    hero_fallback: "/hero-fallback.jpeg",
    globe_bg: "/globe-bg.jpeg",
    prayer_bg: "/prayer-bg.jpeg",
    live_stage: "/live-stage.jpeg",
    bible_cover: "/bible-cover.jpeg"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/homepage-media")
      .then(r => r.json())
      .then(data => {
        setMedia(data.assets || {});
      })
      .catch(err => {
        console.error("[HomePage] Failed to load media:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080D1A] relative font-sans flex flex-col text-white">
      <PublicHeader />

      <main dir="rtl" className="flex-1">

        {/* ═══ HERO SECTION ═══ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Video/Image background — loaded from Telegram cloud storage */}
          <div className="absolute inset-0 z-0">
            {media.hero_video ? (
              <PingPongVideo 
                src={media.hero_video} 
                poster={media.hero_fallback || undefined} 
                className="w-full h-full object-cover opacity-60" 
              />
            ) : media.hero_fallback ? (
              <img src={media.hero_fallback} alt="" className="w-full h-full object-cover opacity-60" />
            ) : (
              /* Animated gradient fallback while loading */
              <div className="w-full h-full bg-gradient-to-br from-[#0B1120] via-[#1a1040] to-[#080D1A] animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/60 via-transparent to-[#080D1A]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.08)_0%,_transparent_70%)]" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              پخش زنده یکشنبه‌ها — ۱۱ صبح
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              کلیسای مسیحی
              <span className="block bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                ایرانیان واشنگتن
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              «من نور جهان هستم» — یوحنا ۸:۱۲
              <br />
              <span className="text-slate-400 text-base">پیوند بیش از ۱۲,۴۰۰ عضو در ۳۴ کشور جهان</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/broadcast/view"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(251,191,36,0.4)] inline-flex items-center gap-2 justify-center">
                <Play size={18} fill="black" />
                پخش زنده
              </Link>
              <Link href="/bible"
                className="px-8 py-4 rounded-full border border-white/20 text-white font-bold text-lg hover:border-amber-500/50 hover:bg-white/5 transition-all inline-flex items-center gap-2 justify-center">
                <BookOpen size={18} />
                کتاب مقدس
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
              <div className="w-1 h-3 rounded-full bg-amber-400"></div>
            </div>
          </div>
        </section>

        {/* ═══ SCRIPTURE SECTION ═══ */}
        <section className="py-24 px-6 bg-gradient-to-b from-[#080D1A] to-[#0B1120]">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            {[
              { ref: "یوحنا ۸:۱۲", text: "«من نور جهان هستم. کسی که پیرو من باشد، در تاریکی نخواهد گشت، بلکه نور حیات را خواهد داشت.»" },
              { ref: "متی ۵:۱۴", text: "«شما نور جهانید. شهری که بر فراز کوهی بنا شده، پنهان نمی‌ماند.»" },
              { ref: "غلاطیان ۲:۲۰", text: "«با مسیح مصلوب شده‌ام؛ دیگر من زندگی نمی‌کنم، بلکه مسیح در من زندگی می‌کند.»" },
            ].map((v, i) => (
              <div key={i} className="group">
                <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-serif mb-3">{v.text}</p>
                <span className="text-amber-400 text-sm font-bold tracking-widest">{v.ref}</span>
                <div className="w-12 h-0.5 bg-amber-500/30 mx-auto mt-6 group-hover:w-24 transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ STATS — GLOBE SECTION ═══ */}
        <section className="relative py-24 px-6 bg-[#0B1120] border-y border-white/5 overflow-hidden">
          {media.globe_bg && (
            <img src={media.globe_bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-[#0B1120]/70" />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm mb-4">
                <Globe size={14} />
                شبکه بین‌المللی کلیسا
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                پراکنده در سراسر زمین، متحد در یک بدن
              </h2>
              <p className="text-slate-400">اتصال بیش از ۱۲,۴۰۰ عضو فعال و ۱۵۰ گروه کوچک خانگی در ۳۴ کشور جهان</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center hover:border-amber-500/30 transition-colors">
                <p className="text-amber-400 text-5xl font-black mb-2">۱۲,۴۰۰+</p>
                <p className="text-slate-400">عضو فعال بین‌المللی</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center hover:border-cyan-500/30 transition-colors">
                <p className="text-cyan-400 text-5xl font-black mb-2">۳۴</p>
                <p className="text-slate-400">کشور تحت پوشش</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center hover:border-amber-500/30 transition-colors">
                <p className="text-amber-300 text-5xl font-black mb-2">۱۵۰+</p>
                <p className="text-slate-400">گروه کوچک خانگی</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ MINISTRIES ═══ */}
        <section className="bg-[#080D1A] px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <h2 className="mb-12 text-center text-3xl font-black text-amber-100">
              {t.ministriesTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "کودکان", desc: "آموزش کتاب مقدس و محبت خدا به کودکان در محیطی شاد", href: "/children", emoji: "🧒" },
                { title: "جوانان", desc: "رشد در ایمان و هدایت نسل جوان با قدرت روح‌القدس", href: "/youth", emoji: "✨" },
                { title: "پرستش", desc: "رهبری کلیسا در حضور خداوند با سرودهای روحانی", href: "/worship", emoji: "🎵" },
              ].map((card, i) => (
                <Link key={i} href={card.href}
                  className="group rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col gap-4 hover:border-amber-500/30 hover:bg-white/10 transition-all">
                  <span className="text-4xl">{card.emoji}</span>
                  <h3 className="font-bold text-xl text-white group-hover:text-amber-300 transition-colors">{card.title}</h3>
                  <p className="text-white/50 text-sm">{card.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRAYER SECTION ═══ */}
        <section className="relative py-24 px-6 overflow-hidden border-y border-white/5">
          {media.prayer_bg && (
            <img src={media.prayer_bg} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/80 via-[#080D1A]/60 to-[#080D1A]/80" />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm mb-6">
              <Heart size={14} />
              دیوار نوری دعا
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              درخواست دعا
            </h2>
            <p className="text-slate-400 mb-8">درخواست دعای خود را به جامعه کلیسا ارسال کنید</p>
            <Link href="/prayers"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:scale-105 transition-transform">
              <Heart size={16} fill="black" />
              ارسال درخواست دعا
            </Link>
          </div>
        </section>

        {/* ═══ LIVE STAGE ═══ */}
        <section className="relative py-24 px-6 overflow-hidden">
          {media.live_stage && (
            <img src={media.live_stage} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-[#080D1A]/75" />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">پخش زنده و مواعظ</h2>
              <p className="text-slate-400">آخرین پیام‌ها و تعلیمات کلیسا</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/sermons" className="group rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:border-amber-500/30 hover:bg-white/10 transition-all">
                <Video className="w-10 h-10 text-amber-400 mb-4" />
                <h3 className="font-bold text-xl text-white group-hover:text-amber-300 transition-colors mb-2">مواعظ و تعلیمات</h3>
                <p className="text-white/50 text-sm">آرشیو کامل پیام‌های شبانان و معلمین کلیسا</p>
              </Link>
              <Link href="/broadcast/view" className="group rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:border-amber-500/30 hover:bg-white/10 transition-all">
                <Mic className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="font-bold text-xl text-white group-hover:text-amber-300 transition-colors mb-2">پخش زنده</h3>
                <p className="text-white/50 text-sm">شرکت آنلاین در جلسات عبادتی هر یکشنبه</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ BIBLE & QUICK ACCESS ═══ */}
        <section className="relative py-24 px-6 overflow-hidden border-t border-white/5">
          {media.bible_cover && (
            <img src={media.bible_cover} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-[#080D1A]/80" />
          <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-3 h-10 bg-amber-500/50 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                <div>
                  <h2 className="text-3xl font-bold text-white">{t.latestSermons || "تازه‌ترین پیام‌ها"}</h2>
                  <p className="text-amber-200/60 text-sm font-medium mt-1">موعظه‌ها و آموزش‌های اخیر کلیسا</p>
                </div>
              </div>
              <Link href="/sermons" className="hidden md:flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold transition-colors">
                مشاهده همه <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: t.bible, icon: BookOpen, desc: t.descBible, link: "/bible" },
                { title: t.worship, icon: Music, desc: t.descWorship, link: "/worship" },
                { title: t.sermons, icon: Video, desc: t.descSermons, link: "/sermons" },
                { title: t.broadcast, icon: Mic, desc: t.descBroadcast, link: "/broadcast" },
              ].map((item, i) => (
                <Link key={i} href={item.link} className="group rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col gap-4 hover:border-amber-500/30 transition-all hover:bg-white/10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                    <item.icon className="w-6 h-6 text-amber-100/80 group-hover:text-amber-300 transition-colors" />
                  </div>
                  <div className="mt-auto pt-4">
                    <h3 className="font-bold text-xl mb-1 text-white/90 group-hover:text-amber-300 transition-colors">{item.title}</h3>
                    <p className="text-white/50 text-sm font-medium">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
