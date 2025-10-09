// AI Routes for Church Website Backend
// Secure server-side AI functionality using Gemini

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System Instructions for different AI functions
const chatSystemInstruction = `You are "Al Hayat GPT", an AI assistant for the "Iranian Christian Church of Washington D.C.". Your purpose is to answer questions about Christianity, the Bible, and our church in a helpful, respectful, and theologically sound manner, consistent with mainstream evangelical beliefs. Your tone should be warm, encouraging, and pastoral. When relevant, you can refer to the church by its full name. Never provide medical, legal, or financial advice. If a user asks to speak with a real person, or expresses a need that requires human interaction (like counseling, urgent help, or a personal conversation), you MUST respond with ONLY the exact string "WHATSAPP_CONNECT" and nothing else.`;

const prayerSystemInstruction = "You are a Christian prayer assistant. Based on the user's request, write a short, respectful, and encouraging prayer. The prayer should be comforting and aligned with Christian teachings. Address God directly (e.g., 'Dear Heavenly Father', 'Lord Jesus').";

const contentWriterSystemInstruction = "You are a professional content writer for faith-based organizations. Based on the provided keywords, write a compelling and well-structured 'About Us' text for a Christian church website. The tone should be inviting, professional, and clearly articulate the church's identity and mission.";

const notificationImproverSystemInstruction = "You are an expert copy editor for church communications. A user will provide text for a push notification. Your task is to refine it to be clearer, more engaging, and concise, while maintaining a warm and inviting tone appropriate for a church community. If the text is bilingual (e.g., separated by a newline), refine both parts independently. Return only the improved text.";

// AI Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { history } = req.body;
        
        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: 'Invalid chat history provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const contents = history
            .filter(msg => !msg.isConnectingToWhatsapp && msg.text)
            .map(msg => ({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }],
            }));

        const result = await model.generateContent({
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topP: 1,
                topK: 32,
            },
            systemInstruction: chatSystemInstruction
        });

        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

// Prayer Generation endpoint
router.post('/generate-prayer', async (req, res) => {
    try {
        const { request } = req.body;
        
        if (!request || typeof request !== 'string') {
            return res.status(400).json({ error: 'Invalid prayer request provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `My prayer request is: ${request}` }] }],
            generationConfig: {
                temperature: 0.8,
                topP: 1,
                topK: 32,
            },
            systemInstruction: prayerSystemInstruction
        });

        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Prayer generation error:', error);
        res.status(500).json({ error: 'Failed to generate prayer' });
    }
});

// About Text Generation endpoint
router.post('/generate-about', async (req, res) => {
    try {
        const { keywords } = req.body;
        
        if (!keywords || typeof keywords !== 'string') {
            return res.status(400).json({ error: 'Invalid keywords provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Keywords: ${keywords}` }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 1,
                topK: 40,
            },
            systemInstruction: contentWriterSystemInstruction
        });

        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('About text generation error:', error);
        res.status(500).json({ error: 'Failed to generate about text' });
    }
});

// Text-to-Speech endpoint (Note: Gemini doesn't actually do TTS, this is a placeholder)
router.post('/text-to-speech', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Invalid text provided for TTS' });
        }

        // Note: Gemini doesn't actually provide TTS functionality
        // This would need to be integrated with a proper TTS service
        // For now, return a mock response to maintain compatibility
        const mockResponse = {
            audioB64: '', // Empty since we can't generate actual audio
            timedWords: text.split(' ').map((word, index) => ({
                word,
                startTime: index * 0.5,
                endTime: (index + 1) * 0.5
            }))
        };

        res.json(mockResponse);
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Failed to process text-to-speech' });
    }
});

// Notification Text Improvement endpoint
router.post('/improve-notification', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Invalid text provided for improvement' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text }] }],
            generationConfig: {
                temperature: 0.5,
            },
            systemInstruction: notificationImproverSystemInstruction
        });

        const response = await result.response;
        const improvedText = response.text();

        res.json({ text: improvedText });
    } catch (error) {
        console.error('Notification improvement error:', error);
        res.status(500).json({ error: 'Failed to improve notification text' });
    }
});

// Image Generation endpoint (Note: Using Gemini's image generation if available)
router.post('/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Invalid prompt provided for image generation' });
        }

        // Note: Image generation with Gemini might not be available in all regions
        // This endpoint provides the structure but may need alternative implementation
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            // Since Gemini image generation is not widely available, we'll return a placeholder
            // In production, you'd want to integrate with a proper image generation service
            res.status(501).json({ 
                error: 'Image generation not available in this configuration',
                message: 'Please configure alternative image generation service'
            });
            
        } catch (imageError) {
            console.error('Image generation not supported:', imageError);
            res.status(501).json({ 
                error: 'Image generation not supported',
                message: 'Alternative image service needed'
            });
        }
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

module.exports = router;