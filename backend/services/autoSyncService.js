const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db-postgres');

// Configuration (defaults are tuned for Gemini free tier; override via env vars)
const DEFAULTS = {
    BATCH_SIZE: 50,
    DELAY_BETWEEN_ITEMS_MS: 5000,
    MAX_DAILY_LIMIT: 1000,
    MAX_REQUESTS_PER_MINUTE: 12,
    USAGE_FILE: path.join(__dirname, '..', '.cache', 'autoSyncUsage.json')
};

function readEnvInt(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
}

class AutoSyncService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        this.batchSize = readEnvInt('AUTO_SYNC_BATCH_SIZE', DEFAULTS.BATCH_SIZE);
        this.delayBetweenItemsMs = readEnvInt('AUTO_SYNC_DELAY_MS', DEFAULTS.DELAY_BETWEEN_ITEMS_MS);
        this.maxDailyLimit = readEnvInt('AUTO_SYNC_MAX_DAILY', DEFAULTS.MAX_DAILY_LIMIT);
        this.maxRequestsPerMinute = readEnvInt('AUTO_SYNC_MAX_RPM', DEFAULTS.MAX_REQUESTS_PER_MINUTE);
        this.usageFile = process.env.AUTO_SYNC_USAGE_FILE || DEFAULTS.USAGE_FILE;

        this._recentRequestTimestamps = [];
        this._usage = this._loadUsage();
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _todayKey() {
        // UTC day key to avoid timezone surprises across servers
        return new Date().toISOString().slice(0, 10);
    }

    _loadUsage() {
        try {
            const dir = path.dirname(this.usageFile);
            fs.mkdirSync(dir, { recursive: true });
            if (!fs.existsSync(this.usageFile)) {
                const initial = { day: this._todayKey(), requests: 0 };
                fs.writeFileSync(this.usageFile, JSON.stringify(initial, null, 2), 'utf8');
                return initial;
            }
            const parsed = JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
            if (!parsed || typeof parsed !== 'object') throw new Error('invalid usage file');
            if (parsed.day !== this._todayKey()) {
                const reset = { day: this._todayKey(), requests: 0 };
                fs.writeFileSync(this.usageFile, JSON.stringify(reset, null, 2), 'utf8');
                return reset;
            }
            if (typeof parsed.requests !== 'number') parsed.requests = 0;
            return parsed;
        } catch (e) {
            // If the usage file is unreadable, fail safe to a reset counter.
            return { day: this._todayKey(), requests: 0 };
        }
    }

    _persistUsage() {
        try {
            const dir = path.dirname(this.usageFile);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.usageFile, JSON.stringify(this._usage, null, 2), 'utf8');
        } catch (e) {
            // Non-fatal: quota protection still works in-memory for this run.
        }
    }

    _remainingToday() {
        if (this._usage.day !== this._todayKey()) {
            this._usage = { day: this._todayKey(), requests: 0 };
            this._persistUsage();
        }
        return Math.max(0, this.maxDailyLimit - this._usage.requests);
    }

    async _throttleBeforeRequest() {
        // Daily cap
        if (this._remainingToday() <= 0) {
            throw new Error(`Daily Gemini request limit reached (${this.maxDailyLimit}/day)`);
        }

        // RPM cap
        const now = Date.now();
        this._recentRequestTimestamps = this._recentRequestTimestamps.filter(ts => now - ts < 60_000);
        if (this._recentRequestTimestamps.length >= this.maxRequestsPerMinute) {
            const oldest = this._recentRequestTimestamps[0];
            const waitMs = Math.max(0, 60_000 - (now - oldest)) + 250;
            await this.sleep(waitMs);
        }

        // Reserve a slot (so concurrent calls don't exceed RPM)
        this._recentRequestTimestamps.push(Date.now());
        this._usage.requests += 1;
        this._persistUsage();
    }

    async _withRetry(fn, { maxAttempts = 3 } = {}) {
        let lastErr;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await fn(attempt);
            } catch (err) {
                lastErr = err;
                const msg = String(err?.message || err);
                const isRate = /429|rate\s*limit|quota/i.test(msg);
                const isTransient = /503|502|timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(msg);
                if (attempt >= maxAttempts || (!isRate && !isTransient)) throw err;

                const backoffMs = Math.min(60_000, 2000 * (2 ** (attempt - 1)));
                console.warn(`⏳ Gemini call failed (attempt ${attempt}/${maxAttempts}): ${msg}. Retrying in ${Math.round(backoffMs / 1000)}s...`);
                await this.sleep(backoffMs);
            }
        }
        throw lastErr;
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
            AND v.translation IN ('TPV', 'MOJDEH', 'QADIM', 'POV-FAS')
      ORDER BY v.book, v.chapter
            LIMIT ${this.batchSize}
    `;

        const res = await pool.query(query);
        const candidates = res.rows;

        console.log(`📝 Found ${candidates.length} Bible chapters pending sync.`);

        for (const item of candidates) {
            if (this._remainingToday() <= 0) {
                console.log(`🛑 Daily limit reached. Stopping Bible sync for today (${this.maxDailyLimit}/day).`);
                break;
            }
            await this.processBibleChapter(item);
            await this.sleep(this.delayBetweenItemsMs);
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
            LIMIT ${this.batchSize}
    `;

        const res = await pool.query(query);
        const songs = res.rows;

        console.log(`📝 Found ${songs.length} Worship Songs pending sync.`);

        for (const song of songs) {
            if (this._remainingToday() <= 0) {
                console.log(`🛑 Daily limit reached. Stopping Worship sync for today (${this.maxDailyLimit}/day).`);
                break;
            }
            await this.processWorshipSong(song);
            await this.sleep(this.delayBetweenItemsMs);
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

        const result = await this._withRetry(async () => {
            await this._throttleBeforeRequest();
            return this.model.generateContent([
                { inlineData: { mimeType: 'audio/mpeg', data: base64Audio } },
                { text: prompt }
            ]);
        });

        let text = result.response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(text);
    }
}

module.exports = AutoSyncService;
