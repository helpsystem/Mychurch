"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame, Music2, HeartHandshake, Star } from "lucide-react";

export default function MinistriesSection() {
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
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

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
