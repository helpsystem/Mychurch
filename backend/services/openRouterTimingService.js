/**
 * OpenRouter-based Timing Estimation Service
 * Uses AI to estimate word timing based on lyrics and audio duration
 * (Fallback when Gemini quota is exhausted)
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class OpenRouterTimingService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        if (!this.apiKey) throw new Error('OPENROUTER_API_KEY is not set');

        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'google/gemini-2.0-flash-exp:free'; // Free model on OpenRouter

        // HiDrive credentials for audio duration check
        this.hidriveUser = process.env.HIDRIVE_USER || '';
        this.hidrivePassword = process.env.HIDRIVE_PASSWORD || '';

        // Timing output directory
        this.outputDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'worship', 'data', 'timings');

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Strip chord notations from lyrics
     */
    stripChords(text) {
        if (!text) return '';
        return text
            .replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')
            .replace(/\b[Vv]\d+\b/g, '')
            .replace(/\bVerse\s*\d*\b/gi, '')
            .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
            .replace(/\([x×]\d+\)/gi, '')
            .replace(/\(\d+x\)/gi, '')
            .replace(/\[column\]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Generate estimated timing based on lyrics and duration
     */
    async generateEstimatedTiming({ songId, lyrics, durationSeconds = 180 }) {
        console.log(`🎵 Generating estimated timing for song ${songId}...`);

        try {
            const cleanLyrics = this.stripChords(lyrics);
            const lines = cleanLyrics.split(/\n+/).filter(l => l.trim());

            // Calculate average time per line
            const timePerLine = durationSeconds / lines.length;

            // Build timing structure
            const timingData = {
                lines: []
            };

            let currentTime = 0;

            for (const line of lines) {
                const words = line.trim().split(/\s+/).filter(w => w);
                const lineEnd = currentTime + timePerLine;
                const timePerWord = timePerLine / words.length;

                const lineEntry = {
                    line: line.trim(),
                    start: parseFloat(currentTime.toFixed(2)),
                    end: parseFloat(lineEnd.toFixed(2)),
                    words: []
                };

                let wordTime = currentTime;
                for (const word of words) {
                    lineEntry.words.push({
                        word: word,
                        start: parseFloat(wordTime.toFixed(2)),
                        end: parseFloat((wordTime + timePerWord).toFixed(2))
                    });
                    wordTime += timePerWord;
                }

                timingData.lines.push(lineEntry);
                currentTime = lineEnd;
            }

            // Use OpenRouter to refine timing estimates
            const refinedTiming = await this.refineTimingWithAI(cleanLyrics, timingData, durationSeconds);

            // Save to file
            const outputPath = await this.saveTimingFile(songId, refinedTiming || timingData);

            console.log(`✅ Estimated timing saved to ${outputPath}`);

            return {
                success: true,
                songId,
                outputPath,
                timing: refinedTiming || timingData
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
     * Use AI to refine timing estimates
     */
    async refineTimingWithAI(lyrics, basicTiming, durationSeconds) {
        console.log(`🤖 Refining timing with OpenRouter AI...`);

        const prompt = `You are a Persian worship song timing expert.

Given these lyrics and total song duration of ${durationSeconds} seconds, estimate realistic word-level timing.
Consider that:
- Choruses are often sung slower and may repeat
- Verses have more consistent pacing
- There may be instrumental breaks between sections

Lyrics:
"""
${lyrics}
"""

Current rough timing estimate:
${JSON.stringify(basicTiming.lines.slice(0, 3), null, 2)}
(showing first 3 lines as example)

Please provide refined timing for ALL lines in this exact JSON format:
{
  "lines": [
    {
      "line": "text of line",
      "start": 0.00,
      "end": 5.50,
      "words": [
        { "word": "text", "start": 0.00, "end": 0.80 }
      ]
    }
  ]
}

Output ONLY valid JSON, no explanations.`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://samanabyar.online',
                    'X-Title': 'MyChurch Timing Generator'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 8192,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`⚠️ OpenRouter API error: ${response.status}. Using basic timing.`);
                return null;
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '';

            // Clean up response
            content = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const refinedTiming = JSON.parse(content);

            if (refinedTiming.lines && Array.isArray(refinedTiming.lines)) {
                console.log(`✅ AI refined ${refinedTiming.lines.length} lines`);
                return refinedTiming;
            }

            return null;

        } catch (error) {
            console.warn(`⚠️ AI refinement failed: ${error.message}. Using basic timing.`);
            return null;
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
            model: 'openrouter-estimated',
            ...timingData
        };

        fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2), 'utf8');

        return outputPath;
    }
}

module.exports = OpenRouterTimingService;
