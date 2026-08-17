"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logTranslationUsage } from "@/lib/translationTracker";
import { translateWithAzurePool } from "@/lib/azureTranslatorPool";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// High-speed In-Memory Cache for 0ms repetitive phrases & speech subtitles
const actionTranslationCache = new Map<string, { text: string; engine: string }>();
const MAX_CACHE_SIZE = 5000;

export async function translateText(text: string, targetLanguage: 'en' | 'fa') {
    if (!text || text.trim() === '') {
        return { success: false, error: "متن خالی است." };
    }

    const cleanText = text.trim();
    const fromLang = targetLanguage === 'en' ? 'fa' : 'en';
    const res = await nvidiaTranslateText(cleanText, fromLang, targetLanguage);
    return res;
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
 * Ultra-Fast Multi-Engine AI Translator (Default: Microsoft Azure Multi-Account Pool):
 * Tier 1: Microsoft Azure Multi-Account Pool (Sub-30ms speed with auto-failover)
 * Tier 2: Google Gemini 1.5 Flash AI
 * Tier 3: Emergency Google Translate Public Endpoint
 */
export async function nvidiaTranslateText(text: string, fromLang: string, toLang: string) {
    if (!text || text.trim() === '') {
        return { success: false, error: "متن جهت ترجمه خالی است." };
    }

    const cleanText = text.trim();
    const charCount = cleanText.length;
    const cacheKey = `${fromLang}_${toLang}_${cleanText}`;

    // 0ms Cache Hit Check
    if (actionTranslationCache.has(cacheKey)) {
        const cached = actionTranslationCache.get(cacheKey)!;
        return { success: true, text: cached.text, engine: cached.engine, cached: true };
    }

    // ── Tier 1: Microsoft Azure Cognitive Translator (Multi-Account Pool) ──
    try {
        const azureRes = await translateWithAzurePool(cleanText, toLang, fromLang);
        if (azureRes && azureRes.translatedText) {
            void logTranslationUsage(charCount, 'azure', fromLang, toLang).catch(() => {});
            
            if (actionTranslationCache.size >= MAX_CACHE_SIZE) {
                const firstKey = actionTranslationCache.keys().next().value;
                if (firstKey) actionTranslationCache.delete(firstKey);
            }
            actionTranslationCache.set(cacheKey, { text: azureRes.translatedText, engine: `Microsoft Azure (${azureRes.accountName})` });
            
            return { success: true, text: azureRes.translatedText, engine: `Microsoft Azure (${azureRes.accountName})` };
        }
    } catch (azureErr) {
        console.warn("[translateAction] Azure Translator pool error:", azureErr);
    }

    // ── Tier 2: Google Gemini AI Fallback (With 2.5s Timeout) ──
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const targetLangName = toLang === 'fa' ? 'Persian (Farsi)' : toLang === 'en' ? 'English' : toLang;
            const prompt = `Translate this speech text accurately into ${targetLangName}. Return ONLY the direct translation:\n\n${cleanText}`;
            
            const geminiPromise = model.generateContent(prompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));
            
            const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
            const translatedText = result?.response?.text()?.trim();
            if (translatedText) {
                void logTranslationUsage(charCount, 'google_gemini', fromLang, toLang).catch(() => {});
                actionTranslationCache.set(cacheKey, { text: translatedText, engine: "Google Gemini AI" });
                return { success: true, text: translatedText, engine: "Google Gemini AI" };
            }
        } catch (e) {
            console.warn("[translateAction] Gemini fast-fallback:", e);
        }
    }

    // ── Tier 3: Emergency Google Translate Public API Endpoint ──
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(fromLang)}&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const gtRes = await fetch(gtUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (gtRes.ok) {
            const gtData = await gtRes.json();
            const translatedText = gtData?.[0]?.map((item: any) => item[0]).join("") || "";
            if (translatedText.trim()) {
                actionTranslationCache.set(cacheKey, { text: translatedText.trim(), engine: "Google Translate" });
                return { success: true, text: translatedText.trim(), engine: "Google Translate" };
            }
        }
    } catch (e) {
        console.error("[translateAction] All translation engines failed:", e);
    }

    return { success: false, error: "امکان برقراری ارتباط با موتورهای ترجمه وجود ندارد." };
}

// ── Ultra-Fast Sub-30ms Interim Translation with Multi-Account Azure Pool ──
export async function interimTranslateText(text: string, fromLang: string, toLang: string) {
    const cleanText = text.trim();
    if (!cleanText) return { success: true, text: "" };

    const cacheKey = `interim_${fromLang}_${toLang}_${cleanText}`;
    if (actionTranslationCache.has(cacheKey)) {
        return { success: true, text: actionTranslationCache.get(cacheKey)!.text };
    }

    // 1. Try Microsoft Azure Multi-Account Pool First
    try {
        const azureRes = await translateWithAzurePool(cleanText, toLang, fromLang);
        if (azureRes && azureRes.translatedText) {
            actionTranslationCache.set(cacheKey, { text: azureRes.translatedText, engine: 'azure' });
            return { success: true, text: azureRes.translatedText };
        }
    } catch (e) {
        // fallback
    }

    // 2. Fast Fallback
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        
        const gtUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(fromLang)}&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const gtRes = await fetch(gtUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (gtRes.ok) {
            const gtData = await gtRes.json();
            const translatedText = gtData?.[0]?.map((item: any) => item[0]).join("") || "";
            if (translatedText.trim()) {
                actionTranslationCache.set(cacheKey, { text: translatedText.trim(), engine: 'gt' });
                return { success: true, text: translatedText.trim() };
            }
        }
    } catch (e) {
        // silent
    }

    return { success: false, text: "" };
}
