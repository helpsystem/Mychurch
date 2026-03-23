import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import fs from 'fs';
import path from 'path';

export async function GET() {
    const results: any[] = [];
    const LEGACY_JSON_PATH = "D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\data\\worship_songs.json";

    try {
        // 1. Fix the Signup Trigger
        console.log("🛠️ Updating public.handle_new_user() trigger function...");
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

            -- Ensure the trigger exists
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
            results.push({ step: "Worship Enrichment", status: "Legacy file not found", path: LEGACY_JSON_PATH });
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ success: false, error: error.message, results }, { status: 500 });
    }
}
