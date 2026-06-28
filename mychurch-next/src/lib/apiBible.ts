import { INITIAL_BIBLE_BOOKS } from './bibleData';

const API_KEY = process.env.API_BIBLE_KEY || "b27dc6902b00019756980695a12eb0da";
const BASE_URL = "https://api.scripture.api.bible/v1";

// ── Known Bible IDs from API.Bible account ─────────────────────────────────
// These are the confirmed IDs accessible with this API key.
const KNOWN_BIBLE_IDS: Record<string, string> = {
  // Farsi / Persian
  "OPCB":    "7cd100148df29c08-01",  // Open Persian Contemporary Bible (Biblica)
  "NMV":     "7cd100148df29c08-01",  // Map NMV → OPCB (closest Persian equivalent)
  "TPV":     "7cd100148df29c08-01",  // Fallback
  "mojdeh":  "7cd100148df29c08-01",
  "qadim":   "7cd100148df29c08-01",

  // English
  "WEB":     "32664dc3288a28df-02",  // World English Bible (American Edition)
  "WEBUS":   "32664dc3288a28df-02",
  "BSB":     "32664dc3288a28df-02",  // Map BSB → WEB (both modern English)
  "KJV":     "de4e12af7f28f599-01",  // King James Version
  "NIV":     "32664dc3288a28df-02",  // Fallback to WEB if NIV not available
};

interface ApiBible {
  id: string;
  name: string;
  abbreviation: string;
  language: { id: string; name: string };
}

let biblesCache: ApiBible[] | null = null;
let cacheTime = 0;

// Only called as fallback when known ID lookup fails
async function getBibles(): Promise<ApiBible[]> {
  if (biblesCache && Date.now() - cacheTime < 24 * 3600 * 1000) {
    return biblesCache;
  }
  try {
    const res = await fetch(`${BASE_URL}/bibles`, {
      headers: { "api-key": API_KEY }
    });
    if (!res.ok) throw new Error(`API.Bible /bibles returned ${res.status}`);
    const data = await res.json();
    biblesCache = data.data || [];
    cacheTime = Date.now();
    return biblesCache || [];
  } catch (error) {
    console.error("[apiBible] Error fetching Bibles list:", error);
    return [];
  }
}

async function getBibleIdForTranslation(translation: string, lang: 'fa' | 'en'): Promise<string | null> {
  const key = translation.toUpperCase();

  // 1. Check hardcoded known IDs first (no API call needed)
  if (KNOWN_BIBLE_IDS[key]) return KNOWN_BIBLE_IDS[key];
  const keyLower = translation.toLowerCase();
  if (KNOWN_BIBLE_IDS[keyLower]) return KNOWN_BIBLE_IDS[keyLower];

  // 2. Dynamic lookup as fallback
  const bibles = await getBibles();
  if (lang === 'fa') {
    const match = bibles.find(b =>
      b.language.id === 'fas' ||
      b.language.id === 'pes' ||
      b.language.name.toLowerCase().includes('persian') ||
      b.language.name.toLowerCase().includes('farsi')
    );
    return match?.id ?? KNOWN_BIBLE_IDS["OPCB"] ?? null;
  } else {
    const matchAbbr = bibles.find(b =>
      b.language.id === 'eng' &&
      b.abbreviation.toLowerCase() === keyLower
    );
    if (matchAbbr) return matchAbbr.id;
    const fallback = bibles.find(b => b.language.id === 'eng');
    return fallback?.id ?? KNOWN_BIBLE_IDS["WEB"] ?? null;
  }
}

