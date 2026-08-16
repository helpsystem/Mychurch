import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

export const revalidate = 3600;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let versionsCache: { ts: number; payload: { versions: unknown[] } } | null = null;

// These version abbreviations are known Farsi/Persian translations
const FARSI_ABBRS = new Set([
  "NMV", "TPV", "PCB", "FARSIO", "TR1895FA", "MNJFA", "AVD", "NMVFA",
  "BBK", "RCPV", "PES", "POV-FAS", "MOZ", "مژده",
]);

// Full catalog of Persian & English Bible Translations (YouVersion & Native)
const STATIC_VERSIONS = [
  // ── English Translations ──
  { version_id: 1,   abbr: "BSB",  name: "Berean Standard Bible (BSB)",             language: "en", hasAudio: true },
  { version_id: 2,   abbr: "NIV",  name: "New International Version (NIV)",         language: "en", hasAudio: true },
  { version_id: 3,   abbr: "ESV",  name: "English Standard Version (ESV)",          language: "en", hasAudio: true },
  { version_id: 4,   abbr: "KJV",  name: "King James Version (KJV)",                language: "en", hasAudio: true },
  { version_id: 5,   abbr: "NLT",  name: "New Living Translation (NLT)",            language: "en", hasAudio: true },
  { version_id: 6,   abbr: "NASB", name: "New American Standard Bible (NASB)",      language: "en", hasAudio: false },
  { version_id: 7,   abbr: "CSB",  name: "Christian Standard Bible (CSB)",          language: "en", hasAudio: false },

  // ── Farsi (Persian) Translations ──
  { version_id: 118, abbr: "NMV",  name: "هزارۀ نو (ترجمه استاندارد معاصر)",       language: "fa", hasAudio: true },
  { version_id: 119, abbr: "TPV",  name: "کتاب مقدس ترجمه تفسیری (مژده)",          language: "fa", hasAudio: true },
  { version_id: 120, abbr: "PCB",  name: "ترجمه قدیم (فاضل‌خان همدانی)",           language: "fa", hasAudio: true },
  { version_id: 121, abbr: "MOZ",  name: "مژده برای عصر جدید (فارسی)",             language: "fa", hasAudio: false },
  { version_id: 122, abbr: "FARSIO", name: "متن اصیل فارسی کهن",                   language: "fa", hasAudio: false },
];

function normalizeAbbr(abbr: string): string {
  const asciiOnly = /^[\x00-\x7F]+$/.test(abbr);
  return asciiOnly ? abbr.toUpperCase() : abbr;
}

function isFarsiLanguage(value: string | null | undefined): boolean {
  const lang = (value || "").toLowerCase().trim();
  return lang === "fa" || lang.includes("persian") || lang.includes("فارسی");
}

export async function GET() {
  try {
    if (versionsCache && Date.now() - versionsCache.ts < CACHE_TTL_MS) {
      return NextResponse.json(versionsCache.payload, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    let rows: { version_id: number; abbr: string; name: string; language: string; publisher?: string }[] = [];
    let audioSet = new Set<number>();

    try {
      rows = await dbAll<{
        version_id: number;
        abbr: string;
        name: string;
        language: string;
        publisher: string;
      }>("SELECT version_id, abbr, name, language, publisher FROM versions ORDER BY name ASC");

      try {
        const audioVersions = await dbAll<{ version_id: number }>(
          "SELECT DISTINCT version_id FROM audio"
        );
        audioSet = new Set(audioVersions.map((a) => a.version_id));
      } catch {
        audioSet = new Set<number>();
      }
    } catch (dbErr) {
      console.warn("[versions] DB lookup fallback to complete catalog:", dbErr);
    }

    // Merge DB rows into full static catalog
    const dbByAbbr = new Map(rows.map(r => [normalizeAbbr(r.abbr), r]));
    const versions = STATIC_VERSIONS.map(sv => {
      const dbRow = dbByAbbr.get(sv.abbr);
      if (dbRow) {
        return {
          ...sv,
          version_id: dbRow.version_id,
          name: dbRow.name || sv.name,
          hasAudio: audioSet.has(dbRow.version_id) || sv.hasAudio,
        };
      }
      return sv;
    });

    const payload = { versions };
    versionsCache = { ts: Date.now(), payload };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
