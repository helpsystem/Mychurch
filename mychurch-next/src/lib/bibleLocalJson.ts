import fs from "fs";
import path from "path";
import { normalizeToUsfm } from "./bibleUsfm";

export interface LocalVerse {
  verse_num: number;
  text: string;
}

export interface LocalChapterResult {
  version_abbr: string;
  version_name: string;
  language: string;
  book_id: string;
  chapter: number;
  verses: LocalVerse[];
  headings: Array<{ before_verse: number; text: string }>;
  audio: Array<{
    audio_version_id: number;
    title: string;
    dramatized: number;
    mp3_url: string;
    hls_url?: string;
  }>;
}

const VERSION_DIR_MAP: Record<string, string> = {
  // Farsi
  NMV: "118_NMV",
  TPV: "181_TPV",
  PCB: "136_POV",
  POV: "136_POV",
  "POV-FAS": "136_POV-FAS",
  FARSIO: "136_POV-FAS",
  MOZ: "3737_مژده",
  "مژده": "3737_مژده",
  RCPV: "4205_RCPV",
  BBK: "4204_BBK",
  PES: "3950_PES",
  // English
  BSB: "3034_BSB",
  NIV: "111_NIV",
  ESV: "59_ESV",
  KJV: "1_KJV",
  NLT: "116_NLT",
  NASB: "2692_NASB2020",
  NASB1995: "100_NASB1995",
  CSB: "1713_CSB",
  WEB: "206_WEB",
  WEBUS: "206_WEBUS",
  NKJV: "114_NKJV",
  ASV: "12_ASV",
  EASY: "2079_EASY",
  GNT: "68_GNT",
  HCSB: "72_HCSB",
  LEB: "90_LEB",
  MSG: "97_MSG",
};

// In-memory file cache for parsed book JSON (kept up to 24h)
const bookFileCache = new Map<string, any>();

function getPossibleJsonDirs(): string[] {
  return [
    path.join(process.cwd(), "Bible", "bible_output", "json"),
    path.join(process.cwd(), "..", "Bible", "bible_output", "json"),
    "/root/mychurch-v2/mychurch-next/Bible/bible_output/json",
  ];
}

export function getLocalBibleChapter(
  versionAbbr: string,
  rawBook: string,
  chapterNum: number
): LocalChapterResult | null {
  try {
    const bookUsfm = normalizeToUsfm(rawBook).toUpperCase();
    const cleanAbbr = (versionAbbr || "").toUpperCase().trim();
    const dirName = VERSION_DIR_MAP[cleanAbbr] || VERSION_DIR_MAP[cleanAbbr.replace(/[^A-Z0-9]/g, "")];
    if (!dirName) return null;

    let targetDir: string | null = null;
    for (const d of getPossibleJsonDirs()) {
      const p = path.join(d, dirName);
      if (fs.existsSync(p)) {
        targetDir = p;
        break;
      }
    }
    if (!targetDir) return null;

    const cacheKey = `${dirName}_${bookUsfm}`;
    let bookData = bookFileCache.get(cacheKey);

    if (!bookData) {
      const files = fs.readdirSync(targetDir);
      const matched = files.find((f) => f.toUpperCase().startsWith(`${bookUsfm}_`));
      if (!matched) return null;

      const fullPath = path.join(targetDir, matched);
      const rawJson = fs.readFileSync(fullPath, "utf8");
      bookData = JSON.parse(rawJson);
      bookFileCache.set(cacheKey, bookData);
    }

    if (!bookData?.chapters || !Array.isArray(bookData.chapters)) {
      return null;
    }

    const chapterObj = bookData.chapters.find((c: any) => Number(c.chapter) === Number(chapterNum));
    if (!chapterObj) return null;

    const verses: LocalVerse[] = (chapterObj.verses || []).map((v: any) => ({
      verse_num: Number(v.verse || v.verse_num || 0),
      text: String(v.text || "").trim(),
    })).filter((v: LocalVerse) => v.verse_num > 0 && v.text.length > 0);

    const headings: Array<{ before_verse: number; text: string }> = (chapterObj.headings || []).map((h: any) => ({
      before_verse: Number(h.before_verse || h.verse || 1),
      text: String(h.text || "").trim(),
    }));

    const audio = (chapterObj.audio || []).map((a: any, idx: number) => ({
      audio_version_id: Number(a.audio_version_id || idx + 1),
      title: String(a.title || `Chapter ${chapterNum}`),
      dramatized: a.dramatized ? 1 : 0,
      mp3_url: String(a.mp3_url || a.url || ""),
      hls_url: a.hls_url ? String(a.hls_url) : undefined,
    }));

    return {
      version_abbr: bookData.version_abbr || cleanAbbr,
      version_name: bookData.version_name || cleanAbbr,
      language: bookData.language || "fa",
      book_id: bookUsfm,
      chapter: chapterNum,
      verses,
      headings,
      audio,
    };
  } catch (err) {
    console.warn(`[getLocalBibleChapter] Failed for ${versionAbbr}/${rawBook}/${chapterNum}:`, err);
    return null;
  }
}
