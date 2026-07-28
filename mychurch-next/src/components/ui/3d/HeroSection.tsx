"use client";

/**
 * HeroSection
 * -----------
 * The homepage thesis: light finding form. Built directly from real copy
 * already on iranianchurchdc.com — the four verses, the tagline, the two
 * primary CTAs — restyled with intention rather than invented content.
 *
 * Drop-in replacement for the current hero block in app/page.tsx.
 * Requires HeroParticleField.tsx (same folder/import alias) and the
 * `vazirmatn` / `notoNaskh` font variables applied at the root layout
 * (see lib/fonts.ts).
 */

import { useEffect, useRef, useState } from "react";
import HeroParticleField from "@/components/ui/3d/HeroParticleField";

type Verse = {
  text: string;
  reference: string;
};

const VERSES: Verse[] = [
  {
    text: "من نور جهان هستم. کسی که پیرو من باشد، در تاریکی نخواهد گشت، بلکه نور حیات را خواهد داشت.",
    reference: "یوحنا ۸:۱۲",
  },
  {
    text: "شما نور جهانید. شهری که بر فراز کوهی بنا شده، پنهان نمی‌ماند.",
    reference: "متی ۵:۱۴",
  },
  {
    text: "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.",
    reference: "یوشع ۱:۹",
  },
  {
    text: "با مسیح مصلوب شده‌ام؛ دیگر من زندگی نمی‌کنم، بلکه مسیح در من زندگی می‌کند.",
    reference: "غلاطیان ۲:۲۰",
  },
];

const AUTO_ADVANCE_MS = 7000;

export default function HeroSection() {
  const [activeVerse, setActiveVerse] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return; // let the visitor drive via dots only

    timerRef.current = setInterval(() => {
      setActiveVerse((i) => (i + 1) % VERSES.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goToVerse(i: number) {
    setActiveVerse(i);
    // restart the auto-advance clock on manual interaction so a click
    // doesn't get immediately overridden by the timer
    if (timerRef.current) clearInterval(timerRef.current);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!prefersReducedMotion) {
      timerRef.current = setInterval(() => {
        setActiveVerse((j) => (j + 1) % VERSES.length);
      }, AUTO_ADVANCE_MS);
    }
  }

  return (
    <section
      dir="rtl"
      className="relative flex h-[100svh] min-h-[720px] w-full flex-col
                 overflow-hidden bg-[#070A14]"
    >
      <HeroParticleField color="#E8B368" background="#070A14" density={3600} />

      {/* subtle vignette so text stays legible over the particles regardless
          of where they drift */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(7,10,20,0.35) 60%, rgba(7,10,20,0.85) 100%)",
        }}
      />

      {/* eyebrow */}
      <div className="relative z-10 flex justify-center pt-8 sm:pt-10">
        <p className="text-xs tracking-[0.25em] text-[#8B93AA]">
          کلیسای ایرانیان مسیحی واشنگتن دی‌سی &nbsp;·&nbsp; EST. 1990
        </p>
      </div>

      {/* headline + CTAs */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1
          className="max-w-3xl text-[2.75rem] font-extrabold leading-[1.15]
                     text-[#F5EFE6] sm:text-6xl"
        >
          پلتفرم آنلاین جهانی
        </h1>
        <p className="mt-5 max-w-xl text-base text-[#8B93AA] sm:text-lg">
          فضایی برای پرستش، یادگیری، و رشد مشترک در ایمان.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/worship"
            className="rounded-full bg-[#E8B368] px-7 py-3 text-sm font-semibold
                       text-[#070A14] transition-colors hover:bg-[#f0c383]"
          >
            سرودهای پرستشی
          </a>
          <a
            href="/bible"
            className="rounded-full border border-[#E8B368]/40 px-7 py-3 text-sm
                       font-semibold text-[#F5EFE6] transition-colors
                       hover:border-[#E8B368] hover:bg-[#E8B368]/10"
          >
            کتاب مقدس
          </a>
        </div>
      </div>

      {/* verse "lectern" — glass card, naskh face, meaningful dot nav */}
      <div className="relative z-10 flex justify-center px-6 pb-10 sm:pb-14">
        <div
          className="w-full max-w-2xl rounded-2xl border border-[#E8B368]/15
                     bg-[#101832]/60 px-6 py-6 text-center backdrop-blur-md
                     sm:px-10 sm:py-8"
        >
          <p
            key={activeVerse}
            aria-live="polite"
            className="animate-[verseFade_0.6s_ease] text-lg leading-loose
                       text-[#F5EFE6] sm:text-xl"
            style={{ fontFamily: "var(--font-naskh)" }}
          >
            {VERSES[activeVerse].text}
          </p>
          <p className="mt-4 text-sm tracking-wide text-[#E8B368]/80">
            {VERSES[activeVerse].reference}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            {VERSES.map((verse, i) => (
              <button
                key={verse.reference}
                onClick={() => goToVerse(i)}
                aria-label={`آیه ${i + 1} از ${VERSES.length}: ${verse.reference}`}
                aria-current={i === activeVerse}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeVerse
                    ? "w-6 bg-[#E8B368]"
                    : "w-1.5 bg-[#8B93AA]/40 hover:bg-[#8B93AA]/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes verseFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
