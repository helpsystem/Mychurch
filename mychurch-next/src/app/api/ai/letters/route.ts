// src/app/api/ai/letters/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { mode, lang, topic, body } = await req.json();

    if (!mode || !lang) {
      return NextResponse.json({ error: "Missing required fields: mode and lang" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = getSystemPrompt(mode, lang, topic, body);
    if (!prompt) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ result: text });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Letters AI] Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
