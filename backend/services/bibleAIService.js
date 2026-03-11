/**
 * Bible AI Assistant Service
 * Provides AI-powered Bible study assistance, scripture search, and spiritual guidance
 */

const https = require('https');
const { pool } = require('../db-postgres'); // Use shared pool
require('dotenv').config();

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Test database connection on startup
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Bible AI Service: Database connection OK');
    return true;
  } catch (error) {
    console.error('⚠️  Bible AI Service: Database connection failed (continuing):', error.message);
    return false;
  }
}

// Skip connection test for now (Supabase timeout)
// testConnection();

/**
 * Execute query with timeout
 */
async function executeWithTimeout(queryFunc, timeoutMs = 5000) {
  return Promise.race([
    queryFunc(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
}

/**
 * Search verses by keyword
 */
async function searchVerses(query, language = 'fa', limit = 5) {
  try {
    const textField = language === 'fa' ? 'text_fa' : 'text_en';
    const nameField = language === 'fa' ? 'name_fa' : 'name_en';

    const result = await executeWithTimeout(async () => {
      return await pool.query(`
        SELECT 
          b.${nameField} as book_name,
          b.code as book_code,
          c.chapter_number,
          v.verse_number,
          v.${textField} as text
        FROM bible_verses v
        JOIN bible_chapters c ON v.chapter_id = c.id
        JOIN bible_books b ON c.book_id = b.id
        WHERE LOWER(v.${textField}) LIKE LOWER($1)
          AND v.${textField} NOT LIKE 'آیه%'
          AND v.${textField} NOT LIKE 'Verse%'
        ORDER BY b.id, c.chapter_number, v.verse_number
        LIMIT $2
      `, [`%${query}%`, limit]);
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Search error:', error.message);
    return [];
  }
}

/**
 * Get verse by reference (e.g., "John 3:16")
 */
async function getVerseByReference(reference, language = 'fa') {
  try {
    // Parse reference (e.g., "John 3:16" or "یوحنا 3:16")
    const match = reference.match(/([a-zA-Zآ-ی۰-۹\s]+)\s*(\d+):(\d+)/i);
    if (!match) return null;

    const [_, bookName, chapter, verse] = match;
    const textField = language === 'fa' ? 'text_fa' : 'text_en';
    const nameField = language === 'fa' ? 'name_fa' : 'name_en';

    const result = await pool.query(`
      SELECT 
        b.${nameField} as book_name,
        b.code as book_code,
        c.chapter_number,
        v.verse_number,
        v.${textField} as text
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE (
        LOWER(b.${nameField}) LIKE LOWER($1)
        OR LOWER(b.code) = LOWER($1)
      )
      AND c.chapter_number = $2
      AND v.verse_number = $3
    `, [bookName.trim(), parseInt(chapter), parseInt(verse)]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Get verse error:', error);
    return null;
  }
}

/**
 * Get context around a verse (verses before and after)
 */
async function getVerseContext(bookCode, chapterNum, verseNum, contextSize = 2) {
  try {
    const result = await pool.query(`
      SELECT 
        v.verse_number,
        v.text_fa,
        v.text_en
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE b.code = $1
        AND c.chapter_number = $2
        AND v.verse_number BETWEEN $3 AND $4
      ORDER BY v.verse_number
    `, [
      bookCode,
      chapterNum,
      Math.max(1, verseNum - contextSize),
      verseNum + contextSize
    ]);

    return result.rows;
  } catch (error) {
    console.error('Get context error:', error);
    return [];
  }
}

/**
 * Get cross-references (verses with similar themes)
 */
async function getCrossReferences(keywords, language = 'fa', limit = 3) {
  try {
    const textField = language === 'fa' ? 'text_fa' : 'text_en';

    // Search for verses containing any of the keywords
    const keywordConditions = keywords.map((_, i) =>
      `LOWER(v.${textField}) LIKE LOWER($${i + 1})`
    ).join(' OR ');

    const result = await pool.query(`
      SELECT 
        b.code as book_code,
        b.name_${language} as book_name,
        c.chapter_number,
        v.verse_number,
        v.${textField} as text
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE (${keywordConditions})
        AND v.${textField} NOT LIKE 'آیه%'
        AND v.${textField} NOT LIKE 'Verse%'
      ORDER BY RANDOM()
      LIMIT $${keywords.length + 1}
    `, [...keywords.map(k => `%${k}%`), limit]);

    return result.rows;
  } catch (error) {
    console.error('Cross-references error:', error);
    return [];
  }
}

/**
 * Call Gemini API for AI-powered responses
 */
/**
 * Call AI Provider (Prioritizes OpenRouter, falls back to Gemini Native if needed)
 */
async function callAIProvider(prompt, language = 'fa') {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const LOCAL_AI_URL = process.env.LOCAL_AI_URL; // e.g. http://127.0.0.1:11434/v1/chat/completions
  const LOCAL_AI_MODEL = process.env.LOCAL_AI_MODEL || 'llama3';

  // 1. Try Local AI First (If Configured)
  if (LOCAL_AI_URL) {
    console.log(`Trying Local AI at ${LOCAL_AI_URL} with model ${LOCAL_AI_MODEL}...`);
    try {
      const result = await new Promise((resolve, reject) => {
        const requestData = JSON.stringify({
          model: LOCAL_AI_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        });

        const url = new URL(LOCAL_AI_URL);
        const requestModule = url.protocol === 'https:' ? require('https') : require('http');

        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestData) },
          timeout: 30000 // Local AI might be slower
        };

        const req = requestModule.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.choices && response.choices[0]?.message?.content) {
                resolve(response.choices[0].message.content);
              } else {
                resolve(null);
              }
            } catch (e) {
              console.error('Local AI Parse Error:', e);
              resolve(null);
            }
          });
        });
        req.on('error', (e) => {
          console.error('Local AI Req Error:', e.message);
          resolve(null);
        });
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(requestData);
        req.end();
      });

      if (result) return result;
    } catch (err) {
      console.error('Local AI exception, falling back...', err.message);
    }
  }

  // 2. Try OpenRouter Next
  if (OPENROUTER_API_KEY) {
    return new Promise((resolve, reject) => {
      const requestData = JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free", // Use a free/good model on OpenRouter
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        top_p: 1,
        temperature: 0.7,
        repetition_penalty: 1,
      });

      const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://samanabyar.online', // Required by OpenRouter
          'X-Title': 'Mychurch', // Required by OpenRouter
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        },
        timeout: 20000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.choices && response.choices[0]?.message?.content) {
              resolve(response.choices[0].message.content);
            } else if (response.error) {
              console.error('OpenRouter API Error:', response.error);
              resolve(null);
            } else {
              console.warn('Unexpected OpenRouter response:', data.substring(0, 200));
              resolve(null);
            }
          } catch (error) {
            console.error('Failed to parse OpenRouter response:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (e) => {
        console.error('OpenRouter Request Error:', e);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('OpenRouter Request Timeout');
        resolve(null);
      });

      req.write(requestData);
      req.end();
    });
  }

  // 2. Fallback to Gemini Native Only if OpenRouter is missing
  if (GEMINI_API_KEY) {
    console.log('Falling back to Gemini Native API...');
    return new Promise((resolve, reject) => {
      const requestData = JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      const url = new URL(GEMINI_API_URL + `?key=${GEMINI_API_KEY}`);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestData) },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
              resolve(response.candidates[0].content.parts[0].text);
            } else {
              resolve(null);
            }
          } catch (e) { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(requestData);
      req.end();
    });
  }

  return null;
}

