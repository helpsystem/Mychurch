"use client";

import "@/lib/react-polyfill";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Globe, Zap } from "lucide-react";
import CounterNumber from "@/components/ui/CounterNumber";

const WorldGlobe = dynamic(() => import("@/components/ui/3d/WorldGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-64 h-64 rounded-full border border-amber-500/20 animate-pulse bg-amber-500/5" />
    </div>
  ),
});

const stats = [
  { end: 12400, suffix: "+", label: "عضو فعال", color: "#F5A623", description: "در سراسر جهان" },
  { end: 34, suffix: "", label: "کشور", color: "#60A5FA", description: "تحت پوشش" },
  { end: 150, suffix: "+", label: "گروه خانگی", color: "#A78BFA", description: "در قاره‌های مختلف" },
  { end: 1990, suffix: "", label: "سال تأسیس", color: "#34D399", description: "بنیانگذاری کلیسا" },
];

const verses = [
  { ref: "یوحنا ۸:۱۲", text: "«من نور جهان هستم»" },
  { ref: "متی ۵:۱۴", text: "«شما نور جهانید»" },
  { ref: "غلاطیان ۲:۲۰", text: "«مسیح در من زندگی می‌کند»" },
];

export default function StatsSection() {
  return (
    <section className="relative py-32 px-6 bg-gradient-to-b from-[#050A0F] via-[#07101F] to-[#050A0F] overflow-hidden" dir="rtl">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,166,35,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(7,16,31,0.8)_0%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* ── Verse carousel ──────────────────────────────────────── */}
        <div className="flex justify-center gap-6 mb-24 flex-wrap">
          {verses.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group text-center px-8 py-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-500"
            >
              <p
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-homa, serif)" }}
              >
                {v.text}
              </p>
              <span className="text-amber-400/70 text-xs tracking-widest font-mono uppercase">
                {v.ref}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ── Globe + Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[420px] lg:h-[520px]"
          >
            <div className="absolute inset-0 rounded-full bg-blue-600/5 blur-3xl" />
            <WorldGlobe />
          </motion.div>

          {/* Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm mb-6">
                <Globe size={13} />
                شبکه بین‌المللی کلیسا
              </div>
              <h2
                className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
                style={{ fontFamily: "var(--font-homa, serif)" }}
              >
                پراکنده در زمین،
                <br />
                <span className="text-amber-300">متحد در مسیح</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                اتصال اعضای کلیسا در سراسر جهان از طریق پلتفرم دیجیتال
              </p>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group p-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur hover:border-opacity-50 transition-all duration-300"
                  style={{ "--glow": stat.color } as React.CSSProperties}
                >
                  <div
                    className="text-4xl font-black mb-1"
                    style={{ color: stat.color, textShadow: `0 0 30px ${stat.color}50` }}
                  >
                    <CounterNumber end={stat.end} suffix={stat.suffix} />
                  </div>
                  <div className="text-white font-semibold text-base">{stat.label}</div>
                  <div className="text-slate-500 text-xs mt-1">{stat.description}</div>
                  <div
                    className="mt-3 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: stat.color }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Bottom indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-3 text-sm text-slate-500"
            >
              <Zap size={14} className="text-amber-400" />
              <span>داده‌های به‌روز از پلتفرم جهانی کلیسا</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
