"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function translateFaToEn(text: string): Promise<string> {
    if (!text || !text.trim()) return "";
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Translate the following Persian text to English accurately and naturally for a church website. Preserve formatting. Return ONLY the translation, no explanation, no quotes around it:\n\n${text}`;
        
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("[AI Translation Error]:", error);
        return text; // Fallback to original
    }
}
