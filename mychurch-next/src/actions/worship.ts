"use server";

import { Pool } from 'pg';
import { revalidatePath } from 'next/cache';

// Reusing same connection logic from the Bible action
const connectionString = 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, 
});

export interface WorshipSong {
    id: string; // Will map to mapping_id in DB
    title: { fa: string; en?: string };
    artist?: string;
    youtubeId?: string;
    audioUrl?: string;
    lyrics?: { fa?: string; en?: string };
    timepoints?: any[]; // Array of { word: string, start_time: number, end_time: number }
    createdAt?: string;
    updatedAt?: string;
}

// Maps our new unified structure to the frontend WorshipSong type
function mapUnifiedDbToSong(rows: any[]): WorshipSong[] {
    // The database has individual rows per lyric line per song.  
    // We group them by unique `mapping_id` to form a complete song structure.
    
    const songMap = new Map<string, any>();

    for (const row of rows) {
        if (!songMap.has(row.mapping_id)) {
            songMap.set(row.mapping_id, {
                id: row.mapping_id || row.id.toString(),
                title: { fa: row.title_fa || "سرود بدون نام", en: row.title_en || "" },
                artist: row.artist || "",
                youtubeId: row.youtube_id || "",
                audioUrl: row.audio_url || "",
                lyrics: { fa: "", en: "" }, // Will append below
                timepoints: [], // Format to match Apple Music Player: { word: string, start_time: number, end_time: number }
                createdAt: new Date().toISOString() // Temporary static date since it wasn't captured in scrape
            });
        }

        const song = songMap.get(row.mapping_id);

        // Append lyrics line by line using standard array joining later, or just string concatenation based on the UI expectation.
        // Frontend Apple UI expects \n breaks
        if (song.lyrics.fa && row.lyric_fa) song.lyrics.fa += "\n" + row.lyric_fa;
        else if (row.lyric_fa) song.lyrics.fa = row.lyric_fa;

        if (song.lyrics.en && row.lyric_en) song.lyrics.en += "\n" + row.lyric_en;
        else if (row.lyric_en) song.lyrics.en = row.lyric_en;

        // Map timepoints if they exist (From LRC parsing)
        if (row.start_time !== undefined && row.end_time !== undefined) {
             song.timepoints.push({
                 word: row.lyric_fa || row.lyric_en || "", // Apple player triggers off words usually, we'll map the whole line here
                 start_time: row.start_time,
                 end_time: row.end_time
             });
        }
    }

    return Array.from(songMap.values());
}

export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
    try {
        const query = `
            SELECT * FROM unified_worship_songs
            ORDER BY mapping_id ASC, line_order ASC;
        `;
        
        const { rows } = await pool.query(query);

        if (rows.length === 0) {
            console.warn(`[Worship Action DB] No worship songs found in PostgreSQL.`);
            return [];
        }

        return mapUnifiedDbToSong(rows);

    } catch (error) {
        console.error(`[Worship Action DB] Global error fetching songs:`, error);
        return [];
    }
}

// Note: Legacy save/delete Supabase logic removed since lyrics are now parsed directly from TSV sources globally. 
// If editing functionality is required later, it should insert/update line-by-line into unified_worship_songs.
export async function saveWorshipSong(song: WorshipSong) {
      console.warn("Saving to DB is currently disabled for Unified Worship Songs layout.");
      revalidatePath('/admin/worship');
      revalidatePath('/broadcast/builder');
}

export async function deleteWorshipSong(id: string) {
     console.warn("Deleting from DB is currently disabled for Unified Worship Songs layout.");
     revalidatePath('/admin/worship');
     revalidatePath('/broadcast/builder');
}
