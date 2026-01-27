/**
 * Timing Files Validator
 * 
 * این اسکریپت همه timing files رو بررسی میکنه و اطمینان میده که:
 * 1. فایل‌های timing برای سرودهای با hasTiming: true وجود دارن
 * 2. فایل‌های timing ساختار صحیح دارن
 * 3. هیچ فایل timing اضافی نداریم
 */

const fs = require('fs');
const path = require('path');

// Paths
const SONGS_FILE = path.join(__dirname, '../frontend/public/worship/data/worship_songs.json');
const TIMINGS_DIR = path.join(__dirname, '../frontend/public/worship/data/timings');

console.log('🎵 Timing Files Validator Starting...\n');

// Read worship songs
let worshipSongs;
try {
    const songsData = fs.readFileSync(SONGS_FILE, 'utf8');
    worshipSongs = JSON.parse(songsData);
    console.log(`✓ Loaded ${worshipSongs.length} worship songs\n`);
} catch (error) {
    console.error('❌ Error reading worship_songs.json:', error.message);
    process.exit(1);
}

// Get all timing files
let timingFiles;
try {
    timingFiles = fs.readdirSync(TIMINGS_DIR)
        .filter(file => file.match(/^song_\d+_timing\.json$/))
        .map(file => {
            const match = file.match(/song_(\d+)_timing\.json/);
            return match ? parseInt(match[1]) : null;
        })
        .filter(id => id !== null);
    console.log(`✓ Found ${timingFiles.length} timing files\n`);
} catch (error) {
    console.error('❌ Error reading timings directory:', error.message);
    process.exit(1);
}

// Validate
const results = {
    songsWithTiming: [],
    missingSongIds: [],
    missingTimingFiles: [],
    extraTimingFiles: [],
    invalidTimingFiles: [],
    validCount: 0
};

// Check each song with hasTiming: true
worshipSongs.forEach(song => {
    if (song.hasTiming === true) {
        results.songsWithTiming.push(song.id);

        const timingFilePath = path.join(TIMINGS_DIR, `song_${song.id}_timing.json`);

        if (!fs.existsSync(timingFilePath)) {
            results.missingTimingFiles.push({
                id: song.id,
                title: song.title?.fa || song.title?.en || 'Unknown',
                artist: song.artist
            });
        } else {
            // Validate timing file structure
            try {
                const timingData = JSON.parse(fs.readFileSync(timingFilePath, 'utf8'));

                // Check structure
                if (!timingData.songId) {
                    results.invalidTimingFiles.push({
                        id: song.id,
                        reason: 'Missing songId field',
                        file: `song_${song.id}_timing.json`
                    });
                } else if (timingData.songId !== song.id) {
                    results.invalidTimingFiles.push({
                        id: song.id,
                        reason: `songId mismatch: expected ${song.id}, got ${timingData.songId}`,
                        file: `song_${song.id}_timing.json`
                    });
                } else if (!timingData.lines || !Array.isArray(timingData.lines)) {
                    results.invalidTimingFiles.push({
                        id: song.id,
                        reason: 'Missing or invalid lines array',
                        file: `song_${song.id}_timing.json`
                    });
                } else {
                    results.validCount++;
                }
            } catch (error) {
                results.invalidTimingFiles.push({
                    id: song.id,
                    reason: `Parse error: ${error.message}`,
                    file: `song_${song.id}_timing.json`
                });
            }
        }
    }
});

// Check for extra timing files (files without corresponding songs)
timingFiles.forEach(fileId => {
    const song = worshipSongs.find(s => s.id === fileId);
    if (!song) {
        results.extraTimingFiles.push({
            id: fileId,
            file: `song_${fileId}_timing.json`,
            reason: 'No corresponding song found'
        });
    } else if (song.hasTiming !== true) {
        results.extraTimingFiles.push({
            id: fileId,
            file: `song_${fileId}_timing.json`,
            reason: `Song exists but hasTiming is ${song.hasTiming}`
        });
    }
});

// Report
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 VALIDATION REPORT');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`✅ Valid timing files: ${results.validCount}`);
console.log(`📝 Songs with hasTiming=true: ${results.songsWithTiming.length}\n`);

if (results.missingTimingFiles.length > 0) {
    console.log(`❌ MISSING TIMING FILES (${results.missingTimingFiles.length}):`);
    results.missingTimingFiles.forEach(item => {
        console.log(`   - Song ID ${item.id}: "${item.title}" by ${item.artist}`);
        console.log(`     Expected: song_${item.id}_timing.json`);
    });
    console.log('');
}

if (results.invalidTimingFiles.length > 0) {
    console.log(`⚠️  INVALID TIMING FILES (${results.invalidTimingFiles.length}):`);
    results.invalidTimingFiles.forEach(item => {
        console.log(`   - ${item.file}: ${item.reason}`);
    });
    console.log('');
}

if (results.extraTimingFiles.length > 0) {
    console.log(`🗑️  EXTRA TIMING FILES (${results.extraTimingFiles.length}):`);
    results.extraTimingFiles.forEach(item => {
        console.log(`   - ${item.file}: ${item.reason}`);
    });
    console.log('');
}

// Test specific song 335
console.log('═══════════════════════════════════════════════════════════');
console.log('🎯 SPECIAL CHECK: Song ID 335 ("آرامی دلهایی")');
console.log('═══════════════════════════════════════════════════════════\n');

const song335 = worshipSongs.find(s => s.id === 335);
if (song335) {
    console.log(`✓ Song found in worship_songs.json`);
    console.log(`  Title: ${song335.title?.fa || 'N/A'}`);
    console.log(`  Artist: ${song335.artist || 'N/A'}`);
    console.log(`  hasTiming: ${song335.hasTiming}`);

    const timing335Path = path.join(TIMINGS_DIR, 'song_335_timing.json');
    if (fs.existsSync(timing335Path)) {
        console.log(`✓ Timing file exists: song_335_timing.json`);

        try {
            const timing335 = JSON.parse(fs.readFileSync(timing335Path, 'utf8'));
            console.log(`✓ Timing file is valid JSON`);
            console.log(`  songId: ${timing335.songId}`);
            console.log(`  Lines count: ${timing335.lines?.length || 0}`);
            console.log(`  Version: ${timing335.version || 'N/A'}`);
            console.log(`  Generated at: ${timing335.generatedAt || 'N/A'}`);

            if (timing335.lines && timing335.lines.length > 0) {
                console.log(`  First line: "${timing335.lines[0].line}" (${timing335.lines[0].start}s)`);
            }
        } catch (error) {
            console.log(`❌ Error parsing timing file: ${error.message}`);
        }
    } else {
        console.log(`❌ Timing file NOT found: song_335_timing.json`);
    }
} else {
    console.log(`❌ Song ID 335 NOT found in worship_songs.json`);
}

console.log('\n═══════════════════════════════════════════════════════════');

// Exit code
if (results.missingTimingFiles.length > 0 || results.invalidTimingFiles.length > 0) {
    console.log('❌ Validation completed with errors\n');
    process.exit(1);
} else {
    console.log('✅ All timing files validated successfully!\n');
    process.exit(0);
}
