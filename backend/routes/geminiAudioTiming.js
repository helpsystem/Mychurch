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

    const prompt = `Listen to this Bible audio and generate precise word-level timestamps.

Book: ${bookName || 'Bible'} Chapter ${chapter || '1'}
Language: ${language === 'fa' ? 'Persian (Farsi)' : 'English'}

Verses:
${versesText}

Generate JSON with this EXACT structure. IMPORTANT: No trailing commas!

{
  "chapter": ${chapter || 1},
  "verses": [
    {
      "verse_number": 1,
      "text": "exact verse text from audio",
      "start_time": 0.5,
      "end_time": 5.2,
      "word_segments": [
        {"word": "first", "start_time": 0.5, "end_time": 0.8},
        {"word": "second", "start_time": 0.9, "end_time": 1.2}
      ]
    }
  ]
}

Return ONLY the JSON object. No markdown, no explanations, no trailing commas.`;

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

    // Remove trailing commas before closing brackets/braces (common JSON error)
    text = text.replace(/,(\s*[}\]])/g, '$1');

    // Parse JSON
    let timingData;
    try {
      timingData = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('📄 Cleaned text:', text.substring(0, 500));
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
    }

    console.log(`✅ Generated timing for ${timingData.verses?.length || 0} verses`);

    res.json({
      success: true,
      data: timingData
    });

  } catch (error) {
    console.error('❌ Error generating timing:', error);
    
    // Fallback: Generate simple estimated timing
    console.log('⚠️  Gemini failed, using fallback timing estimation');
    const { verses, chapter } = req.body;
    
    const fallbackTiming = generateFallbackTiming(verses, chapter);
    
    return res.json({
      success: true,
      data: fallbackTiming,
      warning: 'Using estimated timing (Gemini failed)'
    });
  }
});

/**
 * Generate simple fallback timing when Gemini fails
 * Estimates ~5 seconds per verse with word-level splits
 */
function generateFallbackTiming(verses, chapter) {
  const SECONDS_PER_VERSE = 5;
  
  const verseSegments = verses.map((verse, index) => {
    const startTime = index * SECONDS_PER_VERSE;
    const endTime = (index + 1) * SECONDS_PER_VERSE;
    const words = verse.text.split(/\s+/);
    const secondsPerWord = SECONDS_PER_VERSE / words.length;
    
    const wordSegments = words.map((word, wordIndex) => ({
      word: word,
      start_time: startTime + (wordIndex * secondsPerWord),
      end_time: startTime + ((wordIndex + 1) * secondsPerWord)
    }));
    
    return {
      verse_number: verse.verse,
      text: verse.text,
      start_time: startTime,
      end_time: endTime,
      word_segments: wordSegments
    };
  });
  
  return {
    chapter: chapter || 1,
    verses: verseSegments
  };
}

module.exports = router;
