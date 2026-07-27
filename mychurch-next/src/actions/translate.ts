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

/**
 * Robust Multi-Engine AI Translator:
 * Tier 1: Nvidia NIM API (Llama 3.1 70B)
 * Tier 2: Google Gemini 1.5 Flash API
 * Tier 3: Google Translate Public API Endpoint (Failproof Emergency Fallback)
 */
export async function nvidiaTranslateText(text: string, fromLang: string, toLang: string) {
    if (!text || text.trim() === '') {
        return { success: false, error: "متن جهت ترجمه خالی است." };
    }

    const cleanText = text.trim();

    // ── Tier 1: Nvidia NIM API (Llama 3.1 70B Instruct) ──
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (nvidiaApiKey) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

            const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${nvidiaApiKey}`
                },
                body: JSON.stringify({
                    model: "meta/llama-3.1-70b-instruct",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional real-time translator. Translate the user's speech text accurately, naturally, and contextually. Output ONLY the raw translation content, with no introductory text, no quotes, no explanations, and no markdown formatting."
                        },
                        {
                            role: "user",
                            content: `Translate this text from language code "${fromLang}" to language code "${toLang}". Text to translate:\n\n${cleanText}`
                        }
                    ],
                    temperature: 0.2,
                    top_p: 0.9,
                    max_tokens: 4096
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const translatedText = data.choices?.[0]?.message?.content?.trim();
                if (translatedText) {
                    console.log("[nvidiaTranslateText] Successfully translated via Nvidia Llama 3.1");
                    return { success: true, text: translatedText, engine: "Nvidia Llama 3.1" };
                }
            } else {
                const errText = await response.text().catch(() => "");
                console.warn(`[nvidiaTranslateText] Nvidia status ${response.status}: ${errText.substring(0, 100)}`);
            }
        } catch (e) {
            console.warn("[nvidiaTranslateText] Nvidia API exception:", e);
        }
    }

    // ── Tier 2: Google Gemini AI Fallback ──
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Translate the following text from language code "${fromLang}" to language code "${toLang}". Output ONLY the translated text without any quotes, intro, or Markdown:\n\n${cleanText}`;
            
            // Gemini doesn't directly take signal in generateContent, but we can wrap it in Promise.race
            const geminiPromise = model.generateContent(prompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000));
            
            const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
            
            const translatedText = result.response.text().trim();
            if (translatedText) {
                console.log("[nvidiaTranslateText] Successfully translated via Gemini 1.5 Flash");
                return { success: true, text: translatedText, engine: "Gemini 1.5 Flash" };
            }
        } catch (e) {
            console.warn("[nvidiaTranslateText] Gemini API exception:", e);
        }
    }

    // ── Tier 3: Emergency Google Translate Public API Fallback ──
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        
        const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(fromLang)}&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const gtRes = await fetch(gtUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (gtRes.ok) {
            const gtData = await gtRes.json();
            const translatedText = gtData?.[0]?.map((item: any) => item[0]).join("") || "";
            if (translatedText.trim()) {
                console.log("[nvidiaTranslateText] Successfully translated via Emergency GT API");
                return { success: true, text: translatedText.trim(), engine: "Google Translate" };
            }
        }
    } catch (e) {
        console.error("[nvidiaTranslateText] All translation engines failed:", e);
    }

    return { success: false, error: "امکان برقراری ارتباط با موتورهای ترجمه هوش مصنوعی وجود ندارد." };
}
