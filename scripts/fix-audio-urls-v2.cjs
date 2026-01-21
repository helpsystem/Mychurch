/**
 * Fix Audio URLs Script v2
 * 
 * This script verifies audio files exist and removes broken URLs
 */

const fs = require('fs');
const path = require('path');

// Paths
const JSON_PATH = path.join(__dirname, '../public/worship/data/worship_songs_clean.json');
const AUDIO_DIR = path.join(__dirname, '../public/worship/audio/kalameh');
const OUTPUT_PATH = path.join(__dirname, '../public/worship/data/worship_songs.json');

// Main function
async function main() {
    console.log('🔧 Fix Audio URLs Script v2');
    console.log('============================\n');
    
    // Read worship songs JSON
    console.log('📖 Reading worship_songs.json...');
    const songsData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`   Found ${songsData.length} songs\n`);
    
    // Read audio files
    console.log('📁 Reading audio files from disk...');
    const audioFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
    const audioFilesLower = audioFiles.map(f => f.toLowerCase());
    console.log(`   Found ${audioFiles.length} audio files\n`);
    
    // Create lookup set for fast checking
    const audioSet = new Set(audioFiles);
    const audioSetLower = new Set(audioFilesLower);
    
    let verified = 0;
    let fixed = 0;
    let cleared = 0;
    
    for (const song of songsData) {
        if (!song.audioUrl) {
            continue;
        }
        
        const filename = path.basename(song.audioUrl);
        const decodedFilename = decodeURIComponent(filename);
        
        // Check if file exists (exact match)
        if (audioSet.has(filename) || audioSet.has(decodedFilename)) {
            // File exists - keep URL but ensure it's not URL-encoded
            if (filename !== decodedFilename && audioSet.has(decodedFilename)) {
                song.audioUrl = `/worship/audio/kalameh/${decodedFilename}`;
            }
            verified++;
            continue;
        }
        
        // Try case-insensitive match
        const lowerFilename = decodedFilename.toLowerCase();
        const matchIdx = audioFilesLower.indexOf(lowerFilename);
        if (matchIdx !== -1) {
            song.audioUrl = `/worship/audio/kalameh/${audioFiles[matchIdx]}`;
            fixed++;
            continue;
        }
        
        // File doesn't exist - clear the URL
        console.log(`❌ Not found: [${song.id}] ${song.title?.fa || song.title?.en}`);
        console.log(`   URL: ${filename}`);
        song.audioUrl = '';
        cleared++;
    }
    
    // Write updated JSON
    console.log('\n💾 Writing updated JSON...');
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(songsData, null, 2), 'utf8');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   ✅ Verified (file exists): ${verified}`);
    console.log(`   🔧 Fixed (case mismatch): ${fixed}`);
    console.log(`   ❌ Cleared (file missing): ${cleared}`);
    console.log(`\n📄 Updated JSON saved to: ${OUTPUT_PATH}`);
}

main().catch(console.error);
