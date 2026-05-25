"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/utils/rbac";

import { GoogleGenAI } from "@google/genai";

export interface WorshipSong {
    id: string;
    title_fa: string;
    title_en?: string;
    artist?: string;
    youtube_id?: string;
    audio_url?: string;
    lyrics_fa?: string;
    lyrics_en?: string;
    lyrics_finglish?: string;
    chords?: string;
    category?: string;
    likes_count?: number;
    timepoints?: Array<{ time: number; lyricFA: string; lyricEN?: string }>;
    timing_data?: import('@/types/worship-sync').SystemTimingV2 | null;
    is_verified?: boolean;
    audio_health_status?: 'ok' | 'broken' | 'unknown' | 'no_audio';
    audio_health_checked_at?: Date;
    audio_health_error?: string;
    created_at?: Date;
}

async function ensureWorshipManagementAccess() {
    await requireRole(["Admin", "Leader", "Operator"]);
}

export async function initializeWorshipDB() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS church_worship_songs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title_fa VARCHAR(255) NOT NULL,
                title_en VARCHAR(255),
                artist VARCHAR(255),
                youtube_id VARCHAR(255),
                audio_url VARCHAR(255),
                lyrics_fa TEXT,
                lyrics_en TEXT,
                lyrics_finglish TEXT,
                chords TEXT,
                category VARCHAR(255),
                likes_count INTEGER DEFAULT 0,
                timepoints JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_likes (
                user_id UUID,
                song_id UUID REFERENCES church_worship_songs(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (user_id, song_id)
            );
            
            ALTER TABLE church_worship_songs ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
            ALTER TABLE church_worship_songs ADD COLUMN IF NOT EXISTS timing_data JSONB;
        `);
        console.log('[Action] Worship DB initialized');
    } catch (e) {
        console.error('[Action] Error initializing Worship DB', e);
    }
}

export async function getWorshipSongs(): Promise<WorshipSong[]> {
    try {
        await initializeWorshipDB();
        const { rows } = await query("SELECT * FROM church_worship_songs ORDER BY title_fa ASC");
        return rows.map(r => ({ 
            ...r, 
            created_at: new Date(r.created_at),
            audio_health_checked_at: r.audio_health_checked_at ? new Date(r.audio_health_checked_at) : undefined,
            likes_count: r.likes_count || 0 
        }));
    } catch (e) {
        console.error('Error fetching worship songs', e);
        return [];
    }
}

export async function createWorshipSong(data: Partial<WorshipSong>): Promise<{ success: boolean; id?: string }> {
    await ensureWorshipManagementAccess();

    try {
        const { rows } = await query(
            `INSERT INTO church_worship_songs (title_fa, title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en, lyrics_finglish, chords, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [data.title_fa, data.title_en, data.artist, data.youtube_id, data.audio_url, data.lyrics_fa, data.lyrics_en, data.lyrics_finglish, data.chords, data.category]
        );
        revalidatePath('/worship');
        revalidatePath('/admin/worship');
        return { success: true, id: rows[0].id };
    } catch (e) {
        console.error('Error creating worship song', e);
        return { success: false };
    }
}

export async function updateWorshipSong(id: string, data: Partial<WorshipSong>): Promise<{ success: boolean }> {
    await ensureWorshipManagementAccess();

    try {
        await query(
            `UPDATE church_worship_songs 
             SET title_fa = $1, title_en = $2, artist = $3, youtube_id = $4, audio_url = $5, lyrics_fa = $6, lyrics_en = $7, lyrics_finglish = $8, chords = $9, category = $10, timepoints = $11
             WHERE id = $12`,
            [data.title_fa, data.title_en, data.artist, data.youtube_id, data.audio_url, data.lyrics_fa, data.lyrics_en, data.lyrics_finglish, data.chords, data.category, data.timepoints ? JSON.stringify(data.timepoints) : null, id]
        );
        revalidatePath('/worship');
        revalidatePath('/admin/worship');
        return { success: true };
    } catch (e) {
        console.error('Error updating worship song', e);
        return { success: false };
    }
}

export async function deleteWorshipSong(id: string): Promise<{ success: boolean }> {
    await ensureWorshipManagementAccess();

    try {
        await query(`DELETE FROM church_worship_songs WHERE id = $1`, [id]);
        revalidatePath('/worship');
        revalidatePath('/admin/worship');
        return { success: true };
    } catch (e) {
        console.error('Error deleting worship song', e);
        return { success: false };
    }
}

