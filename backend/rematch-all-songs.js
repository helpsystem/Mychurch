/**
 * Re-match تمام فایل‌های صوتی با آهنگ‌ها با الگوریتم بهبود یافته
 */

const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../public/worship/audio/kalameh');
const SONGS_FILE = path.join(__dirname, '../public/worship/data/worship_songs.json');

console.log('🔍 Re-matching all audio files with songs...\n');

// خواندن آهنگ‌ها
const songs = JSON.parse(fs.readFileSync(SONGS_FILE, 'utf8'));
console.log(`📚 Loaded ${songs.length} songs`);

// خواندن فایل‌های MP3
const mp3Files = fs.readdirSync(AUDIO_DIR)
  .filter(f => f.toLowerCase().endsWith('.mp3'))
  .map(f => ({
    name: f,
    nameWithoutExt: path.basename(f, '.mp3'),
    path: `/worship/audio/kalameh/${f}`
  }));

console.log(`📁 Found ${mp3Files.length} MP3 files\n`);

// الگوریتم Levenshtein Distance
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// نرمال‌سازی برای مقایسه
function normalize(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // حذف URL encoding
    .replace(/%[0-9a-f]{2}/gi, '')
    // تبدیل حروف فارسی متفاوت
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ی')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    // حذف کاراکترهای خاص
    .replace(/[^\u0600-\u06FFa-z0-9]/g, '')
    .trim();
}

// Transliteration فارسی به لاتین (بهبود یافته)
function persianToLatin(text) {
  if (!text) return '';
  
  const map = {
    'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
    'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'و': 'o', 'ه': 'h', 'ی': 'i', 'ئ': 'i', 'ء': ''
  };
  
  return text.split('').map(char => map[char] || char).join('');
}

// محاسبه امتیاز شباهت
function calculateSimilarity(songTitle, fileName) {
  const titleNorm = normalize(songTitle);
  const fileNorm = normalize(fileName);
  const titleLatin = normalize(persianToLatin(songTitle));
  
  // امتیازات مختلف
  let score = 0;
  
  // 1. تطابق کامل (100 امتیاز)
  if (titleNorm === fileNorm) return 100;
  
  // 2. یکی شامل دیگری باشد (80-90 امتیاز)
  if (titleNorm.includes(fileNorm) || fileNorm.includes(titleNorm)) {
    const ratio = Math.min(titleNorm.length, fileNorm.length) / Math.max(titleNorm.length, fileNorm.length);
    return 80 + (ratio * 10);
  }
  
  // 3. تطابق با transliteration (70-80 امتیاز)
  if (titleLatin.includes(fileNorm) || fileNorm.includes(titleLatin)) {
    const ratio = Math.min(titleLatin.length, fileNorm.length) / Math.max(titleLatin.length, fileNorm.length);
    return 70 + (ratio * 10);
  }
  
  // 4. Levenshtein distance (0-70 امتیاز)
  const distance1 = levenshtein(titleNorm, fileNorm);
  const distance2 = levenshtein(titleLatin, fileNorm);
  const minDistance = Math.min(distance1, distance2);
  const maxLength = Math.max(titleNorm.length, fileNorm.length);
  
  if (maxLength === 0) return 0;
  
  const similarity = 1 - (minDistance / maxLength);
  score = Math.max(0, Math.min(70, similarity * 70));
  
  // 5. بونوس: اگر کلمات اصلی Match شوند (+20 امتیاز)
  const titleWords = titleNorm.split(/\s+/).filter(w => w.length > 2);
  const fileWords = fileNorm.split(/\s+/).filter(w => w.length > 2);
  
  let matchingWords = 0;
  titleWords.forEach(tw => {
    if (fileWords.some(fw => fw.includes(tw) || tw.includes(fw))) {
      matchingWords++;
    }
  });
  
  if (titleWords.length > 0) {
    const wordMatchRatio = matchingWords / titleWords.length;
    score += wordMatchRatio * 20;
  }
  
  return Math.min(100, score);
}

// پیدا کردن بهترین Match برای هر آهنگ
console.log('🔄 Matching songs with files...\n');

