// backend/routes/translateRoutes.js
// Translation API Routes with Rate Limiting

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    translateWithContext,
    batchTranslate,
    suggestAlternatives
} = require('../services/translationService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting for translation (already defined in server.js for /api/ai/)
// This will use the AI limiter: 50 requests/hour

/**
 * POST /api/translate
 * Simple translation endpoint (no auth required for public use)
 * Supports: persian, english, finglish
 */
router.post('/', async (req, res) => {
    try {
        const { text, targetLanguage = 'english', type = 'general' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 10000) {
            return res.status(400).json({ error: 'Text too long. Maximum 10000 characters.' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let systemInstruction = '';
        let userPrompt = '';

        if (targetLanguage === 'persian') {
            systemInstruction = `You are a professional translator. Translate text to fluent, formal Iranian Persian (Farsi).
For ${type === 'lyrics' ? 'worship song lyrics' : 'general text'}:
- Use natural, native-sounding Persian
- Keep the emotional tone and meaning
- For religious content, use standard Christian Persian terminology`;
            userPrompt = `Translate the following to Persian (Farsi). Return ONLY the translation, nothing else:\n\n${text}`;
        } else if (targetLanguage === 'english') {
            systemInstruction = `You are a professional translator. Translate text to fluent English.
For ${type === 'lyrics' ? 'worship song lyrics' : 'general text'}:
- Use natural, flowing English
- Keep the emotional tone and meaning
- For religious content, use standard Christian terminology`;
            userPrompt = `Translate the following to English. Return ONLY the translation, nothing else:\n\n${text}`;
        } else if (targetLanguage === 'finglish') {
            systemInstruction = `You are a transliteration expert. Convert text to Finglish (Persian language written using English alphabet).
Rules:
- If input is English, first translate to Persian, then transliterate
- Use standard Finglish spelling conventions
- Keep the text readable for Persian speakers using English keyboard
- Common examples: "سلام" → "salam", "خدا" → "khoda", "عشق" → "eshgh"`;
            userPrompt = `Convert the following to Finglish (Persian using English letters). Return ONLY the transliteration, nothing else:\n\n${text}`;
        } else {
            return res.status(400).json({ error: 'Invalid target language. Use: persian, english, or finglish' });
        }

        const result = await model.generateContent({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096
            }
        });

        const translation = result.response.text()?.trim();

        if (!translation) {
            throw new Error('Empty response from translation service');
        }

        console.log(`✅ Translation (${targetLanguage}): ${text.substring(0, 50)}... → ${translation.substring(0, 50)}...`);

        res.json({
            translation,
            targetLanguage,
            type,
            originalLength: text.length,
            translatedLength: translation.length
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

/**
 * POST /api/translate/smart
 * Smart translation with context awareness
 */
router.post('/smart', authenticateToken, async (req, res) => {
    try {
        const {
            text,
            sourceLang = 'en',
            targetLang = 'fa',
            context = 'general',
            quality = 'professional'
        } = req.body;

        // Validate required fields
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        // Perform translation
        const result = await translateWithContext({
            text,
            sourceLang,
            targetLang,
            context,
            quality
        });

        res.json(result);

    } catch (error) {
        console.error('Smart translation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Translation failed'
        });
    }
});

/**
 * POST /api/translate/batch
 * Batch translate multiple texts
 */
router.post('/batch', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const { texts, sourceLang, targetLang, context, quality } = req.body;

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Texts array is required'
            });
        }

        if (texts.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 texts allowed per batch'
            });
        }

        const results = await batchTranslate(texts, {
            sourceLang,
            targetLang,
            context,
            quality
        });

        res.json({
            success: true,
            translations: results,
            totalProcessed: results.length,
            successfulTranslations: results.filter(r => r.success).length
        });

    } catch (error) {
        console.error('Batch translation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Batch translation failed'
        });
    }
});

/**
 * POST /api/translate/alternatives
 * Get alternative translation suggestions
 */
router.post('/alternatives', authenticateToken, async (req, res) => {
    try {
        const { text, sourceLang, targetLang, context } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const alternatives = await suggestAlternatives({
            text,
            sourceLang,
            targetLang,
            context
        });

        res.json({
            success: true,
            alternatives,
            count: alternatives.length
        });

    } catch (error) {
        console.error('Alternatives error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate alternatives'
        });
    }
});

/**
 * GET /api/translate/contexts
 * Get available translation contexts
 */
router.get('/contexts', authenticateToken, (req, res) => {
    const contexts = [
        { value: 'general', label: 'General Content' },
        { value: 'leader-bio', label: 'Leader Biography' },
        { value: 'leader-title', label: 'Leader Title' },
        { value: 'sermon', label: 'Sermon Content' },
        { value: 'event', label: 'Event Information' },
        { value: 'announcement', label: 'Announcement' }
    ];

    res.json({
        success: true,
        contexts
    });
});

/**
 * GET /api/translate/stats
 * Get translation statistics (admin only)
 */
router.get('/stats', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
    try {
        // This could be enhanced with actual database tracking
        res.json({
            success: true,
            stats: {
                totalTranslations: 0, // Would come from database
                thisMonth: 0,
                averageLength: 0,
                mostUsedContext: 'leader-bio'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
