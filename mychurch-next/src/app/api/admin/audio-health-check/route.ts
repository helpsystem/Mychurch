import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: userRecord } = await supabase.from('users').select('role').eq('email', user.email).single();
        if (!userRecord || (userRecord.role !== 'Admin' && userRecord.role !== 'Leader')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { rows } = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE audio_health_status = 'ok') as ok_links,
                COUNT(*) FILTER (WHERE audio_health_status = 'broken') as broken_links,
                COUNT(*) FILTER (WHERE audio_health_status = 'unknown') as unknown_links
            FROM church_worship_songs
            WHERE audio_url IS NOT NULL
        `);

        return NextResponse.json({ stats: rows[0] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: userRecord } = await supabase.from('users').select('role').eq('email', user.email).single();
        if (!userRecord || userRecord.role !== 'Admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const payload = await req.json();

        if (payload.action === 'run') {
            // Fetch songs to check
            const { rows: songs } = await query(`
                SELECT id, audio_url 
                FROM church_worship_songs 
                WHERE audio_url IS NOT NULL AND audio_url LIKE 'http%'
                ORDER BY audio_health_checked_at ASC NULLS FIRST
                LIMIT $1
            `, [payload.limit || 50]);

            let checked = 0;
            let broken = 0;

            for (const song of songs) {
                try {
                    const res = await fetch(song.audio_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
                    const status = (res.ok || res.status < 400) ? 'ok' : 'broken';
                    const errorMsg = status === 'broken' ? `HTTP ${res.status}` : null;
                    
                    await query(`
                        UPDATE church_worship_songs 
                        SET audio_health_status = $1, audio_health_checked_at = NOW(), audio_health_error = $2
                        WHERE id = $3
                    `, [status, errorMsg, song.id]);

                    if (status === 'broken') broken++;
                    checked++;
                } catch (e: any) {
                    await query(`
                        UPDATE church_worship_songs 
                        SET audio_health_status = 'broken', audio_health_checked_at = NOW(), audio_health_error = $1
                        WHERE id = $2
                    `, [e.message, song.id]);
                    broken++;
                    checked++;
                }
            }

            return NextResponse.json({ success: true, checked, broken });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
