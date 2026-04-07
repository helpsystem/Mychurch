import { NextResponse } from "next/server";
import { dbAll } from "@/lib/bibleDb";

export const revalidate = 3600;

interface VersionRow {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
}

interface VerseRow {
  version_id: number;
  verse_num: number;
  text: string;
}

interface CompareEntry {
  verseNum: number;
  text: string;
}

interface CompareRow {
  abbr: string;
  name: string;
  language: string;
  entries: CompareEntry[];
  hasContent: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const compareCache = new Map<string, { ts: number; payload: { rows: CompareRow[] } }>();

function normalizeLanguage(value: string): string {
  const lang = (value || "").toLowerCase();
  if (lang === "fa" || lang.includes("persian") || lang.includes("فارسی")) return "fa";
  return "en";
}

function parseCsvList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseVerseNums(value: string | null): number[] {
  if (!value) return [];
  const nums = value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const book = (searchParams.get("book") || "GEN").toUpperCase();
    const chapter = Number.parseInt(searchParams.get("chapter") || "1", 10);
    const versionAbbrs = parseCsvList(searchParams.get("versions")).map((abbr) => abbr.toUpperCase());
    const verseNums = parseVerseNums(searchParams.get("verses"));

    if (!Number.isInteger(chapter) || chapter <= 0) {
      return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
    }

    if (!versionAbbrs.length) {
      return NextResponse.json({ rows: [] });
    }

    if (!verseNums.length) {
      return NextResponse.json({ rows: versionAbbrs.map((abbr) => ({ abbr, name: abbr, language: "en", entries: [], hasContent: false })) });
    }

    const cacheKey = `${book}|${chapter}|${versionAbbrs.join(";")}|${verseNums.join(";")}`;
    const cached = compareCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }

    const versionsSql = `
      SELECT version_id, abbr, name, language
      FROM versions
      WHERE UPPER(abbr) IN (${placeholders(versionAbbrs.length)})
    `;

    const versions = await dbAll<VersionRow>(versionsSql, versionAbbrs);
    const versionByAbbr = new Map(versions.map((v) => [v.abbr.toUpperCase(), v]));
    const orderedVersions = versionAbbrs
      .map((abbr) => versionByAbbr.get(abbr))
      .filter((v): v is VersionRow => Boolean(v));

    if (!orderedVersions.length) {
      return NextResponse.json({ rows: [] });
    }

    const versionIds = orderedVersions.map((v) => v.version_id);
    const verseSql = `
      SELECT version_id, verse_num, text
      FROM verses
      WHERE version_id IN (${placeholders(versionIds.length)})
        AND book_id = ?
        AND chapter_num = ?
        AND verse_num IN (${placeholders(verseNums.length)})
      ORDER BY verse_num ASC
    `;

    const verseRows = await dbAll<VerseRow>(verseSql, [...versionIds, book, chapter, ...verseNums]);
    const byVersion = new Map<number, VerseRow[]>();
    for (const row of verseRows) {
      const list = byVersion.get(row.version_id) || [];
      list.push(row);
      byVersion.set(row.version_id, list);
    }

    const rows: CompareRow[] = orderedVersions.map((version) => {
      const matchedRows = byVersion.get(version.version_id) || [];
      const textByVerse = new Map(matchedRows.map((row) => [row.verse_num, row.text]));

      const entries = verseNums
        .map((verseNum) => {
          const text = textByVerse.get(verseNum);
          return text ? { verseNum, text } : null;
        })
        .filter((item): item is CompareEntry => Boolean(item));

      return {
        abbr: version.abbr,
        name: version.name,
        language: normalizeLanguage(version.language),
        entries,
        hasContent: entries.length > 0,
      };
    });

    const payload = { rows };
    compareCache.set(cacheKey, { ts: Date.now(), payload });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