const matches = [];
const stats = {
  perfect: 0,      // 90-100
  high: 0,        // 70-89
  medium: 0,      // 50-69
  low: 0,         // 30-49
  veryLow: 0,     // 0-29
  changed: 0,
  unchanged: 0
};

songs.forEach(song => {
  if (!song.title || !song.title.fa) return;
  
  const titleFA = song.title.fa;
  const titleEN = song.title.en || '';
  
  // محاسبه امتیاز برای تمام فایل‌ها
  const scores = mp3Files.map(file => {
    const scoreFA = calculateSimilarity(titleFA, file.nameWithoutExt);
    const scoreEN = calculateSimilarity(titleEN, file.nameWithoutExt);
    const maxScore = Math.max(scoreFA, scoreEN);
    
    return {
      file: file,
      score: maxScore,
      scoreFA,
      scoreEN
    };
  });
  
  // مرتب‌سازی بر اساس امتیاز
  scores.sort((a, b) => b.score - a.score);
  
  const bestMatch = scores[0];
  const currentAudioUrl = song.audioUrl;
  const newAudioUrl = bestMatch.file.path;
  
  // طبقه‌بندی
  if (bestMatch.score >= 90) stats.perfect++;
  else if (bestMatch.score >= 70) stats.high++;
  else if (bestMatch.score >= 50) stats.medium++;
  else if (bestMatch.score >= 30) stats.low++;
  else stats.veryLow++;
  
  const changed = currentAudioUrl !== newAudioUrl;
  if (changed) stats.changed++;
  else stats.unchanged++;
  
  matches.push({
    id: song.id,
    titleFA,
    titleEN,
    oldFile: currentAudioUrl ? path.basename(currentAudioUrl) : 'N/A',
    newFile: bestMatch.file.name,
    score: bestMatch.score.toFixed(1),
    changed
  });
});

// نمایش تغییرات
console.log('📊 ==================== STATISTICS ====================');
console.log(`   ✅ Perfect Match (90-100): ${stats.perfect}`);
console.log(`   ✅ High Match (70-89): ${stats.high}`);
console.log(`   ⚠️  Medium Match (50-69): ${stats.medium}`);
console.log(`   ❌ Low Match (30-49): ${stats.low}`);
console.log(`   ❌ Very Low Match (0-29): ${stats.veryLow}`);
console.log(`   🔄 Changed: ${stats.changed}`);
console.log(`   ➡️  Unchanged: ${stats.unchanged}`);
console.log('======================================================\n');

// نمایش تغییرات
console.log('🔄 Changes (showing first 20):');
const changes = matches.filter(m => m.changed).slice(0, 20);
changes.forEach((m, i) => {
  console.log(`\n${i + 1}. [Score: ${m.score}] ${m.titleFA}`);
  console.log(`   Old: ${m.oldFile}`);
  console.log(`   New: ${m.newFile}`);
});

if (stats.changed > 20) {
  console.log(`\n... and ${stats.changed - 20} more changes`);
}

// ذخیره گزارش کامل
const reportPath = path.join(__dirname, '../logs/rematch-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  date: new Date().toISOString(),
  stats,
  matches
}, null, 2));
console.log(`\n📄 Full report saved to: ${reportPath}`);

// اعمال تغییرات؟
console.log('\n❓ Apply changes? (yes/no)');
console.log('   Run with --apply flag to apply changes automatically');

if (process.argv.includes('--apply')) {
  console.log('\n🔧 Applying changes...');
  
  // Backup
  const backupPath = SONGS_FILE.replace('.json', `_backup_rematch_${Date.now()}.json`);
  fs.copyFileSync(SONGS_FILE, backupPath);
  console.log(`📦 Backup created: ${backupPath}`);
  
  // اعمال تغییرات
  matches.forEach(match => {
    const song = songs.find(s => s.id === match.id);
    if (song && match.changed) {
      song.audioUrl = `/worship/audio/kalameh/${match.newFile}`;
    }
  });
  
  // ذخیره
  fs.writeFileSync(SONGS_FILE, JSON.stringify(songs, null, 2), 'utf8');
  console.log('✅ Changes applied to worship_songs.json');
  console.log('\n💡 Now run: node backend/import-worship-songs.js');
} else {
  console.log('\n💡 To apply changes, run:');
  console.log('   node backend/rematch-all-songs.js --apply');
}
