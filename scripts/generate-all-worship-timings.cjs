/**
 * Generate timing files for ALL worship songs
 * Skips songs that already have timing files
 */

const fs = require('fs');
const path = require('path');

// Paths
const SONGS_PATH = path.join(__dirname, '../frontend/public/worship/data/worship_songs.json');
const TIMINGS_DIR = path.join(__dirname, '../frontend/public/worship/data/timings');

// Ensure timings directory exists
if (!fs.existsSync(TIMINGS_DIR)) {
    fs.mkdirSync(TIMINGS_DIR, { recursive: true });
}

// Load songs
const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf-8'));
console.log(`\n📚 Total songs in database: ${songs.length}`);

// Get existing timing files
const existingTimings = new Set();
if (fs.existsSync(TIMINGS_DIR)) {
    fs.readdirSync(TIMINGS_DIR)
        .filter(f => f.match(/^song_\d+_timing\.json$/))
        .forEach(f => {
            const id = parseInt(f.match(/song_(\d+)_timing/)[1]);
            existingTimings.add(id);
        });
}
console.log(`✅ Existing timing files: ${existingTimings.size}`);

// Generate timing from lyrics
function generateTiming(song) {
    const lyrics = song.lyrics?.fa || '';
    if (!lyrics || lyrics.length < 10) {
        return null;
    }

    // Parse lyrics into lines
    const lines = lyrics.split('\n').filter(line => line.trim());
    
    // Estimate duration (3 seconds per line average)
    const estimatedDuration = lines.length * 3;
    
    // Build timing data
    const timingData = {
        metadata: {
            songId: song.id,
            title: song.title?.fa || song.title?.en || `Song ${song.id}`,
            totalDuration: estimatedDuration,
            lineCount: lines.length,
            generatedAt: new Date().toISOString(),
            source: 'auto-generated'
        },
        lines: [],
        words: []
    };

    let currentTime = 0;
    const avgLineTime = 3; // seconds per line

    lines.forEach((line, idx) => {
        const lineStart = currentTime;
        const lineEnd = currentTime + avgLineTime;
        
        // Add line timing
        timingData.lines.push({
            index: idx,
            text: line.trim(),
            start: parseFloat(lineStart.toFixed(2)),
            end: parseFloat(lineEnd.toFixed(2))
        });

        // Add word timings
        const words = line.trim().split(/\s+/).filter(w => w);
        if (words.length > 0) {
            const wordDuration = avgLineTime / words.length;
            words.forEach((word, wIdx) => {
                timingData.words.push({
                    word: word,
                    lineIndex: idx,
                    start: parseFloat((lineStart + wIdx * wordDuration).toFixed(2)),
                    end: parseFloat((lineStart + (wIdx + 1) * wordDuration).toFixed(2))
                });
            });
        }

        currentTime = lineEnd;
    });

    // Update total duration
    timingData.metadata.totalDuration = currentTime;

    return timingData;
}

// Process all songs
let created = 0;
let skipped = 0;
let noLyrics = 0;
let errors = 0;

console.log(`\n🔄 Processing ${songs.length} songs...\n`);

songs.forEach((song, idx) => {
    const timingPath = path.join(TIMINGS_DIR, `song_${song.id}_timing.json`);
    
    // Skip if timing already exists
    if (existingTimings.has(song.id) || fs.existsSync(timingPath)) {
        skipped++;
        return;
    }

    // Check if song has lyrics
    const lyrics = song.lyrics?.fa || '';
    if (!lyrics || lyrics.length < 10) {
        noLyrics++;
        return;
    }

    try {
        const timing = generateTiming(song);
        if (timing) {
            fs.writeFileSync(timingPath, JSON.stringify(timing, null, 2), 'utf-8');
            created++;
            if (created % 50 === 0) {
                console.log(`  ✅ Created ${created} timing files...`);
            }
        }
    } catch (err) {
        errors++;
        console.error(`  ❌ Error for song ${song.id}: ${err.message}`);
    }
});

// Final report
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 FINAL REPORT`);
console.log(`${'='.repeat(50)}`);
console.log(`✅ Created: ${created} new timing files`);
console.log(`⏭️  Skipped: ${skipped} (already had timing)`);
console.log(`📝 No lyrics: ${noLyrics} songs`);
console.log(`❌ Errors: ${errors}`);
console.log(`${'='.repeat(50)}`);

// Verify final count
const finalCount = fs.readdirSync(TIMINGS_DIR).filter(f => f.match(/^song_\d+_timing\.json$/)).length;
console.log(`\n🎵 Total timing files now: ${finalCount}`);
