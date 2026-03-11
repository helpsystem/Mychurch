"use server";

/**
 * Bible data service — Hybrid with official YouVersion SDK
 *
 * Strategy:
 *  1. ⚡ Memory cache (ultra-fast, 24h TTL)
 *  2. 🌐 YouVersion SDK → BSB English (always fresh, official)
 *  3. 🗄️  PostgreSQL → Persian translations (already imported: MOJDEH, TPV, QADIM, WP)
 *  4. 💾  Auto-patches English into DB for future fallback
 *
 * Note: KJV is copyright-restricted on this key. BSB (Berean Standard Bible)
 * is an excellent modern open-license alternative used by YouVersion itself.
 */

import { Pool } from 'pg';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ApiClient, BibleClient } = require('@youversion/platform-core');

// ─── Types ───────────────────────────────────────────────────────────────────
export interface UnifiedVerse {
    number: number;
    fa: string;
    en: string;
    fa_tpv?: string;
    fa_mojdeh?: string;
    fa_qadim?: string;
    fa_wp?: string;
    start: number;
    end: number;
}

export interface ChapterData {
    book: string;
    chapter: number;
    audioUrl: string;
    tpvAudioUrl?: string;
    mojdehAudioUrl?: string;
    qadimAudioUrl?: string;
    verses: UnifiedVerse[];
}

// ─── Database (Persian translations + fallback) ──────────────────────────────
const pool = new Pool({
    connectionString: 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch',
    ssl: { rejectUnauthorized: false },
});

