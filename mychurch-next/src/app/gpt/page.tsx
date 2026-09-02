'use client';

import React, { useEffect, useRef } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Sparkles, BookOpen, MessageCircle, AlertCircle, ShieldCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function GptPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Official Al Hayat GPT SDK Loader
    const scriptId = "alhayat-widget-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeWidget = () => {
      const w = window as any;
      if (w.AlHayatGPT && containerRef.current) {
        try {
          w.AlHayatGPT.createWidget({
            containerId: "ahgpt-chat-widget",
            theme: "dark",
            character: "jesus",
            showCharacterSelector: true,
            allowCharacterSelection: true,
            height: "100%",
            width: "100%",
          });
        } catch (err) {
          console.warn("[AlHayatGPT] Error initializing SDK widget:", err);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://alhayatgpt.com/widget-sdk.js";
      script.defer = true;
      script.onload = () => {
        initializeWidget();
      };
      document.body.appendChild(script);
    } else {
      initializeWidget();
    }

    window.addEventListener("AlHayatGPTSDKReady", initializeWidget);

    return () => {
      window.removeEventListener("AlHayatGPTSDKReady", initializeWidget);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-[Vazirmatn] overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200" dir="rtl">
      <PublicHeader />

      {/* Main Full-Height App Container */}
      <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-20 sm:pt-24 pb-4">
        {/* Top Feature Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 py-2 px-3 sm:px-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md">
          {/* Left: Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-zinc-100 tracking-wide">
                  دستیار هوشمند و الهیاتی کتاب‌مقدس
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  Al Hayat GPT 2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                پاسخگویی به پرسش‌های الهیاتی، مفاهیم ایمان مسیحی و بررسی آیات
              </p>
            </div>
          </div>

          {/* Right: Quick Action Links */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/bible"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>کتاب‌مقدس</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all font-semibold"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ارتباط با شبان</span>
            </Link>
          </div>
        </div>

        {/* Chat Widget Canvas (Takes Full Available Viewport) */}
        <div className="flex-1 w-full relative rounded-2xl sm:rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col min-h-[72vh] sm:min-h-[78vh] lg:min-h-[82vh]">
          {/* Target Container for the Official SDK */}
          <div
            id="ahgpt-chat-widget"
            ref={containerRef}
            className="w-full h-full flex-1 relative"
            style={{ width: "100%", height: "100%", minHeight: "100%" }}
          >
            {/* Direct fallback iframe with persona=jesus until SDK initializes */}
            <iframe
              src="https://www.alhayatgpt.com/widget/chat?theme=dark&persona=jesus&character=jesus&allowCharacterSelection=true&showCharacterSelector=true&parentOrigin=https%3A%2F%2Fwww.iranianchurchdc.com&source=www.iranianchurchdc.com"
              id="alhayat-gpt-widget-iframe"
              title="Al Hayat GPT Chat Widget"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              allow="clipboard-write"
              loading="eager"
              className="w-full h-full border-none absolute inset-0 block rounded-2xl"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* Bottom Theological Guidance Note */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5 text-right leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span>
              پاسخ‌ها برگرفته از کتاب‌مقدس و منابع معتبر الهیاتی است. لطفاً مطالب را همواره با متن کلام خدا تطبیق دهید.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>همکاری رسمی با شبکه محبت و سازمان حیات</span>
          </div>
        </div>
      </main>
    </div>
  );
}
