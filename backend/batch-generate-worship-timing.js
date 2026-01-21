/**
 * Batch Worship Timing Generator
 * Automatically generates timing for all worship songs with audio
 * Run this when Gemini API quota resets (12:00 AM Pacific Time)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PrecisionTimingService = require('./services/precisionTimingService');
const { pool } = require('./db-postgres');

// Configuration
const DELAY_BETWEEN_SONGS_MS = 10000; // 10 seconds between songs to avoid rate limits
const MAX_SONGS_PER_RUN = 50; // Maximum songs to process in one run
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3001';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSongsNeedingTiming() {
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                title,
                lyrics,
                audiourl
            FROM worship_songs 
            WHERE audiourl IS NOT NULL 
              AND audiourl != ''
              AND (has_timing = false OR has_timing IS NULL)
            ORDER BY id
            LIMIT $1
        `, [MAX_SONGS_PER_RUN]);

        return result.rows;
    } catch (error) {
        console.error('Error fetching songs:', error.message);
        return [];
    }
}

async function processAllSongs() {
    console.log('\n🎵 ========================================');
    console.log('🎵  Batch Worship Timing Generator');
    console.log('🎵 ========================================\n');

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set in .env');
        process.exit(1);
    }

    console.log('✅ GEMINI_API_KEY found');
    console.log(`⚙️  Delay between songs: ${DELAY_BETWEEN_SONGS_MS / 1000}s`);
    console.log(`⚙️  Max songs per run: ${MAX_SONGS_PER_RUN}`);
    console.log(`⚙️  Base URL: ${BASE_URL}\n`);

    // Initialize timing service
    let timingService;
    try {
        timingService = new PrecisionTimingService();
        console.log('✅ PrecisionTimingService initialized\n');
    } catch (error) {
        console.error('❌ Failed to initialize timing service:', error.message);
        process.exit(1);
    }

    // Get songs needing timing
    const songs = await getSongsNeedingTiming();

    if (songs.length === 0) {
        console.log('✅ All songs already have timing data!');
        process.exit(0);
    }

    console.log(`📝 Found ${songs.length} songs needing timing\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const progress = `[${i + 1}/${songs.length}]`;

        // Parse title
        let titleText = `Song ${song.id}`;
        try {
            const titleObj = typeof song.title === 'string' ? JSON.parse(song.title) : song.title;
            titleText = titleObj?.fa || titleObj?.en || titleText;
        } catch (e) { }

        console.log(`${progress} Processing: ${titleText}`);

        // Parse lyrics
        let lyricsText = '';
        try {
            const lyricsObj = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
            lyricsText = lyricsObj?.fa || lyricsObj?.en || '';
        } catch (e) {
            lyricsText = song.lyrics || '';
        }

        if (!lyricsText) {
            console.log(`   ⚠️  Skipping - no lyrics found`);
            failCount++;
            continue;
        }

        // Convert relative URL to absolute
        let audioUrl = song.audiourl;
        if (audioUrl && audioUrl.startsWith('/')) {
            audioUrl = `${BASE_URL}${audioUrl}`;
        }

        try {
            const result = await timingService.generateWorshipTiming({
                songId: song.id,
                audioUrl: audioUrl,
                lyrics: lyricsText
            });

            if (result.success) {
                console.log(`   ✅ Timing saved to ${result.outputPath}`);

                // Update database to mark as has_timing = true
                await pool.query(
                    'UPDATE worship_songs SET has_timing = true, timing_updated_at = NOW() WHERE id = $1',
                    [song.id]
                );

                successCount++;
            } else {
                console.log(`   ❌ Failed: ${result.error}`);
                failCount++;

                // Check if quota exceeded
                if (result.error && result.error.includes('429')) {
                    console.log('\n⚠️  Quota exceeded! Stopping batch process.');
                    console.log(`   Processed: ${successCount} success, ${failCount} failed`);
                    console.log('   Retry after quota resets (12:00 AM Pacific Time)\n');
                    break;
                }
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failCount++;

            if (error.message && error.message.includes('429')) {
                console.log('\n⚠️  Quota exceeded! Stopping batch process.');
                break;
            }
        }

        // Delay before next song
        if (i < songs.length - 1) {
            console.log(`   ⏳ Waiting ${DELAY_BETWEEN_SONGS_MS / 1000}s before next song...`);
            await sleep(DELAY_BETWEEN_SONGS_MS);
        }
    }

    console.log('\n🎵 ========================================');
    console.log(`🎵  Batch Complete!`);
    console.log(`🎵  Success: ${successCount} | Failed: ${failCount}`);
    console.log('🎵 ========================================\n');

    process.exit(0);
}

// Run the batch process
processAllSongs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
