/**
 * Test Finglish Generation for Song 335 (آرامی دل ها)
 * This script regenerates timing data with Finglish transliterations
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PrecisionTimingService = require('./services/precisionTimingService');
const { pool } = require('./db-postgres');

async function testFinglishOnSong335() {
    console.log('\n🎵 ========================================');
    console.log('🎵  Testing Finglish on Song 335');
    console.log('🎵  آرامی دل ها');
    console.log('🎵 ========================================\n');

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set in .env');
        process.exit(1);
    }

    console.log('✅ GEMINI_API_KEY found\n');

    // Initialize timing service
    let timingService;
    try {
        timingService = new PrecisionTimingService();
        console.log('✅ PrecisionTimingService initialized\n');
    } catch (error) {
        console.error('❌ Failed to initialize timing service:', error.message);
        process.exit(1);
    }

    // Get song 335 details
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                title,
                lyrics,
                audiourl
            FROM worship_songs 
            WHERE id = 335
        `);

        if (result.rows.length === 0) {
            console.error('❌ Song 335 not found in database');
            process.exit(1);
        }

        const song = result.rows[0];

        // Parse title
        let titleText = 'Song 335';
        try {
            const titleObj = typeof song.title === 'string' ? JSON.parse(song.title) : song.title;
            titleText = titleObj?.fa || titleObj?.en || titleText;
        } catch (e) { }

        console.log(`📝 Song: ${titleText} (ID: ${song.id})`);

        // Parse lyrics
        let lyricsText = '';
        try {
            const lyricsObj = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
            lyricsText = lyricsObj?.fa || lyricsObj?.en || '';
        } catch (e) {
            lyricsText = song.lyrics || '';
        }

        if (!lyricsText) {
            console.error('❌ No lyrics found for song 335');
            process.exit(1);
        }

        console.log(`📄 Lyrics length: ${lyricsText.length} characters`);

        // Convert relative URL to absolute
        let audioUrl = song.audiourl;
        if (audioUrl && audioUrl.startsWith('/')) {
            const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3001';
            audioUrl = `${BASE_URL}${audioUrl}`;
        }

        console.log(`🎵 Audio URL: ${audioUrl}\n`);

        // Generate timing with Finglish
        console.log('🚀 Starting timing generation with Finglish...\n');

        const timingResult = await timingService.generateWorshipTiming({
            songId: song.id,
            audioUrl: audioUrl,
            lyrics: lyricsText
        });

        if (timingResult.success) {
            console.log(`\n✅ Timing generated successfully!`);
            console.log(`📁 Output: ${timingResult.outputPath}`);

            // Display sample Finglish words
            if (timingResult.timing && timingResult.timing.lines && timingResult.timing.lines.length > 0) {
                console.log('\n📖 Sample Finglish words from first line:');
                const firstLine = timingResult.timing.lines[0];
                console.log(`   Persian: ${firstLine.line}`);

                if (firstLine.words && firstLine.words.length > 0) {
                    console.log('   Words:');
                    firstLine.words.slice(0, 5).forEach(w => {
                        console.log(`     • ${w.word} → ${w.finglish || '(no finglish)'} [${w.start}s - ${w.end}s]`);
                    });
                }
            }

            // Update database
            await pool.query(
                'UPDATE worship_songs SET has_timing = true, timing_updated_at = NOW() WHERE id = $1',
                [song.id]
            );
            console.log('\n✅ Database updated');

        } else {
            console.error(`\n❌ Failed: ${timingResult.error}`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }

    console.log('\n🎵 ========================================');
    console.log('🎵  Test Complete!');
    console.log('🎵 ========================================\n');

    process.exit(0);
}

// Run the test
testFinglishOnSong335().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
