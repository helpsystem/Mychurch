const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'سلام. لطفا تائید کن که برای OCR فارسی و اسناد رسمی آماده هستی.'
    });
    console.log("Gemini Response:", res.text);
  } catch (e) {
    console.error("Gemini test failed:", e.message);
  }
}

testGemini();
