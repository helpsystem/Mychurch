"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Church, Crown, Sparkles, ExternalLink } from "lucide-react";

export default function LeadershipSection() {
  const leaders = [
    {
      name: "سرکار خانم نازی راستی",
      englishName: "Mrs. Nazi Rasti",
      role: "رهبری و خدمت شبانی",
      badge: "رهبری و خدمت شبانی",
      desc: "مدیریت جلسات، هدایت دعای شفاعتی و خادم ارتباط صمیمانه با خانواده‌ها، بانوان و مادران کلیسا.",
      img: "/images/leader-nazi-real.jpg",
      isVideo: false,
      accentBorder: "border-purple-500/30 hover:border-purple-400/60",
      badgeColor: "text-purple-300 bg-purple-500/10 border-purple-500/30",
    },
    {
      name: "کشیش جواد پیشقدمیان",
      englishName: "Rev. Javad Pishghadamian",
      role: "شبان ارشد کلیسا",
      badge: "شبان ارشد کلیسا",
      desc: "بیش از ۱۵ سال خدمت و رهبری فداکارانه در تعلیم کلام خدا و هدایت جامعه ایمانداران در آمریکا و سراسر جهان.",
      img: "/images/pastor-javad-real.jpg",
      isVideo: false,
      accentBorder: "border-amber-500/30 hover:border-amber-400/60",
      badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    },
    {
      name: "سامان آبیار",
      englishName: "Saman Abyar",
      role: "معاون و مدیریت فنی (Admin)",
      badge: "طراح و توسعه‌دهنده پلتفرم",
      desc: "طراح و توسعه‌دهنده پلتفرم هوشمند کلیسا، مسئول تیم پخش زنده (Broadcast) و هماهنگی امور تکنیکال و رسانه‌ای.",
      videoSrc: "https://o3lj3xhtw9tgbtip.public.blob.vercel-storage.com/SAMAN-MOTION-no%20background.webm",
      link: "https://www.abyarsaman.com/",
      linkLabel: "مشاهده وب‌سایت و رزومه",
      isVideo: true,
      accentBorder: "border-emerald-500/30 hover:border-emerald-400/60",
      badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto relative overflow-hidden" dir="rtl">
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold mb-3 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            تیم شبانی و رهبری
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
            رهبری و خادمین کلیسا
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            شبانان، رهبران و خادمین کلیسای انجیلی ایرانیان واشنگتن
          </p>
        </motion.div>
      </div>

      {/* ── 3 Leadership Cards with Real Photos & Motion Video ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mb-16">
        {leaders.map((l, i) => (
          <motion.div
            key={l.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.6 }}
            className={`group relative w-full max-w-[340px] rounded-3xl overflow-hidden border ${l.accentBorder} bg-gradient-to-b from-[#141824] via-[#0f131d] to-[#0a0e18] shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between`}
          >
            {/* Real Photo or Transparent Motion Video Box */}
            <div className="relative w-full h-[360px] overflow-hidden bg-gradient-to-b from-black/80 via-neutral-900 to-[#0a0e18] flex items-center justify-center">
              {l.isVideo ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain scale-110 group-hover:scale-120 transition-transform duration-700 pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
                >
                  <source src={l.videoSrc} type="video/webm" />
                </video>
              ) : (
                <Image
                  src={l.img || ""}
                  alt={l.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18] via-transparent to-black/20 pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-amber-400 shadow-lg">
                {l.isVideo ? (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                )}
              </div>
            </div>

            {/* Bottom Leader Information */}
            <div className="p-6 text-center space-y-2.5 bg-[#0a0e18]/95 border-t border-white/5 flex-1 flex flex-col justify-between">
              <div>
                <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border ${l.badgeColor} mb-2`}>
                  {l.badge}
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                  {l.name}
                </h3>

                <p className="text-xs text-slate-400 font-sans tracking-wider" dir="ltr">
                  {l.englishName}
                </p>

                <p className="text-xs sm:text-sm font-semibold text-slate-300 pt-1">
                  {l.role}
                </p>

                <p className="text-[12px] text-slate-400 leading-relaxed pt-2">
                  {l.desc}
                </p>
              </div>

              {l.link && (
                <div className="pt-3 border-t border-white/5">
                  <a
                    href={l.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all group/link"
                  >
                    <span>{l.linkLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Section 8: Welcome / Community Invitation Banner ─────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="p-8 sm:p-12 rounded-3xl bg-gradient-to-l from-[#171b26] via-[#1c1f2a] to-[#171b26] text-center shadow-2xl border border-white/8 relative overflow-hidden"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 mx-auto flex items-center justify-center mb-4 border border-amber-500/25 shadow-inner">
          <Church className="w-7 h-7" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          به کلیسای ما خوش آمدید
        </h3>

        <p className="text-[14px] sm:text-[15px] text-gray-300 max-w-xl mx-auto mb-6 leading-relaxed">
          خداوند شما را برکت دهد — در هر مرحله از سفر ایمانی که هستید، آغوش این خانواده صمیمی به روی شما گشوده است.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/contact"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-[14px] font-bold shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-amber-500/40 active:scale-[0.98] transition-all"
          >
            ارتباط با شبان کلیسا
          </Link>

          <Link
            href="/about"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0a0e18]/80 hover:bg-[#1c1f2a] border border-white/15 text-white text-[14px] font-semibold active:scale-[0.98] transition-all"
          >
            درباره باورهای ما
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
