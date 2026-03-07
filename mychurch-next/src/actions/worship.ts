"use server"
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface WorshipSong {
    id: string;
    title: { fa: string; en?: string };
    artist?: string;
    youtubeId?: string;
    audioUrl?: string;
    lyrics?: { fa?: string; en?: string };
    timepoints?: any[]; // Array of { word: string, start_time: number, end_time: number }
    createdAt?: string;
    updatedAt?: string;
}

// Maps a row from PostgreSQL to our frontend interface
function mapDbToSong(row: any): WorshipSong {
    return {
        id: row.id,
        title: { fa: row.title_fa, en: row.title_en || undefined },
        artist: row.artist || undefined,
        youtubeId: row.youtube_id || undefined,
        audioUrl: row.audio_url || undefined,
        lyrics: { fa: row.lyrics_fa || undefined, en: row.lyrics_en || undefined },
        timepoints: row.timepoints || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// Maps our frontend interface to a PostgreSQL row
function mapSongToDb(song: WorshipSong): any {
    return {
        // If it's a new song from UI, it might have a temporary 'temp-' id. Leave undefined for DB sequence
        id: song.id.startsWith('temp-') || song.id.startsWith('new-') ? undefined : song.id,
        title_fa: song.title.fa,
        title_en: song.title.en,
        artist: song.artist,
        youtube_id: song.youtubeId,
        audio_url: song.audioUrl,
        lyrics_fa: song.lyrics?.fa,
        lyrics_en: song.lyrics?.en,
        timepoints: song.timepoints || []
    };
}

export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('worship_songs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching worship songs:", error);
        return [];
    }

    return data.map(mapDbToSong);
}

export async function saveWorshipSong(song: WorshipSong) {
    const supabase = await createClient();
    const dbData = mapSongToDb(song);

    try {
        if (dbData.id) {
            // Update
            const { error } = await supabase.from('worship_songs').update(dbData).eq('id', dbData.id);
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase.from('worship_songs').insert(dbData);
            if (error) throw error;
        }
    } catch (error) {
        console.error("Error saving worship song:", error);
        throw new Error("Failed to save song");
    }

    revalidatePath('/admin/worship');
    revalidatePath('/broadcast/builder');
}

export async function deleteWorshipSong(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('worship_songs').delete().eq('id', id);
    if (error) {
        console.error("Error deleting worship song:", error);
        throw new Error("Failed to delete song");
    }

    revalidatePath('/admin/worship');
    revalidatePath('/broadcast/builder');
}
