"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Crown, Sparkles, ExternalLink } from "lucide-react";

export default function LeadershipSection() {
  const leaders = [
    {
      name: "نازی جون",
      englishName: "Nazi Joon",
      role: "رهبر کلیسا",
      badge: "رهبری و خدمت شبانی",
      img: "/images/leader-nazi-real.jpg",
      isVideo: false,
    },
    {
      name: "کشیش جواد",
      englishName: "Pastor Javad",
      role: "شبان ارشد کلیسا",
      badge: "شبان ارشد کلیسا",
      img: "/images/pastor-javad-real.jpg",
      isVideo: false,
    },
    {
      name: "سامان آبیار",
      englishName: "Saman Abyar",
      role: "معاون و مدیریت فنی (Admin)",
      badge: "طراح و توسعه‌دهنده پلتفرم",
      videoSrc: "https://o3lj3xhtw9tgbtip.public.blob.vercel-storage.com/SAMAN-MOTION-no%20background.webm",
      link: "https://www.abyarsaman.com/",
      isVideo: true,
    },
  ];

  return (
    <section className="py-28 px-6 bg-gradient-to-b from-[#060B14] via-[#050A0F] to-[#04080D] relative overflow-hidden" dir="rtl">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto text-center">
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
            رهبری و خادمین کلیسا
          </h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            شبانان، رهبران و خادمین کلیسای انجیلی ایرانیان واشنگتن
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {leaders.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className="group relative w-full max-w-[320px] rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 to-neutral-950 shadow-2xl hover:border-amber-400/50 hover:shadow-[0_15px_50px_rgba(245,166,35,0.25)] transition-all duration-500 flex flex-col justify-between"
            >
              {/* Photo or Motion Video Box */}
              <div className="relative w-full h-[360px] overflow-hidden bg-gradient-to-b from-black via-neutral-900 to-[#050A0F] flex items-center justify-center">
                {l.isVideo ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain scale-110 group-hover:scale-120 transition-transform duration-700 pointer-events-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]"
                  >
                    <source src={l.videoSrc} type="video/webm" />
                  </video>
                ) : (
                  <Image
                    src={l.img || ""}
                    alt={l.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover object-[center_top] group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}

                {/* Smooth Dark Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A0F] via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-400 shadow-md">
                  {l.isVideo ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />}
                </div>
              </div>

              {/* Bottom Leader Information */}
              <div className="p-6 text-center space-y-2 bg-[#050A0F] border-t border-white/5 flex-1 flex flex-col justify-between">
                <div>
                  <span className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${l.isVideo ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
                    {l.badge}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">{l.name}</h3>
                  <p className="text-xs text-slate-400 font-mono tracking-wider">{l.englishName}</p>
                  <p className="text-sm font-bold text-slate-300 pt-1">{l.role}</p>
                </div>

                {l.link && (
                  <div className="pt-3 border-t border-white/5">
                    <a
                      href={l.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all group/link"
                    >
                      <span>مشاهده وب‌سایت و رزومه</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
