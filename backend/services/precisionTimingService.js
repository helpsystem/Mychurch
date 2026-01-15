/**
 * Precision Timing Service v3.0
 * Uses Gemini 2.5 Flash with JSON Schema for highly accurate word-level audio-text synchronization
 * Based on the professional audio-text-sync-&-highlight patterns
 */

const { GoogleGenAI, Type } = require('@google/genai');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class PrecisionTimingService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

        this.ai = new GoogleGenAI({ apiKey });

        // HiDrive credentials for audio files
        this.hidriveUser = process.env.HIDRIVE_USER || '';
        this.hidrivePassword = process.env.HIDRIVE_PASSWORD || '';

        // Timing output directory for worship songs
        this.worshipOutputDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'worship', 'data', 'timings');

        // Timing output directory for Bible
        this.bibleOutputDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'bible_data', 'timestamps');

        // Ensure output directories exist
        if (!fs.existsSync(this.worshipOutputDir)) {
            fs.mkdirSync(this.worshipOutputDir, { recursive: true });
        }
        if (!fs.existsSync(this.bibleOutputDir)) {
            fs.mkdirSync(this.bibleOutputDir, { recursive: true });
        }
    }

    /**
     * Generate precise word-level timing for a worship song
     * @param {Object} params - { songId, audioUrl, lyrics }
     * @returns {Object} Timing data with lines and words
     */
    async generateWorshipTiming({ songId, audioUrl, lyrics }) {
        console.log(`🎵 Generating timing for worship song ${songId}...`);

        try {
            // 1. Download audio and convert to base64
            const audioBase64 = await this.downloadAudioAsBase64(audioUrl);
            const mimeType = audioUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';

            // 2. Clean lyrics (remove chord notations)
            const cleanLyrics = this.stripChords(lyrics);

            // 3. Call Gemini with JSON Schema
            const timingData = await this.callGeminiWithSchema({
                audioBase64,
                mimeType,
                lyrics: cleanLyrics,
                type: 'worship'
            });

            // 4. Save to JSON file
            const outputPath = await this.saveWorshipTimingFile(songId, timingData);
            console.log(`✅ Worship timing saved to ${outputPath}`);

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
     * Generate precise word-level timing for a Bible chapter
     * @param {Object} params - { translation, bookCode, chapter, verses, audioUrl }
     * @returns {Object} Timing data with verses and words
     */
    async generateBibleTiming({ translation, bookCode, chapter, verses, audioUrl }) {
        console.log(`📖 Generating timing for ${translation}/${bookCode}/${chapter}...`);

        try {
            // 1. Download audio and convert to base64
            const audioBase64 = await this.downloadAudioAsBase64(audioUrl);

            // 2. Prepare verse text
            const versesText = verses.map(v => `آیه ${v.verse}: ${v.text}`).join('\n');

            // 3. Call Gemini with JSON Schema
            const timingData = await this.callGeminiWithSchema({
                audioBase64,
                mimeType: 'audio/mpeg',
                lyrics: versesText,
                type: 'bible',
                metadata: { translation, bookCode, chapter }
            });

            // 4. Save to JSON file
            const outputPath = await this.saveBibleTimingFile(translation, bookCode, chapter, timingData);
            console.log(`✅ Bible timing saved to ${outputPath}`);

            return {
                success: true,
                translation,
                bookCode,
                chapter,
                outputPath,
                timing: timingData
            };

        } catch (error) {
            console.error(`❌ Failed to generate Bible timing:`, error.message);
            return {
                success: false,
                translation,
                bookCode,
                chapter,
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
     * Call Gemini 2.5 Flash with structured JSON Schema output
     * This is the core method using the professional approach
     */
    async callGeminiWithSchema({ audioBase64, mimeType, lyrics, type, metadata = {} }) {
        console.log(`🤖 Calling Gemini 2.5 Flash with JSON Schema...`);

        const prompt = type === 'bible'
            ? `Listen to this Persian Bible audio and generate precise word-level timestamps for each verse.
               Match the audio exactly to these verses:
               ${lyrics}
               
               Generate timestamps in seconds with 2 decimal precision.`
            : `Listen to this Persian worship song and generate precise word-level timestamps.
               Match the audio exactly to these lyrics:
               ${lyrics}
               
               Generate timestamps in seconds with 2 decimal precision.`;

        // Define JSON Schema for structured output
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                lines: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            line: { type: Type.STRING, description: "The full text of this line/verse" },
                            label: { type: Type.STRING, description: "Verse number like '1' or line identifier" },
                            start: { type: Type.NUMBER, description: "Start time in seconds" },
                            end: { type: Type.NUMBER, description: "End time in seconds" },
                            words: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        start: { type: Type.NUMBER },
                                        end: { type: Type.NUMBER }
                                    },
                                    required: ['word', 'start', 'end']
                                }
                            }
                        },
                        required: ['line', 'start', 'end', 'words']
                    }
                },
                total_duration: { type: Type.NUMBER, description: "Total audio duration in seconds" }
            },
            required: ['lines']
        };

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        parts: [
                            { inlineData: { mimeType, data: audioBase64 } },
                            { text: prompt }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.1  // Low temperature for precise timing
                }
            });

            const resultJson = response.text;
            const parsedResponse = JSON.parse(resultJson);

            console.log(`✅ Generated timing for ${parsedResponse.lines?.length || 0} lines`);
            return parsedResponse;

        } catch (error) {
            console.error('❌ Gemini API error:', error.message);
            throw error;
        }
    }

    /**
     * Save worship song timing data to JSON file
     */
    async saveWorshipTimingFile(songId, timingData) {
        const filename = `song_${songId}_timing.json`;
        const outputPath = path.join(this.worshipOutputDir, filename);

        const fileContent = {
            songId,
            generatedAt: new Date().toISOString(),
            version: '3.0',
            model: 'gemini-2.5-flash',
            schema: 'json-schema',
            ...timingData
        };

        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8');
        return outputPath;
    }

    /**
     * Save Bible timing data to JSON file
     */
    async saveBibleTimingFile(translation, bookCode, chapter, timingData) {
        const dirPath = path.join(this.bibleOutputDir, translation.toUpperCase(), bookCode);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filename = `${chapter}.json`;
        const outputPath = path.join(dirPath, filename);

        const fileContent = {
            translation,
            bookCode,
            chapter,
            generatedAt: new Date().toISOString(),
            version: '3.0',
            model: 'gemini-2.5-flash',
            schema: 'json-schema',
            ...timingData
        };

        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8');
        return outputPath;
    }

    /**
     * Get existing timing for a worship song
     */
    getExistingWorshipTiming(songId) {
        const filename = `song_${songId}_timing.json`;
        const filePath = path.join(this.worshipOutputDir, filename);

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
     * Get existing timing for a Bible chapter
     */
    getExistingBibleTiming(translation, bookCode, chapter) {
        const filePath = path.join(this.bibleOutputDir, translation.toUpperCase(), bookCode, `${chapter}.json`);

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
    listWorshipTimingFiles() {
        if (!fs.existsSync(this.worshipOutputDir)) return [];

        return fs.readdirSync(this.worshipOutputDir)
            .filter(f => f.startsWith('song_') && f.endsWith('_timing.json'))
            .map(f => {
                const match = f.match(/song_(\d+)_timing\.json/);
                return match ? parseInt(match[1]) : null;
            })
            .filter(id => id !== null);
    }
}

module.exports = PrecisionTimingService;
