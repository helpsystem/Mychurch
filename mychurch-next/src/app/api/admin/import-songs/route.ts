import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
    try {
        // ===== Security Check: Admin Role Required =====
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!userRecord || userRecord.role !== 'Admin') {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }
        // ===== End Security Check =====

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

        // Insert one by one (or batch if written using postgres UNNEST, but simple loop is fine for admin uploads)
        let inserted = 0;
        let errors = 0;

        for (const song of rows) {
            try {
                await query(
                    `INSERT INTO church_worship_songs (title_fa, title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [song.title_fa, song.title_en, song.artist, song.youtube_id, song.audio_url, song.lyrics_fa, song.lyrics_en]
                );
                inserted++;
            } catch (error: any) {
                console.error('[Import] Error inserting song:', song.title_fa, error.message);
                errors++;
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
