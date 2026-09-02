'use client';

import React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import AlHayatGPTWidget from "@/components/AlHayatGPTWidget";
import {
  Sparkles, BookOpen, MessageCircle, ShieldCheck,
  HeartHandshake, Cross, Stars, Flame, BookMarked
} from "lucide-react";

const CHARACTERS = [
  { id: 'jesus',      label: 'عیسی مسیح',    en: 'Jesus Christ',  emoji: '✝️',  color: 'from-cyan-500 to-blue-500' },
  { id: 'paul',       label: 'پولس رسول',    en: 'Paul',          emoji: '📜',  color: 'from-violet-500 to-purple-500' },
  { id: 'moses',      label: 'موسی نبی',     en: 'Moses',         emoji: '📿',  color: 'from-amber-500 to-orange-500' },
  { id: 'david',      label: 'داوود پادشاه', en: 'David',         emoji: '🎵',  color: 'from-emerald-500 to-teal-500' },
  { id: 'mary',       label: 'مریم مقدس',   en: 'Mary',          emoji: '🌸',  color: 'from-pink-500 to-rose-500' },
  { id: 'theologian', label: 'الهی‌دان',     en: 'Theologian',    emoji: '🔬',  color: 'from-zinc-400 to-zinc-500' },
];

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

      <main className="relative z-10 flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-6">

        {/* ─── PAGE HEADER ─── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-6">
          <div className="text-center sm:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Al Hayat GPT 2.0 — هوش مصنوعی الهیاتی
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              دستیار هوشمند{' '}
              <span className="bg-gradient-to-l from-amber-400 to-amber-200 bg-clip-text text-transparent">
                کتاب‌مقدس
              </span>
            </h1>
            <p className="mt-2 text-zinc-400 text-sm max-w-lg">
              با شخصیت‌های کتاب‌مقدسی گفتگو کنید، سوالات الهیاتی بپرسید و با متن مقدس آشنا شوید.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/bible"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all text-sm font-semibold"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>کتاب‌مقدس</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all text-sm font-semibold"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>ارتباط با شبان</span>
            </Link>
          </div>
        </div>

        {/* ─── MAIN CHAT AREA ─── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* Left: Character Selector Cards */}
          <div className="w-full lg:w-56 xl:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <div className="hidden lg:block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 px-1">
              انتخاب شخصیت
            </div>
            {CHARACTERS.map((c) => (
              <div
                key={c.id}
                className="flex lg:flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/15 hover:bg-zinc-800/60 transition-all cursor-pointer shrink-0 group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-base shadow-lg shrink-0`}>
                  {c.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors leading-none">
                    {c.label}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{c.en}</div>
                </div>
              </div>
            ))}

            {/* Divider + Bible link */}
            <div className="hidden lg:block mt-auto pt-4 border-t border-white/5">
              <Link
                href="/bible"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 text-blue-400 transition-all text-xs font-semibold"
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>مطالعه کتاب‌مقدس</span>
              </Link>
            </div>
          </div>

          {/* Right: Widget Canvas */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top status bar */}
            <div className="flex items-center justify-between px-4 py-2.5 mb-2 rounded-xl bg-zinc-900/60 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="text-xs text-zinc-400 font-medium">در حال اتصال به الهی‌دان هوشمند…</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Stars className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-zinc-500 font-mono">Al Hayat GPT v2.0</span>
              </div>
            </div>

            {/* Chat widget */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50" style={{ minHeight: '68vh' }}>
              <AlHayatGPTWidget
                containerId="church-main-gpt"
                theme="dark"
                character="jesus"
                showCharacterSelector={true}
                height="100%"
                className="w-full h-full"
              />
            </div>

            {/* Disclaimer */}
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/40 border border-white/5 text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                پاسخ‌ها برگرفته از کتاب‌مقدس و منابع معتبر الهیاتی‌اند. همواره با متن کلام خدا تطبیق دهید.
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                همکاری رسمی با شبکه محبت
              </div>
            </div>
          </div>
        </div>

        {/* ─── FEATURES GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {[
            {
              icon: <Flame className="w-5 h-5 text-amber-400" />,
              title: 'الهیات تعمقی',
              desc: 'پرسش‌های عمیق الهیاتی، اصول ایمان و مقایسه مذاهب مسیحی',
              bg: 'from-amber-500/10 to-transparent',
              border: 'border-amber-500/10',
            },
            {
              icon: <BookOpen className="w-5 h-5 text-blue-400" />,
              title: 'تفسیر کتاب‌مقدسی',
              desc: 'توضیح آیات، زبان یونانی و عبری، و زمینه تاریخی نوشته‌های مقدس',
              bg: 'from-blue-500/10 to-transparent',
              border: 'border-blue-500/10',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
              title: 'دفاعیه ایمان',
              desc: 'پاسخ به شبهات، دیالوگ با ادیان مختلف و دلایل ایمان مسیحی',
              bg: 'from-emerald-500/10 to-transparent',
              border: 'border-emerald-500/10',
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br ${f.bg} border ${f.border} hover:brightness-110 transition-all`}
            >
              <div className="shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <div className="font-bold text-sm text-zinc-200 mb-0.5">{f.title}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
