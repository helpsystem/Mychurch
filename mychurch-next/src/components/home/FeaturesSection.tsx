"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import TiltCard from "@/components/ui/TiltCard";
import {
  BookOpen, Music, Video, Mic, Heart, Users,
  Star, Flame, Church, HandHeart,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    titleFa: "کتاب مقدس",
    descFa: "مطالعه و جستجو در کلام خداوند به زبان فارسی",
    href: "/bible",
    color: "#60A5FA",
    glow: "rgba(96,165,250,0.4)",
    gradient: "from-blue-600/20 to-blue-400/5",
    badge: "فارسی",
  },
  {
    icon: Music,
    titleFa: "پرستش",
    descFa: "سرودها و آهنگ‌های روحانی کلیسای ایرانیان",
    href: "/worship",
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.4)",
    gradient: "from-violet-600/20 to-violet-400/5",
    badge: "زنده",
  },
  {
    icon: Video,
    titleFa: "مواعظ",
    descFa: "آرشیو کامل پیام‌های شبانه و آموزش‌های کلیسا",
    href: "/sermons",
    color: "#F472B6",
    glow: "rgba(244,114,182,0.4)",
    gradient: "from-pink-600/20 to-pink-400/5",
    badge: "آرشیو",
  },
  {
    icon: Mic,
    titleFa: "پخش زنده",
    descFa: "شرکت آنلاین در جلسات عبادتی هر یکشنبه",
    href: "/broadcast/view",
    color: "#F87171",
    glow: "rgba(248,113,113,0.5)",
    gradient: "from-red-600/20 to-red-400/5",
    badge: "Live",
  },
  {
    icon: Heart,
    titleFa: "درخواست دعا",
    descFa: "ارسال درخواست دعا و شرکت در دیوار نوری دعا",
    href: "/prayers",
    color: "#FB923C",
    glow: "rgba(251,146,60,0.4)",
    gradient: "from-orange-600/20 to-orange-400/5",
    badge: "دعا",
  },
  {
    icon: Users,
    titleFa: "جوانان و کودکان",
    descFa: "برنامه‌های ویژه رشد ایمانی نسل جوان",
    href: "/about",
    color: "#34D399",
    glow: "rgba(52,211,153,0.4)",
    gradient: "from-emerald-600/20 to-emerald-400/5",
    badge: "جوانان",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function FeaturesSection() {
  return (
    <section className="relative py-32 px-6 bg-[#050A0F] overflow-hidden" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(245,166,35,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm mb-6">
            <Flame size={13} />
            <span>خدمات کلیسا</span>
          </div>
          <h2
            className="text-4xl md:text-6xl font-black text-white mb-5"
            style={{ fontFamily: "var(--font-homa, serif)" }}
          >
            همه چیز در یک جا
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            از کتاب مقدس تا پخش زنده، هر چیزی که برای رشد ایمانی نیاز دارید
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.href} variants={cardVariants}>
                <TiltCard glowColor={feature.glow} className="h-full">
                  <Link href={feature.href} className="block p-8 h-full">
                    {/* Icon area */}
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/10 flex items-center justify-center mb-6`}>
                      <Icon size={26} style={{ color: feature.color }} />
                      <div
                        className="absolute inset-0 rounded-2xl opacity-20 blur-md"
                        style={{ background: feature.color }}
                      />
                    </div>

                    {/* Badge */}
                    <div
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 border"
                      style={{
                        color: feature.color,
                        borderColor: feature.color + "40",
                        background: feature.color + "10",
                      }}
                    >
                      <Star size={9} className="mr-1 fill-current" />
                      {feature.badge}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {feature.titleFa}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.descFa}
                    </p>

                    {/* Arrow indicator */}
                    <div
                      className="mt-6 flex items-center gap-1 text-sm font-medium"
                      style={{ color: feature.color }}
                    >
                      <span>بیشتر بدانید</span>
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: -4 }}
                        className="text-lg"
                      >
                        ←
                      </motion.span>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
