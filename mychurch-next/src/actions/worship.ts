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
    chords?: string;
    timepoints?: Array<{ time: number; lyricFA: string; lyricEN?: string }>;
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
                chords TEXT,
                timepoints JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        return rows.map(r => ({ ...r, created_at: new Date(r.created_at) }));
    } catch (e) {
        console.error('Error fetching worship songs', e);
        // Fallback for UI skeleton testing
        return [{
            id: 'mock-1',
            title_fa: 'عیسی نام تو',
            title_en: 'Jesus Your Name',
            artist: 'گروه پرستش',
            lyrics_fa: 'عیسی نام تو زیباست\nآرامش بخش جانهاست'
        }];
    }
}

export async function createWorshipSong(data: Partial<WorshipSong>): Promise<{ success: boolean; id?: string }> {
    try {
        const { rows } = await query(
            `INSERT INTO church_worship_songs (title_fa, title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en, chords, timepoints)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [data.title_fa, data.title_en, data.artist, data.youtube_id, data.audio_url, data.lyrics_fa, data.lyrics_en, data.chords, data.timepoints ? JSON.stringify(data.timepoints) : null]
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
             SET title_fa = $1, title_en = $2, artist = $3, youtube_id = $4, audio_url = $5, lyrics_fa = $6, lyrics_en = $7, chords = $8, timepoints = $9
             WHERE id = $10`,
            [data.title_fa, data.title_en, data.artist, data.youtube_id, data.audio_url, data.lyrics_fa, data.lyrics_en, data.chords, data.timepoints ? JSON.stringify(data.timepoints) : null, id]
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

export async function extractWorshipSongAI(id: string): Promise<{ success: boolean; message?: string }> {
    try {
        const { rows } = await query("SELECT * FROM church_worship_songs WHERE id = $1", [id]);
        const song = rows[0];
        if (!song || !song.lyrics_fa) return { success: false, message: "متن فارسی یافت نشد" };

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
                }
            } catch (e) {
                console.error("Audio read error", e);
            }
        }

        const promptText = `
You are a bilingual worship pastor and expert in music theory. I will provide you with the Farsi lyrics of a Persian worship song.
Please provide the following data based strictly on the provided Farsi lyrics:
1. "translation_en": An accurate and poetic English translation of the entire song.
2. "chords": Typical standard worship guitar/piano chords that fit this song.
3. "category": Identify the main biblical theme.
4. "timepoints": For Karaoke synchronicity, create a JSON array mapping EACH WORD from the Farsi lyrics to an exact time point (in seconds). ${audioPart ? 'Please listen to the provided audio file to align this perfectly.' : 'Since no audio is provided, estimate based on a standard 120 BPM flowing worship song.'}
    Output array format: [{ "time": 0.0, "word": "word1" }]. Cover at least 20 words.

Song Title: "${song.title_fa}"
Farsi Lyrics:
${song.lyrics_fa.substring(0, 1000)}

Respond strictly in valid JSON format matching this schema:
{"translation_en": "...", "chords": "...", "category": "...", "timepoints": [{"time": 1.2, "word": "word1"}]}
NO MARKDOWN. JUST RAW JSON.
`;

        const parts: any[] = [{ text: promptText }];
        if (audioPart) parts.unshift(audioPart);

        const body = {
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.2 } // Lower temperature for timing accuracy
        };

        const DIRECT_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IpDe6-VgR8OumktCUPuVVPR015eoQRIjC8gAFaarcYSw';
        const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${DIRECT_API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        if (!data.candidates) throw new Error("No output returned");
        const responseText = data.candidates[0].content.parts[0].text.trim();
        
        let cleanJson = responseText;
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
        if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
        if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
        
        const aiData = JSON.parse(cleanJson);

        await query(`
            UPDATE church_worship_songs
            SET lyrics_en = COALESCE(lyrics_en, $1),
                chords = COALESCE(chords, $2),
                category = COALESCE(category, $3),
                timepoints = COALESCE(timepoints, $4)
            WHERE id = $5
        `, [
            aiData.translation_en || null,
            aiData.chords || null,
            aiData.category || null,
            aiData.timepoints ? JSON.stringify(aiData.timepoints) : null,
            id
        ]);
        
        revalidatePath('/worship');
        revalidatePath('/admin/worship');

        return { success: true };
    } catch (e: any) {
        console.error('Error extracting worship AI', e);
        return { success: false, message: e.message };
    }
}
