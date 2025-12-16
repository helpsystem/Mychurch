const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const { pool } = require('../db-postgres');

// Configuration
const BATCH_SIZE = 5; // Process 5 items per run to be safe
const DELAY_BETWEEN_ITEMS = 10000; // 10 seconds delay
const MAX_DAILY_LIMIT = 50; // Safety cap

class AutoSyncService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ----------------------------------------------------------------
    // BIBLE SYNC
    // ----------------------------------------------------------------
    async syncBibleChapters() {
        console.log('🔄 Checking for missing Bible timing data...');

        // Find chapters that have audio but NO timing data
        // Assuming bible_audio_files or similar exists, or we iterate known structure
        // For now, let's query bible_verses to get chapters, and join with timing

        // Complex query: Get distinct book/chapter/translation from verses
        // LEFT JOIN timing to find nulls.
        // LIMIT to batch size.

        const query = `
      SELECT DISTINCT v.book, v.chapter, v.translation
      FROM bible_verses v
      LEFT JOIN bible_audio_timing t 
        ON v.book = t.book_code 
        AND v.chapter = t.chapter 
        AND v.translation = t.translation
      WHERE t.id IS NULL
      AND v.translation IN ('TPV', 'MOJDEH', 'POV-FAS') -- Focus on Persian
      ORDER BY v.book, v.chapter
      LIMIT ${BATCH_SIZE}
    `;

        const res = await pool.query(query);
        const candidates = res.rows;

        console.log(`📝 Found ${candidates.length} Bible chapters pending sync.`);

        for (const item of candidates) {
            await this.processBibleChapter(item);
            await this.sleep(DELAY_BETWEEN_ITEMS);
        }
    }

    async processBibleChapter({ book, chapter, translation }) {
        console.log(`▶️ Processing ${book} ${chapter} (${translation})...`);

        try {
            // 1. Get Verses
            const versesRes = await pool.query(
                `SELECT verse, text FROM bible_verses WHERE book = $1 AND chapter = $2 AND translation = $3 ORDER BY verse`,
                [book, chapter, translation]
            );
            const verses = versesRes.rows;
            if (verses.length === 0) return console.warn('No verses found.');

            // 2. Determine Audio URL (Convention based)
            // This is tricky. We need the audio URL. 
            // If we don't have it in DB, we construct it or check file system.
            // Assuming a convention or lookup:
            const audioUrl = await this.resolveAudioUrl(book, chapter, translation);
            if (!audioUrl) {
                console.warn(`❌ No audio URL found for ${book} ${chapter}`);
                return;
            }

            // 3. Process with Gemini
            const timingData = await this.generateTiming(verses, audioUrl, 'bible');

            // 4. Save
            await pool.query(
                `INSERT INTO bible_audio_timing (book_code, chapter, translation, audio_url, timing_data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (book_code, chapter, translation) 
         DO UPDATE SET timing_data = $5, audio_url = $4, updated_at = NOW()`,
                [book, chapter, translation, audioUrl, JSON.stringify(timingData)]
            );

            console.log(`✅ Saved timing for ${book} ${chapter}`);

        } catch (err) {
            console.error(`❌ Failed to process ${book} ${chapter}:`, err.message);
        }
    }

    async resolveAudioUrl(book, chapter, translation) {
        // Hardcoded logic matching what the app uses or querying a file registry
        // Ideally, check 'bible_audio_files' content if it exists.
        // For now, return a placeholder or check standard path if valid
        // This part depends on where audio is hosted.
        // Example: https://samanabyar.online/audio/TPV/GEN/1.mp3

        // Let's try to verify if the file exists on the main server
        const baseUrl = 'https://samanabyar.online/bible_data/audio';
        const url = `${baseUrl}/${translation}/${book}/${chapter}.mp3`;

        try {
            const check = await fetch(url, { method: 'HEAD' });
            if (check.ok) return url;
        } catch (e) { }

        return null;
    }

    // ----------------------------------------------------------------
    // WORSHIP SYNC
    // ----------------------------------------------------------------
    async syncWorshipSongs() {
        console.log('🔄 Checking for missing Worship Song timing...');

        // Find songs with audio but no timing
        const query = `
      SELECT id, title_fa, lyrics, audiourl
      FROM worship_songs
      WHERE (timing_data IS NULL OR timing_data = '[]')
      AND audiourl IS NOT NULL
      LIMIT ${BATCH_SIZE}
    `;

        const res = await pool.query(query);
        const songs = res.rows;

        console.log(`📝 Found ${songs.length} Worship Songs pending sync.`);

        for (const song of songs) {
            await this.processWorshipSong(song);
            await this.sleep(DELAY_BETWEEN_ITEMS);
        }
    }

    async processWorshipSong(song) {
        console.log(`▶️ Processing Song: ${song.title_fa}...`);
        try {
            const lyrics = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
            const text = lyrics.fa || lyrics.en;
            if (!text) return console.warn('No lyrics text found');

            const result = await this.generateTiming({ text }, song.audiourl, 'worship');

            await pool.query(
                `UPDATE worship_songs SET timing_data = $1, has_timing = true, timing_updated_at = NOW() WHERE id = $2`,
                [JSON.stringify(result.timing), song.id]
            );
            console.log(`✅ Saved timing for song ${song.id}`);

        } catch (err) {
            console.error(`❌ Failed song ${song.id}:`, err.message);
        }
    }

    // ----------------------------------------------------------------
    // CORE AI LOGIC
    // ----------------------------------------------------------------
    async generateTiming(content, audioUrl, type) {
        // content is { verses: [] } or { text: string }

        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) throw new Error('Failed to download audio');
        const arrayBuffer = await audioRes.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        let prompt = '';

        if (type === 'bible') {
            const fullText = content.map(v => `${v.verse}. ${v.text}`).join(' ');
            prompt = `Analyze this Bible chapter audio and generate word-level timestamps for each verse.
        Chapter text: "${fullText.substring(0, 5000)}..."
        Return ONLY valid JSON: { "verses": [ { "verse": 1, "start": 0.0, "end": 5.0, "words": [] } ] }`;
        } else {
            prompt = `Analyze this song audio. Lyrics: "${content.text.substring(0, 5000)}..."
        Return ONLY valid JSON: { "timing": [ { "word": "word1", "startTime": 0, "endTime": 1 } ] }`;
        }

        const result = await this.model.generateContent([
            { inlineData: { mimeType: 'audio/mpeg', data: base64Audio } },
            { text: prompt }
        ]);

        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(text);
    }
}

module.exports = AutoSyncService;
