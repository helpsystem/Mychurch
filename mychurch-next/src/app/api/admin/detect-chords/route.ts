import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      .ilike('email', user.email)
      .maybeSingle();

    if (!userRecord || (userRecord.role !== 'Admin' && userRecord.role !== 'Leader')) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Leader access required" },
        { status: 403 }
      );
    }
    // ===== End Security Check =====

    const body = await req.json().catch(() => ({}));
    const { audioBase64, mimeType, transcript } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `
Analyze this audio file (Transcript: "${transcript || ''}").
Identify the musical chords being played in the song.
List the chords in order of appearance or by song sections (Verse, Chorus, Bridge, etc.).
If no chords are detectable, respond with "none".
`;

    const response = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType || "audio/mp3",
        },
      },
      promptText,
    ]);

    const resultText = response.response.text().trim();
    return NextResponse.json({ chords: resultText });

  } catch (error: any) {
    console.error("[DetectChordsAPI] Error detecting chords:", error);
    return NextResponse.json({ error: error.message || "Failed to detect chords." }, { status: 500 });
  }
}
