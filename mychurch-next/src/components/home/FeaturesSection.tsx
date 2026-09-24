"use client";

import "@/lib/react-polyfill";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Music, Video, Radio, HeartHandshake, Users, ArrowLeft, Sparkles, Calendar } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const featuresMeta = [
  {
    id: "bible",
    icon: BookOpen,
    href: "/bible",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    hoverBorder: "hover:border-amber-500/40",
    actionColor: "text-amber-400",
  },
  {
    id: "worship",
    icon: Music,
    href: "/worship",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15",
    hoverBorder: "hover:border-cyan-500/40",
    actionColor: "text-cyan-400",
  },
  {
    id: "sermons",
    icon: Video,
    href: "/sermons",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    hoverBorder: "hover:border-indigo-500/40",
    actionColor: "text-indigo-400",
  },
  {
    id: "broadcast",
    icon: Radio,
    href: "/broadcast/view",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/15",
    hoverBorder: "hover:border-red-500/40",
    actionColor: "text-red-400",
  },
  {
    id: "prayer",
    icon: HeartHandshake,
    href: "/prayers",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-400/15",
    hoverBorder: "hover:border-amber-400/40",
    actionColor: "text-amber-300",
  },
  {
    id: "weekly",
    icon: Calendar,
    href: "#weekly-schedule",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/40",
    actionColor: "text-emerald-400",
  },
];

const localDict = {
  en: {
    badge: "Church Ministries",
    heading: "Everything in One Place",
    subheading: "From the Bible to live broadcasts, everything you need to grow in faith",
    items: {
      bible: { title: "The Bible", desc: "Study and reflect on God's Word with Persian and English translations.", action: "Study" },
      worship: { title: "Worship Songs", desc: "A rich collection of Persian spiritual songs, chords, and hymns.", action: "Listen" },
      sermons: { title: "Sermons & Teachings", desc: "Archive of Pastor Javad's pastoral messages and church teachings.", action: "Watch" },
      broadcast: { title: "Live Broadcast", desc: "Join our weekly Sunday services online and interactively.", action: "Join" },
      prayer: { title: "Prayer Request", desc: "Submit your needs, intercession, and prayers on the church's prayer wall.", action: "Submit Prayer" },
      weekly: { title: "Weekly Programs & Classes", desc: "Bible study classes throughout the week and Sunday services (Washington D.C. time).", action: "View Sessions" },
    },
  },
  fa: {
    badge: "خدمات کلیسا",
    heading: "همه چیز در یک جا",
    subheading: "از کتاب مقدس تا پخش زنده، هر چیزی که برای رشد ایمانی نیاز دارید",
    items: {
      bible: { title: "کتاب مقدس", desc: "مطالعه و تفکر در کلام خدا با ترجمه‌های فارسی و انگلیسی.", action: "مطالعه" },
      worship: { title: "سرودهای پرستشی", desc: "مجموعه فاخر آهنگ‌ها، آکوردها و سرودهای روحانی فارسی.", action: "شنیدن" },
      sermons: { title: "مواعظ و تعلیمات", desc: "آرشیو پیام‌های شبانی کشیش جواد و تعالیم کلیسا.", action: "مشاهده" },
      broadcast: { title: "پخش زنده", desc: "مشارکت در جلسات هفتگی یکشنبه‌ها به صورت برخط و تعاملی.", action: "پیوستن" },
      prayer: { title: "درخواست دعا", desc: "ثبت نیازها، شفاعت و دعا در دیوار نوری و شبانی کلیسا.", action: "ثبت دعا" },
      weekly: { title: "برنامه‌ها و جلسات هفتگی", desc: "کلاس‌های تدریس کتاب مقدس در طول هفته و جلسات یکشنبه به وقت واشنگتن.", action: "مشاهده جلسات" },
    },
  },
  es: {
    badge: "Ministerios de la Iglesia",
    heading: "Todo en un Solo Lugar",
    subheading: "Desde la Biblia hasta las transmisiones en vivo, todo lo que necesitas para crecer en la fe",
    items: {
      bible: { title: "La Biblia", desc: "Estudia y reflexiona sobre la Palabra de Dios con traducciones en persa e inglés.", action: "Estudiar" },
      worship: { title: "Cantos de Adoración", desc: "Una rica colección de canciones, acordes e himnos espirituales persas.", action: "Escuchar" },
      sermons: { title: "Sermones y Enseñanzas", desc: "Archivo de los mensajes pastorales del Pastor Javad y las enseñanzas de la iglesia.", action: "Ver" },
      broadcast: { title: "Transmisión en Vivo", desc: "Únete a nuestros servicios dominicales semanales en línea e interactivamente.", action: "Unirse" },
      prayer: { title: "Petición de Oración", desc: "Envía tus necesidades, intercesión y oraciones en el muro de oración de la iglesia.", action: "Enviar Oración" },
      weekly: { title: "Programas y Clases Semanales", desc: "Clases de estudio bíblico durante la semana y servicios dominicales (hora de Washington D.C.).", action: "Ver Sesiones" },
    },
  },
};

export default function FeaturesSection() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;

  return (
    <section className="w-full py-16 px-4 max-w-[1240px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div className={`flex flex-col gap-1 mb-8 ${isRTL ? "text-right" : "text-left"}`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1c1f2a] text-amber-400 text-[12px] font-semibold mb-2.5 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{d.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {d.heading}
          </h2>
          <p className="text-[14px] text-gray-300 mt-1.5 leading-relaxed">
            {d.subheading}
          </p>
        </div>
      </div>

      {/* ── 6 Feature Glass Cards Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuresMeta.map((item, idx) => {
          const Icon = item.icon;
          const text = d.items[item.id as keyof typeof d.items];
          return (
            <motion.div
              key={item.id}
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
                    {text.title}
                  </h3>
                  <p className="text-[13px] text-gray-300 line-clamp-2 leading-relaxed">
                    {text.desc}
                  </p>
                </div>

                <div className={`mt-5 pt-3 border-t border-white/5 flex items-center justify-between ${item.actionColor} text-[12px] font-bold`}>
                  <span>{text.action}</span>
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
