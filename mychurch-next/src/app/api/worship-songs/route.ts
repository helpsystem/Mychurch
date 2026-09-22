import { NextResponse } from 'next/server';
import { getWorshipSongs } from '@/actions/worship';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const songs = await getWorshipSongs();
        return NextResponse.json(songs);
    } catch (error) {
        console.error('Error in GET /api/worship-songs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // ===== Security Check: Admin/Leader/Operator Role Required =====
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
        if (!userRecord || !['Admin', 'Leader', 'Operator'].includes(userRecord.role)) {
            return NextResponse.json({ error: "Forbidden: Admin/Leader/Operator access required" }, { status: 403 });
        }
        // ===== End Security Check =====

        const body = await req.json();
        const {
            title_fa,
            title_en,
            artist,
            youtube_id,
            audio_url,
            lyrics_fa,
            lyrics_en,
            lyrics_finglish,
            chords,
            category,
            timepoints,
            timing_data
        } = body;

        if (!title_fa || typeof title_fa !== 'string' || !title_fa.trim()) {
            return NextResponse.json({ error: 'عنوان فارسی سرود الزامی است.' }, { status: 400 });
        }

        // Prevent duplicate youtube entries if youtube_id is present
        if (youtube_id) {
            const { rows: existing } = await query(
                `SELECT id, title_fa FROM church_worship_songs WHERE youtube_id = $1 LIMIT 1`,
                [youtube_id]
            );

            if (existing.length > 0) {
                const updateRes = await query(
                    `UPDATE church_worship_songs 
                     SET title_fa = COALESCE($1, title_fa),
                         title_en = COALESCE($2, title_en),
                         artist = COALESCE($3, artist),
                         lyrics_fa = COALESCE($4, lyrics_fa),
                         lyrics_en = COALESCE($5, lyrics_en),
                         lyrics_finglish = COALESCE($6, lyrics_finglish),
                         chords = COALESCE($7, chords),
                         category = COALESCE($8, category)
                     WHERE id = $9 RETURNING *`,
                    [
                        title_fa.trim(),
                        title_en?.trim() || null,
                        artist?.trim() || null,
                        lyrics_fa?.trim() || null,
                        lyrics_en?.trim() || null,
                        lyrics_finglish?.trim() || null,
                        chords?.trim() || null,
                        category || null,
                        existing[0].id
                    ]
                );

                revalidatePath('/worship');
                revalidatePath('/admin/worship');

                return NextResponse.json({
                    success: true,
                    isExisting: true,
                    message: 'این سرود قبلاً در سیستم ثبت شده بود و مشخصات آن به‌روزرسانی شد.',
                    song: updateRes.rows[0]
                });
            }
        }

        const { rows } = await query(
            `INSERT INTO church_worship_songs (
                title_fa, title_en, artist, youtube_id, audio_url,
                lyrics_fa, lyrics_en, lyrics_finglish, chords, category,
                timepoints, timing_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                title_fa.trim(),
                title_en?.trim() || null,
                artist?.trim() || null,
                youtube_id?.trim() || null,
                audio_url?.trim() || null,
                lyrics_fa?.trim() || null,
                lyrics_en?.trim() || null,
                lyrics_finglish?.trim() || null,
                chords?.trim() || null,
                category || 'پرستش',
                timepoints ? JSON.stringify(timepoints) : null,
                timing_data ? JSON.stringify(timing_data) : null
            ]
        );

        revalidatePath('/worship');
        revalidatePath('/admin/worship');

        return NextResponse.json({
            success: true,
            song: rows[0]
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error in POST /api/worship-songs:', error);
        return NextResponse.json({ error: error.message || 'خطا در ثبت سرود در دیتابیس' }, { status: 500 });
    }
}
