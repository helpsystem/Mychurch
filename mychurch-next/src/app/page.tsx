"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Music, Video, Mic, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import dynamic from "next/dynamic";

// Raw Three.js components — safe with ssr:false (no React Three Fiber)
const HeroSection = dynamic(() => import("@/components/HeroSection"), { ssr: false });
const EventsGlobe = dynamic(() => import("@/components/EventsGlobe"), { ssr: false });
const PrayerWall = dynamic(() => import("@/components/PrayerWall"), { ssr: false });

const GLOBE_LOCATIONS = [
  { name: "یکشنبه‌ها — عبادتگاه اصلی", lat: 38.99, lng: -77.03, time: "۱۱:۰۰ صبح" },
  { name: "جلسات دعای بانوان", lat: 38.88, lng: -77.17, time: "چهارشنبه‌ها" },
  { name: "کلیسای آنلاین (ایران)", lat: 35.68, lng: 51.38, time: "پخش زنده" },
  { name: "لندن — انگلستان", lat: 51.5, lng: -0.12, time: "شنبه‌ها" },
  { name: "فرانکفورت — آلمان", lat: 50.11, lng: 8.68, time: "پنجشنبه‌ها" },
  { name: "تورنتو — کانادا", lat: 43.65, lng: -79.38, time: "جمعه‌ها" },
];

const INITIAL_PRAYERS = [
  { id: "1", text: "خداوندا، برای سلامتی خانواده‌ام دعا می‌کنم.", author: "ناشناس" },
  { id: "2", text: "شکرگزارم برای فیض و محبت بی‌پایان عیسی مسیح در زندگی‌ام.", author: "مریم" },
  { id: "3", text: "لطفاً برای یافتن کار جدید برای همسرم دعا کنید.", author: "برادر در مسیح" },
  { id: "4", text: "دعا برای آرامش و حکمت در تصمیمات مهم زندگی.", author: "سارا" },
  { id: "5", text: "سپاسگزارم برای رهایی‌ای که تنها در نام عیسی مسیح یافت می‌شود.", author: "دانیال" },
];

export default function HomePage() {
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState(INITIAL_PRAYERS);
  const [selectedLocation, setSelectedLocation] = useState<typeof GLOBE_LOCATIONS[0] | null>(null);

  const handleAddPrayer = (text: string) => {
    setPrayers((prev) => [...prev, { id: Date.now().toString(), text, author: "بازدیدکننده" }]);
  };

  return (
    <div className="min-h-screen bg-[#080D1A] relative font-sans flex flex-col text-white">
      <PublicHeader />

      <main className="flex-1">

        {/* 1. Hero — particle field + verse rotator */}
        <HeroSection />

        {/* 2. Globe — church locations worldwide */}
        <section dir="rtl" className="relative h-[80vh] bg-[#080D1A] flex flex-col border-b border-white/5">
          <div className="absolute top-8 left-0 right-0 z-10 text-center pointer-events-none">
            <p className="text-xs tracking-[0.22em] text-[#8B93AA] mb-2">کلیسای ایرانیان</p>
            <h2 className="text-2xl font-black text-amber-100">جلسات و موقعیت‌ها</h2>
            <p className="mt-1 text-sm text-amber-200/50">پراکنده در سراسر زمین، متحد در یک بدن</p>
          </div>

          <EventsGlobe
            locations={GLOBE_LOCATIONS}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
          />

          {/* Location info card */}
          {selectedLocation && (
            <div dir="rtl" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
                         rounded-xl border border-amber-200/20 bg-[#0B1120]/90
                         px-5 py-3 text-sm text-white backdrop-blur shadow-xl">
              <p className="font-bold text-amber-200">{selectedLocation.name}</p>
              {selectedLocation.time && (
                <p className="mt-1 text-white/60">{selectedLocation.time}</p>
              )}
              <button onClick={() => setSelectedLocation(null)}
                className="mt-2 text-xs text-white/40 hover:text-white/70">بستن</button>
            </div>
          )}

          {/* Stats bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-8 pb-3 pointer-events-none">
            <div className="text-center">
              <p className="text-amber-400 text-xl font-black">۱۲,۴۰۰+</p>
              <p className="text-slate-500 text-xs">عضو فعال</p>
            </div>
            <div className="text-center">
              <p className="text-cyan-400 text-xl font-black">۳۴</p>
              <p className="text-slate-500 text-xs">کشور</p>
            </div>
            <div className="text-center">
              <p className="text-amber-300 text-xl font-black">۱۵۰+</p>
              <p className="text-slate-500 text-xs">گروه خانگی</p>
            </div>
          </div>
        </section>

        {/* 3. Prayer Wall */}
        <section dir="rtl" className="relative h-[90vh] bg-[#05070E]">
          <div className="absolute top-8 left-0 right-0 z-10 text-center pointer-events-none">
            <p className="text-xs tracking-[0.22em] text-[#8B93AA] mb-2">دیوار نوری</p>
            <h2 className="text-2xl font-black text-amber-100">درخواست‌های دعا</h2>
            <p className="mt-1 text-sm text-amber-200/50">روی هر نور کلیک کنید تا دعا را بخوانید</p>
          </div>
          <PrayerWall
            prayers={prayers}
            onAddPrayer={handleAddPrayer}
          />
        </section>

        {/* 4. Ministries */}
        <section dir="rtl" className="bg-[#0B1120] px-6 py-24 border-y border-white/5">
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

        {/* 5. Quick Access */}
        <section dir="rtl" className="px-6 lg:px-12 max-w-7xl mx-auto py-24">
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
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