/**
 * Generate AI response using simple pattern matching
 * (Can be upgraded to use OpenAI GPT later)
 */
async function generateAIResponse(userQuestion, language = 'fa') {
  const question = userQuestion.toLowerCase();

  // Step 1: Search for relevant verses
  const words = question.split(/\s+/).filter(w => w.length > 3);
  const searchKeywords = words.slice(0, 3).join(' ') || 'خدا';
  const verses = await searchVerses(searchKeywords, language, 5);

  // Step 2: Build context from verses
  let versesContext = '';
  if (verses.length > 0) {
    versesContext = language === 'fa'
      ? '\n\nآیات مرتبط از کتاب مقدس:\n\n'
      : '\n\nRelevant Bible verses:\n\n';

    verses.forEach((v, i) => {
      versesContext += `${i + 1}. ${v.book_name} ${v.chapter_number}:${v.verse_number}\n"${v.text}"\n\n`;
    });
  }

  // Step 3: Create prompt for Gemini / Local AI
  const prompt = language === 'fa'
    ? `شما یک شبان و راهنمای معنوی مسیحی متخصص در الهیات هستید.
منحصراً از دیدگاه کتاب مقدس و بر مبنای الهیات ارتدوکس مسیحی پاسخ دهید.

سوال کاربر: "${userQuestion}"
${versesContext}

دستورالعمل‌ها:
1. با محبت، فیض و حقیقت که در شخصیت عیسی مسیح یافت می‌شود پاسخ دهید.
2. از آیات ذکر شده به شکل مستقیم استفاده کنید و زمینه تاریخی و الهیاتی آنها را توضیح دهید.
3. در صورت نیاز، کاربردهای عملی برای زندگی ایماندارانه امروز ارائه دهید.
4. اگر سوال شامل مفاهیم پیچیده است، آن را با زبانی ساده، اما عمیق توضیح دهید.
5. پاسخ باید روشن، بدون سوگیری فرقه‌ای خاص (صرفاً کتاب مقدسی) و حداکثر در 400 کلمه باشد.

پاسخ شما:`
    : `You are a pastor and Christian spiritual guide specializing in theology.
Answer exclusively from a biblical worldview and orthodox Christian theology.

User's question: "${userQuestion}"
${versesContext}

Instructions:
1. Respond with the love, grace, and truth found in Jesus Christ.
2. Directly apply the provided verses, explaining their historical and theological context.
3. Provide practical, modern-day applications for a faithful life.
4. If the question involves complex concepts, explain them simply yet profoundly.
5. Ensure the response is clear, non-denominational (strictly biblical), and max 400 words.

Your response:`;

  // Step 4: Try to get AI response from OpenRouter/Gemini
  let aiAnswer = await callAIProvider(prompt, language);

  // Step 5: Fallback if AI fails
  if (!aiAnswer) {
    aiAnswer = language === 'fa'
      ? `بر اساس کتاب مقدس، در پاسخ به سوال شما:\n\nخداوند در کلام خود راهنمایی‌های عمیقی در این زمینه ارائه می‌دهد. آیات بالا نشان می‌دهند که خداوند همیشه با ما است و ما را در هر شرایطی یاری می‌کند.\n\nتوصیه می‌شود این آیات را با دقت مطالعه کنید و در دعا با خداوند درباره آنها صحبت کنید. او پاسخ شما را خواهد داد.`
      : `Based on the Bible, in response to your question:\n\nThe Lord provides deep guidance in His Word on this matter. The verses above show that God is always with us and helps us in every situation.\n\nI recommend studying these verses carefully and talking to the Lord about them in prayer. He will answer you.`;
  }

  return {
    answer: aiAnswer,
    verses: verses.map(v => ({
      reference: `${v.book_name} ${v.chapter_number}:${v.verse_number}`,
      text: v.text,
      book_code: v.book_code,
      chapter: v.chapter_number,
      verse: v.verse_number
    })),
    hasAI: !!(process.env.LOCAL_AI_URL || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY),
    source: aiAnswer ? (process.env.LOCAL_AI_URL ? 'local_ai' : (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'gemini')) : 'fallback'
  };
}

/**
 * Get daily devotional verse
 */
async function getDailyVerse(language = 'fa') {
  try {
    // Use date as seed for consistent daily verse
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);

    const textField = language === 'fa' ? 'text_fa' : 'text_en';
    const nameField = language === 'fa' ? 'name_fa' : 'name_en';

    const result = await pool.query(`
      SELECT 
        b.${nameField} as book_name,
        b.code as book_code,
        c.chapter_number,
        v.verse_number,
        v.${textField} as text
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE v.${textField} NOT LIKE 'آیه%'
        AND v.${textField} NOT LIKE 'Verse%'
        AND LENGTH(v.${textField}) BETWEEN 50 AND 200
      ORDER BY b.id, c.chapter_number, v.verse_number
      LIMIT 1 OFFSET $1
    `, [dayOfYear % 365]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Daily verse error:', error);
    return null;
  }
}

module.exports = {
  searchVerses,
  getVerseByReference,
  getVerseContext,
  getCrossReferences,
  generateAIResponse,
  getDailyVerse
};
