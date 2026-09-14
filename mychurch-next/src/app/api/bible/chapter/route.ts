import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";
import { normalizeToUsfm, getBookInfo } from "@/lib/bibleUsfm";

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const chapterCache = new Map<string, { ts: number; payload: unknown }>();

import { fetchYouVersionChapter } from "@/lib/youversion";
import { getLocalBibleChapter } from "@/lib/bibleLocalJson";

// ─── 2. API.Bible Fallback Configuration ─────────────────────────────────────
const API_BIBLE_KEY = process.env.API_BIBLE_KEY || "b27dc6902b00019756980695a12eb0da";
const API_BIBLE_BASE = "https://api.scripture.api.bible/v1";

const APIBIBLE_VERSION_MAP: Record<string, string> = {
  // English
  BSB:  "bba9f40183526463-01",  // Berean Standard Bible
  KJV:  "de4e12af7f28f599-02",  // King James Version
  NIV:  "06125adad2d5898a-01",  // New International Version
  ESV:  "f421fe261da7624f-01",  // English Standard Version
  // Farsi
  NMV:  "b04daf537f65e96c-01",  // هزاره نو فارسی
  TPV:  "e3e1a548c5c4e98c-01",  // کتاب مقدس ترجمه تفسیری
};

async function fetchFromApiBible(versionAbbr: string, bookId: string, chapter: number) {
  const bibleId = APIBIBLE_VERSION_MAP[versionAbbr.toUpperCase()];
  if (!bibleId) {
    throw new Error(`Version '${versionAbbr}' not available on API.Bible`);
  }

  const usfm = normalizeToUsfm(bookId);
  const chapterId = `${usfm}.${chapter}`;
  const url = `${API_BIBLE_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;

  const res = await fetch(url, {
    headers: { "api-key": API_BIBLE_KEY },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API.Bible returned ${res.status}: ${errText.substring(0, 150)}`);
  }

  const json = await res.json();
  const content = json?.data?.content;
  if (!content || !Array.isArray(content)) {
    throw new Error("API.Bible response missing content");
  }

  const verses: { verse_num: number; text: string }[] = [];
  const headings: { before_verse: number; text: string }[] = [];
  let currentHeading: string | null = null;

  function extractText(node: any): string {
    if (typeof node === "string") return node;
    if (node.type === "text") return node.text || "";
    if (node.children) return node.children.map(extractText).join("");
    return "";
  }

  for (const item of content) {
    if (item.type === "section" || item.type === "s") {
      const headingText = item.title || extractText(item);
      if (headingText) currentHeading = headingText;
    } else if (item.type === "verse" || item.verseId) {
      const verseNum = parseInt(item.number || item.verseId?.split(".")?.pop() || "0", 10);
      if (!verseNum) continue;

      const text = extractText(item).trim().replace(/\s+/g, " ");
      verses.push({ verse_num: verseNum, text });

      if (currentHeading) {
        headings.push({ before_verse: verseNum, text: currentHeading });
        currentHeading = null;
      }
    }
  }

  return { verses, headings };
}