// ─── YouVersion SDK setup ─────────────────────────────────────────────────────
const apiClient = new ApiClient({ appKey: 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834' });
const bibleClient = new BibleClient(apiClient);

// BSB = Berean Standard Bible (ID 3034) - open license, excellent modern translation
const BSB_ID = 3034;

// ─── Audio templates ──────────────────────────────────────────────────────────
const AUDIO_TPV = (code: string, ch: number) =>
    `https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/bible/audio/TPV/${code}/${ch}.mp3`;

// ─── USFM map ─────────────────────────────────────────────────────────────────
const USFM = [
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA",
    "1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO",
    "ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO",
    "OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",
    "MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH",
    "PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS",
    "1PE","2PE","1JN","2JN","3JN","JUD","REV",
];

// ─── Memory cache ─────────────────────────────────────────────────────────────
const MEM = new Map<string, { d: ChapterData; exp: number }>();
const TTL = 24 * 3600 * 1000;

// ─── Fetch English chapter from YouVersion BSB (single API call) ────────────
async function fetchEnglishVerses(bookCode: string, ch: number): Promise<Record<number, string>> {
    try {
        // Fetch the whole chapter as HTML — much faster than per-verse calls
        const chapterPassage = await bibleClient.getPassage(BSB_ID, `${bookCode}.${ch}`, 'html');
        const html: string = chapterPassage?.content || '';
        if (!html) return {};

        // Parse verse spans: <span class="yv-v" v="1">text...</span>
        // or strip all HTML for plain text per verse number
        const verseMap: Record<number, string> = {};

        // Match verse markers and capture text between them
        // YouVersion HTML format: <span ... v="N">text</span>
        const verseRegex = /v="(\d+)"[^>]*>([\s\S]*?)(?=v="\d+"|<\/div>|$)/g;
        let match;
        while ((match = verseRegex.exec(html)) !== null) {
            const vNum = parseInt(match[1]);
            // Strip remaining HTML tags and clean up whitespace
            const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (text && vNum > 0) {
                verseMap[vNum] = text;
            }
        }

        // If regex didn't match (unexpected format), fall back to strip-all approach
        if (Object.keys(verseMap).length === 0) {
            // Try to get plain text version as fallback
            const plainPassage = await bibleClient.getPassage(BSB_ID, `${bookCode}.${ch}`, 'text');
            const plainText: string = (plainPassage?.content || '').trim();
            if (plainText) {
                // Mark as verse 1 with full chapter text (will merge in DB later)
                verseMap[0] = plainText;
            }
        }

        return verseMap;
    } catch (e: any) {
        console.warn(`[Bible/BSB] ${bookCode}:${ch} — ${e.message}`);
        return {};
    }
}


// ─── Load Persian translations from local DB ──────────────────────────────────
async function loadPersianFromDb(book: string, ch: number) {
    try {
        const { rows } = await pool.query(
            `SELECT verse, fa_tpv, fa_mojdeh, fa_qadim, fa_wp FROM unified_bible_verses
             WHERE book_code=$1 AND chapter=$2 ORDER BY verse`,
            [book, ch]
        );
        const fa: Record<number, { fa_tpv: string; fa_mojdeh: string; fa_qadim: string; fa_wp: string }> = {};
        rows.forEach(r => {
            fa[r.verse] = {
                fa_tpv:    r.fa_tpv    || '',
                fa_mojdeh: r.fa_mojdeh || '',
                fa_qadim:  r.fa_qadim  || '',
                fa_wp:     r.fa_wp     || '',
            };
        });
        return fa;
    } catch (e: any) {
        console.warn('[Bible/DB] Persian load failed:', e.message);
        return {};
    }
}

// ─── Patch English into DB (non-blocking backup) ──────────────────────────────
function patchEnglishInDb(book: string, ch: number, enVerses: Record<number, string>) {
    pool.connect().then(async (client) => {
        try {
            for (const [vStr, text] of Object.entries(enVerses)) {
                if (!text) continue;
                await client.query(`
                    INSERT INTO unified_bible_verses (book_code, chapter, verse, en_kjv)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (book_code, chapter, verse)
                    DO UPDATE SET en_kjv = EXCLUDED.en_kjv
                `, [book, ch, parseInt(vStr), text]);
            }
        } catch (e: any) { console.warn('[Bible/DB] en patch:', e.message); }
        finally { client.release(); }
    }).catch(console.warn);
}

// ─── Main exported function ───────────────────────────────────────────────────
export async function fetchChapterData(bookCode: string, chapterNum: number): Promise<ChapterData | null> {
    const parsed = parseInt(bookCode, 10);
    const code   = (!isNaN(parsed) && parsed >= 1 && parsed <= 66)
        ? USFM[parsed - 1]
        : bookCode;

    const key = `${code}:${chapterNum}`;

    // ── 1. Memory cache ────────────────────────────────────────────────────────
    const mem = MEM.get(key);
    if (mem && mem.exp > Date.now()) {
        console.log(`[Bible] ⚡ cache: ${key}`);
        return mem.d;
    }

    // ── 2. Fetch in parallel: English from API + Persian from DB ──────────────
    console.log(`[Bible] 🌐+🗄️  Fetching ${code} ${chapterNum}...`);
    const [enRaw, faRaw] = await Promise.all([
        fetchEnglishVerses(code, chapterNum),
        loadPersianFromDb(code, chapterNum),
    ]);

    // Union of verse numbers from both sources
    const allNums = new Set([
        ...Object.keys(enRaw),
        ...Object.keys(faRaw),
    ].map(Number));

    if (allNums.size === 0) {
        console.error(`[Bible] No data for ${code} ${chapterNum}`);
        return null;
    }

    // Save English to DB for future backup (non-blocking)
    if (Object.keys(enRaw).length > 0) {
        patchEnglishInDb(code, chapterNum, enRaw);
    }

    const verses: UnifiedVerse[] = Array.from(allNums).sort((a, b) => a - b).map(n => {
        const fa = faRaw[n] || { fa_tpv: '', fa_mojdeh: '', fa_qadim: '', fa_wp: '' };
        return {
            number:    n,
            fa:        fa.fa_mojdeh || fa.fa_tpv || fa.fa_qadim || fa.fa_wp || '',
            en:        enRaw[n]  || '',
            fa_mojdeh: fa.fa_mojdeh || '',
            fa_tpv:    fa.fa_tpv    || '',
            fa_qadim:  fa.fa_qadim  || '',
            fa_wp:     fa.fa_wp     || '',
            start: 0, end: 0,
        };
    });

    const audioUrl = AUDIO_TPV(code, chapterNum);
    const result: ChapterData = {
        book: bookCode, chapter: chapterNum,
        audioUrl, tpvAudioUrl: audioUrl, mojdehAudioUrl: audioUrl, qadimAudioUrl: '',
        verses,
    };

    MEM.set(key, { d: result, exp: Date.now() + TTL });
    return result;
}
