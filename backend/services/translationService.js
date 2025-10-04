// Translation Service for Church Website Backend
// Integrates with Google Gemini for professional translations

let GoogleGenerativeAI = null;
let genAI = null;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (err) {
  console.warn('⚠️ @google/generative-ai not available. Translation service will use fallback behavior.');
}

class TranslationService {
  constructor() {
    if (genAI) {
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } else {
      this.model = null;
    }
  }

  /**
   * Translate text professionally between languages
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language (en, fa)
   * @param {string} toLang - Target language (en, fa)
   * @param {string} context - Context (announcement, letter, sermon, etc.)
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, fromLang, toLang, context = 'general') {
    if (fromLang === toLang) return text;

    const contextPrompts = {
      announcement: "This is a church announcement or notice",
      letter: "This is an official church letter or correspondence", 
      sermon: "This is religious/spiritual content from a sermon",
      event: "This is about a church event or gathering",
      prayer: "This is a prayer request or spiritual message",
      general: "This is general church content"
    };

    const prompt = `Translate the following ${contextPrompts[context] || contextPrompts.general} from ${fromLang === 'fa' ? 'Persian/Farsi' : 'English'} to ${toLang === 'fa' ? 'Persian/Farsi' : 'English'}.

IMPORTANT GUIDELINES:
- Use professional, respectful church language
- Maintain religious tone and terminology appropriately
- For Persian: Use proper formal Persian suitable for church communications
- For English: Use professional church English
- Preserve any proper names, biblical references, and specific terms
- Maintain the original meaning and tone exactly

Text to translate:
"""
${text}
"""

Provide ONLY the translation, no explanations or additional text:`;

    try {
      if (!this.model) {
        // Fallback: return a marker or the original text depending on direction
        console.warn('🟨 TranslationService: using fallback translateText (no AI model)');
        return fromLang === 'fa' ? `[ترجمه نیاز است] ${text}` : `[Translation needed] ${text}`;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed: ' + error.message);
    }
  }

  /**
   * Auto-translate content to both languages
   * @param {string} text - Original text
   * @param {string} sourceLang - Source language (en or fa)
   * @param {string} context - Content context
   * @returns {Promise<{en: string, fa: string}>} Bilingual content
   */
  async autoTranslate(text, sourceLang, context = 'general') {
    const targetLang = sourceLang === 'en' ? 'fa' : 'en';
    
    try {
      const translation = await this.translateText(text, sourceLang, targetLang, context);
      
      return {
        [sourceLang]: text,
        [targetLang]: translation
      };
    } catch (error) {
      console.error('Auto-translation error:', error);
      // Fallback: return original text in both languages
      return {
        en: sourceLang === 'en' ? text : `[Translation needed: ${text}]`,
        fa: sourceLang === 'fa' ? text : `[ترجمه مورد نیاز: ${text}]`
      };
    }
  }

  /**
   * Batch translate multiple texts
   * @param {Array<{text: string, context: string}>} texts - Array of texts with context
   * @param {string} sourceLang - Source language
   * @returns {Promise<Array<{en: string, fa: string}>>} Array of translated content
   */
  async batchTranslate(texts, sourceLang) {
    const promises = texts.map(({ text, context }) => 
      this.autoTranslate(text, sourceLang, context)
    );
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch translation error:', error);
      throw error;
    }
  }

  /**
   * Validate and prepare content for translation
   * @param {string} text - Text to validate
   * @returns {boolean} Whether text is suitable for translation
   */
  validateForTranslation(text) {
    if (!text || typeof text !== 'string') return false;
    if (text.trim().length === 0) return false;
    if (text.length > 5000) return false; // Reasonable limit
    return true;
  }

  /**
   * Get supported languages
   * @returns {Array} List of supported language codes
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی' }
    ];
  }

  /**
   * Get available contexts for translation
   * @returns {Array} List of available contexts
   */
  getAvailableContexts() {
    return [
      { code: 'announcement', label: { en: 'Announcement', fa: 'اطلاعیه' } },
      { code: 'letter', label: { en: 'Official Letter', fa: 'نامه رسمی' } },
      { code: 'sermon', label: { en: 'Sermon/Spiritual', fa: 'موعظه/معنوی' } },
      { code: 'event', label: { en: 'Event', fa: 'رویداد' } },
      { code: 'prayer', label: { en: 'Prayer/Spiritual', fa: 'دعا/معنوی' } },
      { code: 'general', label: { en: 'General', fa: 'عمومی' } }
    ];
  }
}

const translationService = new TranslationService();
module.exports = { translationService };