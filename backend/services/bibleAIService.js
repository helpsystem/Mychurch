/**
 * Bible AI Assistant Service
 * Provides AI-powered Bible study assistance, scripture search, and spiritual guidance
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Search verses by keyword
 */
async function searchVerses(query, language = 'fa', limit = 5) {
  try {
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
      WHERE LOWER(v.${textField}) LIKE LOWER($1)
        AND v.${textField} NOT LIKE 'آیه%'
        AND v.${textField} NOT LIKE 'Verse%'
      ORDER BY b.id, c.chapter_number, v.verse_number
      LIMIT $2
    `, [`%${query}%`, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Search error:', error);
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
 * Generate AI response using simple pattern matching
 * (Can be upgraded to use OpenAI GPT later)
 */
async function generateAIResponse(userQuestion, language = 'fa') {
  const question = userQuestion.toLowerCase();
  
  // Pattern matching for common questions
  const patterns = {
    peace: {
      keywords: ['peace', 'صلح', 'آرامش', 'سکون'],
      verses: [
        { ref: 'JHN 14:27', fa: 'یوحنا', en: 'John' },
        { ref: 'PHP 4:7', fa: 'فیلیپیان', en: 'Philippians' },
        { ref: 'ISA 26:3', fa: 'اشعیا', en: 'Isaiah' }
      ]
    },
    love: {
      keywords: ['love', 'محبت', 'عشق'],
      verses: [
        { ref: 'JHN 3:16', fa: 'یوحنا', en: 'John' },
        { ref: '1CO 13:4', fa: '۱ قرنتیان', en: '1 Corinthians' },
        { ref: 'ROM 8:38', fa: 'رومیان', en: 'Romans' }
      ]
    },
    hope: {
      keywords: ['hope', 'امید', 'رجاء'],
      verses: [
        { ref: 'JER 29:11', fa: 'ارمیا', en: 'Jeremiah' },
        { ref: 'ROM 15:13', fa: 'رومیان', en: 'Romans' },
        { ref: 'PSA 42:11', fa: 'مزامیر', en: 'Psalms' }
      ]
    },
    strength: {
      keywords: ['strength', 'قوت', 'نیرو', 'توان'],
      verses: [
        { ref: 'PHP 4:13', fa: 'فیلیپیان', en: 'Philippians' },
        { ref: 'ISA 40:31', fa: 'اشعیا', en: 'Isaiah' },
        { ref: 'PSA 46:1', fa: 'مزامیر', en: 'Psalms' }
      ]
    }
  };
  
  // Find matching pattern
  let matchedPattern = null;
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.keywords.some(kw => question.includes(kw))) {
      matchedPattern = pattern;
      break;
    }
  }
  
  if (!matchedPattern) {
    // Default: search for keywords in the question
    const words = question.split(/\s+/).filter(w => w.length > 3);
    const verses = await searchVerses(words[0] || 'خدا', language, 3);
    
    return {
      answer: language === 'fa' 
        ? 'بر اساس سوال شما، این آیات ممکن است مفید باشند:'
        : 'Based on your question, these verses might be helpful:',
      verses: verses.map(v => ({
        reference: `${v.book_name} ${v.chapter_number}:${v.verse_number}`,
        text: v.text,
        book_code: v.book_code,
        chapter: v.chapter_number,
        verse: v.verse_number
      })),
      suggestion: language === 'fa'
        ? 'برای پاسخ بهتر، سوال خود را واضح‌تر بیان کنید.'
        : 'For better results, please be more specific with your question.'
    };
  }
  
  // Get verses for matched pattern
  const versePromises = matchedPattern.verses.map(async (v) => {
    const [bookCode, ref] = v.ref.split(' ');
    const [chapter, verse] = ref.split(':');
    
    const result = await pool.query(`
      SELECT 
        b.name_${language} as book_name,
        b.code as book_code,
        c.chapter_number,
        v.verse_number,
        v.text_${language} as text
      FROM bible_verses v
      JOIN bible_chapters c ON v.chapter_id = c.id
      JOIN bible_books b ON c.book_id = b.id
      WHERE b.code = $1
        AND c.chapter_number = $2
        AND v.verse_number = $3
    `, [bookCode, parseInt(chapter), parseInt(verse)]);
    
    return result.rows[0];
  });
  
  const verses = (await Promise.all(versePromises)).filter(v => v);
  
  return {
    answer: language === 'fa'
      ? 'کتاب مقدس در مورد این موضوع می‌فرماید:'
      : 'The Bible says about this topic:',
    verses: verses.map(v => ({
      reference: `${v.book_name} ${v.chapter_number}:${v.verse_number}`,
      text: v.text,
      book_code: v.book_code,
      chapter: v.chapter_number,
      verse: v.verse_number
    })),
    suggestion: language === 'fa'
      ? 'برای مطالعه بیشتر، این آیات را با یکدیگر مقایسه کنید.'
      : 'For further study, compare these verses together.'
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