export async function toggleSongVerification(id: string, isVerified: boolean): Promise<{ success: boolean; message?: string }> {
    await ensureWorshipManagementAccess();

    try {
        await query("UPDATE church_worship_songs SET is_verified = $1 WHERE id = $2", [isVerified, id]);
        revalidatePath('/worship');
        revalidatePath('/admin/worship');
        return { success: true };
    } catch (e: any) {
        console.error('Error toggling song verification', e);
        return { success: false, message: e.message };
    }
}


export async function toggleLikeWorshipSong(songId: string, userId: string): Promise<{ success: boolean; liked: boolean; count: number }> {
    try {
        const { rows: existingLike } = await query(
            "SELECT 1 FROM user_likes WHERE user_id = $1 AND song_id = $2",
            [userId, songId]
        );

        if (existingLike.length > 0) {
            await query("DELETE FROM user_likes WHERE user_id = $1 AND song_id = $2", [userId, songId]);
            const { rows } = await query(
                "UPDATE church_worship_songs SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1 RETURNING likes_count",
                [songId]
            );
            revalidatePath('/worship');
            return { success: true, liked: false, count: rows[0].likes_count || 0 };
        } else {
            await query("INSERT INTO user_likes (user_id, song_id) VALUES ($1, $2)", [userId, songId]);
            const { rows } = await query(
                "UPDATE church_worship_songs SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count",
                [songId]
            );
            revalidatePath('/worship');
            return { success: true, liked: true, count: rows[0].likes_count || 0 };
        }
    } catch (e) {
        console.error('Error toggling like', e);
        return { success: false, liked: false, count: 0 };
    }
}

