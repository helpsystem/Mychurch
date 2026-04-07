import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

export const revalidate = 3600;

// Server-side in-memory cache: version -> books (cleared on restart)
const _cache = new Map<string, { data: unknown[]; ts: number }>();
const CACHE_TTL = 24 * 3600 * 1000; // 24h

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const versionAbbr = (searchParams.get("version") || "BSB").toUpperCase();

    // Return from in-memory cache if fresh
    const cached = _cache.get(versionAbbr);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ books: cached.data }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
        }
      });
    }

    // Get the version_id for the requested abbreviation
    const versions = await dbAll<{ version_id: number }>(
      "SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1",
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

    // Store in memory cache
    _cache.set(versionAbbr, { data: books, ts: Date.now() });

    return NextResponse.json({ books }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
