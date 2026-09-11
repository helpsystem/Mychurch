"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, ArrowLeft, Radio, Clock, User, Sparkles } from "lucide-react";

const recentSermons = [
  {
    title: "قدرت دعا در طوفان‌های زندگی",
    category: "تعالیم ایمان",
    categoryColor: "text-amber-400",
    desc: "آموزش کشیش جواد در زمینه استواری در ایمان",
    duration: "۴۸ دقیقه",
    date: "یکشنبه گذشته",
    image: "/images/pastor-javad-real.jpg",
    alt: "کشیش جواد در حال موعظه کلام خدا",
    href: "/sermons",
  },
  {
    title: "فیض بی‌پایان در مشارکت مسیحی",
    category: "پیام‌های آرامش",
    categoryColor: "text-cyan-400",
    desc: "پیام هفتگی سرکار خانم نازی راستی پیرامون محبت الهی",
    duration: "۳۵ دقیقه",
    date: "۲ هفته پیش",
    image: "/images/leader-nazi-real.jpg",
    alt: "سرکار خانم نازی راستی در اشتراک کلام و دعا",
    href: "/sermons",
  },
  {
    title: "هویت ما در مسیح: غلاطیان ۲:۲۰",
    category: "تفسیر رسالات",
    categoryColor: "text-indigo-400",
    desc: "موعظه عمیق با محوریت حیات تازه ایماندار",
    duration: "۵۲ دقیقه",
    date: "ماه گذشته",
    image: "/bible-cover.webp",
    alt: "کتاب مقدس و کلام خداوند",
    href: "/sermons",
  },
];

export default function SermonsSection() {
  return (
    <section className="w-full py-16 bg-[#0a0e18]/90 relative px-4 border-y border-white/5" dir="rtl">
      <div className="max-w-[1240px] mx-auto">
        
        {/* ── Section Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mb-8 text-right">
          <div>
            <span className="text-amber-400 text-[13px] font-semibold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>آخرین پیام‌ها و تعلیمات</span>
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              پخش زنده و مواعظ
            </h2>
          </div>

          <Link
            href="/sermons"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1c1f2a] text-amber-400 text-[13px] font-bold border border-amber-500/20 hover:bg-[#262a35] transition-colors"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Grid: Main Video Player Card + 3 Recent Sermons ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Featured Broadcast Card (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 rounded-2xl bg-[#171b26] p-4 sm:p-5 border border-white/8 shadow-xl flex flex-col justify-between overflow-hidden"
          >
            {/* Video Frame with Live Badges and Play Button */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-md">
              <Image
                src="/live-stage.webp"
                alt="پخش زنده جلسات کلیسای ایرانیان واشنگتن"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover filter brightness-[0.7] contrast-110"
              />

              {/* Badges on top */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>زنده (Live)</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#0a0e18]/85 backdrop-blur-md text-gray-200 text-[11px] font-medium border border-white/10">
                  یکشنبه ۱۰:۰۰ AM EST
                </span>
              </div>

              {/* Play Overlay Button */}
              <Link
                href="/broadcast/view"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-110 active:scale-95 transition-all duration-300"
                aria-label="پخش زنده"
              >
                <Play className="w-7 h-7 fill-slate-950 ml-0.5" />
              </Link>
            </div>

            {/* Video Card Details */}
            <div className="pt-4 text-right">
              <span className="text-[12px] text-cyan-400 font-semibold tracking-wide">
                جلسه عبادتی و موعظه هفتگی
              </span>
              <h3 className="text-[18px] sm:text-[20px] font-bold text-white mt-1.5 mb-2 leading-snug">
                پخش زنده جلسات — کلیسای مسیحی ایرانیان واشنگتن
              </h3>
              <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                شرکت آنلاین در جلسات عبادتی یکشنبه‌ها ساعت ۱۰:۰۰ صبح به وقت واشنگتن (EST) همراه با دعا، شفاعت، سرودهای پرستشی و مشارکت زنده.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                <span className="text-gray-400 text-[12px] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>کشیش جواد و سرکار خانم نازی راستی</span>
                </span>
                <Link
                  href="/broadcast/view"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[13px] font-bold shadow hover:shadow-amber-500/25 transition-all"
                >
                  ورود به اتاق پخش زنده
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 3 Sermon Cards List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {recentSermons.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <Link
                  href={item.href}
                  className="p-3.5 rounded-2xl bg-[#171b26] border border-white/8 hover:bg-[#1c1f2a] hover:border-white/20 shadow transition-all flex gap-3.5 items-center group text-right"
                >
                  {/* Thumbnail with mini play button */}
                  <div className="w-20 h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-[#0a0e18]/80 text-amber-400 flex items-center justify-center border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </span>
                  </div>

                  {/* Sermon Info */}
                  <div className="flex-1 min-w-0">
                    <span className={`${item.categoryColor} text-[11px] font-bold`}>
                      {item.category}
                    </span>
                    <h4 className="text-[14px] font-bold text-white truncate mt-1 group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-gray-400 truncate mt-1">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-2 text-gray-400 text-[11px] mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{item.duration}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
