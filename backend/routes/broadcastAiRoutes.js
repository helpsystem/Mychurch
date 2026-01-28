/**
 * 🎬 Broadcast AI Routes
 * 
 * API endpoints برای:
 * - ترجمه با Gemini
 * - جستجوی هوشمند آیات
 * - تولید محتوا
 */

const express = require('express');
const router = express.Router();

// Gemini AI client
let genAI = null;
let model = null;

// Initialize Gemini
async function initGemini() {
  if (!genAI) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
      return null;
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

// Initialize on module load
initGemini();

/**
 * POST /api/broadcast-ai/translate
 * ترجمه متن
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body;
    
    if (!text || !fromLang || !toLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        original: text,
        translated: text,
        fromLang,
        toLang
      });
    }
    
    const fromLangName = fromLang === 'fa' ? 'Persian' : 'English';
    const toLangName = toLang === 'fa' ? 'Persian' : 'English';
    
    const prompt = `Translate the following text from ${fromLangName} to ${toLangName}. 
Only return the translated text, nothing else.

Text to translate:
${text}`;

    const result = await aiModel.generateContent(prompt);
    const translated = result.response.text().trim();
    
    res.json({
      original: text,
      translated,
      fromLang,
      toLang
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      original: req.body.text,
      translated: req.body.text,
      fromLang: req.body.fromLang,
      toLang: req.body.toLang
    });
  }
});

/**
 * POST /api/broadcast-ai/scripture-search
 * جستجوی هوشمند آیات کتاب مقدس
 */
router.post('/scripture-search', async (req, res) => {
  try {
    const { query, lang = 'fa', maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }
    
    const prompt = `You are a Bible expert. Find ${maxResults} relevant Bible verses for the following query.
Return ONLY a JSON array with this format:
[
  {
    "reference": "Book Chapter:Verse",
    "text": {
      "fa": "Persian text of the verse",
      "en": "English text of the verse"
    },
    "relevanceScore": 0.95
  }
]

Query: ${query}
Language preference: ${lang === 'fa' ? 'Persian' : 'English'}

Return only the JSON array, no markdown or explanation.`;

    const result = await aiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Clean up response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const verses = JSON.parse(responseText);
      res.json(verses);
    } catch (parseError) {
      console.error('Parse error:', parseError, responseText);
      res.json([]);
    }
  } catch (error) {
    console.error('Scripture search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * POST /api/broadcast-ai/scripture-suggest
 * پیشنهاد آیه بر اساس موضوع
 */
router.post('/scripture-suggest', async (req, res) => {
  try {
    const { topic, lang = 'fa' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }
    
    const prompt = `Suggest 5 Bible verses related to the topic "${topic}" for a church broadcast.
Return ONLY a JSON array with this format:
[
  {
    "reference": "Book Chapter:Verse",
    "text": {
      "fa": "Persian text",
      "en": "English text"
    },
    "relevanceScore": 0.95,
    "suggestions": ["Related topic 1", "Related topic 2"]
  }
]

Return only the JSON array, no markdown or explanation.`;

    const result = await aiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const verses = JSON.parse(responseText);
      res.json(verses);
    } catch (parseError) {
      res.json([]);
    }
  } catch (error) {
    console.error('Scripture suggestion error:', error);
    res.status(500).json({ error: 'Suggestion failed' });
  }
});

/**
 * POST /api/broadcast-ai/content-suggest
 * پیشنهاد محتوای هوشمند
 */
router.post('/content-suggest', async (req, res) => {
  try {
    const { context, lang = 'fa' } = req.body;
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }
    
    const prompt = `Suggest content for a church broadcast based on this context:
- Occasion: ${context.occasion || 'Sunday service'}
- Theme: ${context.theme || 'General worship'}
- Current songs: ${context.currentSongs?.join(', ') || 'None'}
- Current scriptures: ${context.currentScriptures?.join(', ') || 'None'}

Return ONLY a JSON array with suggestions:
[
  {
    "type": "scripture" or "song" or "announcement" or "prayer",
    "title": "Suggestion title",
    "content": {
      "fa": "Persian content",
      "en": "English content"
    },
    "reason": "Why this is suggested"
  }
]

Return only the JSON array, no markdown.`;

    const result = await aiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const suggestions = JSON.parse(responseText);
      res.json(suggestions);
    } catch (parseError) {
      res.json([]);
    }
  } catch (error) {
    console.error('Content suggestion error:', error);
    res.status(500).json({ error: 'Suggestion failed' });
  }
});

/**
 * POST /api/broadcast-ai/lower-third
 * تولید متن Lower Third
 */
router.post('/lower-third', async (req, res) => {
  try {
    const { speakerName, role, context, lang = 'fa' } = req.body;
    
    const aiModel = await initGemini();
    if (!aiModel) {
      // Fallback without AI
      return res.json({
        fa: speakerName,
        en: speakerName
      });
    }
    
    const prompt = `Create a professional lower third title for a church broadcast.
Speaker: ${speakerName}
Role: ${role || 'Speaker'}
Context: ${context || 'Church service'}

Return ONLY a JSON object:
{
  "fa": "Professional Persian title with name and role",
  "en": "Professional English title with name and role"
}

Keep it concise and professional. Return only the JSON.`;

    const result = await aiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const titles = JSON.parse(responseText);
      res.json(titles);
    } catch (parseError) {
      res.json({ fa: speakerName, en: speakerName });
    }
  } catch (error) {
    console.error('Lower third generation error:', error);
    res.json({ fa: req.body.speakerName, en: req.body.speakerName });
  }
});

