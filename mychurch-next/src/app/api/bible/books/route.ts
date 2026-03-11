import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionAbbr = searchParams.get("version") || "BSB";

    // Get the version_id for the requested abbreviation
    const versions = await dbAll<{ version_id: number }>(
      "SELECT version_id FROM versions WHERE abbr = ? LIMIT 1",
      [versionAbbr]
    );

    if (!versions.length) {
      return NextResponse.json({ error: `Version '${versionAbbr}' not found` }, { status: 404 });
    }

    const versionId = versions[0].version_id;

    const books = await dbAll<{
      book_id: string;
      book_name_en: string;
      book_name_fa: string;
      testament: string;
      book_order: number;
      chapter_count: number;
      total_verses: number;
    }>(
      `SELECT book_id, book_name_en, book_name_fa, testament, book_order, chapter_count, total_verses
       FROM books WHERE version_id = ? ORDER BY book_order ASC`,
      [versionId]
    );

    return NextResponse.json({ books });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
