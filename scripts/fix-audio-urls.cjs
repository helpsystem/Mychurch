/**
 * Fix Audio URLs Script
 * 
 * This script updates worship_songs.json to use the correct Finglish filenames
 * instead of Persian filenames that don't exist on disk.
 */

const fs = require('fs');
const path = require('path');

// Paths
const JSON_PATH = path.join(__dirname, '../public/worship/data/worship_songs_clean.json');
const AUDIO_DIR = path.join(__dirname, '../public/worship/audio/kalameh');
const OUTPUT_PATH = path.join(__dirname, '../public/worship/data/worship_songs_fixed.json');

// Persian to Finglish character mapping
const persianToFinglish = {
    'آ': 'a', 'ا': 'a', 'أ': 'a', 'إ': 'a',
    'ب': 'b',
    'پ': 'p',
    'ت': 't', 'ط': 't',
    'ث': 's',
    'ج': 'j',
    'چ': 'ch',
    'ح': 'h', 'ه': 'h', 'ة': 'h',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'z',
    'ر': 'r',
    'ز': 'z', 'ض': 'z', 'ظ': 'z',
    'ژ': 'zh',
    'س': 's', 'ص': 's', 'ث': 's',
    'ش': 'sh',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'gh',
    'ک': 'k', 'ك': 'k',
    'گ': 'g',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'و': 'o',
    'ی': 'i', 'ي': 'i', 'ئ': 'i',
    'ء': '',
    '‌': '', // Zero-width non-joiner
    '‎': '', // LTR mark
    '‏': '', // RTL mark
    '\u200c': '', // ZWNJ
    '\u200d': '', // ZWJ
};

// Normalize Persian text to Finglish for comparison
function persianToFinglishNormalize(text) {
    if (!text) return '';
    
    let result = text.toLowerCase();
    
    // Replace Persian characters
    for (const [persian, finglish] of Object.entries(persianToFinglish)) {
        result = result.split(persian).join(finglish);
    }
    
    // Remove non-alphanumeric except spaces
    result = result.replace(/[^\w\s]/g, '');
    
    // Normalize whitespace
    result = result.replace(/\s+/g, ' ').trim();
    
    return result;
}

// Normalize filename for comparison
function normalizeFilename(filename) {
    // Remove extension
    let name = filename.replace(/\.mp3$/i, '');
    
    // Remove leading numbers and spaces
    name = name.replace(/^\d+\s*/, '');
    
    // Remove hash suffixes (like abc123)
    name = name.replace(/[a-f0-9]{4}$/i, '');
    
    // Lowercase and normalize
    name = name.toLowerCase().trim();
    
    // Remove special characters
    name = name.replace(/[^a-z0-9\s]/g, '');
    
    // Normalize whitespace
    name = name.replace(/\s+/g, ' ').trim();
    
    return name;
}

// Calculate similarity between two strings (Levenshtein-based)
function similarity(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    // Check if one contains the other
    if (longer.includes(shorter) || shorter.includes(longer)) {
        return 0.8 + (0.2 * shorter.length / longer.length);
    }
    
    // Levenshtein distance
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    
    return (longer.length - costs[s2.length]) / longer.length;
}

// Find best matching file for a Persian filename
function findBestMatch(persianFilename, files, normalizedFiles) {
    const persianNorm = persianToFinglishNormalize(persianFilename);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (let i = 0; i < files.length; i++) {
        const fileNorm = normalizedFiles[i];
        const score = similarity(persianNorm, fileNorm);
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = files[i];
        }
    }
    
    return { match: bestMatch, score: bestScore };
}

// Check if URL has Persian/non-ASCII characters
function hasPersianChars(url) {
    return /[^\x00-\x7F]/.test(url);
}

// Main function
async function main() {
    console.log('🔧 Fix Audio URLs Script');
    console.log('========================\n');
    
    // Read worship songs JSON
    console.log('📖 Reading worship_songs.json...');
    const songsData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`   Found ${songsData.length} songs\n`);
    
    // Read audio files
    console.log('📁 Reading audio files from disk...');
    const audioFiles = fs.readdirSync(AUDIO_DIR)
        .filter(f => f.endsWith('.mp3'));
    console.log(`   Found ${audioFiles.length} audio files\n`);
    
    // Pre-normalize all filenames
    const normalizedFiles = audioFiles.map(f => normalizeFilename(f));
    
    // Find songs with Persian audioUrl
    const persianUrls = songsData.filter(s => s.audioUrl && hasPersianChars(s.audioUrl));
    console.log(`🔍 Found ${persianUrls.length} songs with Persian filenames\n`);
    
    // Process each song
    let fixed = 0;
    let notFound = 0;
    let alreadyCorrect = 0;
    const notFoundList = [];
    const fixedList = [];
    
    for (const song of songsData) {
        if (!song.audioUrl) continue;
        
        // Skip if already using Finglish filename
        if (!hasPersianChars(song.audioUrl)) {
            // Check if file exists
            const filename = path.basename(song.audioUrl);
            if (audioFiles.includes(filename)) {
                alreadyCorrect++;
                continue;
            }
        }
        
        // Extract Persian filename
        const persianFilename = path.basename(song.audioUrl).replace('.mp3', '');
        
        // Find best match
        const { match, score } = findBestMatch(persianFilename, audioFiles, normalizedFiles);
        
        if (match && score >= 0.5) {
            const oldUrl = song.audioUrl;
            song.audioUrl = `/worship/audio/kalameh/${match}`;
            fixed++;
            fixedList.push({
                id: song.id,
                title: song.title?.fa,
                oldUrl: oldUrl,
                newUrl: song.audioUrl,
                score: score.toFixed(2)
            });
        } else {
            notFound++;
            notFoundList.push({
                id: song.id,
                title: song.title?.fa,
                audioUrl: song.audioUrl,
                bestMatch: match,
                score: score?.toFixed(2) || '0'
            });
        }
    }
    
    // Write updated JSON
    console.log('💾 Writing updated JSON...');
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(songsData, null, 2), 'utf8');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   ✅ Already correct: ${alreadyCorrect}`);
    console.log(`   🔧 Fixed: ${fixed}`);
    console.log(`   ❌ Not found: ${notFound}`);
    
    // Show some fixed examples
    if (fixedList.length > 0) {
        console.log('\n🔧 Sample fixes (first 10):');
        fixedList.slice(0, 10).forEach(f => {
            console.log(`   [${f.id}] ${f.title}`);
            console.log(`      Old: ${path.basename(f.oldUrl)}`);
            console.log(`      New: ${path.basename(f.newUrl)} (score: ${f.score})`);
        });
    }
    
    // Show not found
    if (notFoundList.length > 0) {
        console.log('\n❌ Not found (first 10):');
        notFoundList.slice(0, 10).forEach(f => {
            console.log(`   [${f.id}] ${f.title}`);
            console.log(`      URL: ${path.basename(f.audioUrl)}`);
            console.log(`      Best: ${f.bestMatch || 'none'} (score: ${f.score})`);
        });
    }
    
    // Write detailed logs
    const logPath = path.join(__dirname, 'audio-url-fix-log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        summary: { alreadyCorrect, fixed, notFound },
        fixed: fixedList,
        notFound: notFoundList
    }, null, 2), 'utf8');
    
    console.log(`\n📝 Detailed log saved to: ${logPath}`);
    console.log(`📄 Fixed JSON saved to: ${OUTPUT_PATH}`);
    console.log('\n✅ Done! Review the output and then rename:');
    console.log('   worship_songs_fixed.json → worship_songs.json');
}

main().catch(console.error);
