"use client";

import "@/lib/react-polyfill";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, BookOpen, ChevronDown } from "lucide-react";

// Heavy 3D component loaded lazily
const ParticleField = dynamic(() => import("@/components/ui/3d/ParticleField"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050A0F]" />,
});

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050A0F]">
      
      {/* Three.js Particle Background */}
      <ParticleField />

      {/* Cinematic Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-5">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero-fallback.jpeg"
          className="w-full h-full object-cover opacity-35 mix-blend-screen"
        >
          {/* WebM served first — ~40-60% smaller than MP4 */}
          <source src="/Hero.webm" type="video/webm" />
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(245,166,35,0.06)_0%,transparent_70%)] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050A0F]/30 via-transparent to-[#050A0F] pointer-events-none z-10" />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto pt-24" dir="rtl">

        {/* Live badge */}
        <motion.div
          custom={0} variants={textVariants} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-amber-500/30 bg-amber-500/8 backdrop-blur-sm text-amber-300 text-sm mb-10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          پخش زنده یکشنبه‌ها — ساعت ۱:۰۰ بعد از ظهر (1:00 PM EST)
        </motion.div>

        {/* Main headline */}
        <motion.h1
          custom={1} variants={textVariants} initial="hidden" animate="visible"
          className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-homa, 'B Homa', serif)" }}
        >
          <span className="text-white">کلیسای مسیحی</span>
          <br />
          <span
            className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 40px rgba(245,166,35,0.5))" }}
          >
            ایرانیان
          </span>
        </motion.h1>

        {/* Verse */}
        <motion.p
          custom={2} variants={textVariants} initial="hidden" animate="visible"
          className="text-xl md:text-2xl text-slate-300 mb-3 font-light max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-homa, serif)" }}
        >
          «من نور جهان هستم»
        </motion.p>
        <motion.p
          custom={3} variants={textVariants} initial="hidden" animate="visible"
          className="text-base text-amber-400/70 tracking-[0.2em] mb-12 uppercase font-mono"
        >
          یوحنا ۸:۱۲
        </motion.p>

        {/* Member count pill */}
        <motion.div
          custom={4} variants={textVariants} initial="hidden" animate="visible"
          className="flex items-center justify-center gap-3 mb-12"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/50" />
          <span className="text-slate-400 text-sm">پیوند بیش از</span>
          <span className="text-amber-300 font-bold text-lg">۱۲,۴۰۰+</span>
          <span className="text-slate-400 text-sm">عضو در ۳۴ کشور جهان</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/50" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          custom={5} variants={textVariants} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/broadcast/view"
            className="group relative px-10 py-4 rounded-full overflow-hidden text-black font-bold text-lg transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #F5A623, #FFCD70, #F5A623)",
              backgroundSize: "200% 200%",
              boxShadow: "0 0 40px rgba(245,166,35,0.5), 0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2.5">
              <Play size={18} fill="currentColor" />
              پخش زنده
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </Link>

          <Link
            href="/bible"
            className="px-10 py-4 rounded-full border border-white/20 text-white font-bold text-lg backdrop-blur-sm hover:border-amber-500/50 hover:bg-white/5 transition-all duration-300 flex items-center gap-2.5"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <BookOpen size={18} />
            کتاب مقدس
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs tracking-[0.3em] uppercase font-mono">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown className="text-amber-500/50" size={22} />
        </motion.div>
      </motion.div>
    </section>
  );
}
