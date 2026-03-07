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

        const { timepoints } = await req.json() as { timepoints: Timepoint[] };

        if (!Array.isArray(timepoints)) {
            return NextResponse.json({ error: "Invalid timepoints format" }, { status: 400 });
        }

        const { error } = await supabase
            .from("worship_songs")
            .update({ timepoints })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true, count: timepoints.length });

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
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("worship_songs")
        .select("timepoints")
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ timepoints: data?.timepoints || [] });
}
