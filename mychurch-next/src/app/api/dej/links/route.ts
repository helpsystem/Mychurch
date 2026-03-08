import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/dej/links - List all submission links
export async function GET() {
    const { data, error } = await supabase
        .from("dej_submission_links")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/dej/links - Create new submission link
export async function POST(req: Request) {
    const body = await req.json();

    const { data, error } = await supabase
        .from("dej_submission_links")
        .insert({
            label: body.label,
            to_company: body.to_company || "DEJ TV",
            hourly_rate: body.hourly_rate || null,
            expires_at: body.expires_at || null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
