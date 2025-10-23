/**
 * Complete Bible Data Service
 * 
 * Loads all 66 books and chapters from embedded data or API
 * Supports both online (API) and offline (JSON) modes
 */

export interface BibleBook {
  code: string;
  number: number;
  testament: 'OT' | 'NT';
  names: {
    en: string;
    fa: string;
  };
  chapterCount: number;
}

export interface BibleVerse {
  number: number;
  text: {
    en: string;
    fa: string;
  };
  id: string;
}

export interface BibleChapter {
  book: {
    code: string;
    number: number;
    names: {
      en: string;
      fa: string;
    };
  };
  chapterNumber: number;
  verseCount: number;
  verses: BibleVerse[];
}

// Cache for loaded data
const cache: {
  books?: BibleBook[];
  chapters: Map<string, BibleChapter>;
} = {
  chapters: new Map()
};

/**
 * Load all Bible books
 */
export async function loadBibleBooks(): Promise<BibleBook[]> {
  if (cache.books) {
    return cache.books;
  }

  try {
    // Try loading from local JSON first (offline mode)
    const response = await fetch('/bible-data-complete.json');
    const data = await response.json();
    cache.books = data.books;
    return data.books;
  } catch (error) {
    console.error('Error loading Bible books:', error);
    // Fallback to minimal data
    return getMinimalBooks();
  }
}

/**
 * Load specific chapter
 */
export async function loadBibleChapter(
  bookCode: string,
  chapterNumber: number
): Promise<BibleChapter> {
  const cacheKey = `${bookCode}-${chapterNumber}`;
  
  // Check cache first
  if (cache.chapters.has(cacheKey)) {
    return cache.chapters.get(cacheKey)!;
  }

  try {
    // Try loading from API first
    const response = await fetch(
      `/api/bible-unified/chapter?book=${bookCode}&chapter=${chapterNumber}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.chapter) {
        cache.chapters.set(cacheKey, data.chapter);
        return data.chapter;
      }
    }
  } catch (error) {
    console.log('API not available, using local data');
  }

  // Fallback to local JSON data
  return loadChapterFromJSON(bookCode, chapterNumber);
}

/**
 * Load chapter from local JSON file
 */
async function loadChapterFromJSON(
  bookCode: string,
  chapterNumber: number
): Promise<BibleChapter> {
  try {
    const response = await fetch('/bible-data-complete.json');
    const data = await response.json();
    
    // Find book info
    const book = data.books.find((b: BibleBook) => b.code === bookCode);
    if (!book) {
      throw new Error(`Book ${bookCode} not found`);
    }

    // Get verses for this chapter
    let verses = data.sampleVerses?.[bookCode]?.[chapterNumber] || [];
    
    // If no verses available, generate placeholders
    if (verses.length === 0) {
      verses = generatePlaceholderVerses(book, chapterNumber);
    }

    const chapter: BibleChapter = {
      book: {
        code: book.code,
        number: book.number,
        names: book.names
      },
      chapterNumber,
      verseCount: verses.length,
      verses
    };

    // Cache it
    const cacheKey = `${bookCode}-${chapterNumber}`;
    cache.chapters.set(cacheKey, chapter);

    return chapter;
  } catch (error) {
    console.error('Error loading chapter from JSON:', error);
    throw error;
  }
}

/**
 * Generate placeholder verses when real data not available
 */
function generatePlaceholderVerses(
  book: BibleBook,
  chapterNumber: number,
  count: number = 10
): BibleVerse[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    text: {
      en: `${book.names.en} ${chapterNumber}:${i + 1} - Text will be loaded soon`,
      fa: `${book.names.fa} ${chapterNumber}:${i + 1} - متن به زودی بارگذاری می‌شود`
    },
    id: `${book.code}-${chapterNumber}-${i + 1}`
  }));
}

/**
 * Get minimal book list (fallback)
 */
function getMinimalBooks(): BibleBook[] {
  return [
    { code: 'GEN', number: 1, testament: 'OT', names: { en: 'Genesis', fa: 'پیدایش' }, chapterCount: 50 },
    { code: 'EXO', number: 2, testament: 'OT', names: { en: 'Exodus', fa: 'خروج' }, chapterCount: 40 },
    { code: 'LEV', number: 3, testament: 'OT', names: { en: 'Leviticus', fa: 'لاویان' }, chapterCount: 27 },
    { code: 'NUM', number: 4, testament: 'OT', names: { en: 'Numbers', fa: 'اعداد' }, chapterCount: 36 },
    { code: 'DEU', number: 5, testament: 'OT', names: { en: 'Deuteronomy', fa: 'تثنیه' }, chapterCount: 34 },
    { code: 'MAT', number: 40, testament: 'NT', names: { en: 'Matthew', fa: 'متی' }, chapterCount: 28 },
    { code: 'MRK', number: 41, testament: 'NT', names: { en: 'Mark', fa: 'مرقس' }, chapterCount: 16 },
    { code: 'LUK', number: 42, testament: 'NT', names: { en: 'Luke', fa: 'لوقا' }, chapterCount: 24 },
    { code: 'JHN', number: 43, testament: 'NT', names: { en: 'John', fa: 'یوحنا' }, chapterCount: 21 },
    { code: 'REV', number: 66, testament: 'NT', names: { en: 'Revelation', fa: 'مکاشفه' }, chapterCount: 22 }
  ];
}

/**
 * Preload next chapter for smooth navigation
 */
export async function preloadNextChapter(
  bookCode: string,
  currentChapter: number,
  chapterCount: number
): Promise<void> {
  const nextChapter = currentChapter + 1;
  if (nextChapter <= chapterCount) {
    // Load in background
    loadBibleChapter(bookCode, nextChapter).catch(() => {});
  }
}

/**
 * Clear cache (for testing or memory management)
 */
export function clearCache(): void {
  cache.books = undefined;
  cache.chapters.clear();
}
