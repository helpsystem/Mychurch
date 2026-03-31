import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface Timepoint {
    time: number;
    word: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { timepoints, timing_data, lyrics_fa } = await req.json() as { timepoints: Timepoint[], timing_data?: any, lyrics_fa?: string };
 
        if (timepoints && !Array.isArray(timepoints)) {
            return NextResponse.json({ error: "Invalid timepoints format" }, { status: 400 });
        }
 
        const updatePayload: any = {};
        if (timepoints) updatePayload.timepoints = timepoints;
        if (timing_data) updatePayload.timing_data = timing_data;
        if (lyrics_fa) {
            updatePayload.lyrics_fa = lyrics_fa;
            updatePayload.lyrics_fa_clean = lyrics_fa;
        }

        const { error } = await supabase
            .from("church_worship_songs")
            .update(updatePayload)
            .eq("id", id);
 
        if (error) throw error;
  
        return NextResponse.json({ 
            success: true, 
            timepoints_count: timepoints?.length || 0,
            has_timing_data: !!timing_data,
            lyrics_updated: !!lyrics_fa
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Timing Save] Error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // ===== Security Check: Admin Role Required =====
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

        const { data, error } = await supabase
            .from("church_worship_songs")
            .select("timepoints, timing_data, lyrics_fa, lyrics_fa_clean, lyrics_finglish")
            .eq("id", id)
            .single();
    
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
    
        return NextResponse.json({ 
            timepoints: data?.timepoints || [],
            timing_data: data?.timing_data,
            lyrics_fa: data?.lyrics_fa || data?.lyrics_fa_clean,
            lyrics_finglish: data?.lyrics_finglish
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: "Failed to fetch timing data" }, { status: 500 });
    }
}
