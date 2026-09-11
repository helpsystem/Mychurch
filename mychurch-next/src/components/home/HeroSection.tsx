"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Radio, BookOpen, ArrowLeft, Globe, Sparkles, Flame, Lightbulb, Heart } from "lucide-react";

const textVariants: any = {
  hidden: { opacity: 0, y: 25 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[760px] lg:min-h-[840px] flex items-center justify-center overflow-hidden bg-[#0a0e18] pt-20">
      {/* ── Background Imagery & Spiritual Luminous Glow ────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/stitch/stitch_asset_2.webp"
          alt="محراب و کلام خدا در کلیسای ایرانیان"
          fill
          priority
          className="object-cover object-center filter brightness-[0.38] contrast-125 scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Multilayered Spiritual Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-[#0a0e18]/80 to-[#0f131d]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.22)_0%,rgba(10,14,24,0.92)_75%)]" />
        <div className="absolute -top-24 right-10 w-96 h-[600px] bg-amber-500/10 rotate-12 blur-[120px]" />
        <div className="absolute -bottom-24 left-10 w-96 h-[600px] bg-cyan-500/10 -rotate-12 blur-[120px]" />
      </div>

      {/* ── Content Container ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-4 pt-12 pb-16 flex flex-col items-center text-center" dir="rtl">
        
        {/* Live Broadcast Header Pill */}
        <motion.div custom={0} variants={textVariants} initial="hidden" animate="visible">
          <Link
            href="/broadcast/view"
            className="group mb-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1c1f2a]/90 backdrop-blur-xl shadow-lg border border-red-500/30 hover:bg-[#262a35] hover:border-red-500/50 transition-all duration-300"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-[13px] text-gray-100 font-medium tracking-wide">
              پخش زنده یکشنبه‌ها — ساعت ۱۰:۰۰ صبح به وقت واشنگتن (EST)
            </span>
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          custom={1}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] leading-[1.25] mb-2"
        >
          کلیسای مسیحی ایرانیان
        </motion.h1>

        {/* Subheading / English Attestation */}
        <motion.p
          custom={2}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="text-[13px] sm:text-[15px] font-semibold text-amber-300/90 tracking-widest uppercase mb-6 drop-shadow-sm font-sans"
        >
          Iranian Presbyterian Church of D.C. • واشنگتن
        </motion.p>

        {/* Spiritual Scripture Glass Card */}
        <motion.div
          custom={3}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full max-w-md mx-auto my-3 py-4 px-6 rounded-2xl bg-[#0a0e18]/85 backdrop-blur-xl border border-amber-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
        >
          <div className="text-amber-400/40 text-3xl font-serif leading-none text-right">❝</div>
          <p className="text-[22px] sm:text-[24px] font-bold text-amber-300 drop-shadow-md leading-relaxed my-1">
            «من نور جهان هستم»
          </p>
          <span className="block text-[13px] text-cyan-400 font-medium mt-1 tracking-wide">
            انجیل یوحنا ۸:۱۲
          </span>
          <div className="text-amber-400/40 text-3xl font-serif leading-none text-left">❞</div>
        </motion.div>

        {/* Global Diaspora Badge */}
        <motion.div
          custom={4}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1c1f2a]/80 backdrop-blur-md mb-8 text-gray-300 text-[13px] border border-white/10 shadow-inner"
        >
          <Globe className="w-4 h-4 text-amber-400 shrink-0" />
          <span>پیوند بیش از <strong className="text-white font-bold">۱۲,۴۰۰+</strong> عضو در <strong className="text-white font-bold">۳۴</strong> کشور جهان</span>
        </motion.div>

        {/* Primary Call to Action Buttons */}
        <motion.div
          custom={5}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row w-full max-w-md gap-3.5 mb-10"
        >
          <Link
            href="/broadcast/view"
            className="w-full sm:flex-1 h-13 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold text-[16px] shadow-[0_8px_24px_rgba(245,158,11,0.35)] hover:shadow-[0_10px_28px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
          >
            <Radio className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>پخش زنده جلسات</span>
          </Link>

          <Link
            href="/bible"
            className="w-full sm:flex-1 h-13 py-3.5 px-6 rounded-full bg-[#1c1f2a]/90 hover:bg-[#262a35] backdrop-blur-xl border border-white/15 text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 hover:border-white/30"
          >
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>کتاب مقدس آنلاین</span>
          </Link>
        </motion.div>

        {/* 3 Scripture Affirmation Cards */}
        <motion.div
          custom={6}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2"
        >
          <div className="p-4 rounded-2xl bg-[#0a0e18]/80 backdrop-blur-md border border-white/8 shadow text-right hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-2 text-amber-400 text-[13px] font-bold mb-1.5">
              <Flame className="w-4 h-4" />
              <span>نور حیات</span>
            </div>
            <p className="text-[13px] text-gray-200 font-medium leading-relaxed">«من نور جهان هستم»</p>
            <span className="text-[11px] text-gray-400 mt-1 block">یوحنا ۸:۱۲</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0e18]/80 backdrop-blur-md border border-white/8 shadow text-right hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 text-cyan-400 text-[13px] font-bold mb-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>دعوت مقدسین</span>
            </div>
            <p className="text-[13px] text-gray-200 font-medium leading-relaxed">«شما نور جهانید»</p>
            <span className="text-[11px] text-gray-400 mt-1 block">متی ۵:۱۴</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0e18]/80 backdrop-blur-md border border-white/8 shadow text-right hover:border-indigo-400/30 transition-all">
            <div className="flex items-center gap-2 text-indigo-300 text-[13px] font-bold mb-1.5">
              <Heart className="w-4 h-4" />
              <span>حیات تازه</span>
            </div>
            <p className="text-[13px] text-gray-200 font-medium leading-relaxed">«مسیح در من زندگی می‌کند»</p>
            <span className="text-[11px] text-gray-400 mt-1 block">غلاطیان ۲:۲۰</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
