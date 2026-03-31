"use server";

import { GoogleGenAI } from "@google/genai";

export async function translateFaToEn(text: string): Promise<string> {
    if (!text || !text.trim()) return "";
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const genAI = new GoogleGenAI({ apiKey });
        
        const prompt = `Translate the following Persian text to English accurately and naturally for a church website. Preserve formatting. Return ONLY the translation, no explanation, no quotes around it:\n\n${text}`;
        
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt
        });
        return (response.text || "").trim();
    } catch (error) {
        console.error("[AI Translation Error]:", error);
        return text; // Fallback to original
    }
}
