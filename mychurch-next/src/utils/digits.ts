/**
 * MyChurch — Digit Formatting Utilities
 *
 * RULE (enforced site-wide):
 *  - All numbers → English (Latin) digits  ← applies everywhere
 *  - EXCEPTION: Dates & Times in Farsi/Persian mode → Persian digits
 *
 * Usage:
 *   import { toEnglishDigits, formatDate, formatTime } from "@/utils/digits";
 *
 *   toEnglishDigits("۱۲۳۴")           → "1234"
 *   formatDate(new Date(), "fa")       → "۱۴ خرداد ۱۴۰۴"  (Persian digits)
 *   formatDate(new Date(), "en")       → "May 25, 2025"    (English digits)
 *   formatNumber(1234567)              → "1,234,567"        (always English)
 */

// ─── toEnglishDigits ─────────────────────────────────────────────────────────
/** Convert any Persian/Arabic-Indic digits in a string to English (Latin) digits. */
export function toEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// ─── toPersianDigits ─────────────────────────────────────────────────────────
/** Convert Latin digits to Persian/Farsi digits. Use ONLY for dates/times in Farsi mode. */
export function toPersianDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

// ─── formatDate ──────────────────────────────────────────────────────────────
/**
 * Format a date according to the current language.
 * - Farsi mode ("fa"): Persian calendar + Persian digits (e.g. "۱۴ خرداد ۱۴۰۴")
 * - English mode ("en"): English calendar + English digits (e.g. "May 25, 2025")
 */
export function formatDate(
  date: Date | string | null | undefined,
  lang: "fa" | "en" = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const opts: Intl.DateTimeFormatOptions = options ?? {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (lang === "fa") {
    // Persian calendar with Persian digits — intentional
    return d.toLocaleDateString("fa-IR", opts);
  }

  // Always English digits for English mode
  return toEnglishDigits(d.toLocaleDateString("en-US", opts));
}

// ─── formatTime ──────────────────────────────────────────────────────────────
/**
 * Format a time according to the current language.
 * - Farsi mode: Persian digits
 * - English mode: English digits (always)
 */
export function formatTime(
  date: Date | string | null | undefined,
  lang: "fa" | "en" = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const opts: Intl.DateTimeFormatOptions = options ?? {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (lang === "fa") {
    return d.toLocaleTimeString("fa-IR", opts);
  }

  return toEnglishDigits(d.toLocaleTimeString("en-US", opts));
}

// ─── formatDateTime ───────────────────────────────────────────────────────────
/** Format date + time. Farsi mode → Persian digits. English mode → English digits. */
export function formatDateTime(
  date: Date | string | null | undefined,
  lang: "fa" | "en" = "en"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (lang === "fa") {
    return d.toLocaleString("fa-IR");
  }

  return toEnglishDigits(
    d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  );
}

// ─── formatNumber ─────────────────────────────────────────────────────────────
/** Format a number with commas. ALWAYS English digits. */
export function formatNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return "0";
  const num = Number(value);
  if (isNaN(num)) return toEnglishDigits(String(value));
  return toEnglishDigits(
    num.toLocaleString("en-US", options ?? { maximumFractionDigits: 2 })
  );
}

// ─── formatCurrency ───────────────────────────────────────────────────────────
/** Format a USD currency amount. ALWAYS English digits. */
export function formatCurrency(
  amount: number | string | null | undefined
): string {
  const num = Number(amount ?? 0);
  return toEnglishDigits(
    num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// ─── formatDateShort ─────────────────────────────────────────────────────────
/** Short date format (e.g. "5/25/2025" or "۱۴۰۴/۳/۴"). */
export function formatDateShort(
  date: Date | string | null | undefined,
  lang: "fa" | "en" = "en"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (lang === "fa") {
    return d.toLocaleDateString("fa-IR");
  }
  return toEnglishDigits(d.toLocaleDateString("en-US"));
}
