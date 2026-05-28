// src/app/api/ai/letters/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { hasRoleOrPermission } from "@/lib/access-control";

const getSystemPrompt = (mode: string, lang: string, topic?: string, body?: string) => {
  if (mode === "generate") {
    return `You are an expert legal and administrative letter writer for an Iranian Christian Church in the United States.
Write a professional, formal, legally-sound letter for the topic: "${topic}".
${lang === "fa"
  ? "Write the letter IN PERSIAN (Farsi) using polished, formal, standard Persian language appropriate for official church correspondence."
  : "Write the letter IN ENGLISH using highly professional, formal language appropriate for US government agencies, immigration offices, or legal institutions."
}
The letter must sound completely HUMAN-written, not robotic or AI-generated.
Include proper salutation, body paragraphs, and closing.
Output ONLY the letter body text, no additional comments.`;
  }

  if (mode === "enhance") {
    return `You are an expert Persian/English editor specializing in formal church and legal documents.
Improve the following ${lang === "fa" ? "Persian" : "English"} letter to be:
- Highly professional and human-sounding
- Legally appropriate for US government/official correspondence
- Grammatically perfect
- Formally structured with proper flow
- Completely natural and NOT robotic

${lang === "fa" ? "Write the improved version in Persian (Farsi)." : "Write the improved version in English."}
Output ONLY the improved letter text, no comments, no explanations.

Original text:
${body}`;
  }

  if (mode === "translate") {
    const from = lang === "fa" ? "Persian (Farsi)" : "English";
    const to = lang === "fa" ? "English" : "Persian (Farsi)";
    return `You are a professional bilingual translator specializing in legal and religious documents.
Translate the following ${from} church letter to ${to}.
Keep the formal register, proper tone, and legal accuracy.
Ensure the translation sounds completely natural and human-written in the target language.
Output ONLY the translated text, no comments.

Text to translate:
${body}`;
  }

  return "";
};

export async function POST(req: Request) {
  try {
    const allowed = await hasRoleOrPermission(["canManageWorship", "canManageMedia"]);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { mode, lang, topic, body } = await req.json();

    if (!mode || !lang) {
      return NextResponse.json({ error: "Missing required fields: mode and lang" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = getSystemPrompt(mode, lang, topic, body);
    if (!prompt) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    let text = "";
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt
        });
        text = response.text || "";
        break; // Success!
      } catch (err: any) {
        console.warn(`[Letters AI] Attempt ${attempts} failed:`, err.message || err);
        if (attempts >= maxAttempts) {
          throw err;
        }
        const errStr = String(err.message || err).toLowerCase();
        const isRateLimit = err.status === 429 || errStr.includes("429") || errStr.includes("quota") || errStr.includes("limit");
        if (isRateLimit) {
          const waitTime = attempts * 2000; // 2000ms, 4000ms
          console.log(`[Letters AI] Rate limit hit. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw err; // Throw immediately for other errors (like 400 or 403)
        }
      }
    }

    return NextResponse.json({ result: text });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Letters AI] Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
