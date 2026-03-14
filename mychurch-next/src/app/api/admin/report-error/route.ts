import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/report-error — Saves error reports from the AnimatedError component
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, code, url, timestamp, userAgent } = body;

    // Store in Supabase — table: error_reports (create if needed)
    const { error } = await supabase.from("error_reports").insert({
      message: message ?? "Unknown error",
      code: code ?? null,
      url: url ?? null,
      timestamp: timestamp ?? new Date().toISOString(),
      user_agent: userAgent ?? null,
    });

    if (error) {
      // If table doesn't exist yet, just log and return 200
      console.warn("[report-error] Could not save to DB:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
