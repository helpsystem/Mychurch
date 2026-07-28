import { Vazirmatn, Noto_Naskh_Arabic } from "next/font/google";

/**
 * Two typographic roles, used deliberately:
 *
 *  - `vazirmatn` (UI/headline face): nav, buttons, headings, body copy.
 *    A clean, contemporary Persian sans — carries the site's everyday voice.
 *
 *  - `notoNaskh` (scripture face): used ONLY for quoted Bible verses.
 *    A traditional naskh book face, so scripture visually reads as
 *    something quoted and set apart, the way a printed Farsi Bible sets
 *    verse text differently from commentary.
 *
 * Apply `vazirmatn.variable` and `notoNaskh.variable` on <html> or <body>
 * in app/layout.tsx, then reference `var(--font-vazirmatn)` /
 * `var(--font-naskh)` in CSS, or `font-vazirmatn` / `font-naskh` if you
 * wire them into tailwind.config as fontFamily tokens.
 */

export const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
});
