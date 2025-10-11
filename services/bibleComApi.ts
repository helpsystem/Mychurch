/**
 * Bible.com API Service
 * Integration with YouVersion Bible API
 */

export interface BibleComVerse {
  id: string;
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  usfm: string;
}

export interface BibleComChapter {
  id: string;
  book_id: string;
  book_name: string;
  chapter: number;
  verses: BibleComVerse[];
  next_chapter?: string;
  previous_chapter?: string;
}

export interface BibleComBook {
  id: string;
  name: string;
  abbreviation: string;
  testament: 'OLD' | 'NEW';
  chapters: number;
}

export interface BibleComVersion {
  id: number;
  name: string;
  abbreviation: string;
  language: string;
  hasAudio: boolean;
}

// Popular Persian Bible versions on Bible.com
export const PERSIAN_VERSIONS = {
  NMV: 118,      // هزارۀ نو (New Millennium Version)
  PECL: 464,     // Persian Contemporary Bible
  TPV: 1262,     // Tarjumeh-ye Qadeem (Old Translation)
  MHNT: 2692,    // Mojdeh (Good News)
};

// Popular English Bible versions
export const ENGLISH_VERSIONS = {
  NIV: 111,      // New International Version
  KJV: 1,        // King James Version
  ESV: 59,       // English Standard Version
  NLT: 116,      // New Living Translation
  NKJV: 114,     // New King James Version
};

class BibleComService {
  private baseUrl = 'https://www.bible.com';
  
  /**
   * Get chapter content with verses
   */
  async getChapter(
    book: string, 
    chapter: number, 
    versionId: number = PERSIAN_VERSIONS.NMV
  ): Promise<BibleComChapter | null> {
    try {
      const url = `${this.baseUrl}/bible/${versionId}/${book}.${chapter}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      // Bible.com returns HTML, we need to parse it
      // For now, return null and use our own API
      return null;
    } catch (error) {
      console.error('Bible.com API error:', error);
      return null;
    }
  }

  /**
   * Get audio URL for chapter
   * Bible.com has audio for many versions
   */
  getAudioUrl(
    book: string, 
    chapter: number, 
    versionId: number = PERSIAN_VERSIONS.NMV
  ): string {
    return `${this.baseUrl}/audio-bible/${versionId}/${book}.${chapter}`;
  }

  /**
   * Get verse of the day
   */
  async getVerseOfTheDay(language: 'fa' | 'en' = 'en'): Promise<any> {
    try {
      const url = `${this.baseUrl}/verse-of-the-day`;
      // Would need API key for actual implementation
      return null;
    } catch (error) {
      console.error('Verse of the day error:', error);
      return null;
    }
  }

  /**
   * Get reading plans
   */
  getReadingPlans(language: 'fa' | 'en' = 'en') {
    return `${this.baseUrl}/reading-plans?language=${language === 'fa' ? 'pes' : 'en'}`;
  }

  /**
   * Get Bible videos related to a chapter
   */
  getVideosUrl(book: string, chapter: number) {
    return `${this.baseUrl}/videos?q=${book}+${chapter}`;
  }

  /**
   * Map our book keys to Bible.com book codes
   */
  mapBookCode(ourKey: string): string {
    const mapping: Record<string, string> = {
      'GEN': 'GEN',
      'EXO': 'EXO',
      'LEV': 'LEV',
      'NUM': 'NUM',
      'DEU': 'DEU',
      'JOS': 'JOS',
      'JDG': 'JDG',
      'RUT': 'RUT',
      '1SA': '1SA',
      '2SA': '2SA',
      '1KI': '1KI',
      '2KI': '2KI',
      '1CH': '1CH',
      '2CH': '2CH',
      'EZR': 'EZR',
      'NEH': 'NEH',
      'EST': 'EST',
      'JOB': 'JOB',
      'PSA': 'PSA',
      'PRO': 'PRO',
      'ECC': 'ECC',
      'SNG': 'SNG',
      'ISA': 'ISA',
      'JER': 'JER',
      'LAM': 'LAM',
      'EZK': 'EZK',
      'DAN': 'DAN',
      'HOS': 'HOS',
      'JOL': 'JOL',
      'AMO': 'AMO',
      'OBA': 'OBA',
      'JON': 'JON',
      'MIC': 'MIC',
      'NAM': 'NAM',
      'HAB': 'HAB',
      'ZEP': 'ZEP',
      'HAG': 'HAG',
      'ZEC': 'ZEC',
      'MAL': 'MAL',
      // New Testament
      'MAT': 'MAT',
      'MRK': 'MRK',
      'LUK': 'LUK',
      'JHN': 'JHN',
      'ACT': 'ACT',
      'ROM': 'ROM',
      '1CO': '1CO',
      '2CO': '2CO',
      'GAL': 'GAL',
      'EPH': 'EPH',
      'PHP': 'PHP',
      'COL': 'COL',
      '1TH': '1TH',
      '2TH': '2TH',
      '1TI': '1TI',
      '2TI': '2TI',
      'TIT': 'TIT',
      'PHM': 'PHM',
      'HEB': 'HEB',
      'JAS': 'JAS',
      '1PE': '1PE',
      '2PE': '2PE',
      '1JN': '1JN',
      '2JN': '2JN',
      '3JN': '3JN',
      'JUD': 'JUD',
      'REV': 'REV',
    };
    
    return mapping[ourKey.toUpperCase()] || ourKey;
  }

  /**
   * Get shareable link for verse/chapter
   */
  getShareLink(
    book: string,
    chapter: number,
    verse?: number,
    versionId: number = PERSIAN_VERSIONS.NMV
  ): string {
    const bookCode = this.mapBookCode(book);
    if (verse) {
      return `${this.baseUrl}/bible/${versionId}/${bookCode}.${chapter}.${verse}`;
    }
    return `${this.baseUrl}/bible/${versionId}/${bookCode}.${chapter}`;
  }
}

export const bibleComService = new BibleComService();
export default bibleComService;
