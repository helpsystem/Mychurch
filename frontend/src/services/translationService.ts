import { Language } from '../types';

// The RapidAPI key is provided here based on the user's prior input.
const RAPIDAPI_KEY = '8c16a638c6msh7738cf9dcbb940ap1d90c0jsnaf6241994e22';
const API_HOST = 'openl-translate.p.rapidapi.com';
const API_BASE_URL = `https://${API_HOST}`;

const apiFetch = async (endpoint: string, body: object) => {
    if (!RAPIDAPI_KEY) {
        throw new Error("RapidAPI Key is not configured.");
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': API_HOST,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
};

export const translationService = {
  /**
   * Translates a single string of text.
   * @param text - The string to translate.
   * @param targetLang - The language to translate to ('en' or 'fa').
   * @returns A promise that resolves to the translated string.
   */
  async singleTranslate(text: string, targetLang: Language): Promise<string> {
    if (!text) return '';
    try {
      const response = await apiFetch('/translate', {
        text: text,
        target_lang: targetLang,
        source_lang: targetLang === 'en' ? 'fa' : 'en', // Infer source language
      });
      return response.translated_text || '';
    } catch (error) {
      console.error('Single translation failed:', error);
      return text; // Return original text as fallback
    }
  },
  
  /**
   * Translates a batch of texts to a target language.
   * @param texts - An array of strings to translate.
   * @param targetLang - The language to translate to ('en' or 'fa').
   * @returns A promise that resolves to an array of translated strings.
   */
  async bulkTranslate(texts: string[], targetLang: Language): Promise<string[]> {
    try {
      const response = await apiFetch('/translate/bulk', {
        text: texts,
        target_lang: targetLang,
        source_lang: targetLang === 'en' ? 'fa' : 'en', // Infer source language
      });
      // The API returns an object with a 'translated_text' property which is an array
      return response.translated_text || [];
    } catch (error) {
      console.error('Bulk translation failed:', error);
      // Return original texts as a fallback
      return texts;
    }
  },
};