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

    const rows = await dbAll<{
      version_id: number;
      abbr: string;
      name: string;
      language: string;
      publisher: string;
    }>("SELECT version_id, abbr, name, language, publisher FROM versions ORDER BY name ASC");

    let audioSet = new Set<number>();
    try {
      // Some deployments may not have the optional audio table yet.
      const audioVersions = await dbAll<{ version_id: number }>(
        "SELECT DISTINCT version_id FROM audio"
      );
      audioSet = new Set(audioVersions.map((a) => a.version_id));
    } catch {
      audioSet = new Set<number>();
    }

    const versions = rows.map(v => {
      const normalizedAbbr = normalizeAbbr(v.abbr);
      const isFa = FARSI_ABBRS.has(normalizedAbbr) || isFarsiLanguage(v.language);

      return {
        ...v,
        abbr: normalizedAbbr,
        language: isFa ? "fa" : "en",
        hasAudio: audioSet.has(v.version_id),
      };
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
