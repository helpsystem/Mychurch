/**
 * Real Test: Generate Timing with Gemini 2.5 Flash
 * Tests the new API with a real worship song
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testRealTiming() {
    console.log('🧪 Real Test: Gemini 2.5 Flash Timing Generation\n');
    console.log('='.repeat(50) + '\n');

    try {
        // 1. Load worship songs to find one with audio
        const songsPath = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'worship_songs.json');
        const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));

        // Find first song with local audio (not URL)
        const testSong = songs.find(s =>
            s.audioUrl &&
            s.audioUrl.startsWith('/') &&
            s.lyrics &&
            s.lyrics.length > 50
        );

        if (!testSong) {
            console.log('❌ No suitable test song found');
            return false;
        }

        console.log('📄 Test Song:');
        console.log(`   ID: ${testSong.id}`);
        console.log(`   Title: ${testSong.title}`);
        console.log(`   Audio: ${testSong.audioUrl}`);
        console.log(`   Lyrics: ${testSong.lyrics.substring(0, 100)}...\n`);

        // 2. Check if audio file exists
        const audioPath = path.join(__dirname, '..', 'frontend', 'public', testSong.audioUrl);
        if (!fs.existsSync(audioPath)) {
            console.log(`❌ Audio file not found: ${audioPath}`);
            console.log('\n🔄 Trying with remote audio...');

            // Try a song with remote URL
            const remoteSong = songs.find(s =>
                s.audioUrl &&
                s.audioUrl.startsWith('http') &&
                s.lyrics
            );

            if (remoteSong) {
                console.log(`\n📄 Remote Song:`);
                console.log(`   ID: ${remoteSong.id}`);
                console.log(`   Title: ${remoteSong.title}`);
                console.log(`   Audio: ${remoteSong.audioUrl}`);
            } else {
                console.log('❌ No song with valid audio found');
            }
            return false;
        }

        console.log('✅ Audio file exists\n');

        // 3. Initialize timing service
        const PrecisionTimingService = require('./services/precisionTimingService');
        const service = new PrecisionTimingService();

        console.log('🤖 Starting Gemini 2.5 Flash timing generation...\n');
        console.log('⏳ This may take 30-60 seconds...\n');

        // 4. Generate timing
        const audioUrl = `http://localhost:5173${testSong.audioUrl}`;
        const startTime = Date.now();

        const result = await service.generateWorshipTiming({
            songId: testSong.id,
            audioUrl: audioUrl,
            lyrics: testSong.lyrics
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // 5. Show results
        console.log('='.repeat(50));
        console.log('\n📊 Results:\n');

        if (result.success) {
            console.log('✅ SUCCESS!');
            console.log(`   Time: ${duration}s`);
            console.log(`   Lines: ${result.timing?.lines?.length || 0}`);
            console.log(`   Output: ${result.outputPath}`);

            if (result.timing?.lines?.[0]) {
                console.log('\n📝 First line sample:');
                console.log(`   Text: "${result.timing.lines[0].line}"`);
                console.log(`   Start: ${result.timing.lines[0].start}s`);
                console.log(`   End: ${result.timing.lines[0].end}s`);
                console.log(`   Words: ${result.timing.lines[0].words?.length || 0}`);
            }
        } else {
            console.log('❌ FAILED');
            console.log(`   Error: ${result.error}`);
        }

        return result.success;

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        return false;
    }
}

testRealTiming()
    .then(success => {
        console.log('\n' + '='.repeat(50));
        console.log(success ? '🎉 Test PASSED!' : '❌ Test FAILED');
        process.exit(success ? 0 : 1);
    });