// ─── Main Controller ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionAbbr = (searchParams.get("version") || "BSB").toUpperCase();
    const rawBook = searchParams.get("book") || "GEN";
    const bookId = normalizeToUsfm(rawBook);
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);
    const cacheKey = `${versionAbbr}|${bookId}|${chapterNum}`;
    const debugErrors: any[] = [];

    // ── In-memory cache ────────────────────────────────────────────────────
    const cached = chapterCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // ── Layer 0: Direct Authentic Local JSON for selected version ───────────
    let localCh = getLocalBibleChapter(versionAbbr, bookId, chapterNum);
    let isFallback = false;
    let fallbackNotice: string | null = null;

    if (!localCh || localCh.verses.length === 0) {
      const isFarsi = ["PES", "BBK", "MOZ", "FARSIO", "RCPV", "NMV", "TPV", "PCB", "POV"].includes(versionAbbr);
      if (isFarsi) {
        const fallback = getLocalBibleChapter("NMV", bookId, chapterNum) || getLocalBibleChapter("PCB", bookId, chapterNum);
        if (fallback && fallback.verses.length > 0) {
          localCh = fallback;
          isFallback = true;
          fallbackNotice = `ترجمه «${versionAbbr}» برای این کتاب موجود نیست (فقط شامل عهد جدید است). متن از «${fallback.version_name || "هزارۀ نو"}» نمایش داده شده است.`;
        }
      } else {
        const fallback = getLocalBibleChapter("BSB", bookId, chapterNum) || getLocalBibleChapter("NIV", bookId, chapterNum);
        if (fallback && fallback.verses.length > 0) {
          localCh = fallback;
          isFallback = true;
          fallbackNotice = `Translation "${versionAbbr}" not available for this book. Showing text from "${fallback.version_name || "BSB"}".`;
        }
      }
    }

    if (localCh && localCh.verses.length > 0) {
      const payload = {
        version: localCh.version_abbr,
        versionName: localCh.version_name,
        requestedVersion: versionAbbr,
        isFallback,
        fallbackNotice,
        book: bookId,
        chapter: chapterNum,
        verses: localCh.verses,
        headings: localCh.headings,
        audio: localCh.audio,
      };
      chapterCache.set(cacheKey, { ts: Date.now(), payload });
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          "X-Cache": "HIT_LOCAL_JSON",
        },
      });
    }

    // ── Layer 1: Official YouVersion Platform API ──────────────────────────
    try {
      console.log(`[bible/chapter] Fetching via YouVersion API (${versionAbbr} ${bookId} ${chapterNum})...`);
      const yvResult = await fetchYouVersionChapter(versionAbbr, bookId, chapterNum);
        if (yvResult.verses.length > 0) {
          const payload = {
            version: versionAbbr,
            book: bookId,
            chapter: chapterNum,
            verses: yvResult.verses,
            headings: yvResult.headings,
            audio: [],
          };
          chapterCache.set(cacheKey, { ts: Date.now(), payload });
          return NextResponse.json(payload, {
            headers: {
              "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
              "X-Cache": "HIT",
            },
          });
        }
      } catch (yvErr: any) {
        console.warn("[bible/chapter] Primary lookup fallback:", yvErr);
        debugErrors.push({ source: 'youversion', error: yvErr?.message || String(yvErr) });
      }

    // ── Layer 2: Local SQLite DB ───────────────────────────────────────────
    try {
      const ver = await dbGet<{ version_id: number }>(
        "SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1",
        [versionAbbr]
      );
      const fallbackVer = !ver
        ? await dbGet<{ version_id: number }>(
            "SELECT version_id FROM versions ORDER BY version_id ASC LIMIT 1"
          )
        : undefined;
      const versionId = ver?.version_id ?? fallbackVer?.version_id;

      if (versionId) {
        const verses = await dbAll<{ verse_num: number; text: string }>(
          `SELECT verse_num, text FROM verses
           WHERE version_id = ? AND book_id = ? AND chapter_num = ?
           ORDER BY verse_num ASC`,
          [versionId, bookId, chapterNum]
        );

        if (verses.length > 0) {
          const cleanedVerses = verses.map(v => ({
            verse_num: v.verse_num,
            text: (v.text || "").replace(/^[\s\d\u0660-\u0669\u06F0-\u06F9]+[:.\s\-–—]*/, "").trim(),
          }));

          let headings: { before_verse: number; text: string }[] = [];
          try {
            headings = await dbAll<{ before_verse: number; text: string }>(
              `SELECT before_verse, text FROM headings
               WHERE version_id = ? AND book_id = ? AND chapter_num = ?
               ORDER BY before_verse ASC`,
              [versionId, bookId, chapterNum]
            );
          } catch { headings = []; }

          let audio: any[] = [];
          try {
            audio = await dbAll<any>(
              `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
               WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
              [versionId, bookId, chapterNum]
            );
          } catch { audio = []; }

          const book = await dbGet<{ book_name_en: string; book_name_fa: string; chapter_count: number }>(
            "SELECT book_name_en, book_name_fa, chapter_count FROM books WHERE version_id = ? AND book_id = ?",
            [versionId, bookId]
          );

          const payload = {
            version: versionAbbr,
            book: bookId,
            bookNameEn: book?.book_name_en,
            bookNameFa: book?.book_name_fa,
            chapterCount: book?.chapter_count,
            chapter: chapterNum,
            verses: cleanedVerses,
            headings,
            audio,
          };

          chapterCache.set(cacheKey, { ts: Date.now(), payload });
          return NextResponse.json(payload, {
            headers: {
              "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
              "X-Cache": "HIT",
            },
          });
        }
      }
    } catch (dbErr: any) {
      console.warn("[bible/chapter] Local DB lookup failed, trying API fallback:", dbErr);
      debugErrors.push({ source: 'sqlite', error: dbErr?.message || String(dbErr) });
    }

    // ── Layer 3: Fallback Engine ───────────────────────────────────────────
    let verses: { verse_num: number; text: string }[] = [];
    let headings: { before_verse: number; text: string }[] = [];
    let actualVersion = versionAbbr;

    try {
      const result = await fetchFromApiBible(versionAbbr, bookId, chapterNum);
      verses = result.verses;
      headings = result.headings;
    } catch (apiErr) {
      if (versionAbbr !== "KJV") {
        const kjvResult = await fetchFromApiBible("KJV", bookId, chapterNum);
        verses = kjvResult.verses;
        headings = kjvResult.headings;
        actualVersion = "KJV";
      } else {
        return NextResponse.json({ 
          error: "No Bible data available", 
          verses: [],
          headings: [],
          audio: [],
        }, { status: 503 });
      }
    }

    const bookInfo = getBookInfo(bookId);
    const payload = {
      version: actualVersion,
      book: bookId,
      bookNameEn: bookInfo.nameEn || bookId,
      bookNameFa: bookInfo.nameFa || bookId,
      chapterCount: bookInfo.chapters || null,
      chapter: chapterNum,
      verses,
      headings,
      audio: [],
      debugErrors,
    };

    chapterCache.set(cacheKey, { ts: Date.now(), payload });
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bible/chapter] Unhandled error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
