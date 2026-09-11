"use client";

import "@/lib/react-polyfill";
import React from "react";
import { motion } from "framer-motion";
import { Globe, Users, Home, History, Radio, Clock } from "lucide-react";
import CounterNumber from "@/components/ui/CounterNumber";

const stats = [
  {
    icon: Users,
    end: 12400,
    prefix: "+",
    label: "عضو فعال",
    sub: "در ۵ قاره جهان",
    iconColor: "text-amber-400",
    borderGlow: "border-amber-500/25",
  },
  {
    icon: Globe,
    end: 34,
    prefix: "",
    label: "کشور جهان",
    sub: "شبانی برخط",
    iconColor: "text-cyan-400",
    borderGlow: "border-cyan-500/25",
  },
  {
    icon: Home,
    end: 150,
    prefix: "+",
    label: "گروه خانگی",
    sub: "قاره‌های مختلف",
    iconColor: "text-indigo-400",
    borderGlow: "border-indigo-500/25",
  },
  {
    icon: History,
    end: 1990,
    prefix: "",
    label: "سال تأسیس",
    sub: "واشنگتن دی‌سی",
    iconColor: "text-amber-300",
    borderGlow: "border-amber-400/25",
  },
];

export default function StatsSection() {
  return (
    <section className="w-full py-16 bg-[#0a0e18]/90 relative overflow-hidden px-4 border-y border-white/5" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1240px] mx-auto text-right relative z-10">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1f2a] text-cyan-400 text-[12px] font-semibold mb-3 border border-cyan-500/20">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>LIVE GLOBAL NETWORK • DC HUB</span>
        </div>

        {/* Section Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2.5">
          کلیسایی زنده در ۳۴ کشور جهان
        </h2>

        <p className="text-[14px] text-gray-300 leading-relaxed mb-6 max-w-3xl">
          بیش از سه دهه خدمت پیوسته، اتصال ایمانداران فارسی‌زبان از طریق جلسات زنده و گروه‌های خانگی در آمریکا، اروپا و کلیسای زیرزمینی ایران.
        </p>

        {/* Schedule Notice Banner */}
        <div className="p-4 rounded-2xl bg-[#171b26]/90 border border-white/8 shadow-md flex items-start gap-3.5 mb-8 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-white block">
              جلسات عبادتی یکشنبه
            </span>
            <p className="text-[13px] text-gray-300 mt-1 leading-relaxed">
              یکشنبه‌ها ساعت ۱۰:۰۰ صبح به وقت واشنگتن (۶:۳۰ عصر ایران) به صورت زنده.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className={`p-5 rounded-2xl bg-[#171b26] border ${item.borderGlow} shadow-lg text-right hover:border-white/20 transition-all`}
              >
                <div className={`${item.iconColor} mb-2 flex items-center justify-between`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                    {idx === 0 ? "N • 000°" : idx === 1 ? "E • 090°" : idx === 2 ? "S • 180°" : "W • 270°"}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1 flex items-center gap-0.5">
                  <span>{item.prefix}</span>
                  <CounterNumber end={item.end} duration={2} />
                </div>

                <span className={`text-[14px] ${item.iconColor} font-bold block mt-1`}>
                  {item.label}
                </span>

                <span className="text-[12px] text-gray-400 block mt-0.5">
                  {item.sub}
                </span>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
