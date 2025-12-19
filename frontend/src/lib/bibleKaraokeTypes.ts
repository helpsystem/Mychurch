/**
 * Bible Karaoke - Type Definitions
 */

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
  start?: number;
  end?: number;
  timings?: WordTiming[];
}

export interface LanguageSection {
  textFile?: string;
  audioFile?: string;
  audioUrl?: string;
  duration?: number;
  verses?: BibleVerse[];
  aligned?: boolean;
  alignedAt?: string;
  alignmentMethod?: string;
}

export interface BookInfo {
  id: number;
  iso: string;
  en: string;
  fa: string;
  chapters: number;
}

export interface ChapterData {
  book: BookInfo;
  chapter: number;
  en: LanguageSection;
  fa: LanguageSection;
}

export interface ChapterIndexItem {
  key: string;
  iso: string;
  book: BookInfo;
  chapter: number;
  en: {
    audioUrl?: string;
    hasText: boolean;
    verseCount: number;
  };
  fa: {
    audioUrl?: string;
    hasText: boolean;
    verseCount: number;
  };
}

export interface BibleKaraokeIndex {
  generatedAt: string;
  totalChapters: number;
  chapters: ChapterIndexItem[];
}
