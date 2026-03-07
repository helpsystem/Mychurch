"use server";

import fs from "fs/promises";
import path from "path";

// Function to resolve the absolute path to the bible_data directory.
// In development, this is adjacent to the mychurch-next folder.
// In production, it should be in the same relative location.
function getBibleDataPath() {
    return path.join(process.cwd(), "..", "bible_data");
}

export interface UnifiedVerse {
    number: number;
    fa: string;
    en: string;
    start: number;
    end: number;
}

export interface ChapterData {
    book: string;
    chapter: number;
    audioUrl: string;
    verses: UnifiedVerse[];
}

export async function fetchChapterData(bookCode: string, chapterNumber: number): Promise<ChapterData | null> {
    const usfmMap = [
        "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
        "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
        "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
        "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
        "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
        "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS",
        "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
    ];

    try {
        const parsedCode = parseInt(bookCode, 10);
        let resolvedCode = bookCode;
        if (!isNaN(parsedCode) && parsedCode >= 1 && parsedCode <= 66) {
            resolvedCode = usfmMap[parsedCode - 1];
        }

        const basePath = getBibleDataPath();

        // Paths to the three JSON files
        const faPath = path.join(basePath, "text", "MOJDEH", resolvedCode, `${chapterNumber}.json`);
        const enPath = path.join(basePath, "text", "NET", resolvedCode, `${chapterNumber}.json`);
        const timestampsPath = path.join(basePath, "timestamps", "TPV", resolvedCode, `${chapterNumber}.json`);

        let faData: any = { verses: [], audio: "" };
        let enData: any = { verses: [] };
        let timestampsData: any = { verses: [] };

        // Read Persian (Primary)
        try {
            const faRaw = await fs.readFile(faPath, 'utf8');
            faData = JSON.parse(faRaw);
        } catch (e) {
            console.warn(`[Bible Action] Could not load Persian text for ${bookCode} ${chapterNumber}`, e);
            return null; // Persian text is an absolute requirement
        }

        // Read English (Fallback gracefully if missing)
        try {
            const enRaw = await fs.readFile(enPath, 'utf8');
            enData = JSON.parse(enRaw);
        } catch (e) {
            console.warn(`[Bible Action] Could not load English text for ${bookCode} ${chapterNumber}`);
        }

        // Read Timestamps (Fallback gracefully if missing)
        try {
            const timeRaw = await fs.readFile(timestampsPath, 'utf8');
            timestampsData = JSON.parse(timeRaw);
        } catch (e) {
            console.warn(`[Bible Action] Could not load Timestamps for ${bookCode} ${chapterNumber}`);
        }

        const audioUrl = faData.audio || "";

        // Merge the arrays based on the verse number
        const unifiedVerses: UnifiedVerse[] = faData.verses.map((faVerse: any) => {
            const vNum = faVerse.verse;

            // Find corresponding English verse
            const enVerse = enData.verses?.find((v: any) => v.verse === vNum);

            // Find corresponding Timestamps
            const timeVerse = timestampsData.verses?.find((v: any) => v.verse === vNum);

            return {
                number: vNum,
                fa: faVerse.text || "",
                en: enVerse?.text || "",
                start: timeVerse?.start || 0,
                end: timeVerse?.end || 0
            };
        });

        // Sort by verse number just in case
        unifiedVerses.sort((a, b) => a.number - b.number);

        return {
            book: bookCode,
            chapter: chapterNumber,
            audioUrl: audioUrl,
            verses: unifiedVerses
        };

    } catch (error) {
        console.error(`[Bible Action] Global error fetching chapter:`, error);
        return null;
    }
}
