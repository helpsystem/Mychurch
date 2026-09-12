"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Music, Video, Radio, HeartHandshake, Users, ArrowLeft, Sparkles, Calendar } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "کتاب مقدس",
    desc: "مطالعه و تفکر در کلام خدا با ترجمه‌های فارسی و انگلیسی.",
    href: "/bible",
    action: "مطالعه",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    hoverBorder: "hover:border-amber-500/40",
    actionColor: "text-amber-400",
  },
  {
    icon: Music,
    title: "سرودهای پرستشی",
    desc: "مجموعه فاخر آهنگ‌ها، آکوردها و سرودهای روحانی فارسی.",
    href: "/worship",
    action: "شنیدن",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15",
    hoverBorder: "hover:border-cyan-500/40",
    actionColor: "text-cyan-400",
  },
  {
    icon: Video,
    title: "مواعظ و تعلیمات",
    desc: "آرشیو پیام‌های شبانی کشیش جواد و تعالیم کلیسا.",
    href: "/sermons",
    action: "مشاهده",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    hoverBorder: "hover:border-indigo-500/40",
    actionColor: "text-indigo-400",
  },
  {
    icon: Radio,
    title: "پخش زنده",
    desc: "مشارکت در جلسات هفتگی یکشنبه‌ها به صورت برخط و تعاملی.",
    href: "/broadcast/view",
    action: "پیوستن",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/15",
    hoverBorder: "hover:border-red-500/40",
    actionColor: "text-red-400",
  },
  {
    icon: HeartHandshake,
    title: "درخواست دعا",
    desc: "ثبت نیازها، شفاعت و دعا در دیوار نوری و شبانی کلیسا.",
    href: "/prayers",
    action: "ثبت دعا",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-400/15",
    hoverBorder: "hover:border-amber-400/40",
    actionColor: "text-amber-300",
  },
  {
    icon: Calendar,
    title: "برنامه‌ها و جلسات هفتگی",
    desc: "کلاس‌های تدریس کتاب مقدس در طول هفته و جلسات یکشنبه به وقت واشنگتن.",
    href: "#weekly-schedule",
    action: "مشاهده جلسات",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/40",
    actionColor: "text-emerald-400",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-16 px-4 max-w-[1240px] mx-auto" dir="rtl">
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 mb-8 text-right">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1c1f2a] text-amber-400 text-[12px] font-semibold mb-2.5 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خدمات کلیسا</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            همه چیز در یک جا
          </h2>
          <p className="text-[14px] text-gray-300 mt-1.5 leading-relaxed">
            از کتاب مقدس تا پخش زنده، هر چیزی که برای رشد ایمانی نیاز دارید
          </p>
        </div>
      </div>

      {/* ── 6 Feature Glass Cards Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <Link
                href={item.href}
                className={`group p-5 rounded-2xl bg-[#171b26]/90 border border-white/8 hover:bg-[#1c1f2a] shadow-lg transition-all duration-300 flex flex-col justify-between h-full active:scale-[0.98] ${item.hoverBorder}`}
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-[16px] text-white font-bold mb-1.5 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-gray-300 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className={`mt-5 pt-3 border-t border-white/5 flex items-center justify-between ${item.actionColor} text-[12px] font-bold`}>
                  <span>{item.action}</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
