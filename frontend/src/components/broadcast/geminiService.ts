/**
 * 🤖 Gemini AI Service for Broadcast Console
 * 
 * قابلیت‌ها:
 * 1. ترجمه خودکار FA ↔ EN
 * 2. جستجوی هوشمند آیات کتاب مقدس
 * 3. تولید محتوای پرستشی
 * 4. پیشنهاد هوشمند محتوا
 */

import { AppLanguage } from './types';

// Types
export interface TranslationResult {
  original: string;
  translated: string;
  fromLang: AppLanguage;
  toLang: AppLanguage;
}

export interface ScriptureSearchResult {
  reference: string;
  text: {
    fa: string;
    en: string;
  };
  relevanceScore: number;
  suggestions?: string[];
}

export interface ContentSuggestion {
  type: 'scripture' | 'song' | 'announcement' | 'prayer';
  title: string;
  content: {
    fa?: string;
    en?: string;
  };
  reason: string;
}

// API Configuration
const API_BASE_URL = '/api/broadcast-ai';

/**
 * ترجمه متن با Gemini
 */
export async function translateText(
  text: string,
  fromLang: AppLanguage,
  toLang: AppLanguage
): Promise<TranslationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromLang, toLang }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: Return original text
    return {
      original: text,
      translated: text,
      fromLang,
      toLang,
    };
  }
}

/**
 * ترجمه دوطرفه همزمان
 */
export async function translateBilingual(
  text: string,
  sourceLang: AppLanguage
): Promise<{ fa: string; en: string }> {
  const targetLang: AppLanguage = sourceLang === 'fa' ? 'en' : 'fa';
  
  const result = await translateText(text, sourceLang, targetLang);
  
  return {
    fa: sourceLang === 'fa' ? text : result.translated,
    en: sourceLang === 'en' ? text : result.translated,
  };
}

/**
 * جستجوی هوشمند آیات کتاب مقدس با AI
 */
export async function searchScriptureAI(
  query: string,
  lang: AppLanguage = 'fa',
  maxResults: number = 5
): Promise<ScriptureSearchResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/scripture-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lang, maxResults }),
    });

    if (!response.ok) {
      throw new Error(`Scripture search failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Scripture search error:', error);
    return [];
  }
}

/**
 * پیشنهاد آیه بر اساس موضوع
 */
export async function suggestScriptureByTopic(
  topic: string,
  lang: AppLanguage = 'fa'
): Promise<ScriptureSearchResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/scripture-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, lang }),
    });

    if (!response.ok) {
      throw new Error(`Scripture suggestion failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Scripture suggestion error:', error);
    return [];
  }
}

/**
 * پیشنهاد محتوای هوشمند برای پخش
 */
export async function suggestBroadcastContent(
  context: {
    occasion?: string;  // 'sunday_service' | 'christmas' | 'easter' | 'prayer_meeting'
    theme?: string;
    currentSongs?: string[];
    currentScriptures?: string[];
  },
  lang: AppLanguage = 'fa'
): Promise<ContentSuggestion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/content-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, lang }),
    });

    if (!response.ok) {
      throw new Error(`Content suggestion failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Content suggestion error:', error);
    return [];
  }
}

/**
 * تولید متن Lower Third با AI
 */
export async function generateLowerThird(
  speakerName: string,
  role?: string,
  context?: string,
  lang: AppLanguage = 'fa'
): Promise<{ fa: string; en: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/lower-third`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speakerName, role, context, lang }),
    });

    if (!response.ok) {
      throw new Error(`Lower third generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Lower third generation error:', error);
    return {
      fa: speakerName,
      en: speakerName,
    };
  }
}

/**
 * تولید پیام دعا بر اساس موضوع
 */
export async function generatePrayerText(
  topic: string,
  style: 'short' | 'medium' | 'full' = 'medium',
  lang: AppLanguage = 'fa'
): Promise<{ fa: string; en: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-prayer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, style, lang }),
    });

    if (!response.ok) {
      throw new Error(`Prayer generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Prayer generation error:', error);
    return {
      fa: topic,
      en: topic,
    };
  }
}

/**
 * بررسی و اصلاح متن فارسی
 */
export async function correctPersianText(
  text: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/correct-persian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Text correction failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.corrected;
  } catch (error) {
    console.error('Text correction error:', error);
    return text;
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی و بالعکس با قالب فارسی
 */
export async function formatDateBilingual(
  date: Date
): Promise<{ fa: string; en: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/format-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: date.toISOString() }),
    });

    if (!response.ok) {
      throw new Error(`Date formatting failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Date formatting error:', error);
    // Fallback
    return {
      fa: date.toLocaleDateString('fa-IR'),
      en: date.toLocaleDateString('en-US'),
    };
  }
}

/**
 * ایجاد خلاصه از متن برای نمایش
 */
export async function summarizeForDisplay(
  text: string,
  maxLength: number = 100,
  lang: AppLanguage = 'fa'
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, maxLength, lang }),
    });

    if (!response.ok) {
      throw new Error(`Summarization failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.summary;
  } catch (error) {
    console.error('Summarization error:', error);
    // Fallback: Simple truncation
    return text.length > maxLength 
      ? text.substring(0, maxLength - 3) + '...'
      : text;
  }
}

/**
 * Cached translations for performance
 */
const translationCache = new Map<string, TranslationResult>();

export async function translateWithCache(
  text: string,
  fromLang: AppLanguage,
  toLang: AppLanguage
): Promise<TranslationResult> {
  const cacheKey = `${fromLang}-${toLang}-${text}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  const result = await translateText(text, fromLang, toLang);
  translationCache.set(cacheKey, result);
  
  // Limit cache size
  if (translationCache.size > 500) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }
  
  return result;
}

export default {
  translateText,
  translateBilingual,
  translateWithCache,
  searchScriptureAI,
  suggestScriptureByTopic,
  suggestBroadcastContent,
  generateLowerThird,
  generatePrayerText,
  correctPersianText,
  formatDateBilingual,
  summarizeForDisplay,
};
