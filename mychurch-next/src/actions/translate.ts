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

export async function enhanceText(text: string, language: 'en' | 'fa') {
    if (!genAI) {
        return { success: false, error: "کلید API هوش مصنوعی تنظیم نشده است." };
    }
    
    if (!text || text.trim() === '') {
        return { success: false, error: "متن خالی است." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = language === 'en' 
            ? `Fix any grammar and spelling mistakes in the following English text, and improve its professional tone for a newsletter. Only return the corrected text without any quotes, explanations, or Markdown formatting:\n\n${text}`
            : `لطفا متن فارسی زیر را از نظر نگارشی و املایی اصلاح کن و لحن آن را برای یک خبرنامه کلیسایی حرفه‌ای‌تر و خواناتر کن. فقط متن نهایی را بدون هیچ توضیح اضافه، گیومه یا فرمت‌بندی مارک‌داون برگردان:\n\n${text}`;
            
        const result = await model.generateContent(prompt);
        const enhancedText = result.response.text();
        
        return { success: true, text: enhancedText.trim() };
    } catch (error: any) {
        console.error("AI Enhance Error:", error);
        return { success: false, error: "خطا در برقراری ارتباط با هوش مصنوعی برای اصلاح متن." };
    }
}

export async function nvidiaTranslateText(text: string, fromLang: string, toLang: string) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        return { success: false, error: "NVIDIA API Key is not configured." };
    }
    
    if (!text || text.trim() === '') {
        return { success: false, error: "Text is empty." };
    }

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "z-ai/glm-5.1",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional real-time translator. Translate the user's speech text accurately, naturally, and contextually. Output ONLY the raw translation content, with no introductory text, no quotes, no explanations, and no markdown formatting."
                    },
                    {
                        role: "user",
                        content: `Translate this text from language code "${fromLang}" to language code "${toLang}". Text to translate:\n\n${text}`
                    }
                ],
                temperature: 0.3,
                top_p: 0.9,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Nvidia API Error Body:", errBody);
            return { success: false, error: `Nvidia API returned status ${response.status}` };
        }

        const data = await response.json();
        const translatedText = data.choices?.[0]?.message?.content || "";
        return { success: true, text: translatedText.trim() };
    } catch (error: any) {
        console.error("Nvidia Translation Action Error:", error);
        return { success: false, error: "Failed to translate text via Nvidia AI." };
    }
}

