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
