"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCanvas from "./HeroCanvas";
import { useLanguage } from "@/providers/LanguageProvider";

gsap.registerPlugin(ScrollTrigger);

const localDict = {
  fa: {
    message1Heading: "پراکنده در سراسر زمین",
    message1Quote: "«زیرا جایی که دو یا سه نفر به نام من جمع شوند...»",
    message2Heading: "متحد در یک بدن",
    message2Subtitle: "پیوند بیش از ۱۲,۴۰۰ عضو در ۳۴ کشور جهان",
    message3Heading: "«من نور جهان هستم»",
    message3Reference: "یوحنا ۸:۱۲",
    message4Heading: "به جامعه دیجیتال کلیسا بپیوندید",
    ctaPrayerWall: "ورود به دیوار نوری دعا",
  },
  en: {
    message1Heading: "Scattered across the earth",
    message1Quote: "\"For where two or three gather in my name...\"",
    message2Heading: "United in one body",
    message2Subtitle: "Connecting more than 12,400 members across 34 countries",
    message3Heading: "\"I am the light of the world\"",
    message3Reference: "John 8:12",
    message4Heading: "Join the church's digital community",
    ctaPrayerWall: "Enter the Prayer Wall of Light",
  },
  es: {
    message1Heading: "Dispersos por toda la tierra",
    message1Quote: "«Porque donde dos o tres se reúnen en mi nombre...»",
    message2Heading: "Unidos en un solo cuerpo",
    message2Subtitle: "Conectando a más de 12,400 miembros en 34 países",
    message3Heading: "«Yo soy la luz del mundo»",
    message3Reference: "Juan 8:12",
    message4Heading: "Únete a la comunidad digital de la iglesia",
    ctaPrayerWall: "Entrar al Muro de Oración de Luz",
  },
};

export default function Hero() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5, // اسکرول نرم و روان سینمایی
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-bgDark" id="hero" dir={isRTL ? "rtl" : "ltr"}>
      {/* بخش چسبان (Sticky) که در طول ۴۰۰vh ثابت می‌ماند */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">

        {/* پس‌زمینه ویدیویی لوگوی کلیسا */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/hero-fallback.webp"
            className="w-full h-full object-cover opacity-70"
          >
            <source src="/Hero.webm" type="video/webm" />
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* گرادیان برای ادغام ویدیوی مشکی با پس‌زمینه سایت */}
          <div className="absolute inset-0 bg-gradient-to-b from-bgDark/40 via-transparent to-bgDark" />
        </div>

        {/* بوم سه‌بعدی ذرات */}
        <HeroCanvas scrollProgress={scrollProgress} />

        {/* سایه سیاه‌رنگ چندلایه برای خوانایی بهتر متن‌ها */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-bgDark/60 to-bgDark pointer-events-none z-10" />

        {/* --- لایه متون که بر اساس درصد اسکرول ظاهر می‌شوند --- */}

        {/* پیام اول (۱۵٪ تا ۲۵٪) */}
        <div
          className="absolute z-20 text-center transition-all duration-700 max-w-2xl px-4"
          style={{
            opacity: scrollProgress >= 0.10 && scrollProgress <= 0.30 ? 1 : 0,
            transform: `translateY(${(0.20 - scrollProgress) * 50}px)`,
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            {d.message1Heading}
          </h2>
          <p className="text-accentGold text-lg md:text-xl font-serif">
            {d.message1Quote}
          </p>
        </div>

        {/* پیام دوم (۴۰٪ تا ۵۰٪) */}
        <div
          className="absolute z-20 text-center transition-all duration-700 max-w-2xl px-4"
          style={{
            opacity: scrollProgress >= 0.35 && scrollProgress <= 0.55 ? 1 : 0,
            transform: `translateY(${(0.45 - scrollProgress) * 50}px)`,
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-wide">
            {d.message2Heading}
          </h2>
          <p className="text-accentCyan text-lg md:text-xl font-serif">
            {d.message2Subtitle}
          </p>
        </div>

        {/* پیام سوم (۷۰٪ تا ۸۰٪) */}
        <div
          className="absolute z-20 text-center transition-all duration-700 max-w-3xl px-4"
          style={{
            opacity: scrollProgress >= 0.65 && scrollProgress <= 0.85 ? 1 : 0,
            transform: `translateY(${(0.75 - scrollProgress) * 50}px)`,
          }}
        >
          <h2 className="text-3xl md:text-6xl font-bold text-amber-300 mb-4 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
            {d.message3Heading}
          </h2>
          <p className="text-slate-300 text-lg md:text-2xl font-serif">
            {d.message3Reference}
          </p>
        </div>

        {/* پیام چهارم / فراخوان اقدام (۹۰٪ تا ۱۰۰٪) */}
        <div
          className="absolute z-20 text-center transition-all duration-700 max-w-2xl px-4"
          style={{
            opacity: scrollProgress >= 0.88 ? 1 : 0,
            transform: `translateY(${(0.95 - scrollProgress) * 50}px)`,
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {d.message4Heading}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#prayer-wall"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-accentGold to-amber-600 text-bgDark font-bold text-lg shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:scale-105 transition-transform"
            >
              {d.ctaPrayerWall}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