/**
 * POST /api/broadcast-ai/generate-prayer
 * تولید متن دعا
 */
router.post('/generate-prayer', async (req, res) => {
  try {
    const { topic, style = 'medium', lang = 'fa' } = req.body;
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }
    
    const lengthGuide = {
      short: '2-3 sentences',
      medium: '1 paragraph',
      full: '2-3 paragraphs'
    };
    
    const prompt = `Write a Christian prayer about "${topic}".
Length: ${lengthGuide[style]}
Style: Reverent and heartfelt

Return ONLY a JSON object:
{
  "fa": "Persian prayer text",
  "en": "English prayer text"
}

Return only the JSON, no markdown.`;

    const result = await aiModel.generateContent(prompt);
    let responseText = result.response.text().trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      const prayer = JSON.parse(responseText);
      res.json(prayer);
    } catch (parseError) {
      res.json({ fa: topic, en: topic });
    }
  } catch (error) {
    console.error('Prayer generation error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

/**
 * POST /api/broadcast-ai/correct-persian
 * اصلاح متن فارسی
 */
router.post('/correct-persian', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const aiModel = await initGemini();
    if (!aiModel) {
      return res.json({ corrected: text });
    }
    
    const prompt = `Correct any spelling or grammar errors in this Persian text. 
Keep the original meaning. Return only the corrected text, nothing else.

Text: ${text}`;

    const result = await aiModel.generateContent(prompt);
    const corrected = result.response.text().trim();
    
    res.json({ corrected });
  } catch (error) {
    console.error('Persian correction error:', error);
    res.json({ corrected: req.body.text });
  }
});

/**
 * POST /api/broadcast-ai/format-date
 * فرمت تاریخ دوزبانه
 */
router.post('/format-date', async (req, res) => {
  try {
    const { date } = req.body;
    const dateObj = new Date(date);
    
    // Use Intl for formatting
    const faDate = dateObj.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const enDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    res.json({ fa: faDate, en: enDate });
  } catch (error) {
    console.error('Date formatting error:', error);
    res.status(500).json({ error: 'Formatting failed' });
  }
});

/**
 * POST /api/broadcast-ai/summarize
 * خلاصه‌سازی متن
 */
router.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength = 100, lang = 'fa' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // If text is already short, return as is
    if (text.length <= maxLength) {
      return res.json({ summary: text });
    }
    
    const aiModel = await initGemini();
    if (!aiModel) {
      // Fallback: simple truncation
      return res.json({ 
        summary: text.substring(0, maxLength - 3) + '...'
      });
    }
    
    const prompt = `Summarize this text in ${maxLength} characters or less in ${lang === 'fa' ? 'Persian' : 'English'}.
Return only the summary, nothing else.

Text: ${text}`;

    const result = await aiModel.generateContent(prompt);
    const summary = result.response.text().trim();
    
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.json({ summary: req.body.text.substring(0, req.body.maxLength - 3) + '...' });
  }
});

module.exports = router;