export async function extractWorshipSongAI(id: string): Promise<{ success: boolean; message?: string }> {
    await ensureWorshipManagementAccess();

    console.log(`[AI-Wizard] Starting extraction for ID: ${id}`);
    try {
        const { rows } = await query("SELECT * FROM church_worship_songs WHERE id = $1", [id]);
        const song: WorshipSong = rows[0];
        if (!song) {
            console.error(`[AI-Wizard] Song not found for ID: ${id}`);
            return { success: false, message: "سرود یافت نشد" };
        }
        if (!song.lyrics_fa) {
            console.error(`[AI-Wizard] Missing lyrics_fa for song: ${id}`);
            return { success: false, message: "متن فارسی یافت نشد" };
        }
        
        console.log(`[AI-Wizard] Processing song: ${song.title_fa}`);
        const { getAIConfig } = await import("./ai-config");
        const aiConfig = await getAIConfig();
        const apiKey = process.env.GEMINI_API_KEY || aiConfig.gemini_api_key;
        if (!apiKey) throw new Error("Gemini API key not configured.");
        
        console.log(`[AI-Wizard] Initializing Unified GoogleGenAI SDK...`);
        const genAI = new GoogleGenAI({ apiKey });

        let audioPart = null;
        if (song.audio_url) {
            try {
                const fs = require('fs');
                const path = require('path');
                let filePath = song.audio_url;
                
                // Resolve common URL patterns to local paths
                if (filePath.startsWith('/api/serve/')) {
                    const filename = filePath.split('/').pop();
                    filePath = path.join(process.cwd(), 'public', 'uploads', filename);
                } else if (filePath.startsWith('/')) {
                    filePath = path.join(process.cwd(), 'public', filePath);
                }

                if (fs.existsSync(filePath)) {
                    console.log(`[AI-Wizard] Uploading local audio to Gemini API: ${filePath}`);
                    let mimeType = "audio/mpeg";
                    if (filePath.endsWith('.m4a')) mimeType = "audio/mp4";
                    else if (filePath.endsWith('.ogg')) mimeType = "audio/ogg";
                    
                    const uploadResult = await genAI.files.upload({ file: filePath, config: { mimeType } });
                    audioPart = {
                        fileData: {
                            fileUri: uploadResult.uri,
                            mimeType: uploadResult.mimeType || mimeType
                        }
                    };
                } else if (filePath.startsWith('http')) {
                    const safeUrl = encodeURI(decodeURI(filePath));
                    console.log(`[AI-Wizard] Fetching external audio: ${safeUrl}`);
                    const res = await fetch(safeUrl);
                    if (res.ok) {
                        const buffer = await res.arrayBuffer();
                        const tempPath = path.join(process.cwd(), 'tmp', `temp_audio_${Date.now()}.mp3`);
                        if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) fs.mkdirSync(path.join(process.cwd(), 'tmp'));
                        fs.writeFileSync(tempPath, Buffer.from(buffer));
                        
                        console.log(`[AI-Wizard] Uploading downloaded audio to Gemini API...`);
                        const uploadResult = await genAI.files.upload({ file: tempPath, config: { mimeType: "audio/mpeg" } });
                        audioPart = {
                            fileData: {
                                fileUri: uploadResult.uri,
                                mimeType: uploadResult.mimeType || "audio/mpeg"
                            }
                        };
                        fs.unlinkSync(tempPath);
                    }
                }
            } catch (e) {
                console.error("[AI-Wizard] Audio read/upload error", e);
            }
        }

        const prompt = `
            Analyze this Farsi worship song and provide structured metadata and precise timing.
            
            OUTPUT FORMAT (JSON):
            {
              "lyrics_fa_clean": "Clean Farsi lyrics without chords/labels",
              "lyrics_finglish_clean": "Full Latin transliteration",
              "translation_en": "Full English translation",
              "chords": "Standard chords if detectable",
              "category": "Main theme (Worship, Praise, etc.)",
              "compact_timing_data": {
                "songId": "${id}",
                "totalDuration": 0, 
                "lines": [
                  [
                    "FARSI VERSION OF LINE",
                    "FINGLISH VERSION",
                    "English translation",
                    0.00, // start time
                    0.00, // end time
                    [
                       ["FARSIWORD", 0.00, 0.00]
                    ]
                  ]
                ]
              }
            };

            STRICT MAPPING RULES:
            - You MUST USE THIS COMPACT ARRAY FORMAT for lines and words to save space. Do NOT use object keys for lines and words!
            - lines[]: [ farsi_line, finglish_line, english_line, start_time, end_time, words_array ]
            - words[]: [ farsi_word, start_time, end_time ]
            - NO EXTRA TEXT. JUST THE MINIFIED JSON.
        
            Song Title: "${song.title_fa}"
            Farsi Lyrics Reference:
            ${song.lyrics_fa}
        `;

        const parts: any[] = [{ text: prompt }];
        if (audioPart) parts.push(audioPart);

        let responseText = "";
        
        try {
            const modelName = 'gemini-2.0-flash';
            console.log(`[AI-Wizard] Mode: Google AI Studio`);
            console.log(`[AI-Wizard] Calling ${modelName}...`);
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: parts,
                config: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 8192,
                }
            });
            responseText = response.text || "";
        } catch (e: any) {
            console.error("[AI-Wizard] AI SDK failed:", e);
            throw new Error(`AI SDK Data Issue: ${e.message || 'Unknown'}`);
        }

        if (!responseText) throw new Error("No output returned from AI");
        let aiData;
        try {
            // More robust stripping of markdown and extra whitespace
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
            if (cleanedText.startsWith('```')) cleanedText = cleanedText.substring(3);
            if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            cleanedText = cleanedText.trim();
            aiData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("[AI-Wizard] JSON Parse Error. Writing raw response to tmp/raw_ai_output.json");
            const fs = await import('fs');
            fs.writeFileSync('tmp/raw_ai_output.json', responseText);
            throw e;
        }

        let timingData = null;
        if (aiData.compact_timing_data && Array.isArray(aiData.compact_timing_data.lines)) {
            timingData = {
                songId: aiData.compact_timing_data.songId,
                version: "2.0",
                totalDuration: aiData.compact_timing_data.totalDuration || 0,
                lines: aiData.compact_timing_data.lines.filter((l: any) => Array.isArray(l)).map((l: any) => ({
                    line: l[0],
                    start: l[3],
                    end: l[4],
                    translations: {
                        finglish: l[1],
                        english: l[2]
                    },
                    words: (l[5] || []).filter((w: any) => Array.isArray(w)).map((w: any, index: number) => {
                        // Estimate finglish word by splitting the lines finglish version by space,
                        // this isn't perfect but saves massive tokens from the AI.
                        const finglishWords = l[1] ? l[1].split(' ') : [];
                        return {
                            word: w[0],
                            finglish: finglishWords[index] || null,
                            start: w[1],
                            end: w[2]
                        };
                    })
                }))
            };
        } else {
            timingData = aiData.timing_data || null;
        }

        console.log(`[AI-Wizard] Updating DB for ${song.title_fa}...`);
        
        let finalLyricsFa = aiData.lyrics_fa_clean || aiData.lyrics_fa || song.lyrics_fa;
        let finalLyricsFinglish = aiData.lyrics_finglish_clean || aiData.lyrics_finglish || song.lyrics_finglish;
        let finalTranslationEn = aiData.translation_en || aiData.lyrics_en || song.lyrics_en;
        let finalChords = aiData.chords || song.chords;
        let finalCategory = aiData.category || song.category;
        
        // Prevent accidental overwrite of confirmed data
        if (song.is_verified) {
            console.log(`[AI-Wizard] Song is verified. Skiping text fields overwrite, only applying timing_data.`);
            finalLyricsFa = song.lyrics_fa || '';
            finalLyricsFinglish = song.lyrics_finglish || '';
            finalTranslationEn = song.lyrics_en || '';
            finalChords = song.chords || '';
            finalCategory = song.category || '';
        }

        await query(`
            UPDATE church_worship_songs
            SET lyrics_fa = $1,
                lyrics_finglish = $2,
                lyrics_en = $3,
                chords = $4,
                category = $5,
                timing_data = $6
            WHERE id = $7
        `, [
            finalLyricsFa,
            finalLyricsFinglish,
            finalTranslationEn,
            finalChords,
            finalCategory,
            timingData ? JSON.stringify(timingData) : null,
            id
        ]);
        try {
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/worship');
        } catch (e: any) {
            console.log("[AI-Wizard] Skipped revalidatePath (likely running in standalone script)");
        }
        
        return { success: true };
    } catch (error: any) {
        console.error('[AI-Wizard] Error extractWorshipSongAI:', error);
        return { success: false, message: error.message };
    }
}

