import { INITIAL_BIBLE_BOOKS } from './bibleData';

const API_KEY = "b27dc6902b00019756980695a12eb0da";
const BASE_URL = "https://api.scripture.api.bible/v1";

interface ApiBible {
  id: string;
  name: string;
  abbreviation: string;
  language: {
    id: string;
    name: string;
  };
}

let biblesCache: ApiBible[] | null = null;
let cacheTime = 0;

async function getBibles(): Promise<ApiBible[]> {
  if (biblesCache && Date.now() - cacheTime < 24 * 3600 * 1000) {
    return biblesCache;
  }

  try {
    const res = await fetch(`${BASE_URL}/bibles`, {
      headers: { "api-key": API_KEY }
    });
    if (!res.ok) throw new Error(`API.Bible returned status ${res.status}`);
    const data = await res.json();
    biblesCache = data.data || [];
    cacheTime = Date.now();
    return biblesCache || [];
  } catch (error) {
    console.error("Error fetching Bibles list from API.Bible:", error);
    return [];
  }
}

// Maps standard abbreviations to API.Bible IDs dynamically
async function getBibleIdForTranslation(translation: string, lang: 'fa' | 'en'): Promise<string | null> {
  const bibles = await getBibles();
  const key = translation.toLowerCase();

  if (lang === 'fa') {
    // Farsi translations
    // common language / TPV / Mojdeh
    if (key === 'mojdeh' || key === 'tpv' || key === 'tafsiri') {
      const match = bibles.find(b => b.language.id === 'fas' && (b.abbreviation.toLowerCase().includes('tpv') || b.name.toLowerCase().includes('common') || b.name.includes('مژده')));
      if (match) return match.id;
    }
    // old version / POV
    if (key === 'qadim' || key === 'pov' || key === 'pov-fas') {
      const match = bibles.find(b => b.language.id === 'fas' && (b.abbreviation.toLowerCase().includes('pov') || b.name.toLowerCase().includes('old') || b.name.includes('قدیم')));
      if (match) return match.id;
    }
    // fallback to any Farsi bible
    const fallback = bibles.find(b => b.language.id === 'fas');
    return fallback ? fallback.id : null;
  } else {
    // English translations
    if (key === 'kjv') {
      const match = bibles.find(b => b.language.id === 'eng' && b.abbreviation.toLowerCase() === 'kjv');
      if (match) return match.id;
    }
    if (key === 'bsb') {
      const match = bibles.find(b => b.language.id === 'eng' && b.abbreviation.toLowerCase() === 'bsb');
      if (match) return match.id;
    }
    if (key === 'niv') {
      const match = bibles.find(b => b.language.id === 'eng' && b.abbreviation.toLowerCase() === 'niv');
      if (match) return match.id;
    }
    // generic english matching
    const matchAbbr = bibles.find(b => b.language.id === 'eng' && b.abbreviation.toLowerCase().includes(key));
    if (matchAbbr) return matchAbbr.id;

    // fallback to any English bible
    const fallback = bibles.find(b => b.language.id === 'eng');
    return fallback ? fallback.id : null;
  }
}

function parseHtmlVerses(html: string): string[] {
  const verses: string[] = [];
  if (!html) return verses;

  let cleanHtml = html
    .replace(/<note[^>]*>.*?<\/note>/g, '')
    .replace(/<span class="note"[^>]*>.*?<\/span>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const regex = /<span[^>]*data-number="(\d+)"[^>]*>.*?<\/span>(.*?)(?=<span[^>]*data-number="\d+"[^>]*>|[\s\S]*$)/g;
  
  let match;
  while ((match = regex.exec(cleanHtml)) !== null) {
    const verseNum = parseInt(match[1], 10);
    let verseText = match[2];
    verseText = verseText.replace(/<[^>]+>/g, '').trim();
    if (verseNum > 0) {
      verses[verseNum - 1] = verseText;
    }
  }

  for (let i = 0; i < verses.length; i++) {
    if (verses[i] === undefined) {
      verses[i] = '';
    }
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
      console.warn("Could not resolve Bible IDs for API.Bible:", { faTranslation, enTranslation });
      return null;
    }

    const chapterId = `${bookId}.${chapterNum}`;

    const [faRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/bibles/${faBibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=false&include-verse-numbers=true`, {
        headers: { "api-key": API_KEY }
      }),
      fetch(`${BASE_URL}/bibles/${enBibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=false&include-verse-numbers=true`, {
        headers: { "api-key": API_KEY }
      })
    ]);

    if (!faRes.ok || !enRes.ok) {
      console.warn("API.Bible chapters fetch failed:", { faStatus: faRes.status, enStatus: enRes.status });
      return null;
    }

    const [faData, enData] = await Promise.all([faRes.json(), enRes.json()]);

    const faHtml = faData.data?.content || '';
    const enHtml = enData.data?.content || '';

    const faVerses = parseHtmlVerses(faHtml);
    const enVerses = parseHtmlVerses(enHtml);

    const book = INITIAL_BIBLE_BOOKS.find(b => b.key.toUpperCase() === bookId.toUpperCase() || b.key === bookId);

    return {
      success: true,
      selected: {
        faTranslation,
        enTranslation,
        faVersion: faTranslation,
        enVersion: enTranslation,
        availableFa: ['mojdeh', 'qadim'],
        availableEn: ['kjv', 'bsb', 'niv'],
        bookId,
        bookNameEn: book?.name.en || bookId,
        bookNameFa: book?.name.fa || bookId,
      },
      verses: {
        fa: faVerses,
        en: enVerses
      }
    };
  } catch (error) {
    console.error("Error in fetchApiBibleContent:", error);
    return null;
  }
}
