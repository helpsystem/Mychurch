import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

// These version abbreviations are known Farsi/Persian translations
const FARSI_ABBRS = new Set(["NMV", "TPV", "PCB", "FARSIO", "TR1895FA", "MNJFA", "AVD", "NMVFA"]);

export async function GET() {
  try {
    const rows = await dbAll<{
      version_id: number;
      abbr: string;
      name: string;
      language: string;
      publisher: string;
    }>("SELECT version_id, abbr, name, language, publisher FROM versions ORDER BY name ASC");

    // Fetch which version_ids have audio entries
    const audioVersions = await dbAll<{ version_id: number }>(
      "SELECT DISTINCT version_id FROM audio"
    );
    const audioSet = new Set(audioVersions.map(a => a.version_id));

    const versions = rows.map(v => ({
      ...v,
      // Override language to 'fa' for known Farsi abbrs
      language: FARSI_ABBRS.has(v.abbr.toUpperCase()) ? "fa" : v.language ?? "en",
      hasAudio: audioSet.has(v.version_id),
    }));

    return NextResponse.json({ versions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
