"use server";

/**
 * Bible data service — Hybrid strategy
 *
 * Strategy:
 *  1. ⚡ Memory cache (ultra-fast, 24h TTL)
 *  2. 🌐 YouVersion REST API → BSB English (always fresh)
 *  3. 🗄️  PostgreSQL → Persian translations (MOJDEH, TPV, QADIM, WP)
 *  4. 💾  Auto-patches English into DB for future fallback
 */

import { Pool } from 'pg';
import { INITIAL_BIBLE_BOOKS } from '@/lib/bibleData';

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

// BSB = Berean Standard Bible (ID 3034) - open license, excellent modern translation
const BSB_ID = 3034;
const YV_APP_KEY = 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834';

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

// ─── Fetch English chapter from YouVersion REST API (no SDK) ────────────────
async function fetchEnglishVerses(bookCode: string, ch: number): Promise<Record<number, string>> {
    try {
        // Fetch via direct REST API call — no SDK dependency required
        const apiRes = await fetch(
            `https://nodejs.bible.com/api/bible/passage?id=${BSB_ID}&reference=${bookCode}.${ch}&format=html`,
            { headers: { 'X-YouVersion-App-Platform': 'web', 'X-YouVersion-App-Key': YV_APP_KEY } }
        );
        if (!apiRes.ok) return {};
        const apiJson = await apiRes.json().catch(() => null);
        const html: string = apiJson?.html || apiJson?.content || '';
        if (!html) return {};

        // Parse verse spans from YouVersion HTML — format: <span v="N">text</span>
        const verseMap: Record<number, string> = {};
        const verseRegex = /v="(\d+)"[^>]*>([\s\S]*?)(?=v="\d+"|<\/div>|$)/g;
        let match;
        while ((match = verseRegex.exec(html)) !== null) {
            const vNum = parseInt(match[1]);
            const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (text && vNum > 0) verseMap[vNum] = text;
        }

        return verseMap;
    } catch (e: any) {
        console.warn(`[Bible/BSB] ${bookCode}:${ch} — ${e.message}`);
        return {};
    }
}


export async function initBibleSyncColumns() {
    try {
        await pool.query(`
            ALTER TABLE unified_bible_verses 
            ADD COLUMN IF NOT EXISTS audio_start FLOAT, 
            ADD COLUMN IF NOT EXISTS audio_end FLOAT;
        `);
        console.log('[Bible/DB] Sync columns verified.');
    } catch (e) {
        console.error('[Bible/DB] Error verifying sync columns:', e);
    }
}

