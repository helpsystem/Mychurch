/**
 * AMLL Data Converter
 * Converts our custom timing data format to AMLL-compatible format
 */

// Our current timing data structure
export interface OurTimingData {
    songId: number;
    generatedAt?: string;
    version?: string;
    model?: string;
    schema?: string;
    lines: Array<{
        line: string;
        start: number;
        end: number;
        words: Array<{
            word: string;
            start: number;
            end: number;
            finglish?: string;
        }>;
    }>;
}

// AMLL required structure (full version with romanWord)
export interface AmllWord {
    word: string;
    startTime: number;  // in milliseconds
    endTime: number;    // in milliseconds
    romanWord: string;  // Finglish for individual word
    obscene: boolean;   // Required by AMLL
}

export interface AmllLyricLine {
    words: AmllWord[];
    startTime: number;      // in milliseconds
    endTime: number;        // in milliseconds
    translatedLyric: string; // For English translation (future)
    romanLyric: string;      // For Finglish transliteration
    isBG: boolean;           // Background vocal indicator
    isDuet: boolean;         // Duet indicator
}

/**
 * Convert our timing data to AMLL format (full version with all required fields)
 * @param timingData Our custom timing data
 * @returns AMLL-compatible lyric lines with all required fields
 */
export function convertToAmllFormat(timingData: OurTimingData): AmllLyricLine[] {
    if (!timingData || !timingData.lines || timingData.lines.length === 0) {
        return [];
    }

    return timingData.lines.map((line) => {
        // Convert each word to AMLL format with all required fields
        const amllWords: AmllWord[] = line.words.map((word) => ({
            word: word.word,
            startTime: word.start * 1000, // Convert seconds to milliseconds
            endTime: word.end * 1000,     // Convert seconds to milliseconds
            romanWord: word.finglish || '', // Finglish for each word
            obscene: false,
        }));

        // Collect all Finglish words for the romanLyric field
        const finglishWords = line.words
            .map((word) => word.finglish || '')
            .filter((f) => f.trim() !== '');

        const romanLyric = finglishWords.length > 0
            ? finglishWords.join(' ')
            : '';

        // Create AMLL line structure
        const amllLine: AmllLyricLine = {
            words: amllWords,
            startTime: line.start * 1000,  // Convert seconds to milliseconds
            endTime: line.end * 1000,      // Convert seconds to milliseconds
            translatedLyric: '',            // Empty for now, can add English translation later
            romanLyric: romanLyric,         // Finglish transliteration
            isBG: false,                    // Can be enhanced to detect background vocals
            isDuet: false,                  // Can be enhanced to detect duet sections
        };

        return amllLine;
    });
}

/**
 * Extract plain text lyrics from timing data (for display purposes)
 * @param timingData Our custom timing data
 * @returns Array of plain text lines
 */
export function extractPlainLyrics(timingData: OurTimingData): string[] {
    if (!timingData || !timingData.lines) {
        return [];
    }

    return timingData.lines.map(line => line.line);
}

/**
 * Extract Finglish lyrics from timing data
 * @param timingData Our custom timing data
 * @returns Array of Finglish text lines
 */
export function extractFinglishLyrics(timingData: OurTimingData): string[] {
    if (!timingData || !timingData.lines) {
        return [];
    }

    return timingData.lines.map(line => {
        const finglishWords = line.words
            .map(word => word.finglish || '')
            .filter(f => f.trim() !== '');

        return finglishWords.join(' ');
    });
}

/**
 * Check if timing data has Finglish support
 * @param timingData Our custom timing data
 * @returns true if at least one word has finglish field
 */
export function hasFinglishSupport(timingData: OurTimingData): boolean {
    if (!timingData || !timingData.lines) {
        return false;
    }

    return timingData.lines.some(line =>
        line.words.some(word => word.finglish && word.finglish.trim() !== '')
    );
}

/**
 * Get timing metadata
 * @param timingData Our custom timing data
 * @returns Metadata object
 */
export function getTimingMetadata(timingData: OurTimingData) {
    return {
        songId: timingData.songId,
        generatedAt: timingData.generatedAt,
        version: timingData.version,
        model: timingData.model,
        schema: timingData.schema,
        hasFinglish: hasFinglishSupport(timingData),
        totalLines: timingData.lines?.length || 0,
        totalWords: timingData.lines?.reduce((sum, line) => sum + line.words.length, 0) || 0,
    };
}
