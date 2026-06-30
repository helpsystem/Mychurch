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
        } else if (mode === "finglish") {
            prompt = `You are a linguist specializing in Persian transliteration.
Convert the following Persian worship song lyrics into natural, readable, standard Finglish (Persian written in Latin characters / Pinglish).
Pay close attention to Persian vowels (e.g. 'a', 'e', 'o', 'aa', 'i', 'u') so it sounds natural when read.
Keep the exact same line structure and stanza breaks.
Only output the Finglish transliteration, nothing else. Do not add any introductory or concluding text.

Song Title: ${titleFA || "Unknown"}
Persian Lyrics:
${lyricsFA}`;
        } else {
            return NextResponse.json({ error: "Invalid mode. Use 'translate', 'chords', 'clean', or 'finglish'." }, { status: 400 });
        }

        const nvidiaKey = process.env.NVIDIA_API_KEY;
        let text = "";

        if (nvidiaKey) {
            console.log(`[WorshipAssistAPI] Processing mode '${mode}' via Nvidia GLM-5.1`);
            const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${nvidiaKey}`
                },
                body: JSON.stringify({
                    model: "z-ai/glm-5.1",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional Christian worship leader, translator, and arranger. Return ONLY the final requested translation, chord chart, cleaned lyrics, or Finglish transliteration. Do NOT include markdown blocks, backticks, quotes, introductory text, or explanations."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.2,
                    top_p: 0.9,
                    max_tokens: 4096
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[WorshipAssistAPI] Nvidia API returned status ${response.status}:`, errText);
                throw new Error(`Nvidia API error: ${response.status}`);
            }

            const data = await response.json();
            text = data.choices?.[0]?.message?.content || "";
        } else {
            console.log(`[WorshipAssistAPI] NVIDIA_API_KEY not configured. Falling back to Gemini 2.0 Flash.`);
            const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!geminiKey) {
                return NextResponse.json({ error: "No AI API key is configured on the server." }, { status: 500 });
            }
            const genAI = new GoogleGenAI({ apiKey: geminiKey });
            const response = await genAI.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt
            });
            text = response.text || "";
        }

        return NextResponse.json({ result: text.trim() });

    } catch (error: any) {
        console.error("[Worship AI] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
