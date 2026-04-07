import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";

interface VerseRow {
  verse_num: number;
  text: string;
}

export const revalidate = 3600;

const CACHE_TTL_MS = 60 * 60 * 1000;
const parallelCache = new Map<string, { ts: number; payload: unknown }>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionEn = searchParams.get("versionEn") || "BSB";
    const versionFa = searchParams.get("versionFa") || "NMV";
    const bookId = searchParams.get("book") || "GEN";
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

    // Resolve both version_ids
    const [vEn, vFa] = await Promise.all([
      dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1", [versionEn]),
      dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1", [versionFa]),
    ]);

    if (!vEn || !vFa) {
      return NextResponse.json({ error: "One or both versions not found" }, { status: 404 });
    }

    // Fetch verses for both versions in parallel
    const [enVerses, faVerses] = await Promise.all([
      dbAll<VerseRow>(
        `SELECT verse_num, text FROM verses WHERE version_id = ? AND book_id = ? AND chapter_num = ? ORDER BY verse_num ASC`,
        [vEn.version_id, bookId.toUpperCase(), chapterNum]
      ),
      dbAll<VerseRow>(
        `SELECT verse_num, text FROM verses WHERE version_id = ? AND book_id = ? AND chapter_num = ? ORDER BY verse_num ASC`,
        [vFa.version_id, bookId.toUpperCase(), chapterNum]
      ),
    ]);

    // Audio - fetch for both English and Farsi versions
    const [audioEn, audioFa] = await Promise.all([
      dbAll<{
        audio_version_id: number;
        title: string;
        dramatized: number;
        mp3_url: string;
        hls_url: string;
      }>(
        `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
         WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
        [vEn.version_id, bookId.toUpperCase(), chapterNum]
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
        [vFa.version_id, bookId.toUpperCase(), chapterNum]
      )
    ]);

    // Build maps for both languages and align using the union of verse numbers.
    const faMap = new Map(faVerses.map((v) => [v.verse_num, v.text]));
    const enMap = new Map(enVerses.map((v) => [v.verse_num, v.text]));
    const verseNumbers = Array.from(
      new Set([...enVerses.map((v) => v.verse_num), ...faVerses.map((v) => v.verse_num)])
    ).sort((a, b) => a - b);

    // Create matched pairs with nullable values where a translation is missing.
    const parallel = verseNumbers.map((verseNum) => ({
      verse_num: verseNum,
      en: enMap.get(verseNum) ?? null,
      fa: faMap.get(verseNum) ?? null,
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
