import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { mode, lyricsFA, titleFA } = await req.json();

        if (!lyricsFA || !mode) {
            return NextResponse.json({ error: "Missing required fields: mode and lyricsFA" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
        }

        const genAI = new GoogleGenAI({ apiKey });

        let prompt = "";

        if (mode === "translate") {
            prompt = `You are a bilingual Persian-English Christian worship song translator.
Translate the following Persian worship song lyrics into beautiful, singable English.
Keep the same poetic structure and verse/chorus breaks.
Only output the English translation, nothing else.

Song Title: ${titleFA || "Unknown"}
Persian Lyrics:
${lyricsFA}`;

        } else if (mode === "chords") {
            prompt = `You are a Christian worship music arranger with expertise in Persian worship songs.
Based on the following Persian worship song lyrics and title, suggest appropriate guitar/piano chord progressions for each line or section.
Format: Show each line with its chord(s) above it, like this:
Am         G    C
First line of lyrics here

Use common worship-style chord progressions (Am, G, C, F, Em, Dm are typical for Persian worship).
Only output the chord chart, nothing else.

Song Title: ${titleFA || "Unknown"}
Persian Lyrics:
${lyricsFA}`;
        } else if (mode === "clean") {
            prompt = `You are a text cleaner for worship song databases.
Remove all chords (e.g. [Am], G, C), section labels (e.g. Verse 1, Chorus), and any non-lyric metadata from the following Persian worship song text.
Keep only the clean Persian lyrics, formatted with clear stanza breaks.
Only output the clean text, nothing else.

Song Title: ${titleFA || "Unknown"}
Raw Text:
${lyricsFA}`;
        } else {
            return NextResponse.json({ error: "Invalid mode. Use 'translate' or 'chords'." }, { status: 400 });
        }

        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });
        const text = response.text || "";

        return NextResponse.json({ result: text });

    } catch (error: any) {
        console.error("[Worship AI] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
