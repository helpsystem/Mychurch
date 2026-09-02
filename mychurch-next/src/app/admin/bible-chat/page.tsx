"use client";

import React from "react";
import { Sparkles, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export default function BibleChatPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 h-[calc(100vh-100px)] min-h-[600px] font-[Vazirmatn]" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/60 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base">دستیار هوشمند کتاب‌مقدس (Al Hayat GPT)</h2>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-sans flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              مبتنی بر Al Hayat Ministries با قابلیت پاسخگویی تخصصی به سوالات الهیاتی و انتخاب شخصیت‌های کتاب‌مقدس
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/gpt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>مشاهده صفحه عمومی کاربر (/gpt)</span>
          </a>
          <a
            href="/bible"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>متن کتاب‌مقدس</span>
          </a>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 w-full bg-zinc-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        <iframe
          src="https://www.alhayatgpt.com/widget/chat?theme=dark&allowCharacterSelection=true&parentOrigin=https%3A%2F%2Fwww.iranianchurchdc.com&source=www.iranianchurchdc.com"
          id="alhayat-gpt-widget-iframe-admin"
          title="Al Hayat GPT Admin Chat"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write"
          loading="lazy"
          className="w-full h-full border-none block"
        />
      </div>
    </div>
  );
}
