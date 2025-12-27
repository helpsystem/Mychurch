/**
 * Precision Worship Timing Service
 * Uses Gemini 2.5 Pro for highly accurate word-level audio-text synchronization
 * Based on audio-visual-presentation-creator patterns
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class PrecisionTimingService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash for better quota availability 
        // (gemini-2.5-pro has 0 free tier quota)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // HiDrive credentials for audio files
        this.hidriveUser = process.env.HIDRIVE_USER || '';
        this.hidrivePassword = process.env.HIDRIVE_PASSWORD || '';

        // Timing output directory
        this.outputDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'worship', 'data', 'timings');

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate precise word-level timing for a worship song
     * @param {Object} params - { songId, audioUrl, lyrics }
     * @returns {Object} Timing data with lines and words
     */
    async generatePreciseTiming({ songId, audioUrl, lyrics }) {
        console.log(`🎵 Generating precise timing for song ${songId}...`);

        try {
            // 1. Download audio and convert to base64
            const audioBase64 = await this.downloadAudioAsBase64(audioUrl);

            // 2. Clean lyrics (remove chord notations)
            const cleanLyrics = this.stripChords(lyrics);

            // 3. Call Gemini 2.5 Pro with structured JSON schema
            const timingData = await this.callGeminiForTiming(audioBase64, cleanLyrics);

            // 4. Save to JSON file
            const outputPath = await this.saveTimingFile(songId, timingData);

            console.log(`✅ Timing saved to ${outputPath}`);

            return {
                success: true,
                songId,
                outputPath,
                timing: timingData
            };

        } catch (error) {
            console.error(`❌ Failed to generate timing for song ${songId}:`, error.message);
            return {
                success: false,
                songId,
                error: error.message
            };
        }
    }

    /**
     * Download audio file and convert to base64
     */
    async downloadAudioAsBase64(audioUrl) {
        console.log(`📥 Downloading audio from ${audioUrl}...`);

        const fetchOptions = {};

        // Add Basic Auth for HiDrive URLs
        if (audioUrl.includes('hidrive') && this.hidriveUser && this.hidrivePassword) {
            const authHeader = 'Basic ' + Buffer.from(`${this.hidriveUser}:${this.hidrivePassword}`).toString('base64');
            fetchOptions.headers = { 'Authorization': authHeader };
        }

        const response = await fetch(audioUrl, fetchOptions);
        if (!response.ok) {
            throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        console.log(`✅ Audio downloaded (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);
        return base64;
    }

    /**
     * Strip chord notations from lyrics
     */
    stripChords(text) {
        if (!text) return '';
        return text
            // Remove chord patterns like [Am], [Dm7], [Bb], [G#m], etc.
            .replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')
            // Remove verse markers
            .replace(/\b[Vv]\d+\b/g, '')
            .replace(/\bVerse\s*\d*\b/gi, '')
            // Remove section markers
            .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
            // Remove repeat markers
            .replace(/\([x×]\d+\)/gi, '')
            .replace(/\(\d+x\)/gi, '')
            // Remove [column] markers
            .replace(/\[column\]/gi, '')
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Call Gemini 2.5 Pro with JSON schema for structured timing output
     */
    async callGeminiForTiming(audioBase64, lyrics) {
        console.log(`🤖 Calling Gemini 2.0 Flash for timing analysis...`);

        const systemInstruction = `You are an expert audio transcription and synchronization service specialized in Persian worship songs.
        
Your task is to analyze the audio and precisely match each word in the provided lyrics to its timing in the audio.

CRITICAL REQUIREMENTS:
1. Output MUST be valid JSON only - no explanations, no markdown
2. Each word must have startTime and endTime in seconds (decimal)
3. Group words into lines that match the lyrical structure
4. Timestamps must be precise to 0.01 seconds
5. Ensure no overlapping timestamps between words
6. If a word is sung multiple times, each instance needs its own entry

For the lyrics: "${lyrics.substring(0, 2000)}..."`;

        const prompt = `Analyze this Persian worship song audio against the reference lyrics.
        
Reference lyrics:
"""
${lyrics}
"""

Return ONLY valid JSON in this exact format:
{
  "lines": [
    {
      "line": "خط اول متن",
      "start": 0.00,
      "end": 5.50,
      "words": [
        { "word": "کلمه", "start": 0.00, "end": 0.80 },
        { "word": "دوم", "start": 0.85, "end": 1.20 }
      ]
    }
  ]
}`;

        try {
            const result = await this.model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: 'audio/mpeg', data: audioBase64 } },
                            { text: prompt }
                        ]
                    }
                ],
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.1,  // Low temperature for precise timing
                    maxOutputTokens: 8192
                }
            });

            let responseText = result.response.text();

            // Clean up response - remove markdown code blocks if present
            responseText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const timingData = JSON.parse(responseText);

            // Validate structure
            if (!timingData.lines || !Array.isArray(timingData.lines)) {
                throw new Error('Invalid timing structure - missing lines array');
            }

            console.log(`✅ Generated timing for ${timingData.lines.length} lines`);
            return timingData;

        } catch (error) {
            console.error('❌ Gemini API error:', error.message);
            throw error;
        }
    }

    /**
     * Save timing data to JSON file
     */
    async saveTimingFile(songId, timingData) {
        const filename = `song_${songId}_timing.json`;
        const outputPath = path.join(this.outputDir, filename);

        const fileContent = {
            songId,
            generatedAt: new Date().toISOString(),
            version: '2.0',
            model: 'gemini-2.0-flash',
            ...timingData
        };

        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8');

        return outputPath;
    }

    /**
     * Get existing timing for a song
     */
    getExistingTiming(songId) {
        const filename = `song_${songId}_timing.json`;
        const filePath = path.join(this.outputDir, filename);

        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * List all songs with timing files
     */
    listTimingFiles() {
        if (!fs.existsSync(this.outputDir)) return [];

        return fs.readdirSync(this.outputDir)
            .filter(f => f.startsWith('song_') && f.endsWith('_timing.json'))
            .map(f => {
                const match = f.match(/song_(\d+)_timing\.json/);
                return match ? parseInt(match[1]) : null;
            })
            .filter(id => id !== null);
    }
}

module.exports = PrecisionTimingService;
