const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Multer configuration for temp file storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(os.tmpdir(), 'audio-processor');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// JSON Schema for transcription response
const createResponseSchema = (mode) => {
  const lineTypeEnum = mode === 'song'
    ? ['lyric', 'verse', 'text']
    : ['book_title', 'chapter_title', 'verse', 'text'];

  return {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", enum: lineTypeEnum },
        label: { type: "STRING" },
        content: { type: "STRING" },
        words: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              word: { type: "STRING" },
              start_time: { type: "NUMBER" },
              end_time: { type: "NUMBER" }
            },
            required: ["word", "start_time", "end_time"]
          }
        }
      },
      required: ["type", "content", "words"]
    }
  };
};

/**
 * POST /api/audio-processor/transcribe
 * Transcribe audio using Gemini AI
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  let uploadedFile = null;
  const tempFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const mode = req.body.mode || 'speech';

    // Upload file to Gemini
    uploadedFile = await fileManager.uploadFile(tempFilePath, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    // Wait for file to be processed
    let file = await fileManager.getFile(uploadedFile.file.name);
    while (file.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadedFile.file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed by Gemini');
    }

    // Generate transcription
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: createResponseSchema(mode)
      }
    });

    const prompt = mode === 'song'
      ? `You are transcribing a worship song. Listen carefully and provide a precise, word-by-word transcription with start and end timestamps.
         - Type each lyric line as 'lyric' unless it's clearly a verse marker (like "Verse 1") which should be 'verse'.
         - Capture every word, even repeated ones.
         - Timing must be precise to 0.01 seconds.
         - Return an array of line objects.`
      : `You are transcribing a spoken word recording, such as a Bible reading or audiobook. Listen carefully and provide a precise, word-by-word transcription with start and end timestamps.
         - Identify the structure:
           - 'book_title': When the book name is announced (e.g., "The Gospel of John")
           - 'chapter_title': When a chapter is announced (e.g., "Chapter 3")
           - 'verse': A verse with its number as the label (e.g., type: 'verse', label: '16')
           - 'text': Ordinary text content
         - Timing must be precise to 0.01 seconds.
         - Return an array of line objects.`;

    const result = await model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: prompt }
    ]);

    const responseText = result.response.text();
    const lines = JSON.parse(responseText);

    res.json({ lines });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  } finally {
    // Cleanup
    if (uploadedFile) {
      try {
        await fileManager.deleteFile(uploadedFile.file.name);
      } catch (e) { console.log('Failed to delete uploaded file:', e.message); }
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

/**
 * POST /api/audio-processor/detect-chords
 * Detect musical chords using Gemini AI
 */
router.post('/detect-chords', upload.single('audio'), async (req, res) => {
  let uploadedFile = null;
  const tempFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcript = req.body.transcript || '';

    // Upload file to Gemini
    uploadedFile = await fileManager.uploadFile(tempFilePath, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    // Wait for processing
    let file = await fileManager.getFile(uploadedFile.file.name);
    while (file.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadedFile.file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    const prompt = `You are a music expert. Listen to this worship song and analyze the chord progression.
    Here is the transcript to help you align:
    ---
    ${transcript}
    ---
    
    Provide the chords in a musician-friendly format. Show chords above the corresponding lyrics if possible.
    If no clear chords are detected or the audio is not suitable, respond with "None".`;

    const result = await model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: prompt }
    ]);

    const chords = result.response.text();
    res.json({ chords });
  } catch (error) {
    console.error('Chord detection error:', error);
    res.status(500).json({ error: error.message || 'Chord detection failed' });
  } finally {
    if (uploadedFile) {
      try {
        await fileManager.deleteFile(uploadedFile.file.name);
      } catch (e) { console.log('Failed to delete uploaded file:', e.message); }
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

/**
 * POST /api/audio-processor/translate
 * Translate text lines using Gemini AI
 */
router.post('/translate', async (req, res) => {
  try {
    const { lines, target } = req.body;

    if (!lines || !Array.isArray(lines) || !target) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            translated_lines: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["translated_lines"]
        }
      }
    });

    const numberedInput = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');

    let languageInstruction = '';
    if (target === 'persian') {
      languageInstruction = `Translate to standard modern Persian (Farsi). Ensure the translation sounds natural and is written in Persian script.`;
    } else if (target === 'english') {
      languageInstruction = `Translate to English. Use clear, contemporary English.`;
    } else if (target === 'finglish') {
      languageInstruction = `Transliterate Persian to Finglish (Persian words written with English/Latin letters). If the original is English, convert to Finglish as it would be spoken by an Iranian. Keep proper names as they sound phonetically.`;
    }

    const prompt = `You are a professional translator. Translate each of the following numbered lines accurately.
${languageInstruction}

Rules:
- Return exactly the same number of lines.
- Each translated line should be returned as a simple string in the array.
- Do not add numbering to your output.
- For song lyrics, maintain the poetic style.

Input lines:
${numberedInput}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    res.json({ translated_lines: data.translated_lines });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

/**
 * POST /api/audio-processor/tts
 * Text-to-Speech using Gemini TTS
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Determine prompt based on language
    let voicePrompt = '';
    if (language === 'persian' || language === 'original') {
      voicePrompt = `You are a highly skilled Iranian voice actor with a deep, resonant tone and exceptional diction. Read the following text with a polished, standard **Iranian (Tehrani)** accent, focusing on natural intonation and emotional depth.

**Text to Read:**
${text}

Instructions:
- Deliver a clear, expressive, and emotionally engaging reading.
- Use natural pauses and appropriate cadence.
- If the text is from the Bible or a religious context, adopt a reverent and solemn tone.`;
    } else if (language === 'english') {
      voicePrompt = `You are a professional English voice-over artist. Read the following text clearly and naturally with a warm, engaging tone.

**Text to Read:**
${text}

Instructions:
- Use natural pauses and appropriate inflection.
- If the content is religious or poetic, use a reverent tone.`;
    } else if (language === 'finglish') {
      voicePrompt = `You are a bilingual speaker fluent in both Persian and English. Read the following Finglish text (Persian written in Latin letters) as a native Persian speaker would pronounce it.

**Text to Read:**
${text}

Instructions:
- Pronounce each word as it would sound in Persian.
- Use natural Iranian intonation patterns.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: voicePrompt }] }],
      generationConfig: {
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
        }
      }
    });

    const response = result.response;
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('No audio data received from TTS');
    }

    const audioBuffer = Buffer.from(audioData, 'base64');
    res.set('Content-Type', 'audio/wav');
    res.set('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

/**
 * POST /api/audio-processor/export-pptx
 * Generate PowerPoint with AI images (placeholder for now)
 */
router.post('/export-pptx', upload.single('audio'), async (req, res) => {
  const tempFilePath = req.file?.path;

  try {
    // Note: Full PPTX generation with Imagen requires additional setup
    // For now, return a message about this feature
    res.status(501).json({
      message: 'PowerPoint export with AI images is being implemented. Please use the JSON export for now.'
    });
  } catch (error) {
    console.error('PPTX export error:', error);
    res.status(500).json({ error: error.message || 'PPTX export failed' });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

module.exports = router;
