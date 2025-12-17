const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { pool } = require('../db-postgres');

// Configuration (defaults are tuned for Gemini free tier; override via env vars)
const DEFAULTS = {
    BATCH_SIZE: 50,
    DELAY_BETWEEN_ITEMS_MS: 5000,
    MAX_DAILY_LIMIT: 1000,
    MAX_REQUESTS_PER_MINUTE: 12,
    MAX_ITEM_ATTEMPTS_PER_RUN: 300,
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
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        this.batchSize = readEnvInt('AUTO_SYNC_BATCH_SIZE', DEFAULTS.BATCH_SIZE);
        this.delayBetweenItemsMs = readEnvInt('AUTO_SYNC_DELAY_MS', DEFAULTS.DELAY_BETWEEN_ITEMS_MS);
        this.maxDailyLimit = readEnvInt('AUTO_SYNC_MAX_DAILY', DEFAULTS.MAX_DAILY_LIMIT);
        this.maxRequestsPerMinute = readEnvInt('AUTO_SYNC_MAX_RPM', DEFAULTS.MAX_REQUESTS_PER_MINUTE);
        this.maxItemAttemptsPerRun = readEnvInt('AUTO_SYNC_MAX_ATTEMPTS_PER_RUN', DEFAULTS.MAX_ITEM_ATTEMPTS_PER_RUN);
        this.usageFile = process.env.AUTO_SYNC_USAGE_FILE || DEFAULTS.USAGE_FILE;

        this.publicBaseUrl = (process.env.AUTO_SYNC_PUBLIC_BASE_URL || 'https://samanabyar.online').replace(/\/$/, '');

        // HiDrive credentials for Basic Auth (WebDAV URLs require authentication)
        this.hidriveUser = process.env.HIDRIVE_USER || '';
        this.hidrivePassword = process.env.HIDRIVE_PASSWORD || '';

        // If DATABASE_URL isn't configured, db-postgres falls back to a lightweight Supabase REST wrapper
        // that does not support many SQL features (LIMIT/JOIN/etc). In that situation, force Supabase paths.
        this.forceSupabase = !process.env.DATABASE_URL || process.env.DATABASE_URL_DISABLED === 'true';

        // Local Bible text folder (server: /root/Mychurch/backend/bible_data/text)
        this.localBibleTextRoot = path.join(__dirname, '..', 'bible_data', 'text');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey =
            process.env.SUPABASE_SERVICE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY;
        this.supabase = supabaseUrl && supabaseKey
            ? createClient(supabaseUrl, supabaseKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            })
            : null;

        this._recentRequestTimestamps = [];
        this._usage = this._loadUsage();
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _hasSupabase() {
        return Boolean(this.supabase);
    }

    _normalizeUrl(raw) {
        if (!raw || typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        // Allow relative URLs stored in DB
        if (trimmed.startsWith('/')) return `${this.publicBaseUrl}${trimmed}`;
        return null;
    }

    _isDbConnError(err) {
        const msg = String(err?.message || err);
        return /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|timeout|connect/i.test(msg);
    }

    async _supabaseSelectAll(table, select, buildQuery) {
        // Paginates using range() to avoid default 1k limits
        const pageSize = 1000;
        let from = 0;
        const out = [];

        while (true) {
            let query = this.supabase.from(table).select(select).range(from, from + pageSize - 1);
            if (buildQuery) query = buildQuery(query);
            const { data, error } = await query;
            if (error) throw error;
            if (!data || data.length === 0) break;
            out.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }

        return out;
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
        console.log(`⚙️ Bible sync config: batch=${this.batchSize}, delayMs=${this.delayBetweenItemsMs}, maxDaily=${this.maxDailyLimit}, maxRPM=${this.maxRequestsPerMinute}`);

        if (this.forceSupabase) {
            await this._syncBibleChaptersSupabase();
            return;
        }

        // Try Postgres first; fallback to Supabase when Postgres isn't reachable.
        try {
            await this._syncBibleChaptersPostgres();
        } catch (err) {
            if (!this._hasSupabase() || !this._isDbConnError(err)) throw err;
            console.warn(`⚠️ Postgres not reachable; falling back to Supabase for Bible sync: ${err.message}`);
            await this._syncBibleChaptersSupabase();
        }
    }

    async _syncBibleChaptersPostgres() {

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

        const attempted = new Set();
        let totalProcessed = 0;
        let totalAttempts = 0;

        while (this._remainingToday() > 0) {
            const res = await pool.query(query);
            const candidates = res.rows;
            if (candidates.length === 0) break;

            console.log(`📝 Found ${candidates.length} Bible chapters pending sync (remainingToday=${this._remainingToday()}).`);

            let progressedThisBatch = false;

            for (const item of candidates) {
                if (this._remainingToday() <= 0) {
                    console.log(`🛑 Daily limit reached. Stopping Bible sync for today (${this.maxDailyLimit}/day).`);
                    return;
                }

                if (totalAttempts >= this.maxItemAttemptsPerRun) {
                    console.log(`🛑 Max attempts reached for this run (${this.maxItemAttemptsPerRun}). Stopping Bible sync.`);
                    return;
                }

                const key = `${item.translation}:${item.book}:${item.chapter}`;
                if (attempted.has(key)) continue;
                attempted.add(key);

                totalAttempts += 1;

                await this.processBibleChapter(item);
                progressedThisBatch = true;
                totalProcessed += 1;
                await this.sleep(this.delayBetweenItemsMs);
            }

            if (!progressedThisBatch) {
                // Avoid looping forever on the same failing items.
                break;
            }
        }

        console.log(`✅ Bible sync finished. Attempted ${totalProcessed} chapters this run.`);
    }

    async _syncBibleChaptersSupabase() {
        if (!this.supabase) throw new Error('Supabase client is not configured');

        const translations = ['TPV', 'MOJDEH', 'QADIM', 'POV-FAS'];
        const attempted = new Set();
        let totalProcessed = 0;
        let totalAttempts = 0;

        for (const translation of translations) {
            if (this._remainingToday() <= 0) break;
            if (totalAttempts >= this.maxItemAttemptsPerRun) break;

            const translationDir = path.join(this.localBibleTextRoot, translation);
            if (!fs.existsSync(translationDir)) continue;

            // Get existing timing keys for this translation (so we only process missing)
            const existing = await this._supabaseSelectAll(
                'bible_audio_timing',
                'book_code,chapter',
                (q) => q.eq('translation', translation)
            );
            const existingSet = new Set(existing.map(r => `${r.book_code}:${r.chapter}`));

            const bookDirs = fs.readdirSync(translationDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name)
                .sort();

            while (this._remainingToday() > 0 && totalAttempts < this.maxItemAttemptsPerRun) {
                const candidates = [];

                for (const bookCode of bookDirs) {
                    const bookPath = path.join(translationDir, bookCode);
                    let chapterFiles = [];
                    try {
                        chapterFiles = fs.readdirSync(bookPath, { withFileTypes: true })
                            .filter(f => f.isFile() && f.name.toLowerCase().endsWith('.json'))
                            .map(f => f.name);
                    } catch (e) {
                        continue;
                    }

                    const chapters = chapterFiles
                        .map(name => Number.parseInt(name.replace(/\.json$/i, ''), 10))
                        .filter(n => Number.isFinite(n) && n > 0)
                        .sort((a, b) => a - b);

                    for (const chapter of chapters) {
                        if (existingSet.has(`${bookCode}:${chapter}`)) continue;
                        const key = `${translation}:${bookCode}:${chapter}`;
                        if (attempted.has(key)) continue;
                        candidates.push({ translation, book: bookCode, chapter });
                        if (candidates.length >= this.batchSize) break;
                    }

                    if (candidates.length >= this.batchSize) break;
                }

                if (candidates.length === 0) break;
                console.log(`📝 Found ${candidates.length} Bible chapters pending sync via local text (${translation}, remainingToday=${this._remainingToday()}).`);

                let progressedThisBatch = false;
                for (const item of candidates) {
                    if (this._remainingToday() <= 0) return;
                    if (totalAttempts >= this.maxItemAttemptsPerRun) {
                        console.log(`🛑 Max attempts reached for this run (${this.maxItemAttemptsPerRun}). Stopping Bible sync.`);
                        return;
                    }

                    const key = `${item.translation}:${item.book}:${item.chapter}`;
                    attempted.add(key);
                    totalAttempts += 1;

                    const ok = await this._processBibleChapterFromLocalTextSupabase(item);
                    progressedThisBatch = progressedThisBatch || ok;
                    if (ok) existingSet.add(`${item.book}:${item.chapter}`);
                    totalProcessed += 1;
                    await this.sleep(this.delayBetweenItemsMs);
                }

                if (!progressedThisBatch) break;
            }
        }

        console.log(`✅ Bible sync finished (Supabase/local text). Attempted ${totalProcessed} chapters this run.`);
    }

    async _processBibleChapterFromLocalTextSupabase({ book, chapter, translation }) {
        console.log(`▶️ Processing ${book} ${chapter} (${translation})...`);

        try {
            const chapterPath = path.join(this.localBibleTextRoot, translation, book, `${chapter}.json`);
            if (!fs.existsSync(chapterPath)) {
                console.warn(`Missing chapter JSON: ${chapterPath}`);
                return false;
            }

            const parsed = JSON.parse(fs.readFileSync(chapterPath, 'utf8'));
            const rawVerses = Array.isArray(parsed?.verses) ? parsed.verses : [];
            if (rawVerses.length === 0) {
                console.warn('No verses in chapter JSON');
                return false;
            }

            const verses = rawVerses
                .map((v, index) => {
                    const verseNum = v.verse ?? v.verseNumber ?? v.verse_number ?? v.verseNumber ?? (index + 1);
                    const text = v.text ?? v.verse_text ?? v.text_fa ?? v.textFa ?? v.text_en ?? v.textEn;
                    return { verse: Number(verseNum), text: (text ?? '').toString() };
                })
                .filter(v => Number.isFinite(v.verse) && v.text);

            if (verses.length === 0) {
                console.warn('No usable verses after normalization');
                return false;
            }

            const audioUrl = await this.resolveAudioUrl(book, chapter, translation);
            if (!audioUrl) {
                console.warn(`❌ No audio URL found for ${book} ${chapter} (${translation})`);
                return false;
            }

            const timingData = await this.generateTiming(verses, audioUrl, 'bible');
            const payload = {
                book_code: book,
                chapter,
                translation,
                audio_url: audioUrl,
                timing_data: timingData,
                updated_at: new Date().toISOString()
            };

            const { error: upsertErr } = await this.supabase
                .from('bible_audio_timing')
                .upsert(payload, { onConflict: 'book_code,chapter,translation' });
            if (upsertErr) throw upsertErr;

            console.log(`✅ Saved timing for ${book} ${chapter} (${translation})`);
            return true;
        } catch (err) {
            console.error(`❌ Failed to process ${book} ${chapter} (${translation}) from local text:`, err.message);
            return false;
        }
    }

    async _processBibleChapterSupabase({ book, chapter, translation }) {
        try {
            const { data: verses, error } = await this.supabase
                .from('bible_verses')
                .select('verse,text')
                .eq('book', book)
                .eq('chapter', chapter)
                .eq('translation', translation)
                .order('verse', { ascending: true });
            if (error) throw error;
            if (!verses || verses.length === 0) {
                console.warn(`No verses found for ${book} ${chapter} (${translation})`);
                return false;
            }

            const audioUrl = await this.resolveAudioUrl(book, chapter, translation);
            if (!audioUrl) {
                console.warn(`❌ No audio URL found for ${book} ${chapter} (${translation})`);
                return false;
            }

            const timingData = await this.generateTiming(verses, audioUrl, 'bible');
            const payload = {
                book_code: book,
                chapter,
                translation,
                audio_url: audioUrl,
                timing_data: timingData,
                updated_at: new Date().toISOString()
            };

            const { error: upsertErr } = await this.supabase
                .from('bible_audio_timing')
                .upsert(payload, { onConflict: 'book_code,chapter,translation' });
            if (upsertErr) throw upsertErr;

            console.log(`✅ Saved timing for ${book} ${chapter} (${translation})`);
            return true;
        } catch (err) {
            console.error(`❌ Failed to process ${book} ${chapter} (${translation}) via Supabase:`, err.message);
            return false;
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
        console.log(`⚙️ Worship sync config: batch=${this.batchSize}, delayMs=${this.delayBetweenItemsMs}, maxDaily=${this.maxDailyLimit}, maxRPM=${this.maxRequestsPerMinute}`);

        if (this.forceSupabase) {
            await this._syncWorshipSongsSupabase();
            return;
        }

        // Try Postgres first; fallback to Supabase when Postgres isn't reachable.
        try {
            await this._syncWorshipSongsPostgres();
        } catch (err) {
            if (!this._hasSupabase() || !this._isDbConnError(err)) throw err;
            console.warn(`⚠️ Postgres not reachable; falling back to Supabase for Worship sync: ${err.message}`);
            await this._syncWorshipSongsSupabase();
        }
    }

    async _syncWorshipSongsPostgres() {

        // Find songs with audio but no timing
        const query = `
      SELECT id, title_fa, lyrics, audiourl
      FROM worship_songs
      WHERE (timing_data IS NULL OR timing_data = '[]')
      AND audiourl IS NOT NULL
            LIMIT ${this.batchSize}
    `;

        const attempted = new Set();
        let totalProcessed = 0;
        let totalAttempts = 0;

        while (this._remainingToday() > 0) {
            const res = await pool.query(query);
            const songs = res.rows;
            if (songs.length === 0) break;

            console.log(`📝 Found ${songs.length} Worship Songs pending sync (remainingToday=${this._remainingToday()}).`);

            let progressedThisBatch = false;

            for (const song of songs) {
                if (this._remainingToday() <= 0) {
                    console.log(`🛑 Daily limit reached. Stopping Worship sync for today (${this.maxDailyLimit}/day).`);
                    return;
                }

                if (totalAttempts >= this.maxItemAttemptsPerRun) {
                    console.log(`🛑 Max attempts reached for this run (${this.maxItemAttemptsPerRun}). Stopping Worship sync.`);
                    return;
                }

                const key = String(song.id);
                if (attempted.has(key)) continue;
                attempted.add(key);

                totalAttempts += 1;

                await this.processWorshipSong(song);
                progressedThisBatch = true;
                totalProcessed += 1;
                await this.sleep(this.delayBetweenItemsMs);
            }

            if (!progressedThisBatch) {
                break;
            }
        }

        console.log(`✅ Worship sync finished. Attempted ${totalProcessed} songs this run.`);
    }

    async _syncWorshipSongsSupabase() {
        if (!this.supabase) throw new Error('Supabase client is not configured');

        const attempted = new Set();
        let totalProcessed = 0;
        let totalAttempts = 0;

        while (this._remainingToday() > 0) {
            // Prefer the boolean column; it's cheaper and avoids json comparison quirks.
            const { data: songs, error } = await this.supabase
                .from('worship_songs')
                .select('id,title,lyrics,audiourl,has_timing')
                .not('audiourl', 'is', null)
                .or('has_timing.is.null,has_timing.eq.false')
                .range(0, Math.max(0, this.batchSize - 1));
            if (error) throw error;
            if (!songs || songs.length === 0) break;

            console.log(`📝 Found ${songs.length} Worship Songs pending sync via Supabase (remainingToday=${this._remainingToday()}).`);

            let progressedThisBatch = false;
            for (const song of songs) {
                if (this._remainingToday() <= 0) return;

                if (totalAttempts >= this.maxItemAttemptsPerRun) {
                    console.log(`🛑 Max attempts reached for this run (${this.maxItemAttemptsPerRun}). Stopping Worship sync.`);
                    return;
                }
                const key = String(song.id);
                if (attempted.has(key)) continue;
                attempted.add(key);

                totalAttempts += 1;

                const ok = await this._processWorshipSongSupabase(song);
                progressedThisBatch = progressedThisBatch || ok;
                totalProcessed += 1;
                await this.sleep(this.delayBetweenItemsMs);
            }

            if (!progressedThisBatch) break;
        }

        console.log(`✅ Worship sync finished (Supabase). Attempted ${totalProcessed} songs this run.`);
    }

    async _processWorshipSongSupabase(song) {
        let titleLabel = String(song.id);
        try {
            const rawTitle = song.title;
            const titleObj = typeof rawTitle === 'string' ? JSON.parse(rawTitle) : rawTitle;
            titleLabel = titleObj?.fa || titleObj?.en || (typeof rawTitle === 'string' ? rawTitle : titleLabel);
        } catch (e) {
            // ignore
        }

        console.log(`▶️ Processing Song: ${titleLabel}...`);
        try {
            const lyrics = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
            const text = lyrics?.fa || lyrics?.en;
            if (!text) {
                console.warn('No lyrics text found');
                return false;
            }

            const audioUrl = this._normalizeUrl(song.audiourl);
            if (!audioUrl) {
                console.warn('No valid audio URL');
                return false;
            }

            const result = await this.generateTiming({ text }, audioUrl, 'worship');

            const { error } = await this.supabase
                .from('worship_songs')
                .update({
                    timing_data: result.timing,
                    has_timing: true,
                    timing_updated_at: new Date().toISOString()
                })
                .eq('id', song.id);
            if (error) throw error;

            console.log(`✅ Saved timing for song ${song.id}`);
            return true;
        } catch (err) {
            console.error(`❌ Failed song ${song.id} via Supabase:`, err.message);
            return false;
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

        // Build fetch options (add Basic Auth for HiDrive URLs)
        const fetchOptions = {};
        if (audioUrl.includes('hidrive') && this.hidriveUser && this.hidrivePassword) {
            const authHeader = 'Basic ' + Buffer.from(`${this.hidriveUser}:${this.hidrivePassword}`).toString('base64');
            fetchOptions.headers = { 'Authorization': authHeader };
        }

        const audioRes = await fetch(audioUrl, fetchOptions);
        if (!audioRes.ok) throw new Error(`Failed to download audio (${audioRes.status} ${audioRes.statusText})`);
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
