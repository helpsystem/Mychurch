// backend/services/translationService.js
// AI-Powered Translation Service with Context Awareness

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Context-specific prompts for different content types
const CONTEXT_PROMPTS = {
  'leader-bio': {
    system: 'You are a professional translator specializing in church leadership biographies.',
    requirements: [
      'Use formal, respectful Persian language',
      'Maintain Christian/Biblical terminology accurately',
      'Keep the same professional tone and style',
      'Preserve any Bible verse references in standard format',
      'Ensure natural, native-sounding translation'
    ]
  },
  'leader-title': {
    system: 'You are translating church leadership titles.',
    requirements: [
      'Use standard Persian church terminology',
      'Keep it concise and respectful',
      'Use common Persian equivalents for positions'
    ]
  },
  'sermon': {
    system: 'You are translating sermon descriptions and titles.',
    requirements: [
      'Keep theological concepts accurate and precise',
      'Maintain inspirational and encouraging tone',
      'Preserve Bible references in standard format (Book Chapter:Verse)',
      'Use appropriate Christian terminology in Persian'
    ]
  },
  'event': {
    system: 'You are translating church event information.',
    requirements: [
      'Maintain inviting, welcoming tone',
      'Keep times and dates clear if mentioned',
      'Use appropriate event-related terminology',
      'Make it engaging and encouraging'
    ]
  },
  'announcement': {
    system: 'You are translating church announcements.',
    requirements: [
      'Keep the tone clear and informative',
      'Maintain urgency level of original',
      'Preserve any important dates, times, or contact information',
      'Use appropriate formal church language'
    ]
  },
  'general': {
    system: 'You are a professional translator for church content.',
    requirements: [
      'Maintain appropriate tone and style',
      'Keep Christian terminology accurate',
      'Ensure natural, fluent translation'
    ]
  }
};

/**
 * Translate text with context awareness
 * @param {Object} params - Translation parameters
 * @param {string} params.text - Text to translate
 * @param {string} params.sourceLang - Source language ('en' or 'fa')
 * @param {string} params.targetLang - Target language ('en' or 'fa')
 * @param {string} params.context - Content context (leader-bio, sermon, event, etc.)
 * @param {string} params.quality - Quality level (quick, professional, literary)
 * @returns {Promise<Object>} Translation result
 */
async function translateWithContext({
  text,
  sourceLang = 'en',
  targetLang = 'fa',
  context = 'general',
  quality = 'professional'
}) {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for translation');
    }

    if (text.length > 5000) {
      throw new Error('Text is too long. Maximum 5000 characters allowed.');
    }

    // Get context prompt or use general
    const contextPrompt = CONTEXT_PROMPTS[context] || CONTEXT_PROMPTS['general'];

    const sourceLangName = sourceLang === 'en' ? 'English' : 'Persian (Farsi)';
    const targetLangName = targetLang === 'fa' ? 'Persian (Farsi)' : 'English';

    // Build the prompt
    const prompt = `${contextPrompt.system}

Translate the following text from ${sourceLangName} to ${targetLangName}.

Requirements:
${contextPrompt.requirements.map(r => `- ${r}`).join('\n')}

Quality Level: ${quality}
- "professional" means accurate, polished, and natural
- "quick" means fast but still accurate
- "literary" means elegant and formal

Text to translate:
"""
${text.trim()}
"""

IMPORTANT: Provide ONLY the ${targetLangName} translation. Do not include any explanations, notes, or the original text. Just the translation.`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const translation = result.response.text().trim();

    // Remove any quotation marks that AI might add
    const cleanedTranslation = translation.replace(/^["']|["']$/g, '');

    return {
      success: true,
      translation: cleanedTranslation,
      sourceLang,
      targetLang,
      context,
      confidence: 0.95, // Could be enhanced with actual confidence scoring
      characterCount: cleanedTranslation.length
    };

  } catch (error) {
    console.error('Translation error:', error);

    // Handle specific errors
    if (error.message?.includes('API key')) {
      throw new Error('Translation service configuration error');
    }

    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Batch translate multiple texts with same context
 * @param {Array} texts - Array of texts to translate
 * @param {Object} options - Translation options
 * @returns {Promise<Array>} Array of translations
 */
async function batchTranslate(texts, options) {
  const translations = [];

  for (const text of texts) {
    try {
      const result = await translateWithContext({ text, ...options });
      translations.push(result);
    } catch (error) {
      translations.push({
        success: false,
        error: error.message,
        originalText: text
      });
    }
  }

  return translations;
}

/**
 * Suggest alternative translations
 * @param {Object} params - Same as translateWithContext
 * @returns {Promise<Array>} Array of alternative translations
 */
async function suggestAlternatives(params) {
  const prompt = `Provide 3 different translation variations for the following text.
Each variation should have a slightly different tone or word choice, but all should be accurate.

${params.text}

Format your response as:
1. [First variation]
2. [Second variation]
3. [Third variation]`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the numbered list
    const alternatives = response
      .split('\n')
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return alternatives.slice(0, 3); // Ensure max 3 alternatives
  } catch (error) {
    console.error('Alternative generation error:', error);
    return [];
  }
}

module.exports = {
  translateWithContext,
  batchTranslate,
  suggestAlternatives
};