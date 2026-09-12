// mychurch-next/src/lib/youversion.ts
import { normalizeToUsfm } from "./bibleUsfm";

const YOUVERSION_APP_KEY = process.env.YOUVERSION_APP_KEY || "f6E6HZKwtYii0xLZMxVzbhbpO3Z4ADAxH6qtHcyzl855A1rc";
const YOUVERSION_BASE = "https://api.youversion.com/v1";

const YOUVERSION_BIBLE_MAP: Record<string, string | number> = {
  // English
  KJV: 12,       // ASV (Fallback)
  ESV: 206,      // WEB (Fallback)
  NIV: 3034,     // BSB (Fallback)
  NLT: 3034,     // BSB (Fallback)
  BSB: 3034,     // BSB
  NASB: 2692,    // NASB2020
  CSB: 3034,     // BSB (Fallback)
  WEB: 206,      // WEB
  // Farsi (Persian)
  NMV: 1619,      // Farsi PCB
  TPV: 1619,      // Farsi PCB
  PCB: 1619,      // Farsi PCB
  MOZ: 1619,      // Farsi PCB
  FARSIO: 1619,   // Farsi PCB
  OPCB: 1619,     // Farsi PCB
};

export async function fetchYouVersionChapter(versionAbbr: string, bookId: string, chapter: number) {
  const bibleId = YOUVERSION_BIBLE_MAP[versionAbbr.toUpperCase()] || 1619;
  const usfm = normalizeToUsfm(bookId);
  const passageId = `${usfm}.${chapter}`;
  const url = `${YOUVERSION_BASE}/bibles/${bibleId}/passages/${passageId}?format=html`;

  const res = await fetch(url, {
    headers: {
      "X-YVP-App-Key": YOUVERSION_APP_KEY,
      "x-yvp-app-key": YOUVERSION_APP_KEY,
      "Accept": "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`YouVersion API returned ${res.status}: ${errText.substring(0, 150)}`);
  }

  const json = await res.json();
  const verses: { verse_num: number; text: string }[] = [];
  const headings: { before_verse: number; text: string }[] = [];

  if (typeof json?.content === "string") {
    const html = json.content;
    const regex = /<span class="yv-v" v="(\d+)"><\/span>/g;
    const parts = html.split(regex);
    for (let i = 1; i < parts.length; i += 2) {
      const num = parseInt(parts[i], 10);
      const rawText = parts[i + 1] || "";
      const clean = rawText
        .replace(/<span class="yv-vlbl">[^<]*<\/span>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (num && clean) {
        verses.push({ verse_num: num, text: clean });
      }
    }
  }

  if (verses.length === 0 && Array.isArray(json?.verses)) {
    for (const v of json.verses) {
      const num = parseInt(v.verse_number || v.verse || v.number || "0", 10);
      const text = (v.text || v.content || "").replace(/<[^>]+>/g, "").trim();
      if (num && text) {
        verses.push({ verse_num: num, text });
      }
    }
  }

  return { verses, headings };
}
