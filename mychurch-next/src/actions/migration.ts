"use server";

import { query } from "@/lib/db";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export async function migrateLegacyWorshipData() {
    const LEGACY_JSON_PATH = "D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\data\\worship_songs.json";
    const results: any[] = [];

    try {
        console.log("[Migration] 🚀 Starting complete migration from:", LEGACY_JSON_PATH);

        // 1. Ensure the trigger for auth signup is created and correct
        await query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user() 
            RETURNS trigger AS $$
            BEGIN
                INSERT INTO public.users (name, email, role, permissions)
                VALUES (
                    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
                    new.email,
                    'User',
                    '{}'::jsonb
                )
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    last_active = now();
                RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
        `);
        results.push({ step: "Trigger Fix", status: "Success" });

        // 2. Import and Enrich Worship Songs with Timing Data
        if (fs.existsSync(LEGACY_JSON_PATH)) {
            const legacyData = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, "utf8"));
            let insertedCount = 0;
            let updatedCount = 0;

            for (const song of legacyData) {
                const titleFa = (song.title?.fa || "").trim();
                const titleEn = (song.title?.en || "").trim() || null;
                const artist = (song.artist || "").trim() || null;
                const youtubeId = (song.youtubeId || "").trim() || null;
                const audioUrl = (song.audioUrl || "").trim() || null;
                const lyricsFa = (song.lyrics?.fa || "").trim() || null;
                const lyricsEn = (song.lyrics?.en || "").trim() || null;
                const timepoints = song.timepoints || null;

                if (!titleFa) continue;

                // 2.1 Find and load timing JSON data if it exists
                let timingData = null;
                const timingFile = path.join(
                    process.cwd(),
                    "public",
                    "worship",
                    "data",
                    "timings",
                    `song_${song.id}_timing.json`
                );

                if (fs.existsSync(timingFile)) {
                    try {
                        const timingRaw = fs.readFileSync(timingFile, "utf8");
                        timingData = JSON.parse(timingRaw);
                    } catch (e) {
                        console.error(`[Migration] Failed to parse timing for song ${song.id}:`, e);
                    }
                }

                // 2.2 Check if song already exists in PostgreSQL
                const checkRes = await query(
                    "SELECT id FROM church_worship_songs WHERE title_fa = $1 OR (title_en = $2 AND title_en IS NOT NULL)",
                    [titleFa, titleEn]
                );

                if (checkRes.rows && checkRes.rows.length > 0) {
                    // Update existing song
                    const songId = checkRes.rows[0].id;
                    await query(
                        `UPDATE church_worship_songs 
                         SET artist = COALESCE($1, artist), 
                             youtube_id = COALESCE($2, youtube_id), 
                             audio_url = COALESCE($3, audio_url), 
                             lyrics_fa = COALESCE($4, lyrics_fa), 
                             lyrics_en = COALESCE($5, lyrics_en),
                             timepoints = COALESCE($6, timepoints),
                             timing_data = COALESCE($7, timing_data)
                         WHERE id = $8`,
                        [
                            artist,
                            youtubeId,
                            audioUrl,
                            lyricsFa,
                            lyricsEn,
                            timepoints ? JSON.stringify(timepoints) : null,
                            timingData ? JSON.stringify(timingData) : null,
                            songId,
                        ]
                    );
                    updatedCount++;
                } else {
                    // Insert new song
                    await query(
                        `INSERT INTO church_worship_songs 
                         (title_fa, title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en, timepoints, timing_data) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            titleFa,
                            titleEn,
                            artist,
                            youtubeId,
                            audioUrl,
                            lyricsFa,
                            lyricsEn,
                            timepoints ? JSON.stringify(timepoints) : null,
                            timingData ? JSON.stringify(timingData) : null,
                        ]
                    );
                    insertedCount++;
                }
            }

            results.push({
                step: "Worship Enrichment",
                inserted: insertedCount,
                updated: updatedCount,
                total: legacyData.length,
            });
        } else {
            console.error("[Migration] ❌ Legacy file not found at:", LEGACY_JSON_PATH);
            results.push({ step: "Worship Enrichment", status: "Legacy file not found" });
        }

        revalidatePath("/admin/worship");
        revalidatePath("/worship");
        return { success: true, results };
    } catch (error: any) {
        console.error("[Migration] ❌ Error:", error);
        return { success: false, error: error.message };
    }
}
