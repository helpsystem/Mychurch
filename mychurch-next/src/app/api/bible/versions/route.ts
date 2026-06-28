import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

export const revalidate = 3600;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let versionsCache: { ts: number; payload: { versions: unknown[] } } | null = null;

// These version abbreviations are known Farsi/Persian translations
const FARSI_ABBRS = new Set([
  "NMV", "TPV", "PCB", "FARSIO", "TR1895FA", "MNJFA", "AVD", "NMVFA",
  "BBK", "RCPV", "PES", "POV-FAS", "مژده",
]);

// Static fallback versions - shown when DB has fewer than the expected set
const STATIC_VERSIONS = [
  { version_id: 1, abbr: "BSB", name: "Berean Standard Bible", language: "en", hasAudio: false },
  { version_id: 2, abbr: "KJV", name: "King James Version", language: "en", hasAudio: false },
  { version_id: 3, abbr: "NIV", name: "New International Version", language: "en", hasAudio: false },
  { version_id: 118, abbr: "NMV", name: "هزارۀ نو (فارسی)", language: "fa", hasAudio: false },
  { version_id: 119, abbr: "TPV", name: "کتاب مقدس ترجمه تفسیری (فارسی)", language: "fa", hasAudio: false },
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
      console.warn("[versions] DB lookup failed, using static fallback:", dbErr);
    }

    let versions;

    // If DB has a meaningful set of versions, use it; otherwise use static fallback
    if (rows.length >= 4) {
      versions = rows.map(v => {
        const normalizedAbbr = normalizeAbbr(v.abbr);
        const isFa = FARSI_ABBRS.has(normalizedAbbr) || isFarsiLanguage(v.language);
        return {
          ...v,
          abbr: normalizedAbbr,
          language: isFa ? "fa" : "en",
          hasAudio: audioSet.has(v.version_id),
        };
      });
    } else {
      // Merge DB rows into static list (DB rows override statics for same abbr)
      const dbByAbbr = new Map(rows.map(r => [normalizeAbbr(r.abbr), r]));
      versions = STATIC_VERSIONS.map(sv => {
        const dbRow = dbByAbbr.get(sv.abbr);
        if (dbRow) {
          return {
            ...sv,
            version_id: dbRow.version_id,
            name: dbRow.name,
            hasAudio: audioSet.has(dbRow.version_id),
          };
        }
        return sv;
      });
    }

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
