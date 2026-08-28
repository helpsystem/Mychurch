"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import PrayerSection from "@/components/home/PrayerSection";
import { 
  Video, Mic, ArrowLeft, Crown, Sparkles, Flame, 
  Music2, HeartHandshake, ShieldCheck, Users2, Church, Star
} from "lucide-react";
import Image from "next/image";

// ─── Ministry section (Stunning 3D Icons & Glassmorphism Cards) ───────────
function MinistriesSection() {
  const ministries = [
    {
      icon: Sparkles,
      title: "خدمت کودکان",
      badge: "محیط شاد و خلاق",
      desc: "تعلیم داستان‌های کتاب‌مقدس، سرود، بازی و نقاشی در محیطی پر از محبت و امنیت برای کودکان.",
      color: "#38BDF8",
      glowBg: "rgba(56, 189, 248, 0.15)",
      borderGlow: "group-hover:border-sky-400/50",
      iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    },
    {
      icon: Flame,
      title: "جوانان و نوجوانان",
      badge: "نسل پرشور ایمان",
      desc: "جلسات صمیمانه گفتگو، پاسخ به سوالات ایمانی، همراهی و کشف استعدادهای الهی در جوانان.",
      color: "#A78BFA",
      glowBg: "rgba(167, 139, 250, 0.15)",
      borderGlow: "group-hover:border-purple-400/50",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      icon: Music2,
      title: "پرستش و سرود",
      badge: "حضور زنده خداوند",
      desc: "هدایت کلیسا در پرستش زنده، سرودهای روحانی جدید و کهن، و تجربه‌ی آرامش در حضور روح‌القدس.",
      color: "#F5A623",
      glowBg: "rgba(245, 166, 35, 0.15)",
      borderGlow: "group-hover:border-amber-400/50",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      icon: HeartHandshake,
      title: "گروه‌های خانگی و شبانی",
      badge: "مشارکت هفتگی",
      desc: "مشارکت صمیمانه برادران و خواهران، دعای اختصاصی، مطالعه گروهی کلام و پیوند عمیق خانوادگی.",
      color: "#34D399",
      glowBg: "rgba(52, 211, 153, 0.15)",
      borderGlow: "group-hover:border-emerald-400/50",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <section className="py-28 px-6 bg-gradient-to-b from-[#050A0F] via-[#060B14] to-[#050A0F] relative overflow-hidden" dir="rtl">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs font-bold mb-4">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            بخش‌های فعال کلیسای ایرانیان
          </span>
          <h2
            className="text-4xl md:text-5xl font-black text-white"
            style={{ fontFamily: "var(--font-homa, serif)" }}
          >
            خدمات و شاخه‌های کلیسا
          </h2>
          <p className="text-slate-400 text-base mt-3 max-w-xl mx-auto">
            محیطی صمیمی و روحانی برای رشد ایمانی تمامی رده‌های سنی
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ministries.map((m, i) => {
            const IconComponent = m.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`group relative p-7 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between ${m.borderGlow}`}
              >
                <div>
                  {/* Top: Glowing Icon Box & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3.5 rounded-2xl border ${m.iconBg} shadow-lg transition-transform duration-500 group-hover:scale-110`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {m.badge}
                    </span>
                  </div>

                  <h3
                    className="font-bold text-xl text-white mb-3 group-hover:text-amber-300 transition-colors"
                    style={{ fontFamily: "var(--font-homa, serif)" }}
                  >
                    {m.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{m.desc}</p>
                </div>

                {/* Bottom interactive highlight bar */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div
                    className="h-1 w-8 group-hover:w-full rounded-full transition-all duration-500"
                    style={{ background: m.color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Sermons preview section (With High-Res Church Stage Photography) ───────
function SermonsSection() {
  return (
    <section className="py-24 px-6 bg-[#050A0F] relative overflow-hidden" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-14 flex-wrap gap-4"
        >
          <div>
            <h2
              className="text-4xl font-black text-white mb-2"
              style={{ fontFamily: "var(--font-homa, serif)" }}
            >
              پخش زنده و مواعظ
            </h2>
            <p className="text-slate-500 text-sm">آخرین پیام‌ها و تعلیمات کلیسای ایرانیان</p>
          </div>
          <Link
            href="/sermons"
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-sm transition-colors group"
          >
            <span>مشاهده همه</span>
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Video,
              title: "مواعظ و تعلیمات",
              desc: "آرشیو کامل پیام‌های شبانه و آموزش‌های کلام خدا",
              href: "/sermons",
              color: "#F472B6",
              badge: "آرشیو ویدیویی",
              bgImage: "/live-stage.jpeg",
            },
            {
              icon: Mic,
              title: "پخش زنده جلسات",
              desc: "شرکت آنلاین در جلسات عبادتی یکشنبه‌ها ساعت ۱:۰۰ بعد از ظهر",
              href: "/broadcast/view",
              color: "#F87171",
              badge: "🔴 Live Stream",
              bgImage: "/hero-fallback.jpeg",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
              >
                <Link
                  href={item.href}
                  className="group relative block p-8 rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/40"
                >
                  {/* Photo Background Layer with Dark Gradient */}
                  <Image
                    src={item.bgImage}
                    alt={item.title}
                    fill
                    loading="lazy"
                    quality={60}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-25 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050A0F] via-[#050A0F]/80 to-transparent pointer-events-none" />

                  {/* Card Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/15 backdrop-blur-md shadow-lg"
                        style={{ background: `${item.color}25`, color: item.color }}
                      >
                        <Icon size={26} />
                      </div>
                      <span className="text-xs px-3.5 py-1.5 rounded-full border border-white/15 text-slate-200 bg-black/60 backdrop-blur-md font-bold shadow">
                        {item.badge}
                      </span>
                    </div>
                    <h3
                      className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors"
                      style={{ fontFamily: "var(--font-homa, serif)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">{item.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-amber-400 transition-colors">
                      <span>ورود به بخش</span>
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Leadership section (Full Portrait Framing & Head Visibility) ──────────
function LeadershipSection() {
  const leaders = [
    {
      name: "نازی جون",
      englishName: "Nazi Joon",
      role: "رهبر کلیسا",
      badge: "رهبری و خدمت شبانی",
      img: "/images/leader-nazi-real.jpg",
    },
    {
      name: "کشیش جواد",
      englishName: "Pastor Javad",
      role: "شبان ارشد کلیسا",
      badge: "شبان ارشد کلیسا",
      img: "/images/pastor-javad-real.jpg",
    },
  ];

  return (
    <section className="py-28 px-6 bg-gradient-to-b from-[#060B14] via-[#050A0F] to-[#04080D] relative overflow-hidden" dir="rtl">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs font-bold mb-4">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            تیم شبانی و رهبری
          </span>
          <h2
            className="text-4xl md:text-5xl font-black text-white mb-4"
            style={{ fontFamily: "var(--font-homa, serif)" }}
          >
            رهبری کلیسا
          </h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            شبانان و رهبران کلیسای مسیحی ایرانیان واشنگتن
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          {leaders.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.7 }}
              className="group relative w-full max-w-[320px] rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 to-neutral-950 shadow-2xl hover:border-amber-400/50 hover:shadow-[0_15px_50px_rgba(245,166,35,0.25)] transition-all duration-500"
            >
              {/* Photo Box with Top-Aligned Framing so head is 100% visible */}
              <div className="relative w-full h-[360px] overflow-hidden bg-neutral-900">
                <Image
                  src={l.img}
                  alt={l.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover object-[center_top] group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                {/* Smooth Dark Gradient Overlays for crystal clarity */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A0F] via-transparent to-black/20" />
                <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-400 shadow-md">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>

              {/* Bottom Leader Information */}
              <div className="p-6 text-center space-y-2 bg-[#050A0F] border-t border-white/5">
                <span className="inline-block text-[11px] font-bold text-amber-400 uppercase px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {l.badge}
                </span>
                <h3 className="text-2xl font-black text-white">{l.name}</h3>
                <p className="text-xs text-slate-400 font-mono tracking-wider">{l.englishName}</p>
                <p className="text-sm font-bold text-slate-300 pt-1">{l.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050A0F] flex flex-col text-white overflow-x-hidden">
      <PublicHeader />

      <main id="main-content" className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <MinistriesSection />
        <SermonsSection />
        <PrayerSection />
        <LeadershipSection />
      </main>

      <PublicFooter />
    </div>
  );
}
