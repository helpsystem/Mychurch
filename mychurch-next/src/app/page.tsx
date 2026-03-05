"use client";

import React from "react";
import Link from "next/link";
import {
  Play, BookOpen, Music, Video, User, Heart, Mic, Phone, Settings, Globe, Users
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-primary/20 rounded-full blur-[80px] animate-pulse-slow" />
      </div>

      <div className="relative z-10">

        {/* Navigation Bar */}
        <nav className="fixed top-0 inset-x-0 h-20 bg-background/60 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6 lg:px-12">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4">
            <div className="w-14 items-center justify-center flex">
              <Image
                src="/logo-transparent.png"
                alt="Church Logo"
                width={56}
                height={56}
                className="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight leading-none text-foreground uppercase drop-shadow-sm">Iranian Christian Church</span>
              <span className="text-xs font-bold text-primary tracking-widest uppercase">{t.heroTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button className="hidden md:flex items-center gap-2 p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary font-medium transition-colors shadow-sm cursor-pointer border border-border/10" title="User Menu">
              <User className="w-5 h-5" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col justify-center min-h-[70vh]">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold tracking-widest uppercase shadow-inner">
              <Globe className="w-4 h-4" />
              {t.heroTitle}
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 leading-[1.1] pb-2 drop-shadow-sm">
              {t.heroTitle}
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/worship" className="flex items-center gap-3 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02]">
                <Music className="w-5 h-5" />
                {t.worship}
              </Link>
              <Link href="/bible" className="flex items-center gap-3 bg-secondary text-foreground font-bold px-8 py-4 rounded-2xl hover:bg-muted transition-all border border-border/10 hover:shadow-lg shadow-black/5 hover:scale-[1.02]">
                <BookOpen className="w-5 h-5 opacity-80" />
                {t.bible}
              </Link>
            </div>
          </div>
        </header>

        {/* Quick Access Grid */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-24">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
            <h2 className="text-3xl font-bold">{t.quickAccess}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: t.bible, icon: BookOpen, desc: "Persian & English translations", link: "/bible", color: "from-blue-500/20 to-indigo-500/20", iconColor: "text-blue-500" },
              { title: t.worship, icon: Music, desc: "Live lyrics & chords", link: "/worship", color: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500" },
              { title: t.sermons, icon: Video, desc: "Video & audio archives", link: "/sermons", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500" },
              { title: t.broadcast, icon: Mic, desc: "Live service controller", link: "/broadcast", color: "from-red-500/20 to-orange-500/20", iconColor: "text-red-500" },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="group relative overflow-hidden rounded-3xl bg-secondary/30 backdrop-blur-md border border-border/50 p-6 flex flex-col gap-4 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${item.color} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner border border-white/5 relative z-10`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>

                <div className="relative z-10 mt-auto pt-4">
                  <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Dynamic Stats & Daily Verse */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto pb-32 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Daily Verse CTA */}
          <div className="lg:col-span-2 mt-12 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

            {/* Background Watermark Logo (Admin Configurable) */}
            <DynamicWatermark
              defaultSize={400}
              defaultOpacity={4}
              defaultPosition="custom"
              className="-left-20 md:-left-12 -bottom-24 group-hover:scale-105 group-hover:rotate-12"
            />

            <div className="relative glass p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 justify-between">
              <div className="flex-1 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 shadow-sm backdrop-blur-md">
                  <Image
                    src="/logo-transparent.png"
                    alt="Logo"
                    width={18}
                    height={18}
                    className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  />
                  {t.dailyVerseTitle}
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black leading-tight text-foreground/90 text-right leading-relaxed" dir="rtl">
                    "خدا روح است و هر که او را می‌پرستد، باید به روح و راستی بپرستد."
                  </h3>
                  <h3 className="text-xl md:text-2xl font-bold leading-tight text-foreground/70 text-left font-serif italic" dir="ltr">
                    "God is spirit, and his worshipers must worship in the Spirit and in truth."
                  </h3>
                </div>

                <p className="text-primary font-bold text-lg bg-black/20 inline-block px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm shadow-inner">
                  یوحنا ۴:۲۴ | John 4:24
                </p>
              </div>
              <Link href="/bible" className="shrink-0">
                <button className="px-8 py-4 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-primary/30 hover:-translate-y-1" title="Read Bible">
                  {t.readMore}
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-col gap-6">
            {[
              { label: t.statsMembers, value: "12,400+", icon: Users },
              { label: t.statsGroups, value: "150+", icon: Box },
              { label: t.statsCountries, value: "34", icon: Globe }
            ].map((stat, i) => (
              <div key={i} className="flex-1 bg-secondary/40 backdrop-blur-sm border border-border/50 rounded-3xl p-6 flex flex-col justify-center hover:bg-secondary/60 transition-colors">
                <stat.icon className="w-8 h-8 text-primary/50 mb-4" />
                <div className="text-4xl font-black tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-muted-foreground tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

        </section>

      </div>
    </div>
  );
}

// Quick placeholder for Box icon
function Box(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
}
