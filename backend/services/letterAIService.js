// backend/services/letterAIService.js
// AI Service for Letter Management - Draft generation, improvement, and suggestions

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LETTER_PROMPTS = {
  draftLetter: `You are an expert in writing professional church correspondence in both English and Persian.

Letter Type: {type}
Recipient: {recipient}
Key Points:
{keyPoints}

Tone: {tone}
Language: {language}

Write a professional, warm, and appropriate letter for a church setting.
The letter should:
- Be respectful and professional
- Include appropriate Christian greetings
- Be clear and concise
- Maintain the specified tone
- Be written in {language}

Provide ONLY the letter body (without "Dear..." opening and signature closing).
The body should be 2-4 paragraphs.`,

  improveLetter: `You are an expert editor for professional church correspondence.

Please improve the following letter text:
"""
{text}
"""

Requirements:
- Fix grammar and spelling errors
- Improve clarity and flow
- Maintain professional church tone
- Keep the same message and meaning
- Make it more elegant and polished
- Keep it in the same language ({language})

Provide ONLY the improved version, nothing else.`,

  suggestSubject: `Based on this letter content:
"""
{text}
"""

Suggest a professional and concise subject line for this church letter in {language}.
Requirements:
- Maximum 8-10 words
- Professional tone
- Clear and descriptive

Provide ONLY the subject line, nothing else.`,

  expandPoints: `You are writing a church letter. Expand these key points into a well-written letter body:

Key Points:
{points}

Tone: {tone}
Language: {language}

Write a cohesive letter body (2-3 paragraphs) that incorporates all these points naturally.
Use appropriate church language and maintain a {tone} tone.

Provide ONLY the letter body.`
};

/**
 * Generate a letter draft using AI
 * @param {Object} params - Letter parameters
 * @returns {Promise<string>} Generated letter body
 */
async function draftLetter({
  type = 'custom',
  recipient,
  keyPoints = [],
  tone = 'professional',
  language = 'en'
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const languageName = language === 'en' ? 'English' : 'Persian (Farsi)';
    
    const prompt = LETTER_PROMPTS.draftLetter
      .replace(/{type}/g, type)
      .replace(/{recipient}/g, recipient || 'the recipient')
      .replace('{keyPoints}', keyPoints.length > 0 ? keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'None provided')
      .replace(/{tone}/g, tone)
      .replace(/{language}/g, languageName);
    
    const result = await model.generateContent(prompt);
    const draft = result.response.text().trim();
    
    return draft;
  } catch (error) {
    console.error('Draft generation error:', error);
    throw new Error(`Failed to generate letter draft: ${error.message}`);
  }
}

/**
 * Improve existing letter text
 * @param {string} text - Original letter text
 * @param {string} language - Language code
 * @returns {Promise<string>} Improved text
 */
async function improveLetter(text, language = 'en') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const languageName = language === 'en' ? 'English' : 'Persian';
    
    const prompt = LETTER_PROMPTS.improveLetter
      .replace('{text}', text)
      .replace(/{language}/g, languageName);
    
    const result = await model.generateContent(prompt);
    const improved = result.response.text().trim();
    
    return improved;
  } catch (error) {
    console.error('Letter improvement error:', error);
    throw new Error(`Failed to improve letter: ${error.message}`);
  }
}

/**
 * Suggest a subject line based on letter content
 * @param {string} bodyText - Letter body text
 * @param {string} language - Language code
 * @returns {Promise<string>} Suggested subject
 */
async function suggestSubject(bodyText, language = 'en') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const languageName = language === 'en' ? 'English' : 'Persian';
    
    const prompt = LETTER_PROMPTS.suggestSubject
      .replace('{text}', bodyText.substring(0, 500)) // Limit text length
      .replace(/{language}/g, languageName);
    
    const result = await model.generateContent(prompt);
    const subject = result.response.text().trim();
    
    // Remove quotes if AI added them
    return subject.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Subject suggestion error:', error);
    throw new Error(`Failed to suggest subject: ${error.message}`);
  }
}

/**
 * Expand key points into full letter body
 * @param {Array<string>} points - Key points to expand
 * @param {string} tone - Letter tone
 * @param {string} language - Language code
 * @returns {Promise<string>} Expanded letter body
 */
async function expandPoints(points, tone = 'professional', language = 'en') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const languageName = language === 'en' ? 'English' : 'Persian';
    
    const prompt = LETTER_PROMPTS.expandPoints
      .replace('{points}', points.map((p, i) => `${i + 1}. ${p}`).join('\n'))
      .replace(/{tone}/g, tone)
      .replace(/{language}/g, languageName);
    
    const result = await model.generateContent(prompt);
    const expanded = result.response.text().trim();
    
    return expanded;
  } catch (error) {
    console.error('Point expansion error:', error);
    throw new Error(`Failed to expand points: ${error.message}`);
  }
}

/**
 * Generate both English and Persian versions of a letter
 * @param {Object} params - Letter parameters
 * @returns {Promise<Object>} Both language versions
 */
async function generateBilingualLetter(params) {
  try {
    const [englishDraft, persianDraft] = await Promise.all([
      draftLetter({ ...params, language: 'en' }),
      draftLetter({ ...params, language: 'fa' })
    ]);
    
    return {
      en: englishDraft,
      fa: persianDraft
    };
  } catch (error) {
    console.error('Bilingual generation error:', error);
    throw new Error(`Failed to generate bilingual letter: ${error.message}`);
  }
}

module.exports = {
  draftLetter,
  improveLetter,
  suggestSubject,
  expandPoints,
  generateBilingualLetter
};
