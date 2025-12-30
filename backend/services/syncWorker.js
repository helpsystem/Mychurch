// backend/services/syncWorker.js
// Background worker for automatic audio synchronization
const { pool } = require('../db-postgres');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

class SyncWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 10000; // 10 seconds
    this.maxConcurrentJobs = 2; // Process max 2 jobs at once
    this.activeJobs = 0;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Sync worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Sync worker started');
    this.processLoop();
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Sync worker stopped');
  }

  async processLoop() {
    while (this.isRunning) {
      try {
        // Check if we have capacity for more jobs
        if (this.activeJobs < this.maxConcurrentJobs) {
          await this.processNextJob();
        }

        // Wait before checking again
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('❌ Sync worker error:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  async processNextJob() {
    let client;
    
    try {
      client = await pool.connect();
    } catch (connError) {
      // Database not available, skip this job cycle
      console.log('⚠️  SyncWorker: Database not available, skipping job cycle');
      return;
    }

    try {
      // Get next pending job with highest priority
      await client.query('BEGIN');

      const result = await client.query(`
        SELECT * FROM sync_jobs 
        WHERE status = 'pending' 
        AND attempts < max_attempts
        ORDER BY priority ASC, created_at ASC 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
      `);

      if (result.rows.length === 0) {
        await client.query('COMMIT');
        return; // No jobs to process
      }

      const job = result.rows[0];

      // Mark job as processing
      await client.query(`
        UPDATE sync_jobs 
        SET status = 'processing', 
            started_at = CURRENT_TIMESTAMP,
            attempts = attempts + 1
        WHERE id = $1
      `, [job.id]);

      await client.query('COMMIT');

      console.log(`📋 Processing job ${job.id} (${job.job_type} #${job.entity_id})`);

      this.activeJobs++;

      // Process job asynchronously
      this.processJobAsync(job).finally(() => {
        this.activeJobs--;
      });

    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
      }
      console.error('Error fetching next job:', error);
    } finally {
      if (client) {
        try { client.release(); } catch (e) { /* ignore */ }
      }
    }
  }

  async processJobAsync(job) {
    try {
      let result;

      if (job.job_type === 'worship_song') {
        result = await this.processWorshipSong(job.entity_id);
      } else if (job.job_type === 'bible_chapter') {
        result = await this.processBibleChapter(job.entity_id);
      } else {
        throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark job as completed
      await pool.query(`
        UPDATE sync_jobs 
        SET status = 'completed', 
            completed_at = CURRENT_TIMESTAMP,
            result = $1
        WHERE id = $2
      `, [JSON.stringify(result), job.id]);

      // Update worship_songs status
      if (job.job_type === 'worship_song') {
        await pool.query(`
          UPDATE worship_songs 
          SET processing_status = 'completed'
          WHERE id = $1
        `, [job.entity_id]);
      }

      console.log(`✅ Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);

      // Mark job as failed
      await pool.query(`
        UPDATE sync_jobs 
        SET status = CASE 
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'pending'
        END,
        error_message = $1,
        completed_at = CASE 
          WHEN attempts >= max_attempts THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
        WHERE id = $2
      `, [error.message, job.id]);

      // Update worship_songs status
      if (job.job_type === 'worship_song') {
        await pool.query(`
          UPDATE worship_songs 
          SET processing_status = CASE 
            WHEN (SELECT attempts FROM sync_jobs WHERE id = $2) >= (SELECT max_attempts FROM sync_jobs WHERE id = $2) 
            THEN 'failed'
            ELSE 'queued'
          END
          WHERE id = $1
        `, [job.entity_id, job.id]);
      }
    }
  }

  async processWorshipSong(songId) {
    console.log(`🎵 Processing worship song ${songId}`);

    // Get song details
    const songResult = await pool.query(
      'SELECT * FROM worship_songs WHERE id = $1',
      [songId]
    );

    if (songResult.rows.length === 0) {
      throw new Error('Song not found');
    }

    const song = songResult.rows[0];

    if (!song.audiourl) {
      throw new Error('No audio URL found');
    }

    // Parse lyrics
    const lyrics = typeof song.lyrics === 'string' 
      ? JSON.parse(song.lyrics) 
      : song.lyrics;

    const lyricsFa = lyrics?.fa || '';
    const lyricsEn = lyrics?.en || '';

    if (!lyricsFa && !lyricsEn) {
      throw new Error('No lyrics found');
    }

    // Build full audio URL
    const audioUrl = song.audiourl.startsWith('http')
      ? song.audiourl
      : `https://samanabyar.online${song.audiourl}`;

    console.log(`📥 Downloading audio from: ${audioUrl}`);

    // Download audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const base64Audio = audioBuffer.toString('base64');

    console.log(`✅ Audio downloaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Process with Gemini AI
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const referenceText = lyricsEn || lyricsFa;

    console.log('🤖 Generating AI analysis...');

    const prompt = `Analyze this worship song audio and provide comprehensive timing data.

Reference text: "${referenceText}"

Return ONLY valid JSON with this structure (no markdown, no trailing commas):
{
  "timing": [
    { "word": "word1", "startTime": 0.5, "endTime": 1.2 }
  ],
  "chords": [
    { "time": 0.0, "chord": "Am" }
  ],
  "structure": {
    "intro": { "start": 0, "end": 5 },
    "verse1": { "start": 5, "end": 20 }
  }
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/mpeg',
          data: base64Audio,
        },
      },
      { text: prompt },
    ]);

    let responseText = result.response.text();
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
      .replace(/,(\s*[}\]])/g, '$1');

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('⚠️  AI response not valid JSON, using fallback');
      aiAnalysis = {
        timing: this.generateFallbackTiming(referenceText),
        chords: [],
        structure: {}
      };
    }

    // Save results to database
    const timingData = aiAnalysis.timing || [];
    const chordsData = aiAnalysis.chords || [];
    const structureData = aiAnalysis.structure || {};

    await pool.query(`
      UPDATE worship_songs 
      SET timing_data = $1,
          chords = $2,
          structure = $3,
          timing_updated_at = NOW()
      WHERE id = $4
    `, [
      JSON.stringify(timingData),
      JSON.stringify(chordsData),
      JSON.stringify(structureData),
      songId
    ]);

    console.log(`✅ Worship song ${songId} processed: ${timingData.length} words, ${chordsData.length} chords`);

    return {
      success: true,
      wordCount: timingData.length,
      chordCount: chordsData.length,
      hasStructure: Object.keys(structureData).length > 0
    };
  }

  async processBibleChapter(chapterId) {
    console.log(`📖 Processing bible chapter ${chapterId}`);
    // TODO: Implement Bible chapter processing
    throw new Error('Bible chapter processing not yet implemented');
  }

  generateFallbackTiming(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const SECONDS_PER_WORD = 0.5;

    return words.map((word, index) => ({
      word: word,
      startTime: index * SECONDS_PER_WORD,
      endTime: (index + 1) * SECONDS_PER_WORD
    }));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const syncWorker = new SyncWorker();

module.exports = syncWorker;
