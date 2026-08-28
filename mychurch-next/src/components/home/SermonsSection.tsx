"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Video, Mic, ArrowLeft } from "lucide-react";

export default function SermonsSection() {
  const sermonCards = [
    {
      icon: Video,
      title: "مواعظ و تعلیمات",
      desc: "آرشیو کامل پیام‌های شبانه و آموزش‌های کلام خدا",
      href: "/sermons",
      color: "#F472B6",
      badge: "آرشیو ویدیویی",
      bgImage: "/live-stage.webp",
    },
    {
      icon: Mic,
      title: "پخش زنده جلسات",
      desc: "شرکت آنلاین در جلسات عبادتی یکشنبه‌ها ساعت ۱:۰۰ بعد از ظهر",
      href: "/broadcast/view",
      color: "#F87171",
      badge: "🔴 Live Stream",
      bgImage: "/hero-fallback.webp",
    },
  ];

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
          {sermonCards.map((item, i) => {
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
                  {/* Photo Background Layer with Dark Gradient (Optimized WebP) */}
                  <Image
                    src={item.bgImage}
                    alt={item.title}
                    fill
                    loading="lazy"
                    quality={75}
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
