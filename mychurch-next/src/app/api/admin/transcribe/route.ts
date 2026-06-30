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
    const { audioBase64, mimeType, mode } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio data is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for fast and precise transcription and JSON generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let promptText = "";
    if (mode === "song") {
      promptText = `
Transcribe this worship song.
Group words into natural lyric lines/stanzas in the 'lines' array. Set type to 'lyric'. Do NOT merge stanzas into big blocks.
CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), for perfect karaoke-style synchronization.

Respond strictly in valid JSON format matching this schema:
{
  "lines": [
    {
      "type": "lyric",
      "content": "Full line text",
      "words": [
        { "word": "word", "start_time": 0.12, "end_time": 0.45 }
      ]
    }
  ]
}
Return ONLY valid JSON. No markdown backticks, no wrapping.
`;
    } else {
      promptText = `
Transcribe this Bible reading or Speech.
Analyze the structure carefully:
1. If you detect a Book Title (e.g., 'The Book of Genesis'), create a line with type 'book_title'.
2. If you detect a Chapter Title (e.g., 'Chapter One'), create a line with type 'chapter_title'.
3. For Verses, create a line with type 'verse' and put the verse number in the 'label' field.
4. For general text, use type 'text'.

Group words into these structural lines.
CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), to ensure perfect synchronization.

Respond strictly in valid JSON format matching this schema:
{
  "lines": [
    {
      "type": "verse",
      "label": "1",
      "content": "Full verse text",
      "words": [
        { "word": "word", "start_time": 0.12, "end_time": 0.45 }
      ]
    }
  ]
}
Return ONLY valid JSON. No markdown backticks, no wrapping.
`;
    }

    const response = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType || "audio/mp3",
        },
      },
      promptText,
    ]);

    let cleanJson = response.response.text().trim();
    
    // Clean markdown if the model output has it
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (parseErr) {
      console.error("[TranscribeAPI] JSON Parsing Error. Raw output:", cleanJson, parseErr);
      return NextResponse.json({
        error: "Failed to parse structured JSON from Gemini. Raw output returned.",
        raw: cleanJson
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[TranscribeAPI] Error transcribing audio:", error);
    return NextResponse.json({ error: error.message || "Failed to process audio transcription." }, { status: 500 });
  }
}
