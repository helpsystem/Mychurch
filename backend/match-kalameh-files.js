/**
 * تطبیق هوشمند فایل‌های MP3 و PDF با سرودها
 * با استفاده از Fuzzy Matching و Transliteration
 * 
 * نحوه استفاده:
 * node backend/match-kalameh-files.js
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const AUDIO_DIR = path.join(__dirname, '../public/worship/audio/kalameh');
const PDF_DIR = path.join(__dirname, '../public/worship/pdf/kalameh');
const JSON_FILE = path.join(__dirname, '../public/worship/data/worship_songs.json');

// تابع تبدیل متن فارسی به حروف لاتین (Transliteration)
const persianToLatin = {
  'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 
  'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
  'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'و': 'o', 'ه': 'h', 'ی': 'i', 'ئ': 'i', 'ة': 'e',
  ' ': '', 'َ': '', 'ُ': '', 'ِ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ّ': '', 'ْ': ''
};

function normalizeText(text) {
  if (!text) return '';
  
  // حذف کاراکترهای خاص
  text = text.toLowerCase()
    .replace(/[_\-\(\)\[\]\.،؛«»\s]+/g, '')
    .replace(/\d+/g, ''); // حذف اعداد
  
  // تبدیل فارسی به لاتین
  let normalized = '';
  for (let char of text) {
    normalized += persianToLatin[char] || char;
  }
  
  return normalized;
}

// تابع محاسبه فاصله Levenshtein (شباهت متن)
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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
  
  return matrix[str2.length][str1.length];
}

// تابع محاسبه درصد شباهت
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 100 : ((1 - distance / maxLength) * 100);
}

// تابع یافتن بهترین تطبیق
function findBestMatch(songTitle, fileNames) {
  const normalizedSongTitle = normalizeText(songTitle);
  let bestMatch = null;
  let bestScore = 0;
  
  fileNames.forEach(fileName => {
    const normalizedFileName = normalizeText(fileName);
    const similarity = calculateSimilarity(normalizedSongTitle, normalizedFileName);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = fileName;
    }
  });
  
  return { fileName: bestMatch, score: bestScore };
}

// خواندن فایل‌ها
console.log('📂 Reading files...\n');

const mp3Files = fs.existsSync(AUDIO_DIR) 
  ? fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'))
  : [];

const pdfFiles = fs.existsSync(PDF_DIR)
  ? fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'))
  : [];

console.log(`✅ Found ${mp3Files.length} MP3 files`);
console.log(`✅ Found ${pdfFiles.length} PDF files\n`);

// خواندن JSON سرودها
console.log('📖 Loading worship songs JSON...');
const songs = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
console.log(`✅ Found ${songs.length} songs in database\n`);

// آمار
let stats = {
  mp3Matched: 0,
  mp3High: 0,   // > 80%
  mp3Medium: 0, // 60-80%
  mp3Low: 0,    // 40-60%
  pdfMatched: 0,
  updated: 0
};

// پردازش هر سرود
console.log('🔍 Matching files with songs...\n');

songs.forEach((song, index) => {
  const songTitle = song.title?.fa || song.title?.en || `Song ${index + 1}`;
  console.log(`${index + 1}. ${songTitle}`);
  
  // تطبیق MP3
  if (mp3Files.length > 0) {
    const mp3Match = findBestMatch(songTitle, mp3Files);
    
    if (mp3Match.score >= 40) { // حداقل 40% شباهت
      const audioPath = `/worship/audio/kalameh/${mp3Match.fileName}`;
      song.audioUrl = audioPath;
      stats.mp3Matched++;
      stats.updated++;
      
      // دسته‌بندی بر اساس امتیاز
      if (mp3Match.score >= 80) {
        stats.mp3High++;
        console.log(`   ✅ MP3: ${mp3Match.fileName} (${mp3Match.score.toFixed(1)}% match) 🎯`);
      } else if (mp3Match.score >= 60) {
        stats.mp3Medium++;
        console.log(`   ⚠️  MP3: ${mp3Match.fileName} (${mp3Match.score.toFixed(1)}% match) ⚡`);
      } else {
        stats.mp3Low++;
        console.log(`   ⚡ MP3: ${mp3Match.fileName} (${mp3Match.score.toFixed(1)}% match) ⚠️`);
      }
      
      // حذف فایل از لیست برای جلوگیری از تطبیق دوباره
      const fileIndex = mp3Files.indexOf(mp3Match.fileName);
      if (fileIndex > -1) {
        mp3Files.splice(fileIndex, 1);
      }
    } else {
      console.log(`   ❌ MP3 not matched (best: ${mp3Match.score.toFixed(1)}%)`);
    }
  }
  
  // تطبیق PDF
  if (pdfFiles.length > 0) {
    const pdfMatch = findBestMatch(songTitle, pdfFiles);
    
    if (pdfMatch.score >= 40) {
      const pdfPath = `/worship/pdf/kalameh/${pdfMatch.fileName}`;
      song.pdfFileUrl = pdfPath;
      stats.pdfMatched++;
      stats.updated++;
      
      console.log(`   📄 PDF: ${pdfMatch.fileName} (${pdfMatch.score.toFixed(1)}% match)`);
      
      // حذف فایل از لیست
      const fileIndex = pdfFiles.indexOf(pdfMatch.fileName);
      if (fileIndex > -1) {
        pdfFiles.splice(fileIndex, 1);
      }
    }
  }
  
  console.log('');
});

// ذخیره JSON به‌روز شده
if (stats.updated > 0) {
  // ساخت نسخه پشتیبان
  const backupFile = JSON_FILE.replace('.json', '_backup.json');
  fs.copyFileSync(JSON_FILE, backupFile);
  console.log(`💾 Backup created: ${backupFile}\n`);
  
  // ذخیره فایل جدید
  fs.writeFileSync(JSON_FILE, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`💾 Updated JSON file: ${JSON_FILE}\n`);
}

// نمایش فایل‌های بدون تطبیق
if (mp3Files.length > 0) {
  console.log(`\n⚠️  ${mp3Files.length} MP3 files without match:`);
  mp3Files.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  if (mp3Files.length > 10) {
    console.log(`   ... and ${mp3Files.length - 10} more`);
  }
}

if (pdfFiles.length > 0) {
  console.log(`\n⚠️  ${pdfFiles.length} PDF files without match:`);
  pdfFiles.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  if (pdfFiles.length > 10) {
    console.log(`   ... and ${pdfFiles.length - 10} more`);
  }
}

// خلاصه نهایی
console.log('\n\n📊 ==================== MATCHING SUMMARY ====================');
console.log(`   🎵 MP3 Files Matched: ${stats.mp3Matched} / ${songs.length}`);
console.log(`      🎯 High confidence (>80%): ${stats.mp3High}`);
console.log(`      ⚡ Medium confidence (60-80%): ${stats.mp3Medium}`);
console.log(`      ⚠️  Low confidence (40-60%): ${stats.mp3Low}`);
console.log(`\n   📄 PDF Files Matched: ${stats.pdfMatched} / ${songs.length}`);
console.log(`\n   ✅ Total songs updated: ${stats.updated}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Review medium and low confidence matches`);
console.log(`   2. Manually assign unmatched files`);
console.log(`   3. Upload to database: node backend/import-worship-songs.js`);
console.log(`   4. Reload website to see changes`);
console.log('============================================================\n');

// ذخیره گزارش تطبیق
const reportFile = path.join(__dirname, '../logs/match-report.txt');
const reportDir = path.dirname(reportFile);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = songs
  .filter(s => s.audioUrl && s.audioUrl.includes('kalameh'))
  .map((s, i) => `${i + 1}. ${s.title?.fa || s.title?.en}\n   Audio: ${s.audioUrl}\n   PDF: ${s.pdfFileUrl || 'N/A'}\n`)
  .join('\n');

fs.writeFileSync(reportFile, report, 'utf8');
console.log(`📋 Match report saved: ${reportFile}\n`);
