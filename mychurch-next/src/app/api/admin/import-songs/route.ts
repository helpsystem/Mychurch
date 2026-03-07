import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { songs } = await req.json();

        if (!Array.isArray(songs) || songs.length === 0) {
            return NextResponse.json({ error: "No songs provided" }, { status: 400 });
        }

        const rows = songs.map((song: any) => ({
            title_fa: (song.title?.fa || song.title_fa || '(بدون نام)').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim(),
            title_en: (song.title?.en || song.title_en || '').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim() || null,
            artist: (song.artist || '').trim() || null,
            youtube_id: song.youtubeId || song.youtube_id || null,
            audio_url: song.audioUrl || song.audio_url || null,
            lyrics_fa: (song.lyrics?.fa || song.lyrics_fa || '').trim() || null,
            lyrics_en: (song.lyrics?.en || song.lyrics_en || '').trim() || null,
        }));

        // Insert in batches of 50
        const BATCH_SIZE = 50;
        let inserted = 0;
        let errors = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('worship_songs').insert(batch);
            if (error) {
                console.error('[Import] Batch error:', error.message);
                errors += batch.length;
            } else {
                inserted += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            inserted,
            errors,
            total: songs.length
        });

    } catch (error: any) {
        console.error('[Import] Error:', error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
