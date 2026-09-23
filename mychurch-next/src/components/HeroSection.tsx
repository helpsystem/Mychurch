"use client";

import { useEffect, useRef, useState } from "react";
import HeroParticleField from "@/components/HeroParticleField";
import { useLanguage } from "@/providers/LanguageProvider";

type Verse = {
  text: string;
  reference: string;
};

const VERSES_BY_LANG: Record<"en" | "fa" | "es", Verse[]> = {
  fa: [
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
  ],
  en: [
    {
      text: "I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.",
      reference: "John 8:12",
    },
    {
      text: "You are the light of the world. A city set on a hill cannot be hidden.",
      reference: "Matthew 5:14",
    },
    {
      text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.",
      reference: "Joshua 1:9",
    },
    {
      text: "I have been crucified with Christ; it is no longer I who live, but Christ who lives in me.",
      reference: "Galatians 2:20",
    },
  ],
  es: [
    {
      text: "Yo soy la luz del mundo. El que me sigue no andará en tinieblas, sino que tendrá la luz de la vida.",
      reference: "Juan 8:12",
    },
    {
      text: "Vosotros sois la luz del mundo; una ciudad asentada sobre un monte no se puede esconder.",
      reference: "Mateo 5:14",
    },
    {
      text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo dondequiera que vayas.",
      reference: "Josué 1:9",
    },
    {
      text: "Con Cristo estoy juntamente crucificado, y ya no vivo yo, más vive Cristo en mí.",
      reference: "Gálatas 2:20",
    },
  ],
};

const localDict = {
  fa: {
    eyebrow: "کلیسای انجیلی ایرانیان واشنگتن دی‌سی  ·  EST. 1990",
    headline: "پلتفرم آنلاین جهانی",
    subtitle: "فضایی برای پرستش، یادگیری، و رشد مشترک در ایمان.",
    ctaWorship: "سرودهای پرستشی",
    ctaBible: "کتاب مقدس",
    verseAriaLabel: (i: number, total: number, reference: string) =>
      `آیه ${i} از ${total}: ${reference}`,
  },
  en: {
    eyebrow: "Iranian Evangelical Church of Washington D.C.  ·  EST. 1990",
    headline: "A Global Online Platform",
    subtitle: "A space for worship, learning, and growing together in faith.",
    ctaWorship: "Worship Songs",
    ctaBible: "Bible",
    verseAriaLabel: (i: number, total: number, reference: string) =>
      `Verse ${i} of ${total}: ${reference}`,
  },
  es: {
    eyebrow: "Iglesia Evangélica Iraní de Washington D.C.  ·  EST. 1990",
    headline: "Una Plataforma Global en Línea",
    subtitle: "Un espacio para adorar, aprender y crecer juntos en la fe.",
    ctaWorship: "Canciones de Adoración",
    ctaBible: "Biblia",
    verseAriaLabel: (i: number, total: number, reference: string) =>
      `Versículo ${i} de ${total}: ${reference}`,
  },
};

const AUTO_ADVANCE_MS = 7000;

export default function HeroSection() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const VERSES = VERSES_BY_LANG[language] || VERSES_BY_LANG.fa;
  const [activeVerse, setActiveVerse] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    timerRef.current = setInterval(() => {
      setActiveVerse((i) => (i + 1) % VERSES.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goToVerse(i: number) {
    setActiveVerse(i);
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
      dir={isRTL ? "rtl" : "ltr"}
      className="relative flex h-[100svh] min-h-[720px] w-full flex-col
                 overflow-hidden bg-[#070A14]"
    >
      <HeroParticleField color="#E8B368" background="#070A14" density={3600} />

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
          {d.eyebrow}
        </p>
      </div>

      {/* headline + CTAs */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1
          className="max-w-3xl text-[2.75rem] font-extrabold leading-[1.15]
                     text-[#F5EFE6] sm:text-6xl"
        >
          {d.headline}
        </h1>
        <p className="mt-5 max-w-xl text-base text-[#8B93AA] sm:text-lg">
          {d.subtitle}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/worship"
            className="rounded-full bg-[#E8B368] px-7 py-3 text-sm font-semibold
                       text-[#070A14] transition-colors hover:bg-[#f0c383]"
          >
            {d.ctaWorship}
          </a>
          <a
            href="/bible"
            className="rounded-full border border-[#E8B368]/40 px-7 py-3 text-sm
                       font-semibold text-[#F5EFE6] transition-colors
                       hover:border-[#E8B368] hover:bg-[#E8B368]/10"
          >
            {d.ctaBible}
          </a>
        </div>
      </div>

      {/* verse card */}
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
                aria-label={d.verseAriaLabel(i + 1, VERSES.length, verse.reference)}
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

      <style>{`
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
