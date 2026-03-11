import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";

interface VerseRow {
  verse_num: number;
  text: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionEn = searchParams.get("versionEn") || "BSB";
    const versionFa = searchParams.get("versionFa") || "NMV";
    const bookId = searchParams.get("book") || "GEN";
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);

    // Resolve both version_ids
    const [vEn, vFa] = await Promise.all([
      dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE abbr = ? LIMIT 1", [versionEn]),
      dbGet<{ version_id: number }>("SELECT version_id FROM versions WHERE abbr = ? LIMIT 1", [versionFa]),
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

    // Audio - prefer the English version's audio
    const audio = await dbAll<{
      audio_version_id: number;
      title: string;
      dramatized: number;
      mp3_url: string;
      hls_url: string;
    }>(
      `SELECT audio_version_id, title, dramatized, mp3_url, hls_url FROM audio
       WHERE version_id = ? AND book_id = ? AND chapter_num = ?`,
      [vEn.version_id, bookId.toUpperCase(), chapterNum]
    );

    // Build a map for fast lookup of Farsi verses by verse_num
    const faMap = new Map(faVerses.map((v) => [v.verse_num, v.text]));

    // Create matched pairs
    const parallel = enVerses.map((v) => ({
      verse_num: v.verse_num,
      en: v.text,
      fa: faMap.get(v.verse_num) ?? null,
    }));

    return NextResponse.json({
      versionEn,
      versionFa,
      book: bookId.toUpperCase(),
      chapter: chapterNum,
      parallel,
      audio,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
