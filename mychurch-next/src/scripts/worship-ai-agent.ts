import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Configure __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the main .env.local file from the root
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// The user provided this specific key and endpoint
const DIRECT_API_KEY = 'AQ.Ab8RN6IpDe6-VgR8OumktCUPuVVPR015eoQRIjC8gAFaarcYSw';
const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${DIRECT_API_KEY}`;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } 
});

/**
 * DELAY HELPER -> rate limiting
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function extractWorshipData() {
    console.log('\n🤖 Starting AI Extraction Pipeline with [gemini-2.5-flash-lite] via REST...');
    
    const { rows: songsToProcess } = await pool.query(`
        SELECT id, title_fa, lyrics_fa
        FROM church_worship_songs
        WHERE (lyrics_fa IS NOT NULL AND lyrics_fa != '') 
          AND (lyrics_en IS NULL OR timepoints IS NULL OR chords IS NULL OR category IS NULL)
        ORDER BY created_at ASC
    `);

    console.log(`📊 Found ${songsToProcess.length} songs needing AI extraction.`);
    
    if (songsToProcess.length === 0) {
        console.log('✅ All songs are fully processed!');
        process.exit(0);
    }

    let processedCount = 0;
    
    for (const song of songsToProcess) {
        console.log(`\n⏳ Processing [${song.title_fa}] (ID: ${song.id})`);
        
        const promptText = `
You are a bilingual worship pastor and expert in music theory. I will provide you with the Farsi lyrics of a Persian worship song.
Please provide the following data based strictly on the provided Farsi lyrics:
1. "translation_en": An accurate and poetic English translation of the entire song.
2. "chords": Typical standard worship guitar/piano chords that fit this song (e.g. "Am, G, F, C" or "Em, C, G, D"). Provide a comma separated string. Do not overcomplicate.
3. "category": Identify the main biblical theme (e.g. "Praise", "Repentance", "Blood of Jesus", "Holy Spirit").
4. "timepoints": For Karaoke synchronicity, create a JSON array mapping EACH WORD from the Farsi lyrics to an approximate time point (in seconds) assuming a standard 120 BPM flowing worship song.
    Output array format: [{ "time": 0.0, "word": "word1" }, { "time": 0.5, "word": "word2" }]. Make sure to cover the first 10-15 words at least, incrementing time by ~0.3s to 0.7s per word depending on natural flow.

Song Title: "${song.title_fa}"
Farsi Lyrics:
${song.lyrics_fa.substring(0, 800)}

Respond strictly in valid JSON format matching this exact schema:
{
  "translation_en": "string",
  "chords": "string",
  "category": "string",
  "timepoints": [{"time": number, "word": "string"}]
}
NO MARKDOWN. NO BACKTICKS. JUST RAW JSON.
`;

        try {
            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: promptText }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7
                }
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json() as any;
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No candidates returned from Gemini");
            }

            const responseText = data.candidates[0].content.parts[0].text.trim();
            
            // Cleanup any accidental markdown backticks from Gemini
            let cleanJson = responseText;
            if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
            if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
            if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
            
            const aiData = JSON.parse(cleanJson);
            
            await pool.query(`
                UPDATE church_worship_songs
                SET lyrics_en = COALESCE(lyrics_en, $1),
                    chords = COALESCE(chords, $2),
                    category = COALESCE(category, $3),
                    timepoints = COALESCE(timepoints, $4)
                WHERE id = $5
            `, [
                aiData.translation_en || null,
                aiData.chords || null,
                aiData.category || null,
                aiData.timepoints ? JSON.stringify(aiData.timepoints) : null,
                song.id
            ]);
            
            console.log(`  ✅ Success: Extracted translation, chords '${aiData.chords}', and ${aiData.timepoints?.length || 0} timepoints.`);
            processedCount++;
            
            await delay(3000); 
            
        } catch (err: any) {
            console.error(`  ❌ Failed to process [${song.title_fa}]:`, err.message);
            await delay(4000); // Backoff on error
        }
    }
    
    console.log(`\n🎉 Extraction complete! Processed ${processedCount} songs.`);
    process.exit(0);
}

extractWorshipData();
