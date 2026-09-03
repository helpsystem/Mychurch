'use client';

import React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import AlHayatGPTWidget from "@/components/AlHayatGPTWidget";
import {
  Sparkles, BookOpen, MessageCircle, ShieldCheck, HeartHandshake
} from "lucide-react";

export default function GptPage() {
  return (
    <div
      className="min-h-screen bg-[#070709] text-white flex flex-col font-[Vazirmatn]"
      dir="rtl"
    >
      <PublicHeader />

      {/* ─── HERO GRADIENT TOP ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute top-60 -right-40 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[100px]" />
        <div className="absolute top-60 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-600/5 blur-[100px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        
        {/* ─── PAGE HEADER ─── */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Al Hayat GPT 2.0
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
            دستیار هوشمند و الهیاتی
            <span className="block mt-1 bg-gradient-to-l from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
              کتاب‌مقدس
            </span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            محلی امن برای پرسش‌های الهیاتی، بررسی عمیق آیات کلام خدا، و مکالمه با شخصیت‌های کتاب‌مقدسی جهت تقویت ایمان و شناخت عمیق‌تر از کلام.
          </p>
        </div>

        {/* ─── MAIN CHAT WIDGET ─── */}
        <div className="w-full flex-1 flex flex-col">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-5 py-3 mb-3 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-sm text-zinc-300 font-medium">متصل به پایگاه داده الهیاتی</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/bible"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-xs font-bold"
              >
                <BookOpen className="w-3.5 h-3.5" />
                مطالعه کلام
              </Link>
            </div>
          </div>

          {/* Widget Container */}
          <div className="w-full bg-zinc-950/80 rounded-3xl border border-white/10 p-2 sm:p-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <AlHayatGPTWidget
              containerId="church-study-bot"
              theme="dark"
              height="700px"
              className="w-full rounded-2xl border border-white/5"
            />
          </div>

          {/* Bottom Trust Indicators */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-zinc-500 text-center sm:text-right">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-amber-500/70" />
              <span>پاسخ‌ها برگرفته از کتاب‌مقدس و منابع معتبر. لطفاً با متن کلام تطبیق دهید.</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-zinc-700" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
              <span>پشتیبانی و همیاری رسمی با شبکه محبت</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
