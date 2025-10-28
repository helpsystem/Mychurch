/**
 * کپی کردن تمام فایل‌های MP3, PPTX, PDF از kalameh.com
 * 
 * نحوه استفاده:
 * node backend/copy-all-kalameh-files.js
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const KALAMEH_FILES = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.kalameh.com\\file';
const TARGET_AUDIO = path.join(__dirname, '../public/worship/audio/kalameh');
const TARGET_PPTX = path.join(__dirname, '../public/worship/pptx/kalameh');
const TARGET_PDF = path.join(__dirname, '../public/worship/pdf/kalameh');

// ساخت پوشه‌های مقصد
[TARGET_AUDIO, TARGET_PPTX, TARGET_PDF].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('📂 Reading kalameh.com files...\n');

// بررسی وجود پوشه
if (!fs.existsSync(KALAMEH_FILES)) {
  console.error(`❌ Files directory not found: ${KALAMEH_FILES}`);
  process.exit(1);
}

// آمار
let stats = {
  mp3: { found: 0, copied: 0, failed: 0 },
  pptx: { found: 0, copied: 0, failed: 0 },
  pdf: { found: 0, copied: 0, failed: 0 }
};

// تابع کپی فایل‌ها
function copyFiles(ext, targetDir, stats) {
  console.log(`\n🔍 Searching for ${ext.toUpperCase()} files...`);
  
  function searchDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else {
          const fileExt = path.extname(item).toLowerCase();
          if (fileExt === ext.toLowerCase() || (ext === '.pptx' && fileExt === '.ppt')) {
            stats.found++;
            
            // کپی فایل
            const targetPath = path.join(targetDir, item);
            try {
              fs.copyFileSync(fullPath, targetPath);
              stats.copied++;
              
              if (stats.copied <= 5) {
                console.log(`   ✅ ${item} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
              }
            } catch (err) {
              stats.failed++;
              console.log(`   ❌ Failed: ${item} - ${err.message}`);
            }
          }
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }
  
  searchDir(KALAMEH_FILES);
  
  if (stats.copied > 5) {
    console.log(`   ... and ${stats.copied - 5} more files`);
  }
  
  console.log(`\n   📊 ${ext.toUpperCase()} Summary:`);
  console.log(`      Found: ${stats.found}`);
  console.log(`      Copied: ${stats.copied}`);
  console.log(`      Failed: ${stats.failed}`);
}

// کپی فایل‌های MP3
copyFiles('.mp3', TARGET_AUDIO, stats.mp3);

// کپی فایل‌های PPTX
copyFiles('.pptx', TARGET_PPTX, stats.pptx);

// کپی فایل‌های PDF
copyFiles('.pdf', TARGET_PDF, stats.pdf);

// خلاصه نهایی
console.log('\n\n📊 ==================== FINAL SUMMARY ====================');
console.log(`   🎵 MP3 Files:`);
console.log(`      Found: ${stats.mp3.found}`);
console.log(`      Copied: ${stats.mp3.copied}`);
console.log(`      Failed: ${stats.mp3.failed}`);
console.log(`\n   📑 PPTX Files:`);
console.log(`      Found: ${stats.pptx.found}`);
console.log(`      Copied: ${stats.pptx.copied}`);
console.log(`      Failed: ${stats.pptx.failed}`);
console.log(`\n   📄 PDF Files:`);
console.log(`      Found: ${stats.pdf.found}`);
console.log(`      Copied: ${stats.pdf.copied}`);
console.log(`      Failed: ${stats.pdf.failed}`);

const totalCopied = stats.mp3.copied + stats.pptx.copied + stats.pdf.copied;
console.log(`\n   ✅ Total files copied: ${totalCopied}`);

console.log(`\n📝 Next steps:`);
console.log(`   1. Check files in:`);
console.log(`      - public/worship/audio/kalameh/`);
console.log(`      - public/worship/pptx/kalameh/`);
console.log(`      - public/worship/pdf/kalameh/`);
console.log(`   2. Create a mapping script to match files with songs`);
console.log(`   3. Update worship_songs.json with file paths`);
console.log('========================================================\n');
