/**
 * 🎵 Audio Timing Extraction Pipeline
 * 
 * Uses Google Gemini to transcribe audio files and extract
 * word-level timing data in SystemTimingV2 format for Karaoke sync.
 * 
 * Usage: npx tsx src/scripts/extract-audio-timing.ts
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root (two levels up from src/scripts/)
const envLocalPath = path.resolve(__dirname, '../../.env.local');
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log(`[env] Loaded ${envLocalPath}`);
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[env] Loaded ${envPath}`);
} else {
    console.warn('[env] No .env.local or .env found!');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IpDe6-VgR8OumktCUPuVVPR015eoQRIjC8gAFaarcYSw';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ── Format seconds → mm:ss
function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── Download or read audio file to a temp location
async function downloadAudio(url: string): Promise<string | null> {
    try {
        if (url.startsWith('/')) {
            // Local file, read directly from public path
            const decodedUrl = decodeURIComponent(url);
            const localPath = path.join(__dirname, '../../../public', decodedUrl);
            if (fs.existsSync(localPath)) {
                console.log(`  📂 Found local file: ${localPath}`);
                return localPath; // Return the path directly, no need to download
            } else {
                console.error(`  ❌ Local file not found: ${localPath}`);
                return null;
            }
        } 
        
        if (!url.startsWith('http')) {
            console.error(`  ❌ Invalid URL format: ${url}`);
            return null;
        }

        console.log(`  📥 Downloading audio: ${url.substring(0, 80)}...`);
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`  ❌ Failed to download: HTTP ${res.status}`);
            return null;
        }
        const ext = url.toLowerCase().includes('.mp3') ? '.mp3' : '.audio';
        const tmpFile = path.join(os.tmpdir(), `worship_audio_${Date.now()}${ext}`);
        const buffer = await res.buffer();
        fs.writeFileSync(tmpFile, buffer);
        console.log(`  ✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${tmpFile}`);
        return tmpFile;
    } catch (err: any) {
        console.error(`  ❌ Download error: ${err.message}`);
        return null;
    }
}

// ── Transcribe audio using Vertex AI with inline base64
async function transcribeWithGemini(filePath: string, lyricsHint: string): Promise<any | null> {
    try {
        console.log('  🤖 Transcribing with Gemini (Inline)...');
        
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = filePath.endsWith('.mp3') ? 'audio/mp3' : 'audio/mp3';
        const base64Data = fileBuffer.toString('base64');
        
        const prompt = `You are a professional audio transcription expert specializing in Persian/Farsi worship songs.

Listen to this audio file carefully and transcribe it with precise word-level timing.

The song's known Persian lyrics for reference (match the words exactly):
${lyricsHint.substring(0, 1500)}

CRITICAL Instructions:
1. Follow the audio EXACTLY — if a chorus or section is repeated 2 or 3 times in the audio, include it 2 or 3 times in the JSON output with accurate timestamps
2. Do NOT deduplicate repeated sections — each occurrence of a repeated chorus/bridge must appear separately with its own timing
3. For each line, identify the exact start and end time (in seconds) from the audio
4. Skip any silent instrumental intro, start recording from the first sung word
5. For Persian words, preserve their exact spelling from the provided lyrics

IMPORTANT: Repeated sections like "هللویاه" or a chorus sung twice must appear twice in the lines array with different timestamps.

Respond with ONLY valid JSON in this exact format (SystemTimingV2):
{
  "version": "2.0",
  "totalDuration": <total duration in seconds>,
  "lines": [
    {
      "line": "full line text in Farsi",
      "start": <start time in seconds>,
      "end": <end time in seconds>,
      "words": [
        { "word": "کلمه", "start": <time>, "end": <time> }
      ]
    }
  ]
}

NO MARKDOWN. NO EXPLANATION. ONLY RAW JSON.`;

        const body = {
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
            }
        };

        const VERTEX_URL = `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const res = await fetch(VERTEX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`  ❌ Gemini API error ${res.status}: ${errText.substring(0, 300)}`);
            return null;
        }

        const data = await res.json() as any;
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!rawText) {
            console.error('  ❌ No content returned from Gemini');
            return null;
        }

        let cleanJson = rawText;
        if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
        if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
        if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

        const parsed = JSON.parse(cleanJson.trim());
        console.log(`  ✅ Transcribed ${parsed.lines?.length || 0} lines, ${fmt(parsed.totalDuration || 0)} duration`);
        return parsed;

    } catch (err: any) {
        console.error(`  ❌ Transcription error: ${err.message}`);
        return null;
    }
}

// ── Save timing data to DB
async function saveToDB(songId: string, timingData: any): Promise<boolean> {
    try {
        // Add songId to the data
        const dataWithId = { ...timingData, songId };
        
        await pool.query(`
            ALTER TABLE church_worship_songs 
            ADD COLUMN IF NOT EXISTS timing_data JSONB
        `);

        await pool.query(
            `UPDATE church_worship_songs SET timing_data = $1 WHERE id = $2`,
            [JSON.stringify(dataWithId), songId]
        );
        return true;
    } catch (err: any) {
        console.error(`  ❌ DB save error: ${err.message}`);
        return false;
    }
}

// ── Main Pipeline
async function main() {
    console.log('\n🎵 ═══════════════════════════════════════');
    console.log('   Audio Timing Extraction Pipeline v1.0');
    console.log('   Powered by Google Gemini 2.0 Flash');
    console.log('═══════════════════════════════════════\n');

    // Ensure timing_data column exists  
    await pool.query(`
        ALTER TABLE church_worship_songs 
        ADD COLUMN IF NOT EXISTS timing_data JSONB
    `);

    // Fetch songs with audio that don't have timing yet
    const { rows: songs } = await pool.query(`
        SELECT id, title_fa, audio_url, lyrics_fa 
        FROM church_worship_songs 
        WHERE audio_url IS NOT NULL 
          AND audio_url != ''
          AND timing_data IS NULL
        ORDER BY title_fa ASC
    `);

    console.log(`📊 Found ${songs.length} songs with audio needing timing extraction\n`);

    if (songs.length === 0) {
        console.log('✅ All songs with audio already have timing data!');
        await pool.end();
        return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        console.log(`\n[${i + 1}/${songs.length}] 🎵 ${song.title_fa}`);
        console.log(`   ID: ${song.id}`);

        let tmpFile: string | null = null;
        try {
            // Step 1: Download audio
            tmpFile = await downloadAudio(song.audio_url);
            if (!tmpFile) { failed++; continue; }

            // Step 2: Transcribe Inline (Skip explicit upload endpoint)
            const timingData = await transcribeWithGemini(tmpFile, song.lyrics_fa || '');
            if (!timingData) { failed++; continue; }

            // Step 3: Save to DB
            const saved = await saveToDB(song.id, timingData);
            if (!saved) { failed++; continue; }

            console.log(`  💾 Saved to database ✅`);
            success++;

        } finally {
            // Cleanup temp file if we downloaded it
            if (tmpFile && fs.existsSync(tmpFile) && tmpFile.includes(os.tmpdir())) {
                fs.unlinkSync(tmpFile);
            }
        }

        // Rate limiting: wait between songs
        if (i < songs.length - 1) {
            console.log(`  ⏳ Waiting 5s before next song...`);
            await delay(5000);
        }
    }

    console.log('\n\n🎉 ═══════════════════════════════════════');
    console.log(`   Extraction Complete!`);
    console.log(`   ✅ Success: ${success} songs`);
    console.log(`   ❌ Failed:  ${failed} songs`);
    console.log('═══════════════════════════════════════\n');

    await pool.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
