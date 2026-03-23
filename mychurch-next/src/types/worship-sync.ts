export type WordSegment = {
    word: string;
    start_time: number;
    end_time: number;
    finglish?: string | null;
    english?: string | null;
};

export type LineType = 'book_title' | 'chapter_title' | 'verse' | 'text' | 'lyric';

export type LineSegment = {
    type: LineType;
    label?: string; // e.g., "1", "2" for verses
    content: string;
    translations?: {
        persian?: string | null;
        english?: string | null;
        finglish?: string | null;
    };
    words: WordSegment[];
};

export type TranscriptData = {
    lines: LineSegment[];
    fullTranscript: string;
};

// Compatible type for existing "System V2.0" files
export type SystemWordV2 = {
    word: string;
    start: number;
    end: number;
    finglish?: string | null;
    english?: string | null;
};

export type SystemLineV2 = {
    line: string;
    start: number;
    end: number;
    translations?: {
        persian?: string | null;
        english?: string | null;
        finglish?: string | null;
    };
    words: SystemWordV2[];
};

export type SystemTimingV2 = {
    songId: number;
    version: string;
    generatedAt?: string;
    source?: string;
    totalDuration: number;
    lines: SystemLineV2[];
};