// Parse HTML content from API.Bible into array of verse strings
function parseHtmlVerses(html: string): string[] {
  if (!html) return [];

  // Remove footnotes, notes, headings
  let clean = html
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<span class="note"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')  // remove superscripts
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const verses: string[] = [];

  // Match verse spans with data-number attribute
  const regex = /<span[^>]*data-number="(\d+)"[^>]*>([\s\S]*?)(?=<span[^>]*data-number="\d+"|$)/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    const verseNum = parseInt(match[1], 10);
    let text = match[2]
      .replace(/<[^>]+>/g, '') // strip all tags
      .replace(/\s+/g, ' ')
      .trim();
    if (verseNum > 0 && text) {
      verses[verseNum - 1] = text;
    }
  }

  // If data-number approach didn't work, try verse-number spans
  if (verses.filter(Boolean).length === 0) {
    const regex2 = /<span[^>]*class="[^"]*v[^"]*"[^>]*>([\s\S]*?)(?=<span[^>]*class="[^"]*v[^"]*"|$)/g;
    let m2;
    let idx = 0;
    while ((m2 = regex2.exec(clean)) !== null) {
      const text = m2[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text) verses[idx++] = text;
    }
  }

  // Fill any holes with empty string
  for (let i = 0; i < verses.length; i++) {
    if (verses[i] === undefined) verses[i] = '';
  }

  return verses;
}

export async function fetchApiBibleContent(
  bookId: string,
  chapterNum: number,
  faTranslation: string,
  enTranslation: string
) {
  try {
    const [faBibleId, enBibleId] = await Promise.all([
      getBibleIdForTranslation(faTranslation, 'fa'),
      getBibleIdForTranslation(enTranslation, 'en')
    ]);

    if (!faBibleId || !enBibleId) {
      console.warn("[apiBible] Could not resolve Bible IDs:", { faTranslation, enTranslation });
      return null;
    }

    // API.Bible chapter IDs use format BOOK.CHAPTER (e.g. GEN.1, JHN.3)
    // Normalise bookId: API expects uppercase 3-letter codes (GEN, EXO, etc.)
    const chapterId = `${bookId.toUpperCase()}.${chapterNum}`;

    const fetchOpts = {
      headers: { "api-key": API_KEY },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    };

    const params = "content-type=html&include-notes=false&include-titles=false&include-verse-numbers=true&include-verse-spans=true";

    const [faRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/bibles/${faBibleId}/chapters/${chapterId}?${params}`, fetchOpts),
      fetch(`${BASE_URL}/bibles/${enBibleId}/chapters/${chapterId}?${params}`, fetchOpts),
    ]);

    // Gracefully handle partial failures
    const faOk = faRes.ok;
    const enOk = enRes.ok;

    if (!faOk && !enOk) {
      console.warn("[apiBible] Both chapter fetches failed:", { faStatus: faRes.status, enStatus: enRes.status, chapterId });
      return null;
    }

    const [faData, enData] = await Promise.all([
      faOk ? faRes.json() : Promise.resolve({}),
      enOk ? enRes.json() : Promise.resolve({}),
    ]);

    const faVerses = parseHtmlVerses(faData?.data?.content || '');
    const enVerses = parseHtmlVerses(enData?.data?.content || '');

    // If both returned empty, fall back to DB
    if (faVerses.filter(Boolean).length === 0 && enVerses.filter(Boolean).length === 0) {
      console.warn("[apiBible] Parsed verses are empty for", chapterId, "— falling back to DB");
      return null;
    }

    const book = INITIAL_BIBLE_BOOKS.find(b =>
      b.key.toUpperCase() === bookId.toUpperCase()
    );

    return {
      success: true,
      selected: {
        faTranslation,
        enTranslation,
        faVersion: "OPCB",
        enVersion: enTranslation.toUpperCase() === "BSB" ? "WEB" : enTranslation.toUpperCase(),
        availableFa: ['NMV', 'OPCB'],
        availableEn: ['BSB', 'KJV', 'NIV'],
        bookId,
        bookNameEn: book?.name.en || bookId,
        bookNameFa: book?.name.fa || bookId,
      },
      verses: {
        fa: faVerses,
        en: enVerses,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn("[apiBible] Request timed out for", bookId, chapterNum);
    } else {
      console.error("[apiBible] Error in fetchApiBibleContent:", error);
    }
    return null;
  }
}
