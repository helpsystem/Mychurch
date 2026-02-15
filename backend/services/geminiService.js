/**
 * 🧠 Gemini AI Service
 * Centralized service for Google Gemini interactions
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

/**
 * Initialize Gemini Client
 */
function initGemini() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
            return null;
        }

        genAI = new GoogleGenerativeAI(apiKey);
        // Use the latest flash model for speed
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        console.log('✨ Gemini 2.0 Flash initialized');
    }
    return model;
}

/**
 * Transcribe Audio Buffer
 * @param {Buffer} audioBuffer - Audio data (mp3/wav/webm)
 * @param {string} mimeType - e.g. 'audio/webm'
 * @param {string} prompt - Optional context
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm', prompt = '') {
    try {
        const aiModel = initGemini();
        if (!aiModel) return '';

        const imageParts = [
            {
                inlineData: {
                    data: audioBuffer.toString('base64'),
                    mimeType: mimeType
                }
            }
        ];

        const result = await aiModel.generateContent([
            `Transcribe the following audio accurately. ${prompt}`,
            ...imageParts
        ]);

        return result.response.text();
    } catch (error) {
        console.error('Gemini Transcription Error:', error);
        return '';
    }
}

/**
 * Generate Text from Prompt
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function generateText(prompt) {
    try {
        const aiModel = initGemini();
        if (!aiModel) return '';

        const result = await aiModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini Generation Error:', error);
        return '';
    }
}

module.exports = {
    initGemini,
    transcribeAudio,
    generateText
};
