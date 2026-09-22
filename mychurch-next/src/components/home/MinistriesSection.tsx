"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const ministriesMeta = [
  {
    id: "women",
    tagColor: "text-rose-400 bg-rose-500/15 border-rose-500/25",
    image: "/images/stitch/stitch_asset_3.webp",
    actionColor: "text-rose-400",
    href: "/about",
  },
  {
    id: "youth",
    tagColor: "text-cyan-400 bg-cyan-500/15 border-cyan-500/25",
    image: "/images/stitch/stitch_asset_4.webp",
    actionColor: "text-cyan-400",
    href: "/about",
  },
  {
    id: "worship",
    tagColor: "text-amber-300 bg-amber-400/15 border-amber-400/25",
    image: "/images/stitch/stitch_asset_5.webp",
    actionColor: "text-amber-300",
    href: "/worship",
  },
  {
    id: "homeGroups",
    tagColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/25",
    image: "/images/stitch/stitch_asset_6.webp",
    actionColor: "text-indigo-400",
    href: "/contact",
  },
];

const localDict = {
  en: {
    badge: "Active Church Ministries",
    heading: "Church Ministries & Departments",
    subheading: "A warm environment for spiritual growth at every age",
    items: {
      women: {
        title: "Women's Ministry & Fellowship",
        tag: "Fellowship & Spiritual Growth",
        desc: "Intimate gatherings of prayer, Word study, and spiritual empowerment for women and families in God's grace.",
        alt: "Fellowship and gatherings of the Iranian church's women",
        action: "Women's Ministry Info",
      },
      youth: {
        title: "Youth & Teens",
        tag: "A Passionate Generation of Faith",
        desc: "Heartfelt conversations, answers to questions of faith, and discovering the spiritual gifts of the younger generation.",
        alt: "Youth of the Iranian church in fellowship and conversation",
        action: "Weekly Gatherings",
      },
      worship: {
        title: "Worship & Music",
        tag: "The Living Presence of the Lord",
        desc: "Leading the church in new and timeless spiritual songs in the glorious presence of the Holy Spirit.",
        alt: "Church worship and music team",
        action: "Church Worship Team",
      },
      homeGroups: {
        title: "Home & Fellowship Groups",
        tag: "Weekly Fellowship",
        desc: "Warm fellowship among believers, dedicated prayer, and Word study in a close-knit family setting.",
        alt: "Intimate gatherings of the home church",
        action: "Join the Nearest Group",
      },
    },
  },
  fa: {
    badge: "بخش‌های فعال کلیسا",
    heading: "خدمات و شاخه‌های کلیسا",
    subheading: "محیطی صمیمی برای رشد ایمانی تمامی رده‌های سنی",
    items: {
      women: {
        title: "خدمت و مشارکت بانوان",
        tag: "مشارکت و رشد ایمانی",
        desc: "جلسات صمیمانه دعا، مطالعه کلام و توانمندسازی روحانی بانوان و خانواده‌ها در فیض خداوند.",
        alt: "مشارکت و جلسات بانوان کلیسای ایرانیان",
        action: "اطلاعات برنامه بانوان",
      },
      youth: {
        title: "جوانان و نوجوانان",
        tag: "نسل پرشور ایمان",
        desc: "جلسات صمیمانه گفتگو، پاسخ به پرسش‌های ایمانی و کشف استعدادهای روحانی نسل جوان.",
        alt: "جوانان کلیسای ایرانیان در مشارکت و گفتگو",
        action: "مشارکت‌های هفتگی",
      },
      worship: {
        title: "پرستش و سرود",
        tag: "حضور زنده خداوند",
        desc: "هدایت کلیسا در سرودهای روحانی جدید و کهن در حضور پرجلال روح‌القدس.",
        alt: "تیم سرود و پرستش کلیسا",
        action: "گروه سرود کلیسا",
      },
      homeGroups: {
        title: "گروه‌های خانگی و شبانی",
        tag: "مشارکت هفتگی",
        desc: "مشارکت صمیمانه ایمانداران، دعای اختصاصی و مطالعه کلام در جمع گرم خانوادگی.",
        alt: "جلسات صمیمانه کلیسای خانگی",
        action: "پیوستن به نزدیک‌ترین گروه",
      },
    },
  },
  es: {
    badge: "Ministerios Activos de la Iglesia",
    heading: "Ministerios y Departamentos de la Iglesia",
    subheading: "Un ambiente cálido para el crecimiento espiritual en todas las edades",
    items: {
      women: {
        title: "Ministerio y Comunión de Mujeres",
        tag: "Comunión y Crecimiento Espiritual",
        desc: "Reuniones íntimas de oración, estudio de la Palabra y empoderamiento espiritual para mujeres y familias en la gracia de Dios.",
        alt: "Comunión y reuniones de mujeres de la iglesia iraní",
        action: "Información del Ministerio de Mujeres",
      },
      youth: {
        title: "Jóvenes y Adolescentes",
        tag: "Una Generación Apasionada de Fe",
        desc: "Conversaciones sinceras, respuestas a preguntas de fe y descubrimiento de los dones espirituales de la generación joven.",
        alt: "Jóvenes de la iglesia iraní en comunión y conversación",
        action: "Reuniones Semanales",
      },
      worship: {
        title: "Adoración y Música",
        tag: "La Presencia Viva del Señor",
        desc: "Guiando a la iglesia en cantos espirituales nuevos y antiguos en la gloriosa presencia del Espíritu Santo.",
        alt: "Equipo de adoración y música de la iglesia",
        action: "Equipo de Adoración de la Iglesia",
      },
      homeGroups: {
        title: "Grupos Hogareños y de Comunión",
        tag: "Comunión Semanal",
        desc: "Comunión cercana entre creyentes, oración dedicada y estudio de la Palabra en un ambiente familiar cálido.",
        alt: "Reuniones íntimas de la iglesia en el hogar",
        action: "Únete al Grupo Más Cercano",
      },
    },
  },
};

export default function MinistriesSection() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;

  return (
    <section className="w-full py-16 px-4 max-w-[1240px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className={`${isRTL ? "text-right" : "text-left"} mb-8`}>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1c1f2a] text-amber-400 text-[12px] font-semibold mb-2.5 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{d.badge}</span>
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          {d.heading}
        </h2>
        <p className="text-[14px] text-gray-300 mt-1.5 leading-relaxed">
          {d.subheading}
        </p>
      </div>

      {/* ── 4 Ministry Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ministriesMeta.map((item, idx) => {
          const text = d.items[item.id as keyof typeof d.items];
          return (
            <motion.div
              key={item.id}
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
                  alt={text.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-semibold border ${item.tagColor}`}>
                  {text.tag}
                </span>
              </div>

              {/* Content Body */}
              <div className={`p-5 flex-1 flex flex-col justify-between ${isRTL ? "text-right" : "text-left"}`}>
                <div>
                  <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {text.title}
                  </h3>
                  <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                    {text.desc}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 ${item.actionColor} text-[13px] font-bold hover:underline pt-2 border-t border-white/5`}
                >
                  <span>{text.action}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
