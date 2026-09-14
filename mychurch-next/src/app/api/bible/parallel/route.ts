import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";
import { fetchApiBibleContent } from "@/lib/apiBible";
import { normalizeToUsfm } from "@/lib/bibleUsfm";
import { fetchYouVersionChapter } from "@/lib/youversion";
import { getLocalBibleChapter } from "@/lib/bibleLocalJson";

interface VerseRow {
  verse_num: number;
  text: string;
}

export const revalidate = 3600;

const CACHE_TTL_MS = 60 * 60 * 1000;
const parallelCache = new Map<string, { ts: number; payload: unknown }>();

function cleanVerseText(t: string | null | undefined): string | null {
  if (!t) return null;
  return t.replace(/^[\s\d\u0660-\u0669\u06F0-\u06F9]+[:.\s\-–—]*/, "").trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionEn = searchParams.get("versionEn") || "BSB";
    const versionFa = searchParams.get("versionFa") || "NMV";
    const rawBook = searchParams.get("book") || "GEN";
    const bookId = normalizeToUsfm(rawBook);
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);
    const cacheKey = `${versionEn.toUpperCase()}|${versionFa.toUpperCase()}|${bookId.toUpperCase()}|${chapterNum}`;

    const cached = parallelCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // Layer 0: Direct Authentic Local JSON for chosen translation (NMV, TPV, PCB, MOZ, BSB, NIV, ESV, KJV, etc.)
    let localFa = getLocalBibleChapter(versionFa, bookId, chapterNum);
    let localEn = getLocalBibleChapter(versionEn, bookId, chapterNum);

    let isFaFallback = false;
    let fallbackNoticeFa: string | null = null;
    if (!localFa || localFa.verses.length === 0) {
      // Version doesn't have this book (e.g. PES/BBK only have NT, but requested book is OT like Genesis)
      const fallback = getLocalBibleChapter("NMV", bookId, chapterNum) || getLocalBibleChapter("PCB", bookId, chapterNum);
      if (fallback && fallback.verses.length > 0) {
        localFa = fallback;
        isFaFallback = true;
        fallbackNoticeFa = `ترجمه «${versionFa}» برای این کتاب متن ندارد (فقط شامل عهد جدید است). متن به صورت هوشمند از ترجمه «${fallback.version_name || "هزارۀ نو"}» جایگزین شد.`;
      }
    }

    let isEnFallback = false;
    let fallbackNoticeEn: string | null = null;
    if (!localEn || localEn.verses.length === 0) {
      const fallback = getLocalBibleChapter("BSB", bookId, chapterNum) || getLocalBibleChapter("NIV", bookId, chapterNum);
      if (fallback && fallback.verses.length > 0) {
        localEn = fallback;
        isEnFallback = true;
        fallbackNoticeEn = `Translation "${versionEn}" is not available for this book. Showing text from "${fallback.version_name || "BSB"}".`;
      }
    }

    if (localFa && localEn && (localFa.verses.length > 0 || localEn.verses.length > 0)) {
      const faMap = new Map(localFa.verses.map((v) => [v.verse_num, v.text]));
      const enMap = new Map(localEn.verses.map((v) => [v.verse_num, v.text]));
      const verseNumbers = Array.from(
        new Set([...localEn.verses.map((v) => v.verse_num), ...localFa.verses.map((v) => v.verse_num)])
      ).sort((a, b) => a - b);

      const parallel = verseNumbers.map((vNum) => ({
        verse_num: vNum,
        en: cleanVerseText(enMap.get(vNum)),
        fa: cleanVerseText(faMap.get(vNum)),
      }));

      const payload = {
        versionEn: localEn.version_abbr || versionEn,
        versionFa: localFa.version_abbr || versionFa,
        requestedVersionEn: versionEn,
        requestedVersionFa: versionFa,
        isFaFallback,
        isEnFallback,
        fallbackNoticeFa,
        fallbackNoticeEn,
        book: bookId.toUpperCase(),
        chapter: chapterNum,
        parallel,
        audioEn: localEn.audio || [],
        audioFa: localFa.audio || [],
      };

      parallelCache.set(cacheKey, { ts: Date.now(), payload });
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT_LOCAL_JSON",
        },
      });
    }

    // Layer 1: API.Bible
    try {
      const apiResult = await fetchApiBibleContent(bookId, chapterNum, versionFa, versionEn);
      if (apiResult && (apiResult.verses.en.length > 0 || apiResult.verses.fa.length > 0)) {
        const maxVerse = Math.max(apiResult.verses.en.length, apiResult.verses.fa.length);
        const parallel = [];
        for (let i = 0; i < maxVerse; i++) {
          parallel.push({
            verse_num: i + 1,
            en: cleanVerseText(apiResult.verses.en[i]),
            fa: cleanVerseText(apiResult.verses.fa[i]),
          });
        }

        const payload = {
          versionEn,
          versionFa,
          book: bookId.toUpperCase(),
          chapter: chapterNum,
          parallel,
          audioEn: [],
          audioFa: [],
        };

        parallelCache.set(cacheKey, { ts: Date.now(), payload });
        return NextResponse.json(payload, {
          headers: {
            "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
            "X-Cache": "MISS_API_BIBLE",
          },
        });
      }
    } catch (apiErr) {
      console.error("API.Bible parallel fetch failed, falling back to DB/YouVersion:", apiErr);
    }

    // Layer 2: Local SQLite DB
    let enVerses: VerseRow[] = [];
    let faVerses: VerseRow[] = [];
    let enVersionId: number | undefined;
    let faVersionId: number | undefined;

    try {
      const [vEn, vFa] = await Promise.all([
        dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1", [versionEn]),
        dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1", [versionFa]),
      ]);

      const [fallbackEn, fallbackFa] = await Promise.all([
        vEn
          ? Promise.resolve(undefined)
          : dbGet<{ version_id: number }>(
              "SELECT version_id FROM versions WHERE LOWER(language) IN ('english','en') ORDER BY version_id ASC LIMIT 1"
            ),
        vFa
          ? Promise.resolve(undefined)
          : dbGet<{ version_id: number }>(
              "SELECT version_id FROM versions WHERE LOWER(language) IN ('persian','fa','فارسی') ORDER BY version_id ASC LIMIT 1"
            ),
      ]);

      enVersionId = vEn?.version_id ?? fallbackEn?.version_id;
      faVersionId = vFa?.version_id ?? fallbackFa?.version_id;

      if (enVersionId && faVersionId) {
        const [dbEn, dbFa] = await Promise.all([
          dbAll<VerseRow>(
            `SELECT verse_num, text FROM verses WHERE version_id = ? AND book_id = ? AND chapter_num = ? ORDER BY verse_num ASC`,
            [enVersionId, bookId.toUpperCase(), chapterNum]
          ),
          dbAll<VerseRow>(
            `SELECT verse_num, text FROM verses WHERE version_id = ? AND book_id = ? AND chapter_num = ? ORDER BY verse_num ASC`,
            [faVersionId, bookId.toUpperCase(), chapterNum]
          ),
        ]);
        enVerses = dbEn;
        faVerses = dbFa;
      }
    } catch (dbErr) {
      console.warn("[parallel] SQLite query failed:", dbErr);
    }

    // Layer 3: YouVersion Platform API (Guaranteed coverage for all 66 books)
    if (enVerses.length === 0 || faVerses.length === 0) {
      try {
        const [yvEn, yvFa] = await Promise.all([
          enVerses.length === 0 ? fetchYouVersionChapter(versionEn, bookId, chapterNum).catch(() => ({ verses: [] })) : Promise.resolve({ verses: [] }),
          faVerses.length === 0 ? fetchYouVersionChapter(versionFa, bookId, chapterNum).catch(() => ({ verses: [] })) : Promise.resolve({ verses: [] })
        ]);
        if (enVerses.length === 0 && yvEn.verses.length > 0) {
          enVerses = yvEn.verses;
        }
        if (faVerses.length === 0 && yvFa.verses.length > 0) {
          faVerses = yvFa.verses;
        }
      } catch (yvErr) {
        console.warn("[parallel] YouVersion fallback failed:", yvErr);
      }
    }

    // Audio - fetch for both English and Farsi versions
    let audioEn: Array<{
      audio_version_id: number;
      title: string;
      dramatized: number;
      mp3_url: string;
      hls_url: string;
    }> = [];
    let audioFa: Array<{
      audio_version_id: number;
      title: string;
      dramatized: number;
      mp3_url: string;
      hls_url: string;
    }> = [];

    try {
      [audioEn, audioFa] = await Promise.all([
        dbAll<{
          audio_version_id: number;
          title: string;
          dramatized: number;
          mp3_url: string;
          hls_url: string;
        }>(
          `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
           WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
          [enVersionId, bookId.toUpperCase(), chapterNum]
        ),
        dbAll<{
          audio_version_id: number;
          title: string;
          dramatized: number;
          mp3_url: string;
          hls_url: string;
        }>(
          `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
           WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
          [faVersionId, bookId.toUpperCase(), chapterNum]
        ),
      ]);
    } catch {
      audioEn = [];
      audioFa = [];
    }

    // Build maps for both languages and align using the union of verse numbers.
    const faMap = new Map(faVerses.map((v) => [v.verse_num, v.text]));
    const enMap = new Map(enVerses.map((v) => [v.verse_num, v.text]));
    const verseNumbers = Array.from(
      new Set([...enVerses.map((v) => v.verse_num), ...faVerses.map((v) => v.verse_num)])
    ).sort((a, b) => a - b);

    // Create matched pairs with nullable values where a translation is missing.
    const parallel = verseNumbers.map((verseNum) => ({
      verse_num: verseNum,
      en: cleanVerseText(enMap.get(verseNum)),
      fa: cleanVerseText(faMap.get(verseNum)),
    }));

    const payload = {
      versionEn,
      versionFa,
      book: bookId.toUpperCase(),
      chapter: chapterNum,
      parallel,
      audioEn,
      audioFa,
    };

    parallelCache.set(cacheKey, { ts: Date.now(), payload });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
