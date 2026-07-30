"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Music, Video, Mic, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

import dynamic from "next/dynamic";

// 3D Components — must be dynamically imported (no SSR) because @react-three/fiber requires browser APIs
const Hero = dynamic(() => import("@/components/ui/3d/Hero"), { ssr: false });
const GlobalGlobe = dynamic(() => import("@/components/ui/3d/GlobalGlobe"), { ssr: false });
const ScrollCrossReveal = dynamic(() => import("@/components/ui/3d/ScrollCrossReveal"), { ssr: false });
const PrayerWall = dynamic(() => import("@/components/ui/3d/PrayerWall"), { ssr: false });
const MinistryCards = dynamic(() => import("@/components/ui/3d/MinistryCards"), { ssr: false });

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#080D1A] relative font-sans flex flex-col text-white">
      <PublicHeader />

      <main dir="rtl" className="flex-1">
        
        {/* 1. Hero Particle Field */}
        <Hero />

        {/* 2. Our story, told through scripture */}
        <ScrollCrossReveal
          verses={[
            { reference: "یوحنا ۸:۱۲", text: "«من نور جهان هستم. کسی که پیرو من باشد، در تاریکی نخواهد گشت، بلکه نور حیات را خواهد داشت.»" },
            { reference: "متی ۵:۱۴", text: "«شما نور جهانید. شهری که بر فراز کوهی بنا شده، پنهان نمی‌ماند.»" },
            { reference: "یوشع ۱:۹", text: "«آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.»" },
            { reference: "غلاطیان ۲:۲۰", text: "«با مسیح مصلوب شده‌ام؛ دیگر من زندگی نمی‌کنم، بلکه مسیح در من زندگی می‌کند.»" },
          ]}
        />

        {/* 3. Ministries */}
        <section className="bg-[#0B1120] px-6 py-24 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <h2 className="mb-12 text-center text-3xl font-black text-amber-100 drop-shadow-sm">
              {t.ministriesTitle}
            </h2>
            <MinistryCards
              cards={[
                { kind: "children", title: "کودکان", description: "آموزش کتاب مقدس و محبت خدا به کودکان در محیطی شاد", href: "/children" },
                { kind: "youth", title: "جوانان", description: "رشد در ایمان و هدایت نسل جوان با قدرت روح‌القدس", href: "/youth" },
                { kind: "worship", title: "پرستش", description: "رهبری کلیسا در حضور خداوند با سرودهای روحانی", href: "/worship" },
              ]}
            />
          </div>
        </section>

        {/* 4. Where we gather */}
        <GlobalGlobe />

        {/* 5. Prayer wall */}
        <PrayerWall />

        {/* 6. Quick Access / Latest Sermons (Legacy preservation for functionality) */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto py-24 relative z-10 bg-[#080D1A]">
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
              { title: t.bible, icon: BookOpen, desc: t.descBible, link: "/bible", color: "from-blue-500/20 to-indigo-500/20" },
              { title: t.worship, icon: Music, desc: t.descWorship, link: "/worship", color: "from-purple-500/20 to-pink-500/20" },
              { title: t.sermons, icon: Video, desc: t.descSermons, link: "/sermons", color: "from-emerald-500/20 to-teal-500/20" },
              { title: t.broadcast, icon: Mic, desc: t.descBroadcast, link: "/broadcast", color: "from-red-500/20 to-orange-500/20" },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col gap-4 hover:border-amber-500/30 transition-all hover:bg-white/10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 relative z-10">
                  <item.icon className="w-6 h-6 text-amber-100/80 group-hover:text-amber-300 transition-colors" />
                </div>
                <div className="relative z-10 mt-auto pt-4">
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
