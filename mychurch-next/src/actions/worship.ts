"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    created_at?: Date;
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
            likes_count: r.likes_count || 0 
        }));
    } catch (e) {
        console.error('Error fetching worship songs', e);
        return [];
    }
}

export async function createWorshipSong(data: Partial<WorshipSong>): Promise<{ success: boolean; id?: string }> {
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

export async function toggleLikeWorshipSong(songId: string, userId: string): Promise<{ success: boolean; liked: boolean; count: number }> {
    try {
        const { rows: existingLike } = await query(
            "SELECT 1 FROM user_likes WHERE user_id = $1 AND song_id = $2",
            [userId, songId]
        );

        if (existingLike.length > 0) {
            await query("DELETE FROM user_likes WHERE user_id = $1 AND song_id = $2", [userId, songId]);
            const { rows } = await query(
                "UPDATE worship_songs SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1 RETURNING likes_count",
                [songId]
            );
            revalidatePath('/worship');
            return { success: true, liked: false, count: rows[0].likes_count || 0 };
        } else {
            await query("INSERT INTO user_likes (user_id, song_id) VALUES ($1, $2)", [userId, songId]);
            const { rows } = await query(
                "UPDATE worship_songs SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count",
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
    console.log(`[AI-Wizard] Starting extraction for ID: ${id}`);
    try {
        const { rows } = await query("SELECT * FROM church_worship_songs WHERE id = $1", [id]);
        const song = rows[0];
        if (!song) {
            console.error(`[AI-Wizard] Song not found for ID: ${id}`);
            return { success: false, message: "سرود یافت نشد" };
        }
        if (!song.lyrics_fa) {
            console.error(`[AI-Wizard] Missing lyrics_fa for song: ${id}`);
            return { success: false, message: "متن فارسی یافت نشد" };
        }
        
        console.log(`[AI-Wizard] Processing song: ${song.title_fa}`);
        let audioPart = null;
        if (song.audio_url) {
            try {
                const fs = require('fs');
                const path = require('path');
                let filePath = song.audio_url;
                if (filePath.startsWith('/')) {
                    filePath = path.join(process.cwd(), 'public', filePath);
                }
                if (fs.existsSync(filePath)) {
                    const audioBuffer = fs.readFileSync(filePath);
                    const base64Audio = audioBuffer.toString('base64');
                    let mimeType = "audio/mpeg";
                    if (filePath.endsWith('.m4a')) mimeType = "audio/mp4";
                    else if (filePath.endsWith('.ogg')) mimeType = "audio/ogg";
                    
                    audioPart = {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Audio
                        }
                    };
                } else if (filePath.startsWith('http')) {
                    // Fetch external audio if it's a full URL
                    const safeUrl = encodeURI(decodeURI(filePath));
                    console.log(`[AI-Wizard] Fetching external audio: ${safeUrl}`);
                    const res = await fetch(safeUrl);
                    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
                    
                    const buffer = await res.arrayBuffer();
                    const base64Audio = Buffer.from(buffer).toString('base64');
                    audioPart = {
                        inlineData: {
                            mimeType: "audio/mpeg", // Assumption
                            data: base64Audio
                        }
                    };
                }
            } catch (e) {
                console.error("Audio read error", e);
            }
        }

        const { getAIConfig } = await import("./ai-config");
        const aiConfig = await getAIConfig();

        const prompt = `
            Analyze this worship song in depth and extract structured data.
            CRITICAL REQUIREMENTS:
            1. Transcribe the audio (if present) and align it with the provided Persian lyrics.
            2. Group words into natural lyric lines/stanzas in the 'lines' array. Set type to 'lyric'.
            3. For EVERY line, provide:
               - 'persian': Exact Persian/Farsi lyrics (CLEAN - no chords, no labels like [Verse]).
               - 'english': Accurate English translation.
               - 'finglish': Transliterate the Persian lyrics to Finglish (Latin alphabet) for pronunciation.
            4. Provide highly accurate timestamps for every single word in the 'words' array, down to the hundredth of a second (0.01s).
            5. The 'content' field should contain the Finglish version for primary identification.
            6. Identify song structure (Verses, Chorus, Bridge) and mark lines accordingly if possible.
            7. Also provide:
               - 'lyrics_fa_clean': The entire Persian lyrics, formatted nicely, with NO chords or extra characters.
               - 'lyrics_finglish_clean': The entire Finglish version of the Persian lyrics (Latin alphabet transliteration).
               - 'translation_en': Full English translation.
               - 'chords': Standard worship chords (only if detectable).
               - 'category': The main theme (e.g. Worship, Praise, Cross, Grace, Holy Spirit).
               - 'musical_metadata': Any detected tempo (BPM), key, or mood (e.g. "Slow Worship", "Upbeat Praise").
        
            Song Title: "${song.title_fa}"
            Farsi Lyrics Reference:
            ${song.lyrics_fa}
        `;

        const parts: any[] = [{ text: prompt }];
        if (audioPart) parts.unshift(audioPart);

        let responseText = "";
        
        if (aiConfig.active_provider === 'vertex' && aiConfig.vertex_project_id) {
            console.log(`[AI-Wizard] Calling Vertex AI (Project: ${aiConfig.vertex_project_id})`);
            const { VertexAI } = await import('@google-cloud/vertexai');
            const vertexAI = new VertexAI({
                project: aiConfig.vertex_project_id,
                location: aiConfig.vertex_region || 'us-central1',
                googleAuthOptions: {
                    credentials: aiConfig.vertex_service_account
                }
            });
            const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts }]
            });
            const response = await result.response;
            responseText = response.candidates?.[0].content.parts[0].text || "";
        } else {
            console.log(`[AI-Wizard] Calling Gemini AI Studio (Standard fallback)`);
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const apiKey = aiConfig.gemini_api_key || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key not configured in settings or env.");
            const genAI = new GoogleGenerativeAI(apiKey);
            
            const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
            for (const modelName of modelNames) {
                try {
                    console.log(`[AI-Wizard] Attempting ${modelName}...`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(parts);
                    responseText = result.response.text();
                    if (responseText) break;
                } catch (e: any) {
                    if (e.message?.includes('429')) {
                        console.warn(`[AI-Wizard] ${modelName} quota hit, trying next...`);
                        continue;
                    }
                    throw e;
                }
            }
        }

        if (!responseText) throw new Error("No output returned from AI");
        
        const aiData = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

        console.log(`[AI-Wizard] AI returned data. Updating DB...`);
        await query(`
            UPDATE church_worship_songs
            SET lyrics_fa = $1,
                lyrics_finglish = CASE WHEN lyrics_finglish IS NULL OR lyrics_finglish = '' THEN $2 ELSE lyrics_finglish END,
                lyrics_en = CASE WHEN lyrics_en IS NULL OR lyrics_en = '' THEN $3 ELSE lyrics_en END,
                chords = CASE WHEN chords IS NULL OR chords = '' THEN $4 ELSE chords END,
                category = CASE WHEN category IS NULL OR category = '' THEN $5 ELSE category END,
                timing_data = CASE WHEN timing_data IS NULL OR (timing_data::text = '{}' OR timing_data::text = 'null') THEN $6 ELSE timing_data END
            WHERE id = $7
        `, [
            aiData.lyrics_fa_clean || aiData.lyrics_fa || null,
            aiData.lyrics_finglish_clean || aiData.lyrics_finglish || null,
            aiData.translation_en || aiData.lyrics_en || null,
            aiData.chords || null,
            aiData.category || null,
            aiData.timing_data ? JSON.stringify(aiData.timing_data) : null,
            id
        ]);
        
        console.log(`[AI-Wizard] Successfully updated song: ${song.title_fa}`);        
        revalidatePath('/worship');
        revalidatePath('/admin/worship');
        return { success: true };
    } catch (e: any) {
        console.error('Error extracting worship AI', e);
        return { success: false, message: e.message };
    }
}

export async function getWorshipEnrichmentStats() {
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
