import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logTranslationUsage } from "@/lib/translationTracker";
import { translateWithAzurePool } from "@/lib/azureTranslatorPool";

export const dynamic = 'force-dynamic';

// High-speed in-memory LRU cache for ultra-fast instant 0ms responses
const translationCache = new Map<string, { translatedText: string; engine: string }>();
const MAX_CACHE_SIZE = 5000;

export async function POST(request: Request) {
  try {
    const { 
      text, 
      targetLanguage = 'fa', 
      sourceLanguage,
      preferredEngine = 'azure' // Default is Microsoft Azure
    } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'متنی برای ترجمه ارسال نشده است.' }, { status: 400 });
    }

    const trimmedText = text.trim();
    const charCount = trimmedText.length;
    const cacheKey = `${sourceLanguage || 'auto'}_${targetLanguage}_${preferredEngine}_${trimmedText}`;

    // 1. Instant cache hit check (0ms response)
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey)!;
      return NextResponse.json({
        translatedText: cached.translatedText,
        charCount,
        engine: cached.engine,
        cached: true
      }, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_URL;

    // Helper: Call Microsoft Azure Multi-Account Pool
    async function translateViaAzure(): Promise<{ translatedText: string; engine: string } | null> {
      try {
        const res = await translateWithAzurePool(trimmedText, targetLanguage, sourceLanguage);
        if (res && res.translatedText) {
          void logTranslationUsage(charCount, 'azure', sourceLanguage, targetLanguage).catch(() => {});
          return { translatedText: res.translatedText, engine: `Microsoft Azure (${res.accountName})` };
        }
      } catch (err) {
        console.warn('[Translate API] Azure Pool error:', err);
      }
      return null;
    }

    // Helper: Call Google Gemini AI with fast timeout
    async function translateViaGemini(): Promise<{ translatedText: string; engine: string } | null> {
      if (!geminiKey) return null;
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const targetLangName = targetLanguage === 'fa' ? 'Persian (Farsi)' : targetLanguage === 'en' ? 'English' : targetLanguage;
        const prompt = `Translate to ${targetLangName}. Return ONLY the direct translation:\n\n${trimmedText}`;
        
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        if (translatedText) {
          void logTranslationUsage(charCount, 'google_gemini', sourceLanguage, targetLanguage).catch(() => {});
          return { translatedText, engine: 'google_gemini' };
        }
      } catch (err) {
        console.warn('[Translate API] Gemini fast-fallback:', err);
      }
      return null;
    }

    // Helper: Call Google Apps Script
    async function translateViaGoogleScript(): Promise<{ translatedText: string; engine: string } | null> {
      if (!googleScriptUrl) return null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const fallbackRes = await fetch(`${googleScriptUrl}?text=${encodeURIComponent(trimmedText)}&target=${encodeURIComponent(targetLanguage)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.translatedText) {
            void logTranslationUsage(charCount, 'google_translate', sourceLanguage, targetLanguage).catch(() => {});
            return { translatedText: fallbackData.translatedText, engine: 'google_translate' };
          }
        }
      } catch (err) {
        console.warn('[Translate API] Google script fast-fallback:', err);
      }
      return null;
    }

    // ── Dispatch: Microsoft Azure is DEFAULT ──
    let result: { translatedText: string; engine: string } | null = null;

    if (preferredEngine === 'google' || preferredEngine === 'gemini') {
      result = await translateViaGemini() || await translateViaGoogleScript();
      if (!result) result = await translateViaAzure();
    } else {
      // Default / 'azure': Microsoft Azure Pool (Multi-Account) first -> Gemini AI -> Google Script
      result = await translateViaAzure();
      if (!result) result = await translateViaGemini();
      if (!result) result = await translateViaGoogleScript();
    }

    if (result) {
      if (translationCache.size >= MAX_CACHE_SIZE) {
        const firstKey = translationCache.keys().next().value;
        if (firstKey) translationCache.delete(firstKey);
      }
      translationCache.set(cacheKey, result);

      return NextResponse.json({
        translatedText: result.translatedText,
        charCount,
        engine: result.engine,
      });
    }

    return NextResponse.json({ 
      error: 'خطا در برقراری ارتباط با سرویس‌های ترجمه.' 
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('[Translate API] Global error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور در سیستم ترجمه رخ داده است.' }, { status: 500 });
  }
}
