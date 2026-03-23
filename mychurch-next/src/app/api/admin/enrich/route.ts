import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { updateWorshipSong, getWorshipSongs } from "@/actions/worship";

export async function GET() {
    const results: any[] = [];
    
    try {
        // 1. RLS Fix for 'users' table
        results.push({ step: "RLS Fix", status: "Starting" });
        await query(`
            -- Allow anyone (including anon during signup) to insert their initial profile
            DROP POLICY IF EXISTS "Enable insert for all users" ON users;
            CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
            
            -- Ensure authenticated users can handle their own data
            DROP POLICY IF EXISTS "Enable all access for authenticated users" ON users;
            CREATE POLICY "Enable all access for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
        `);
        results.push({ step: "RLS Fix", status: "Success" });

        // 2. Worship Enrichment
        results.push({ step: "Worship Enrichment", status: "Starting" });
        const songs = await getWorshipSongs();
        
        // 1. آسمان گوید جلال (All Heaven Declares)
        const asman = songs.find(s => s.title_fa.includes("آسمان گوید جلال"));
        if (asman) {
            await updateWorshipSong(asman.id, {
                artist: "Noel & Tricia Richards",
                youtube_id: "R6w6E9oR-Bw",
                lyrics_fa: "آسمان گوید، جلال و شکوه عیسی\nکیست همچو او، نوبر قیام‌کنندگان\n\nتا ابد تو هستی بره‌ى تخت‌نشین\nنزدت زانو زنم و تو را پرستم\n\nاعلام کنم، زیبایی خداوندم\nاو فديه گشت بهر نجات انسانها"
            });
            results.push({ song: "آسمان گوید جلال", status: "Enriched" });
        }

        // 2. الشدای (El Shaddai)
        const elshaddai = songs.find(s => s.title_fa.includes("الشدای"));
        if (elshaddai) {
            await updateWorshipSong(elshaddai.id, {
                artist: "Michael Card / Amy Grant",
                youtube_id: "vT_Csh_vIhk",
                lyrics_fa: "الشدای الشدای، ال الیون ادونای\nنام تو در بین ما، هم در عالم اعلی\nالشدای خدای ما، دوست داریم نام تو را\nای خالق ابدی، الشدای"
            });
            results.push({ song: "الشدای", status: "Enriched" });
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Enrichment Error:", error);
        return NextResponse.json({ success: false, error: error.message, results }, { status: 500 });
    }
}
