import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    // ===== Security Check: Admin or Leader Role Required =====
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .ilike('email', user.email || '')
      .maybeSingle();

    if (!userRecord || (userRecord.role !== 'Admin' && userRecord.role !== 'Leader')) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Leader access required" },
        { status: 403 }
      );
    }
    // ===== End Security Check =====

    const body = await req.json().catch(() => ({}));
    const { path, payload } = body;

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${path}?key=${apiKey}`;

    console.log(`[GeminiProxy] Forwarding to: https://generativelanguage.googleapis.com/v1beta/${path}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GeminiProxy] Google API error (${response.status}):`, errText);
      return NextResponse.json({ error: errText }, { status: response.status });
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("[GeminiProxy] Exception occurred:", error);
    return NextResponse.json({ error: error.message || "Failed to proxy Gemini request." }, { status: 500 });
  }
}
