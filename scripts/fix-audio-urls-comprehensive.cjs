/**
 * Comprehensive Audio URL Fixer
 * Maps Persian filenames in worship_songs.json to actual Finglish filenames on disk
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = 'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch';
const AUDIO_DIR = path.join(WORKSPACE, 'public/worship/audio/kalameh');
const JSON_PATH = path.join(WORKSPACE, 'public/worship/data/worship_songs.json');

// Persian to Finglish transliteration map
const PERSIAN_TO_FINGLISH = {
  'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
  'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'o', 'ه': 'h', 'ی': 'i', 'ئ': 'e', 'ء': '', 'ة': 'h',
  'أ': 'a', 'إ': 'e', 'ؤ': 'o', '‌': ' ', // ZWNJ to space
  'ي': 'i', 'ى': 'a', 'ك': 'k', '۰': '0', '۱': '1', '۲': '2',
  '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

function persianToFinglish(text) {
  if (!text) return '';
  let result = '';
  for (const char of text) {
    if (PERSIAN_TO_FINGLISH[char] !== undefined) {
      result += PERSIAN_TO_FINGLISH[char];
    } else if (/[a-zA-Z0-9\s\-_\.]/.test(char)) {
      result += char;
    }
  }
  return result.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeForComparison(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function hasPersianChars(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function findBestMatch(songTitle, audioFiles) {
  const songFinglish = normalizeForComparison(persianToFinglish(songTitle));
  
  // Score each file
  let bestMatch = null;
  let bestScore = 0;
  
  for (const file of audioFiles) {
    // Extract the text part (remove number prefix and extension)
    const baseName = path.basename(file, '.mp3');
    const textPart = baseName.replace(/^\d+\s*/, '');
    const fileNormalized = normalizeForComparison(textPart);
    
    // Calculate similarity score
    let score = 0;
    
    // Check if file contains the transliterated song title
    if (fileNormalized.includes(songFinglish.substring(0, Math.min(10, songFinglish.length)))) {
      score += 50;
    }
    
    // Check character overlap
    const songChars = new Set(songFinglish.split(''));
    const fileChars = new Set(fileNormalized.split(''));
    const overlap = [...songChars].filter(c => fileChars.has(c)).length;
    score += overlap * 2;
    
    // Bonus for similar length
    const lengthDiff = Math.abs(songFinglish.length - fileNormalized.length);
    if (lengthDiff < 5) score += 10;
    
    // Check if first few characters match
    if (songFinglish.length > 3 && fileNormalized.startsWith(songFinglish.substring(0, 3))) {
      score += 30;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = file;
    }
  }
  
  return bestScore > 40 ? bestMatch : null;
}

async function main() {
  console.log('🎵 Comprehensive Audio URL Fixer\n');
  
  // Read all audio files
  const audioFiles = fs.readdirSync(AUDIO_DIR)
    .filter(f => f.toLowerCase().endsWith('.mp3'));
  console.log(`📁 Found ${audioFiles.length} audio files in kalameh folder\n`);
  
  // Create a set of normalized file names for quick lookup
  const audioFileMap = new Map();
  for (const file of audioFiles) {
    const normalized = normalizeForComparison(path.basename(file, '.mp3'));
    if (!audioFileMap.has(normalized)) {
      audioFileMap.set(normalized, file);
    }
  }
  
  // Read worship songs JSON
  const jsonContent = fs.readFileSync(JSON_PATH, 'utf8');
  const songs = JSON.parse(jsonContent);
  console.log(`📋 Found ${songs.length} songs in JSON\n`);
  
  let fixed = 0;
  let verified = 0;
  let notFound = 0;
  let noAudio = 0;
  const issues = [];
  
  for (const song of songs) {
    if (!song.audioUrl) {
      noAudio++;
      continue;
    }
    
    const currentFileName = path.basename(song.audioUrl);
    
    // Check if file exists as-is
    const fullPath = path.join(AUDIO_DIR, currentFileName);
    if (fs.existsSync(fullPath)) {
      verified++;
      continue;
    }
    
    // Check with decoded URI
    const decodedFileName = decodeURIComponent(currentFileName);
    const decodedPath = path.join(AUDIO_DIR, decodedFileName);
    if (fs.existsSync(decodedPath)) {
      verified++;
      continue;
    }
    
    // Has Persian chars - needs mapping
    if (hasPersianChars(currentFileName)) {
      // Try to get song title for matching
      const songTitle = song.title?.fa || song.title?.en || currentFileName;
      
      // Try to find matching file
      const matchedFile = findBestMatch(songTitle, audioFiles);
      
      if (matchedFile) {
        const newUrl = `/worship/audio/kalameh/${matchedFile}`;
        console.log(`✅ Fixed: "${songTitle.substring(0, 30)}..."`);
        console.log(`   Old: ${currentFileName}`);
        console.log(`   New: ${matchedFile}\n`);
        song.audioUrl = newUrl;
        fixed++;
      } else {
        console.log(`❌ No match: "${songTitle}" (ID: ${song.id})`);
        console.log(`   Persian: ${currentFileName}\n`);
        issues.push({ id: song.id, title: songTitle, filename: currentFileName });
        song.audioUrl = ''; // Clear broken URL
        notFound++;
      }
    } else {
      // Non-Persian but file not found
      console.log(`⚠️ Missing file: ${currentFileName} (ID: ${song.id})`);
      issues.push({ id: song.id, title: song.title?.fa || song.title?.en, filename: currentFileName });
      notFound++;
    }
  }
  
  // Write updated JSON
  const backupPath = JSON_PATH.replace('.json', '_backup.json');
  fs.copyFileSync(JSON_PATH, backupPath);
  console.log(`💾 Backup saved to: ${backupPath}`);
  
  fs.writeFileSync(JSON_PATH, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`💾 Updated: ${JSON_PATH}\n`);
  
  console.log('📊 Summary:');
  console.log(`   ✅ Already verified: ${verified}`);
  console.log(`   🔧 Fixed (mapped): ${fixed}`);
  console.log(`   ❌ Not found: ${notFound}`);
  console.log(`   ⬜ No audio URL: ${noAudio}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️ ${issues.length} songs need manual attention:`);
    issues.slice(0, 10).forEach(i => {
      console.log(`   - ID ${i.id}: ${i.title?.substring(0, 40) || 'No title'}`);
    });
    if (issues.length > 10) {
      console.log(`   ... and ${issues.length - 10} more`);
    }
  }
}

main().catch(console.error);
