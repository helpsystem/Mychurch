"use client";

import "@/lib/react-polyfill";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Globe, Zap, Radio, Compass, ShieldCheck } from "lucide-react";
import CounterNumber from "@/components/ui/CounterNumber";

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
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative py-32 px-6 bg-gradient-to-b from-[#050A0F] via-[#07101F] to-[#050A0F] overflow-hidden" 
      dir="rtl"
    >
      {/* Background celestial matrix grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,166,35,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(7,16,31,0.85)_0%,transparent_100%)] pointer-events-none" />

      {/* Ambient background light spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Verse Carousel ──────────────────────────────────────── */}
        <div className="flex justify-center gap-6 mb-24 flex-wrap">
          {verses.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="group text-center px-8 py-5 rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-md hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,166,35,0.15)] transition-all duration-500"
            >
              <p
                className="text-xl font-bold text-white mb-1.5"
                style={{ fontFamily: "var(--font-homa, serif)" }}
              >
                {v.text}
              </p>
              <span className="text-amber-400/80 text-xs tracking-widest font-mono uppercase font-bold">
                {v.ref}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ── Holographic Portal + Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Luxury Holographic Cosmic Portal Video Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[420px] sm:h-[480px] lg:h-[540px] flex items-center justify-center select-none"
          >
            {/* Outer Rotating Futuristic Radar Rings */}
            <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] lg:w-[490px] lg:h-[490px] rounded-full border border-dashed border-amber-500/25 animate-[spin_40s_linear_infinite] pointer-events-none" />
            <div className="absolute w-[390px] h-[390px] sm:w-[470px] sm:h-[470px] lg:w-[520px] lg:h-[520px] rounded-full border border-cyan-500/20 animate-[spin_60s_linear_infinite_reverse] pointer-events-none" />

            {/* Glowing Cardinal Calibration Points */}
            <div className="absolute -top-1 font-mono text-[10px] text-amber-400/80 tracking-widest bg-black/80 px-2 py-0.5 rounded-full border border-amber-500/30">N • 000°</div>
            <div className="absolute -bottom-1 font-mono text-[10px] text-amber-400/80 tracking-widest bg-black/80 px-2 py-0.5 rounded-full border border-amber-500/30">S • 180°</div>
            <div className="absolute -right-2 font-mono text-[10px] text-cyan-400/80 tracking-widest bg-black/80 px-2 py-0.5 rounded-full border border-cyan-500/30">E • 090°</div>
            <div className="absolute -left-2 font-mono text-[10px] text-cyan-400/80 tracking-widest bg-black/80 px-2 py-0.5 rounded-full border border-cyan-500/30">W • 270°</div>

            {/* Faceted Cybernetic Glass Outer Shield */}
            <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] p-3 rounded-[42px] bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-cyan-500/30 border-2 border-white/20 shadow-[0_0_100px_rgba(59,130,246,0.35)] backdrop-blur-2xl group">
              
              {/* Inner Chamfered Bezel */}
              <div className="w-full h-full rounded-[34px] overflow-hidden relative bg-black shadow-inner border border-white/10">
                {inView && (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster="/globe-bg.webp"
                    className="w-full h-full object-cover scale-110 group-hover:scale-115 transition-transform duration-1000"
                  >
                    <source src="https://cdn.pixabay.com/video/2025/07/04/289540_large.mp4" type="video/mp4" />
                  </video>
                )}

                {/* Holographic Lens Flare & Ambient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(5,10,15,0.7)_100%)] pointer-events-none" />

                {/* Live Floating Telemetry Badge Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>LIVE GLOBAL NETWORK</span>
                </div>

                {/* Bottom Hub Location Indicator */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Compass className="w-3.5 h-3.5" />
                    <span>DC CENTRAL HUB</span>
                  </div>
                  <span className="text-slate-400 font-mono">38.9072° N, 77.0369° W</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Grid ────────────────────────────────────────── */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Globe className="w-3.5 h-3.5" />
                گستره بین‌المللی
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight"
                style={{ fontFamily: "var(--font-homa, serif)" }}
              >
                کلیسایی زنده در{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
                  ۳۴ کشور جهان
                </span>
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg">
                بیش از سه دهه خدمت پیوسته، اتصال ایمانداران فارسی‌زبان از طریق جلسات زنده، گروه‌های خانگی و شبکه‌های دعای بین‌المللی.
              </p>
            </motion.div>

            {/* Stat Cards 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className="absolute top-0 right-0 left-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: s.color }}
                  />
                  <div
                    className="text-3xl sm:text-4xl font-black mb-1 font-mono tracking-tight"
                    style={{ color: s.color }}
                  >
                    {inView ? (
                      <CounterNumber end={s.end} suffix={s.suffix} duration={2} />
                    ) : (
                      <span>0{s.suffix}</span>
                    )}
                  </div>
                  <div className="font-bold text-white text-sm sm:text-base">
                    {s.label}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {s.description}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live broadcast indicator chip */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-slate-300 text-xs">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span>
                جلسات هفتگی یکشنبه‌ها ساعت ۱۰:۳۰ صبح به وقت واشنگتن دی‌سی (۶:۳۰ عصر ایران) به صورت زنده پخش می‌شود.
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