export async function getWorshipEnrichmentStats() {
    await ensureWorshipManagementAccess();

    try {
        const { rows } = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE audio_url IS NULL OR audio_url = '') as missing_audio,
                COUNT(*) FILTER (WHERE lyrics_fa IS NULL OR lyrics_fa = '') as missing_lyrics,
                COUNT(*) FILTER (WHERE timing_data IS NULL OR (timing_data::text = '{}' OR timing_data::text = 'null')) as missing_timing
            FROM church_worship_songs
        `);
        return rows[0];
    } catch (e) {
        console.error('Error fetching enrichment stats', e);
        return { total: 0, missing_audio: 0, missing_lyrics: 0, missing_timing: 0 };
    }
}

export async function scanMissingAudio() {
    await ensureWorshipManagementAccess();

    try {
        const fs = require('fs');
        const path = require('path');
        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        
        if (!fs.existsSync(audioDir)) return { success: false, message: "پوشه صوتی یافت نشد" };
        
        const files = fs.readdirSync(audioDir).filter((f: string) => f.endsWith('.mp3') || f.endsWith('.m4a'));
        const { rows: songs } = await query("SELECT id, title_fa FROM church_worship_songs WHERE audio_url IS NULL OR audio_url = ''");
        
        const suggestions: Array<{ songId: string; title: string; fileName: string; score: number }> = [];
        
        // Simple fuzzy matching
        for (const song of songs) {
            const cleanTitle = song.title_fa.replace(/[0-9]/g, '').trim();
            for (const file of files) {
                const cleanFile = file.replace(/[0-9]/g, '').replace('.mp3', '').replace('.m4a', '').trim();
                if (cleanFile.includes(cleanTitle) || cleanTitle.includes(cleanFile)) {
                    suggestions.push({
                        songId: song.id,
                        title: song.title_fa,
                        fileName: file,
                        score: 0.8 // Rough match
                    });
                    break; // Take first match for now
                }
            }
        }
        
        return { success: true, suggestions };
    } catch (e: any) {
        console.error('Error scanning audio', e);
        return { success: false, message: e.message };
    }
}

export async function linkWorshipAudio(songId: string, fileName: string) {
    await ensureWorshipManagementAccess();

    try {
        const audioUrl = `/worship/audio/kalameh/${fileName}`;
        await query("UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2", [audioUrl, songId]);
        revalidatePath('/admin/worship');
        return { success: true };
    } catch (e: any) {
        console.error('Error linking audio', e);
        return { success: false, message: e.message };
    }
}
