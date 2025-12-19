// Bible Types
export interface BibleVerse {
  id: number;
  testament: 'OT' | 'NT';
  book: string;
  chapter: number;
  verse_number: number;
  verse_text: string;
  language: 'en' | 'fa';
}

export interface BibleBook {
  code: string;
  name: {
    en: string;
    fa: string;
  };
  chapters: number;
  testament: 'OT' | 'NT';
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface TTSConfig {
  language: 'en' | 'fa';
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface ReadingState {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerse: number;
  currentWordIndex: number;
  totalVerses: number;
}
