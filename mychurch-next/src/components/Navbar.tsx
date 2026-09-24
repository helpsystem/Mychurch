"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Radio, Menu, X } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  en: {
    churchName: "Iranian Evangelical Church of Washington D.C.",
    home: "Home",
    prayerWall: "Prayer Wall",
    globalReach: "Global Reach",
    liveBroadcast: "Live Broadcast",
    donate: "Give & Support",
  },
  fa: {
    churchName: "کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
    home: "خانه",
    prayerWall: "دیوار نوری دعا",
    globalReach: "پراکنش جهانی",
    liveBroadcast: "پخش زنده",
    donate: "اهدای هدیه و همیاری",
  },
  es: {
    churchName: "Iglesia Evangélica Iraní de Washington D.C.",
    home: "Inicio",
    prayerWall: "Muro de Oración",
    globalReach: "Alcance Global",
    liveBroadcast: "Transmisión en Vivo",
    donate: "Donar y Apoyar",
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bgDark/80 backdrop-blur-md border-b border-accentGold/20 py-3 shadow-lg shadow-black/50"
          : "bg-transparent py-5"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* لوگو و نام کلیسا */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentGold to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <Sparkles className="w-5 h-5 text-bgDark" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {d.churchName}
            </h1>
            <p className="text-xs text-accentGold/80">Iranian Presbyterian Church</p>
          </div>
        </div>

        {/* منوی دسکتاپ */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#hero" className="hover:text-accentGold transition-colors">
            {d.home}
          </a>
          <a href="#prayer-wall" className="hover:text-accentGold transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accentGold" />
            {d.prayerWall}
          </a>
          <a href="#globe" className="hover:text-accentGold transition-colors">
            {d.globalReach}
          </a>
          <a href="#live" className="hover:text-accentGold transition-colors flex items-center gap-1.5 text-rose-400">
            <Radio className="w-4 h-4 animate-pulse" />
            {d.liveBroadcast}
          </a>
        </div>

        {/* دکمه اقدام / همیاری */}
        <div className="hidden md:block">
          <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-accentGold to-amber-600 text-bgDark font-bold text-sm hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all transform hover:-translate-y-0.5">
            {d.donate}
          </button>
        </div>

        {/* دکمه موبایل */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* منوی کشویی موبایل */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-bgDark/95 backdrop-blur-xl border-b border-accentGold/20 px-6 py-6 flex flex-col gap-4 text-slate-200">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)}>{d.home}</a>
          <a href="#prayer-wall" onClick={() => setMobileMenuOpen(false)}>{d.prayerWall}</a>
          <a href="#globe" onClick={() => setMobileMenuOpen(false)}>{d.globalReach}</a>
          <a href="#live" onClick={() => setMobileMenuOpen(false)}>{d.liveBroadcast}</a>
        </div>
      )}
    </nav>
  );
}
