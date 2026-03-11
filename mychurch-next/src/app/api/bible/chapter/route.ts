import { NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/bibleDb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionAbbr = searchParams.get("version") || "BSB";
    const bookId = searchParams.get("book") || "GEN";
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);

    // Resolve version_id
    const ver = await dbGet<{ version_id: number }>(
      "SELECT version_id FROM versions WHERE abbr = ? LIMIT 1",
      [versionAbbr]
    );
    if (!ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    const versionId = ver.version_id;

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
    const headings = await dbAll<{
      before_verse: number;
      text: string;
    }>(
      `SELECT before_verse, text FROM headings
       WHERE version_id = ? AND book_id = ? AND chapter_num = ?
       ORDER BY before_verse ASC`,
      [versionId, bookId.toUpperCase(), chapterNum]
    );

    // Fetch audio links for this chapter
    const audio = await dbAll<{
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

    // Get book info
    const book = await dbGet<{ book_name_en: string; book_name_fa: string; chapter_count: number }>(
      "SELECT book_name_en, book_name_fa, chapter_count FROM books WHERE version_id = ? AND book_id = ?",
      [versionId, bookId.toUpperCase()]
    );

    return NextResponse.json({
      version: versionAbbr,
      book: bookId.toUpperCase(),
      bookNameEn: book?.book_name_en,
      bookNameFa: book?.book_name_fa,
      chapterCount: book?.chapter_count,
      chapter: chapterNum,
      verses,
      headings,
      audio,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
