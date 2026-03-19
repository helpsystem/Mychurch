const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DIRECT_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IpDe6-VgR8OumktCUPuVVPR015eoQRIjC8gAFaarcYSw';
const API_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${DIRECT_API_KEY}`;

async function processSong(song) {
    if (!song.lyrics_fa) return false;
    
    // Build prompt text without template literal inside the SQL to avoid escaping issues
    const promptText = "You are a bilingual worship pastor and expert in music theory. I will provide you with the Farsi lyrics of a Persian worship song.\n" +
"Please provide the following data based strictly on the provided Farsi lyrics:\n" +
'1. "translation_en": An accurate and poetic English translation of the entire song.\n' +
'2. "chords": Typical standard worship guitar/piano chords that fit this song.\n' +
'3. "category": Identify the main biblical theme.\n' +
'4. "timepoints": For Karaoke synchronicity, create a JSON array mapping EACH WORD from the Farsi lyrics to an exact time point (in seconds). Since no audio is provided, estimate based on a standard 120 BPM flowing worship song.\n' +
'    Output array format: [{ "time": 0.0, "word": "word1" }]. Cover at least 20 words.\n\n' +
'Song Title: "' + song.title_fa + '"\n' +
'Farsi Lyrics:\n' + song.lyrics_fa.substring(0, 1000) + '\n\n' +
'Respond strictly in valid JSON format matching this schema:\n' +
'{"translation_en": "...", "chords": "...", "category": "...", "timepoints": [{"time": 1.2, "word": "word1"}]}\n' +
'NO MARKDOWN. JUST RAW JSON.\n';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        if (!data.candidates) return false;
        
        let cleanJson = data.candidates[0].content.parts[0].text.trim();
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
        
        console.log(`✅ Extracted AI for: ${song.title_fa}`);
        return true;
    } catch (e) {
        console.log(`❌ Failed AI for: ${song.title_fa}`, e.message);
        return false;
    }
}

async function run() {
    try {
        console.log("Fetching songs that need AI extraction...");
        const res = await pool.query(`
            SELECT id, title_fa, lyrics_fa, audio_url 
            FROM church_worship_songs 
            WHERE lyrics_fa IS NOT NULL 
              AND LENGTH(lyrics_fa) > 10
              AND (timepoints IS NULL OR lyrics_en IS NULL OR chords IS NULL)
            ORDER BY id ASC
        `);
        
        const songs = res.rows;
        console.log(`Found ${songs.length} songs needing extraction. Processing in sequence to avoid rate limits...`);
        
        for (let i = 0; i < songs.length; i++) {
            console.log(`Processing ${i+1}/${songs.length}...`);
            await processSong(songs[i]);
            await new Promise(r => setTimeout(r, 2000));
        }
        
        console.log("Bulk extraction complete.");
    } catch (e) {
        console.error("Fatal error:", e);
    } finally {
        await pool.end();
    }
}

run();
