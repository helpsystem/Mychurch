"use server";

import { query } from "@/lib/db";
import fs from 'fs';
import { revalidatePath } from "next/cache";

export async function migrateLegacyWorshipData() {
    const LEGACY_JSON_PATH = "D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\data\\worship_songs.json";
    const results: any[] = [];

    try {
        console.log("[Migration] 🚀 Starting migration from:", LEGACY_JSON_PATH);

        // 1. Fix the Signup Trigger
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

        // 2. Mass Enrich Worship Data
        if (fs.existsSync(LEGACY_JSON_PATH)) {
            const legacyData = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf8'));
            let updatedCount = 0;

            for (const song of legacyData) {
                const titleFa = song.title.fa;
                const artist = song.artist || "";
                const youtubeId = song.youtubeId || "";
                const lyricsFa = song.lyrics?.fa || "";
                
                if (!titleFa) continue;

                // Attempt to update by Title (Persian or English)
                const res = await query(
                    `UPDATE church_worship_songs 
                     SET artist = $1, youtube_id = $2, lyrics_fa = $3 
                     WHERE title_fa = $4 OR title_en = $5`,
                    [artist, youtubeId, lyricsFa, titleFa, song.title.en || ""]
                );
                
                if (res.rowCount > 0) {
                    updatedCount++;
                }
            }
            results.push({ step: "Worship Enrichment", count: updatedCount, total: legacyData.length });
        } else {
            console.error("[Migration] ❌ Legacy file not found at:", LEGACY_JSON_PATH);
            results.push({ step: "Worship Enrichment", status: "Legacy file not found" });
        }

        revalidatePath("/admin/worship");
        return { success: true, results };
    } catch (error: any) {
        console.error("[Migration] ❌ Error:", error);
        return { success: false, error: error.message };
    }
}
