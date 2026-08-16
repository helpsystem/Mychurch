import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logTranslationUsage } from "@/lib/translationTracker";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { 
      text, 
      targetLanguage = 'fa', 
      sourceLanguage,
      preferredEngine = 'auto' // 'auto' | 'azure' | 'google' | 'gemini'
    } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'متنی برای ترجمه ارسال نشده است.' }, { status: 400 });
    }

    const charCount = text.length;
    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    const region = process.env.AZURE_TRANSLATOR_REGION;
    const geminiKey = process.env.GEMINI_API_KEY;
    const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_URL;

    // Helper: Call Microsoft Azure
    async function translateViaAzure() {
      if (!apiKey || !region) return null;
      try {
        const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
        let url = `${endpoint}?api-version=3.0&to=${encodeURIComponent(targetLanguage)}`;
        if (sourceLanguage) {
          url += `&from=${encodeURIComponent(sourceLanguage)}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Ocp-Apim-Subscription-Region': region,
            'Content-type': 'application/json',
          },
          body: JSON.stringify([{ text }]),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data[0]?.translations?.[0]?.text) {
            const translatedText = data[0].translations[0].text;
            logTranslationUsage(charCount, 'azure', sourceLanguage, targetLanguage).catch(console.error);
            return { translatedText, engine: 'azure' };
          }
        }
      } catch (err) {
        console.warn('[Translate API] Azure call error:', err);
      }
      return null;
    }

    // Helper: Call Google Gemini AI
    async function translateViaGemini() {
      if (!geminiKey) return null;
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const targetLangName = targetLanguage === 'fa' ? 'Persian (Farsi)' : targetLanguage === 'en' ? 'English' : targetLanguage;
        const prompt = `Translate the following text into ${targetLangName} accurately, fluently, and naturally. Return ONLY the translated text without any explanation, markdown, or quotation marks:\n\n${text}`;
        
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        if (translatedText) {
          logTranslationUsage(charCount, 'google_gemini', sourceLanguage, targetLanguage).catch(console.error);
          return { translatedText, engine: 'google_gemini' };
        }
      } catch (err) {
        console.warn('[Translate API] Gemini call error:', err);
      }
      return null;
    }

    // Helper: Call Google Apps Script / Public Translate
    async function translateViaGoogleScript() {
      if (!googleScriptUrl) return null;
      try {
        const fallbackRes = await fetch(`${googleScriptUrl}?text=${encodeURIComponent(text)}&target=${encodeURIComponent(targetLanguage)}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.translatedText) {
            logTranslationUsage(charCount, 'google_translate', sourceLanguage, targetLanguage).catch(console.error);
            return { translatedText: fallbackData.translatedText, engine: 'google_translate' };
          }
        }
      } catch (err) {
        console.warn('[Translate API] Google script call error:', err);
      }
      return null;
    }

    // ── Dispatch based on engine preference ──
    let result = null;

    if (preferredEngine === 'azure') {
      result = await translateViaAzure();
      if (!result) result = await translateViaGemini() || await translateViaGoogleScript();
    } else if (preferredEngine === 'google' || preferredEngine === 'gemini') {
      result = await translateViaGemini() || await translateViaGoogleScript();
      if (!result) result = await translateViaAzure();
    } else {
      // 'auto' mode: Azure first (instant) -> Gemini (AI) -> Google Script
      result = await translateViaAzure();
      if (!result) result = await translateViaGemini();
      if (!result) result = await translateViaGoogleScript();
    }

    if (result) {
      return NextResponse.json({
        translatedText: result.translatedText,
        charCount,
        engine: result.engine,
      });
    }

    return NextResponse.json({ 
      error: 'خطا در برقراری ارتباط با سرویس‌های ترجمه مایکروسافت و گوگل.' 
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('[Translate API] Global error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور در سیستم ترجمه رخ داده است.' }, { status: 500 });
  }
}
