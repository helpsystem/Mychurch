"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function LeadershipSection() {
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
