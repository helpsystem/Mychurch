/**
 * AI Chat Routes
 * Endpoints for Bible AI Assistant
 */

const express = require('express');
const router = express.Router();
const bibleAIService = require('../services/bibleAIService');

/**
 * POST /api/ai-chat/ask
 * Ask a question to the Bible AI Assistant
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, language = 'fa' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const response = await bibleAIService.generateAIResponse(question, language);
    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

/**
 * GET /api/ai-chat/daily-verse
 * Get today's devotional verse
 */
router.get('/daily-verse', async (req, res) => {
  try {
    const { language = 'fa' } = req.query;
    const verse = await bibleAIService.getDailyVerse(language);
    
    if (!verse) {
      return res.status(404).json({ error: 'Daily verse not found' });
    }
    
    res.json({
      reference: `${verse.book_name} ${verse.chapter_number}:${verse.verse_number}`,
      text: verse.text,
      book_code: verse.book_code,
      chapter: verse.chapter_number,
      verse: verse.verse_number
    });
  } catch (error) {
    console.error('Daily verse error:', error);
    res.status(500).json({ error: 'Failed to get daily verse' });
  }
});

/**
 * POST /api/ai-chat/search
 * Search verses by keyword
 */
router.post('/search', async (req, res) => {
  try {
    const { query, language = 'fa', limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const verses = await bibleAIService.searchVerses(query, language, limit);
    res.json({ verses });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/ai-chat/verse/:reference
 * Get verse by reference (e.g., "John 3:16")
 */
router.get('/verse/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { language = 'fa' } = req.query;
    
    const verse = await bibleAIService.getVerseByReference(reference, language);
    
    if (!verse) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    res.json({
      reference: `${verse.book_name} ${verse.chapter_number}:${verse.verse_number}`,
      text: verse.text,
      book_code: verse.book_code,
      chapter: verse.chapter_number,
      verse: verse.verse_number
    });
  } catch (error) {
    console.error('Get verse error:', error);
    res.status(500).json({ error: 'Failed to get verse' });
  }
});

/**
 * GET /api/ai-chat/context/:bookCode/:chapter/:verse
 * Get context around a verse
 */
router.get('/context/:bookCode/:chapter/:verse', async (req, res) => {
  try {
    const { bookCode, chapter, verse } = req.params;
    const { contextSize = 2 } = req.query;
    
    const verses = await bibleAIService.getVerseContext(
      bookCode,
      parseInt(chapter),
      parseInt(verse),
      parseInt(contextSize)
    );
    
    res.json({ verses });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({ error: 'Failed to get verse context' });
  }
});

/**
 * POST /api/ai-chat/cross-references
 * Get cross-references for keywords
 */
router.post('/cross-references', async (req, res) => {
  try {
    const { keywords, language = 'fa', limit = 3 } = req.body;
    
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }
    
    const verses = await bibleAIService.getCrossReferences(keywords, language, limit);
    res.json({ verses });
  } catch (error) {
    console.error('Cross-references error:', error);
    res.status(500).json({ error: 'Failed to get cross-references' });
  }
});

module.exports = router;
