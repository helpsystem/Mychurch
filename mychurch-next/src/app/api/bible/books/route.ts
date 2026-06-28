import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";
import { INITIAL_BIBLE_BOOKS, OLD_TESTAMENT_BOOKS } from "@/lib/bibleData";

export const revalidate = 3600;

const CACHE_TTL = 24 * 3600 * 1000; // 24h
const _cache = new Map<string, { data: unknown[]; ts: number }>();

// Build the full 66-book list from static data as fallback
function getStaticBooks() {
  return INITIAL_BIBLE_BOOKS.map((b, index) => ({
    book_id: b.key.toUpperCase(),
    book_name_en: b.name.en,
    book_name_fa: b.name.fa,
    testament: OLD_TESTAMENT_BOOKS.includes(b.key) ? "OT" : "NT",
    book_order: index + 1,
    chapter_count: b.chapters,
    total_verses: 0,
  }));
}

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

    // Try DB first
    try {
      const versions = await dbAll<{ version_id: number }>(
        "SELECT version_id FROM versions WHERE UPPER(abbr) = UPPER(?) LIMIT 1",
        [versionAbbr]
      );

      const fallback = !versions.length
        ? await dbAll<{ version_id: number; abbr: string }>(
            "SELECT version_id, abbr FROM versions WHERE LOWER(language) NOT IN ('persian','fa','فارسی') ORDER BY version_id ASC LIMIT 1"
          )
        : [];

      if (versions.length || fallback.length) {
        const versionId = versions.length ? versions[0].version_id : fallback[0].version_id;

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

        // If DB returned a full set (≥ 60 books), use it
        if (books.length >= 60) {
          _cache.set(versionAbbr, { data: books, ts: Date.now() });
          return NextResponse.json({ books }, {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
              'X-Cache': 'MISS_DB',
            }
          });
        }
      }
    } catch (dbErr) {
      console.warn("[books] DB lookup failed, falling back to static data:", dbErr);
    }

    // Fallback: return complete static 66-book list
    const staticBooks = getStaticBooks();
    _cache.set(versionAbbr, { data: staticBooks, ts: Date.now() });

    return NextResponse.json({ books: staticBooks }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS_STATIC',
      }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
