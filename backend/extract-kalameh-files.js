/**
 * استخراج فایل‌های صوتی (MP3) و پاورپوینت (PPTX) از آرشیو kalameh.com
 * و کپی کردن آنها به پوشه‌های مناسب در سایت
 * 
 * نحوه استفاده:
 * node backend/extract-kalameh-files.js
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const KALAMEH_ARCHIVE = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.kalameh.com\\file';
const TARGET_AUDIO = path.join(__dirname, '../public/worship/audio');
const TARGET_PPTX = path.join(__dirname, '../public/worship/pptx');
const TARGET_PDF = path.join(__dirname, '../public/worship/pdf');
const JSON_FILE = path.join(__dirname, '../public/worship/data/worship_songs.json');

// ساخت پوشه‌های مقصد
[TARGET_AUDIO, TARGET_PPTX, TARGET_PDF].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('📂 Reading kalameh.com archive...');

// بررسی وجود پوشه آرشیو
if (!fs.existsSync(KALAMEH_ARCHIVE)) {
  console.error(`❌ Archive directory not found: ${KALAMEH_ARCHIVE}`);
  console.log('\n📝 Please check the path and try again.');
  process.exit(1);
}

// خواندن JSON سرودها
console.log('📖 Loading worship songs JSON...');
const songs = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
console.log(`✅ Found ${songs.length} songs in database`);

// آمار
let stats = {
  mp3Found: 0,
  mp3Copied: 0,
  pptxFound: 0,
  pptxCopied: 0,
  pdfFound: 0,
  pdfCopied: 0,
  updated: 0
};

// تابع جستجوی فایل در آرشیو
function findFileInArchive(searchPattern, extensions) {
  const results = [];
  
  function searchDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            const fileName = path.basename(item, ext).toLowerCase();
            if (fileName.includes(searchPattern.toLowerCase())) {
              results.push(fullPath);
            }
          }
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }
  
  searchDir(KALAMEH_ARCHIVE);
  return results;
}

// پردازش هر سرود
console.log('\n🔍 Searching for files in archive...\n');

songs.forEach((song, index) => {
  const songTitle = song.title?.fa || song.title?.en || `Song ${index + 1}`;
  const youtubeId = song.youtubeId;
  
  console.log(`${index + 1}. ${songTitle}`);
  
  // جستجوی فایل MP3
  const mp3Files = findFileInArchive(songTitle, ['.mp3']);
  if (mp3Files.length > 0) {
    stats.mp3Found++;
    const sourceMp3 = mp3Files[0]; // اولین فایل پیدا شده
    const targetMp3 = path.join(TARGET_AUDIO, `${youtubeId || `song_${song.id}`}.mp3`);
    
    try {
      fs.copyFileSync(sourceMp3, targetMp3);
      song.audioUrl = `/worship/audio/${path.basename(targetMp3)}`;
      stats.mp3Copied++;
      stats.updated++;
      console.log(`   ✅ MP3 copied: ${path.basename(sourceMp3)}`);
    } catch (err) {
      console.log(`   ⚠️  MP3 copy failed: ${err.message}`);
    }
  } else {
    console.log(`   ❌ MP3 not found`);
  }
  
  // جستجوی فایل PPTX
  const pptxFiles = findFileInArchive(songTitle, ['.pptx', '.ppt']);
  if (pptxFiles.length > 0) {
    stats.pptxFound++;
    const sourcePptx = pptxFiles[0];
    const targetPptx = path.join(TARGET_PPTX, `${youtubeId || `song_${song.id}`}.pptx`);
    
    try {
      fs.copyFileSync(sourcePptx, targetPptx);
      song.presentationFileUrl = `/worship/pptx/${path.basename(targetPptx)}`;
      stats.pptxCopied++;
      stats.updated++;
      console.log(`   ✅ PPTX copied: ${path.basename(sourcePptx)}`);
    } catch (err) {
      console.log(`   ⚠️  PPTX copy failed: ${err.message}`);
    }
  } else {
    console.log(`   ❌ PPTX not found`);
  }
  
  // جستجوی فایل PDF
  const pdfFiles = findFileInArchive(songTitle, ['.pdf']);
  if (pdfFiles.length > 0) {
    stats.pdfFound++;
    const sourcePdf = pdfFiles[0];
    const targetPdf = path.join(TARGET_PDF, `${youtubeId || `song_${song.id}`}.pdf`);
    
    try {
      fs.copyFileSync(sourcePdf, targetPdf);
      song.pdfFileUrl = `/worship/pdf/${path.basename(targetPdf)}`;
      stats.pdfCopied++;
      stats.updated++;
      console.log(`   ✅ PDF copied: ${path.basename(sourcePdf)}`);
    } catch (err) {
      console.log(`   ⚠️  PDF copy failed: ${err.message}`);
    }
  }
  
  console.log('');
});

// ذخیره JSON به‌روز شده
if (stats.updated > 0) {
  fs.writeFileSync(JSON_FILE, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`\n💾 Updated JSON file: ${JSON_FILE}`);
}

// نمایش آمار
console.log('\n📊 ==================== SUMMARY ====================');
console.log(`   🎵 MP3 Files:`);
console.log(`      Found: ${stats.mp3Found}`);
console.log(`      Copied: ${stats.mp3Copied}`);
console.log(`\n   📑 PPTX Files:`);
console.log(`      Found: ${stats.pptxFound}`);
console.log(`      Copied: ${stats.pptxCopied}`);
console.log(`\n   📄 PDF Files:`);
console.log(`      Found: ${stats.pdfFound}`);
console.log(`      Copied: ${stats.pdfCopied}`);
console.log(`\n   ✅ Total songs updated: ${stats.updated}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Check files in public/worship/audio/`);
console.log(`   2. Check files in public/worship/pptx/`);
console.log(`   3. Check files in public/worship/pdf/`);
console.log(`   4. Reload the website to see changes`);
console.log(`   5. Upload to database: node backend/import-worship-songs.js`);
console.log('====================================================\n');
