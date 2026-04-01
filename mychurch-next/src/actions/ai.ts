"use server";

import { GoogleGenAI } from "@google/genai";
import { getAIConfig } from "./ai-config";

async function translateText(text: string, sourceLang: "Persian" | "English", targetLang: "English" | "Persian"): Promise<string> {
    if (!text || !text.trim()) return "";

    try {
        const aiConfig = await getAIConfig();
        let genAI: GoogleGenAI | null = null;

        if (aiConfig.active_provider === 'vertex' && aiConfig.vertex_project_id) {
            try {
                genAI = new GoogleGenAI({
                    vertexai: true,
                    project: aiConfig.vertex_project_id,
                    location: aiConfig.vertex_region || 'us-central1',
                    googleAuthOptions: { credentials: aiConfig.vertex_service_account }
                });
            } catch {
                genAI = null;
            }
        }

        if (!genAI) {
            const apiKey = process.env.GEMINI_API_KEY || aiConfig.gemini_api_key;
            if (!apiKey) throw new Error("No AI key configured");
            genAI = new GoogleGenAI({ apiKey });
        }

        const prompt = `Translate the following ${sourceLang} text to ${targetLang} naturally for a church website. Preserve formatting and line breaks. Return ONLY the translation with no explanation or quotes:\n\n${text}`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                maxOutputTokens: 2048,
            },
        });

        const out = (response.text || "").trim();
        return out || text;
    } catch (error) {
        console.error("[AI Translation Error]:", error);
        return text;
    }
}

export async function translateFaToEn(text: string): Promise<string> {
    return translateText(text, "Persian", "English");
}

export async function translateEnToFa(text: string): Promise<string> {
    return translateText(text, "English", "Persian");
}
