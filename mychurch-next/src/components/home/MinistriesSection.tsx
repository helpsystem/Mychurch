"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

const ministries = [
  {
    title: "خدمت کودکان",
    tag: "محیط شاد و خلاق",
    tagColor: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    desc: "تعلیم داستان‌های کتاب‌مقدس، سرود، بازی و نقاشی در محیطی امن و شاد برای فرزندان.",
    image: "/images/stitch/stitch_asset_3.webp",
    alt: "کودکان در کلاس کلیسا و داستان‌های کتاب مقدس",
    action: "اطلاعات برنامه کودکان",
    actionColor: "text-amber-400",
    href: "/about",
  },
  {
    title: "جوانان و نوجوانان",
    tag: "نسل پرشور ایمان",
    tagColor: "text-cyan-400 bg-cyan-500/15 border-cyan-500/25",
    desc: "جلسات صمیمانه گفتگو، پاسخ به پرسش‌های ایمانی و کشف استعدادهای روحانی نسل جوان.",
    image: "/images/stitch/stitch_asset_4.webp",
    alt: "جوانان کلیسای ایرانیان در مشارکت و گفتگو",
    action: "مشارکت‌های هفتگی",
    actionColor: "text-cyan-400",
    href: "/about",
  },
  {
    title: "پرستش و سرود",
    tag: "حضور زنده خداوند",
    tagColor: "text-amber-300 bg-amber-400/15 border-amber-400/25",
    desc: "هدایت کلیسا در سرودهای روحانی جدید و کهن در حضور پرجلال روح‌القدس.",
    image: "/images/stitch/stitch_asset_5.webp",
    alt: "تیم سرود و پرستش کلیسا",
    action: "گروه سرود کلیسا",
    actionColor: "text-amber-300",
    href: "/worship",
  },
  {
    title: "گروه‌های خانگی و شبانی",
    tag: "مشارکت هفتگی",
    tagColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/25",
    desc: "مشارکت صمیمانه ایمانداران، دعای اختصاصی و مطالعه کلام در جمع گرم خانوادگی.",
    image: "/images/stitch/stitch_asset_6.webp",
    alt: "جلسات صمیمانه کلیسای خانگی",
    action: "پیوستن به نزدیک‌ترین گروه",
    actionColor: "text-indigo-400",
    href: "/contact",
  },
];

export default function MinistriesSection() {
  return (
    <section className="w-full py-16 px-4 max-w-[1240px] mx-auto" dir="rtl">
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className="text-right mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1c1f2a] text-amber-400 text-[12px] font-semibold mb-2.5 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>بخش‌های فعال کلیسا</span>
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          خدمات و شاخه‌های کلیسا
        </h2>
        <p className="text-[14px] text-gray-300 mt-1.5 leading-relaxed">
          محیطی صمیمی برای رشد ایمانی تمامی رده‌های سنی
        </p>
      </div>

      {/* ── 4 Ministry Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ministries.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            className="rounded-2xl bg-[#171b26] overflow-hidden border border-white/8 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all group"
          >
            {/* Image Banner */}
            <div className="h-44 w-full relative overflow-hidden bg-slate-900">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-semibold border ${item.tagColor}`}>
                {item.tag}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between text-right">
              <div>
                <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <Link
                href={item.href}
                className={`inline-flex items-center gap-1.5 ${item.actionColor} text-[13px] font-bold hover:underline pt-2 border-t border-white/5`}
              >
                <span>{item.action}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
