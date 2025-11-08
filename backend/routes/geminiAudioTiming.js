// backend/routes/geminiAudioTiming.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

/**
 * POST /api/gemini-timing
 * Generate word-level timing for Bible audio using Gemini AI
 */
router.post('/generate', async (req, res) => {
  try {
    const { audioUrl, bookName, chapter, verses, language } = req.body;

    if (!audioUrl || !verses || !Array.isArray(verses)) {
      return res.status(400).json({ 
        error: 'Missing required fields: audioUrl, verses' 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY not configured on server' 
      });
    }

    console.log(`🎵 Generating timing for ${bookName} Chapter ${chapter} (${language})`);
    console.log(`📥 Fetching audio from: ${audioUrl}`);

    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const base64Audio = audioBuffer.toString('base64');

    console.log(`✅ Audio fetched: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

    const prompt = `You are an expert Bible audio transcription tool.

This is ${bookName || 'Bible'} Chapter ${chapter || '1'} in ${language === 'fa' ? 'Persian (Farsi)' : 'English'}.

The verses are:
${versesText}

Your task:
1. Listen to the audio carefully - it contains someone reading these Bible verses
2. For EACH verse, identify:
   - verse_number: The verse number (1, 2, 3, etc.)
   - text: The exact verse text
   - start_time: When this verse reading begins (in seconds)
   - end_time: When this verse reading ends (in seconds)
   - word_segments: Word-level timestamps for each word in the verse

3. Generate precise word-level timestamps for highlighting each word as it's spoken

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "chapter": ${chapter || 1},
  "verses": [
    {
      "verse_number": 1,
      "text": "verse text here",
      "start_time": 0.5,
      "end_time": 5.2,
      "word_segments": [
        {"word": "first", "start_time": 0.5, "end_time": 0.8},
        {"word": "word", "start_time": 0.9, "end_time": 1.2}
      ]
    }
  ]
}`;

    console.log('🤖 Sending to Gemini AI...');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/mpeg',
          data: base64Audio,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    let text = response.text();

    console.log('📝 Raw Gemini response:', text.substring(0, 200) + '...');

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    const timingData = JSON.parse(text);

    console.log(`✅ Generated timing for ${timingData.verses?.length || 0} verses`);

    res.json({
      success: true,
      data: timingData
    });

  } catch (error) {
    console.error('❌ Error generating timing:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate timing',
      details: error.stack
    });
  }
});

module.exports = router;
