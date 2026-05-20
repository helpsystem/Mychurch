"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function translateText(text: string, targetLanguage: 'en' | 'fa') {
    if (!genAI) {
        return { success: false, error: "کلید API هوش مصنوعی (Gemini) تنظیم نشده است." };
    }
    
    if (!text || text.trim() === '') {
        return { success: false, error: "متن خالی است." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = targetLanguage === 'en' 
            ? `Translate the following Persian text to English accurately and professionally. Only return the translated text without any quotes or explanations:\n\n${text}`
            : `Translate the following English text to Persian (Farsi) accurately and professionally. Use fluent and natural phrasing. Only return the translated text without any quotes or explanations:\n\n${text}`;
            
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();
        
        return { success: true, text: translatedText.trim() };
    } catch (error: any) {
        console.error("AI Translation Error:", error);
        return { success: false, error: "خطا در برقراری ارتباط با هوش مصنوعی برای ترجمه." };
    }
}
