"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Radio, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* لوگو و نام کلیسا */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentGold to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <Sparkles className="w-5 h-5 text-bgDark" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              کلیسای ایرانیان واشنگتن دی‌سی
            </h1>
            <p className="text-xs text-accentGold/80">Iranian Church DC</p>
          </div>
        </div>

        {/* منوی دسکتاپ */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#hero" className="hover:text-accentGold transition-colors">
            خانه
          </a>
          <a href="#prayer-wall" className="hover:text-accentGold transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accentGold" />
            دیوار نوری دعا
          </a>
          <a href="#globe" className="hover:text-accentGold transition-colors">
            پراکنش جهانی
          </a>
          <a href="#live" className="hover:text-accentGold transition-colors flex items-center gap-1.5 text-rose-400">
            <Radio className="w-4 h-4 animate-pulse" />
            پخش زنده
          </a>
        </div>

        {/* دکمه اقدام / همیاری */}
        <div className="hidden md:block">
          <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-accentGold to-amber-600 text-bgDark font-bold text-sm hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all transform hover:-translate-y-0.5">
            اهدای هدیه و همیاری
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
          <a href="#hero" onClick={() => setMobileMenuOpen(false)}>خانه</a>
          <a href="#prayer-wall" onClick={() => setMobileMenuOpen(false)}>دیوار نوری دعا</a>
          <a href="#globe" onClick={() => setMobileMenuOpen(false)}>پراکنش جهانی</a>
          <a href="#live" onClick={() => setMobileMenuOpen(false)}>پخش زنده</a>
        </div>
      )}
    </nav>
  );
}
