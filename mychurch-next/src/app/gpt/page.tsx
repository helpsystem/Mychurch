import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Sparkles, BookOpen, MessageCircle, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "هوش مصنوعی کتاب‌مقدس | Iranian Christian Church DC",
  description: "دستیار هوشمند الهیاتی و پاسخ به سوالات کتاب‌مقدس و مسیحیت با همکاری شبکه حیات",
};

export default function GptPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-[Vazirmatn]" dir="rtl">
      <PublicHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-32 pb-16">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>دستیار هوشمند و الهیاتی کتاب‌مقدس (Al Hayat GPT)</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            گفتگوی هوشمند درباره کتاب‌مقدس
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            پاسخ به سوالات الهیاتی، بررسی آیات و مفاهیم کتاب‌مقدس به زبان فارسی با امکان انتخاب شخصیت‌های مختلف
          </p>
        </div>

        {/* Iframe Container */}
        <div className="w-full bg-zinc-950/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs text-zinc-400 mr-2 font-mono">alhayatgpt.com</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/bible"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>متن کتاب‌مقدس</span>
              </Link>
              <a
                href="https://www.alhayat.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <span>Al Hayat Ministries</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="w-full min-h-[650px] md:min-h-[750px] h-[78vh] relative bg-black/40">
            <iframe
              src="https://www.alhayatgpt.com/widget/chat?theme=dark&allowCharacterSelection=true&parentOrigin=https%3A%2F%2Fwww.iranianchurchdc.com&source=www.iranianchurchdc.com"
              id="alhayat-gpt-widget-iframe"
              title="Al Hayat GPT Chat Widget"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              allow="clipboard-write"
              loading="lazy"
              className="w-full h-full border-none block"
            />
          </div>
        </div>

        {/* Footer Guidance Note (Same as Mohabat TV) */}
        <div className="mt-8 max-w-3xl mx-auto text-center space-y-4 px-4">
          <div className="flex items-start justify-center gap-2 text-xs text-zinc-400 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              توجه: پاسخ‌های این هوش مصنوعی برگرفته از کتاب‌مقدس و دیگر کتب الهیاتی موثق می‌باشند. لطفاً تمام پاسخ‌ها را با کتاب‌مقدس تطبیق دهید، زیرا این یک سیستم هوشمند است و ممکن است در موارد نادر حاوی اشتباه باشد.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>جهت ارتباط با شبانان و مشاورین کلیسا، اینجا کلیک کنید</span>
            </Link>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">
              Powered by <a href="https://www.alhayat.org/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:underline">Al Hayat Ministries</a>
            </span>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
