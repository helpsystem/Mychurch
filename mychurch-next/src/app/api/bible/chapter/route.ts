import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";

export const revalidate = 3600;

const CACHE_TTL_MS = 60 * 60 * 1000;
const chapterCache = new Map<string, { ts: number; payload: unknown }>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionAbbr = searchParams.get("version") || "BSB";
    const bookId = searchParams.get("book") || "GEN";
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);
    const cacheKey = `${versionAbbr.toUpperCase()}|${bookId.toUpperCase()}|${chapterNum}`;

    const cached = chapterCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    // Resolve version_id
    const ver = await dbGet<{ version_id: number }>(
      "SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1",
      [versionAbbr]
    );
    const fallbackVer = !ver
      ? await dbGet<{ version_id: number }>("SELECT version_id FROM versions ORDER BY version_id ASC LIMIT 1")
      : undefined;
    const versionId = ver?.version_id ?? fallbackVer?.version_id;
    if (!versionId) return NextResponse.json({ verses: [], headings: [], audio: [] });

    // Fetch verses
    const verses = await dbAll<{
      verse_num: number;
      text: string;
    }>(
      `SELECT verse_num, text FROM verses
       WHERE version_id = ? AND book_id = ? AND chapter_num = ?
       ORDER BY verse_num ASC`,
      [versionId, bookId.toUpperCase(), chapterNum]
    );

    // Fetch headings (section titles that appear before a verse)
    let headings: Array<{ before_verse: number; text: string }> = [];
    try {
      headings = await dbAll<{
        before_verse: number;
        text: string;
      }>(
        `SELECT before_verse, text FROM headings
         WHERE version_id = ? AND book_id = ? AND chapter_num = ?
         ORDER BY before_verse ASC`,
        [versionId, bookId.toUpperCase(), chapterNum]
      );
    } catch {
      headings = [];
    }

    // Fetch audio links for this chapter
    let audio: Array<{
      audio_version_id: number;
      title: string;
      dramatized: number;
      mp3_url: string;
      hls_url: string;
    }> = [];
    try {
      audio = await dbAll<{
        audio_version_id: number;
        title: string;
        dramatized: number;
        mp3_url: string;
        hls_url: string;
      }>(
        `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
         WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
        [versionId, bookId.toUpperCase(), chapterNum]
      );
    } catch {
      audio = [];
    }

    // Get book info
    const book = await dbGet<{ book_name_en: string; book_name_fa: string; chapter_count: number }>(
      "SELECT book_name_en, book_name_fa, chapter_count FROM books WHERE version_id = ? AND book_id = ?",
      [versionId, bookId.toUpperCase()]
    );

    const payload = {
      version: versionAbbr,
      book: bookId.toUpperCase(),
      bookNameEn: book?.book_name_en,
      bookNameFa: book?.book_name_fa,
      chapterCount: book?.chapter_count,
      chapter: chapterNum,
      verses,
      headings,
      audio,
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
