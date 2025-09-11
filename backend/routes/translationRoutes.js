const express = require('express');
const { translationService } = require('../services/translationService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/translate - ترجمه متن
router.post('/', authenticateToken, async (req, res) => {
  const { text, fromLang, toLang, context = 'general' } = req.body;

  if (!text || !fromLang || !toLang) {
    return res.status(400).json({ 
      message: 'Missing required fields: text, fromLang, toLang' 
    });
  }

  if (!translationService.validateForTranslation(text)) {
    return res.status(400).json({ 
      message: 'Invalid text for translation' 
    });
  }

  try {
    const translation = await translationService.translateText(text, fromLang, toLang, context);
    res.json({ 
      originalText: text,
      translatedText: translation,
      fromLang,
      toLang,
      context 
    });
  } catch (error) {
    console.error('Translation API Error:', error);
    res.status(500).json({ 
      message: 'Translation failed', 
      error: error.message 
    });
  }
});

// POST /api/translate/auto - ترجمه خودکار به هردو زبان
router.post('/auto', authenticateToken, async (req, res) => {
  const { text, sourceLang, context = 'general' } = req.body;

  if (!text || !sourceLang) {
    return res.status(400).json({ 
      message: 'Missing required fields: text, sourceLang' 
    });
  }

  if (!translationService.validateForTranslation(text)) {
    return res.status(400).json({ 
      message: 'Invalid text for translation' 
    });
  }

  try {
    const translations = await translationService.autoTranslate(text, sourceLang, context);
    res.json(translations);
  } catch (error) {
    console.error('Auto Translation API Error:', error);
    res.status(500).json({ 
      message: 'Auto translation failed', 
      error: error.message 
    });
  }
});

// POST /api/translate/batch - ترجمه دسته‌ای
router.post('/batch', authenticateToken, async (req, res) => {
  const { texts, sourceLang } = req.body;

  if (!texts || !Array.isArray(texts) || !sourceLang) {
    return res.status(400).json({ 
      message: 'Missing required fields: texts (array), sourceLang' 
    });
  }

  try {
    const translations = await translationService.batchTranslate(texts, sourceLang);
    res.json({ translations });
  } catch (error) {
    console.error('Batch Translation API Error:', error);
    res.status(500).json({ 
      message: 'Batch translation failed', 
      error: error.message 
    });
  }
});

// GET /api/translate/languages - زبان‌های پشتیبانی شده
router.get('/languages', (req, res) => {
  const languages = translationService.getSupportedLanguages();
  res.json({ languages });
});

// GET /api/translate/contexts - زمینه‌های ترجمه
router.get('/contexts', (req, res) => {
  const contexts = translationService.getAvailableContexts();
  res.json({ contexts });
});

// POST /api/translate/test - تست سرویس ترجمه (برای توسعه)
router.post('/test', authenticateToken, async (req, res) => {
  const { text, fromLang, toLang, context } = req.body;
  
  try {
    const result = await translationService.translateText(
      text || 'Hello Church Family',
      fromLang || 'en', 
      toLang || 'fa',
      context || 'announcement'
    );
    
    res.json({ 
      success: true, 
      translation: result,
      service: 'Google Gemini',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;