// ─── Load Persian translations from local DB ──────────────────────────────────
async function loadPersianFromDb(book: string, ch: number) {
    try {
        const { rows } = await pool.query(
            `SELECT verse, fa_tpv, fa_mojdeh, fa_qadim, fa_wp, en_kjv, audio_start, audio_end FROM unified_bible_verses
             WHERE book_code=$1 AND chapter=$2 ORDER BY verse`,
            [book, ch]
        );
        const fa: Record<number, { fa_tpv: string; fa_mojdeh: string; fa_qadim: string; fa_wp: string; en_kjv: string; audio_start: number; audio_end: number; }> = {};
        rows.forEach(r => {
            fa[r.verse] = {
                fa_tpv:    r.fa_tpv    || '',
                fa_mojdeh: r.fa_mojdeh || '',
                fa_qadim:  r.fa_qadim  || '',
                fa_wp:     r.fa_wp     || '',
                en_kjv:    r.en_kjv    || '',
                audio_start: r.audio_start || 0,
                audio_end:   r.audio_end || 0,
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
    const normalizedBook = (bookCode || '').trim();
    const parsed = parseInt(normalizedBook, 10);

    let code: string;
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 66) {
        code = USFM[parsed - 1];
    } else {
        const upper = normalizedBook.toUpperCase();
        if (USFM.includes(upper)) {
            code = upper;
        } else {
            const index = INITIAL_BIBLE_BOOKS.findIndex((book) =>
                book.key.toLowerCase() === normalizedBook.toLowerCase() ||
                book.name.en.toLowerCase() === normalizedBook.toLowerCase() ||
                book.name.fa === normalizedBook
            );
            code = index >= 0 ? USFM[index] : upper;
        }
    }

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
        const fa = faRaw[n] || { fa_tpv: '', fa_mojdeh: '', fa_qadim: '', fa_wp: '', en_kjv: '', audio_start: 0, audio_end: 0 };
        return {
            number:    n,
            fa:        fa.fa_mojdeh || fa.fa_tpv || fa.fa_qadim || fa.fa_wp || '',
            en:        enRaw[n] || fa.en_kjv || '',
            fa_mojdeh: fa.fa_mojdeh || '',
            fa_tpv:    fa.fa_tpv    || '',
            fa_qadim:  fa.fa_qadim  || '',
            fa_wp:     fa.fa_wp     || '',
            start:     fa.audio_start || 0, 
            end:       fa.audio_end || 0,
        };
    });

    const audioUrl = AUDIO_TPV(code, chapterNum);
    const result: ChapterData = {
        book: normalizedBook || code, chapter: chapterNum,
        audioUrl, tpvAudioUrl: audioUrl, mojdehAudioUrl: audioUrl, qadimAudioUrl: '',
        verses,
    };

    MEM.set(key, { d: result, exp: Date.now() + TTL });
    return result;
}

// ─── Gemini Multimodal AI Auto-Sync ───────────────────────────────────────────
export async function syncBibleChapterAudioAI(bookCode: string, chapterNum: number): Promise<{ success: boolean; message?: string }> {
    try {
        await initBibleSyncColumns();

        // 1. Fetch chapter text from DB
        const textVerseMap = await loadPersianFromDb(bookCode, chapterNum);
        if (Object.keys(textVerseMap).length === 0) {
            return { success: false, message: "هیچ متنی برای این باب در دیتابیس یافت نشد." };
        }

        // Construct a structured prompt representing the chapter
        let chapterText = "";
        const verseKeys = Object.keys(textVerseMap).map(Number).sort((a, b) => a - b);
        for (const vNum of verseKeys) {
            const vObj = textVerseMap[vNum];
            const textFa = vObj.fa_mojdeh || vObj.fa_tpv || vObj.fa_qadim || vObj.fa_wp || "";
            if (textFa) {
                chapterText += `[Verse ${vNum}] ${textFa}\n`;
            }
        }

        // 2. Fetch the actual Audio file via WebDAV URL (TPV version)
        const audioUrl = AUDIO_TPV(bookCode, chapterNum);
        console.log(`[Bible Sync] Downloading Audio from WebDAV: ${audioUrl}`);
        
        let audioBase64 = "";
        try {
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) throw new Error("Audio file not found or inaccessible (404/403)");
            const arrayBuffer = await audioRes.arrayBuffer();
            audioBase64 = Buffer.from(arrayBuffer).toString('base64');
        } catch (downloadErr: any) {
            console.error("[Bible Sync] Audio Download Failed", downloadErr);
            return { success: false, message: "فایل صوتی این باب در سرور WebDAV وجود ندارد یا قابل دانلود نیست." };
        }

        // 3. Ping Gemini 2.5 Flash API via REST
        const promptText = `
Transcribe this Bible reading.
Analyze the structure carefully based on the provided text references:
1. If you detect a Book Title, create a line with type 'book_title'.
2. If you detect a Chapter Title, create a line with type 'chapter_title'.
3. For Verses, create a line with type 'verse'. IMPORTANT: Extract the exact verse number (e.g., '1', '12') and put it in the 'label' field.
4. For general text, use type 'text'.

Group words into these structural lines.
CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), to ensure perfect synchronization with the audio.

Text Reference to match against:
${chapterText}

Respond strictly in valid JSON format matching this schema:
{
  "lines": [
    {
      "type": "verse",
      "label": "1",
      "content": "در آغاز، خدا آسمان‌ها و زمین را آفرید.",
      "words": [
        { "word": "در", "start_time": 0.5, "end_time": 0.8 },
        { "word": "آغاز", "start_time": 0.81, "end_time": 1.2 }
      ]
    }
  ]
}
NO MARKDOWN. JUST RAW JSON.
        `;

        const body = {
            contents: [{ 
                role: "user", 
                parts: [
                    { inlineData: { mimeType: "audio/mpeg", data: audioBase64 } },
                    { text: promptText }
                ] 
            }],
            generationConfig: { temperature: 0.1 } 
        };

        const DIRECT_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IpDe6-VgR8OumktCUPuVVPR015eoQRIjC8gAFaarcYSw';
        const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${DIRECT_API_KEY}`;

        console.log(`[Bible Sync] Pinging Gemini 2.5 Flash...`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
             console.error("[Bible Sync] Gemini API Error:", errText);
             return { success: false, message: "خطا در ارتباط با هوش مصنوعی گوگل." };
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
             return { success: false, message: "هوش مصنوعی دیتایی برنگرداند." };
        }

        let cleanJson = data.candidates[0].content.parts[0].text.trim();
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
        if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
        if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

        const aiData = JSON.parse(cleanJson);
        const lines = aiData.lines;

        if (!lines || !Array.isArray(lines)) {
            return { success: false, message: "ساختار JSON برگشتی معتبر نیست." };
        }

        // 4. Update the Database
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            let updatedCount = 0;
            for (const line of lines) {
                if (line.type === 'verse' && line.label) {
                    const vNum = parseInt(line.label, 10);
                    if (!isNaN(vNum) && line.words && line.words.length > 0) {
                        const start = line.words[0].start_time;
                        const end = line.words[line.words.length - 1].end_time;
                        
                        await client.query(`
                            UPDATE unified_bible_verses
                            SET audio_start = $1, audio_end = $2
                            WHERE book_code = $3 AND chapter = $4 AND verse = $5
                        `, [start, end, bookCode, chapterNum, vNum]);
                        
                        updatedCount++;
                    }
                }
            }
            
            await client.query('COMMIT');
            
            // Invalidate Memory Cache for this chapter
            MEM.delete(`${bookCode}:${chapterNum}`);
            
            console.log(`[Bible Sync] Successfully synced ${updatedCount} verses for ${bookCode} ${chapterNum}.`);
            return { success: true, message: `تایم لاین صوتی ${updatedCount} آیه با موفقیت ثبت شد.` };
            
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (e: any) {
        console.error('[Bible Sync] Error:', e);
        return { success: false, message: `خطای سرور: ${e.message}` };
    }
}
