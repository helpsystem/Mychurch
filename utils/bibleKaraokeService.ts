// utils/bibleKaraokeService.ts
import { supabase } from '@/lib/supabaseClient';

export interface BibleVerse {
    id: number;
    book_code: string;
    book_name_en: string;
    book_name_fa: string;
    chapter: number;
    verse_number: number;
    text_fa: string;
    text_en?: string;
    audio_url?: string;
    timestamps?: any; // JSON field
}

export interface BibleChapterData {
    translation: string;
    book: string;
    chapter: number;
    bookName: string;
    bookNameFa: string;
    audioUrl: string;
    verses: BibleVerse[];
    timestampData?: any; // Full timestamp JSON if exists
}

/**
 * Fetch Bible chapter data with verses and timestamps from Supabase
 */
export async function fetchBibleChapterData(
    translation: 'TPV' | 'NMV' | 'MOJDEH',
    bookCode: string,
    chapter: number
): Promise<BibleChapterData | null> {
    try {
        const tableName = `bible_verses_${translation.toLowerCase()}`;

        // Fetch all verses for this chapter
        const { data: verses, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('book_code', bookCode)
            .eq('chapter', chapter)
            .order('verse_number', { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return null;
        }

        if (!verses || verses.length === 0) {
            console.warn(`⚠️ No verses found for ${bookCode} ${chapter}`);
            return null;
        }

        // Build audio URL (HiDrive proxy)
        const audioUrl = `/api/hidrive/stream/bible/audio/${translation}/${bookCode}/${chapter}.mp3`;

        // Check if we have timestamp data in any verse
        const timestampData = verses[0]?.timestamps || null;

        return {
            translation,
            book: bookCode,
            chapter,
            bookName: verses[0].book_name_en || bookCode,
            bookNameFa: verses[0].book_name_fa || bookCode,
            audioUrl,
            verses: verses as BibleVerse[],
            timestampData
        };

    } catch (err) {
        console.error('❌ Error fetching Bible data:', err);
        return null;
    }
}

/**
 * Convert old timestamp format to new lines format on the fly
 */
export function convertTimestampFormat(timestampData: any) {
    if (!timestampData) return null;

    // If already in new format
    if (timestampData.lines) {
        return timestampData;
    }

    // Convert old format (intro + verses) to new format (lines)
    const lines: any[] = [];

    // Add intro as book_title
    if (timestampData.intro) {
        lines.push({
            type: 'book_title',
            content: timestampData.intro.text,
            words: timestampData.intro.words || []
        });
    }

    // Add each verse
    if (timestampData.verses) {
        timestampData.verses.forEach((verse: any) => {
            lines.push({
                type: 'verse',
                label: String(verse.verse),
                content: verse.text,
                words: verse.words || []
            });
        });
    }

    return {
        ...timestampData,
        lines
    };
}
