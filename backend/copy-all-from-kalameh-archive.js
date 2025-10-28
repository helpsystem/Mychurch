const fs = require('fs');
const path = require('path');

// مسیرها
const KALAMEH_ARCHIVE = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.kalameh.com';
const OUTPUT_DIR = path.join(__dirname, '../public/worship');

console.log('🚀 Starting file copy from kalameh.com archive...\n');

/**
 * کپی کردن تمام فایل‌های MP3
 */
function copyMP3Files() {
  console.log('📀 Copying MP3 files...');
  
  const sourceDir = path.join(KALAMEH_ARCHIVE, 'sites', 'default', 'files', 'songs', 'mp3');
  const destDir = path.join(OUTPUT_DIR, 'audio', 'kalameh');
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️  Source directory not found: ${sourceDir}`);
    return 0;
  }
  
  fs.mkdirSync(destDir, { recursive: true });
  
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.mp3'));
  let copied = 0;
  
  files.forEach(file => {
    try {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        copied++;
        if (copied % 50 === 0) {
          console.log(`   ✅ Copied ${copied} MP3 files...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error copying ${file}:`, error.message);
    }
  });
  
  console.log(`✅ MP3: Copied ${copied} / ${files.length} files\n`);
  return copied;
}

/**
 * کپی کردن تمام فایل‌های PowerPoint
 */
function copyPPTXFiles() {
  console.log('📊 Copying PowerPoint files...');
  
  const sourceDir = path.join(KALAMEH_ARCHIVE, 'sites', 'default', 'files', 'songs', 'powerpoints');
  const destDir = path.join(OUTPUT_DIR, 'pptx', 'kalameh');
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️  Source directory not found: ${sourceDir}`);
    return 0;
  }
  
  fs.mkdirSync(destDir, { recursive: true });
  
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.pptx') || f.endsWith('.ppt'));
  let copied = 0;
  
  files.forEach(file => {
    try {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        copied++;
        if (copied % 50 === 0) {
          console.log(`   ✅ Copied ${copied} PPTX files...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error copying ${file}:`, error.message);
    }
  });
  
  console.log(`✅ PPTX: Copied ${copied} / ${files.length} files\n`);
  return copied;
}

/**
 * کپی کردن تمام فایل‌های PDF
 */
function copyPDFFiles() {
  console.log('📄 Copying PDF files...');
  
  const sourceDir = path.join(KALAMEH_ARCHIVE, 'sites', 'default', 'files');
  const destDir = path.join(OUTPUT_DIR, 'pdf', 'kalameh');
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️  Source directory not found: ${sourceDir}`);
    return 0;
  }
  
  fs.mkdirSync(destDir, { recursive: true });
  
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.pdf'));
  let copied = 0;
  
  files.forEach(file => {
    try {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        copied++;
        if (copied % 100 === 0) {
          console.log(`   ✅ Copied ${copied} PDF files...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error copying ${file}:`, error.message);
    }
  });
  
  console.log(`✅ PDF: Copied ${copied} / ${files.length} files\n`);
  return copied;
}

/**
 * تابع اصلی
 */
async function main() {
  try {
    console.log(`📂 Source: ${KALAMEH_ARCHIVE}`);
    console.log(`📁 Destination: ${OUTPUT_DIR}\n`);
    
    const stats = {
      mp3: copyMP3Files(),
      pptx: copyPPTXFiles(),
      pdf: copyPDFFiles()
    };
    
    console.log('\n📊 ==================== SUMMARY ====================');
    console.log(`   🎵 MP3 Files: ${stats.mp3} copied`);
    console.log(`   📊 PPTX Files: ${stats.pptx} copied`);
    console.log(`   📄 PDF Files: ${stats.pdf} copied`);
    console.log(`   📦 Total: ${stats.mp3 + stats.pptx + stats.pdf} files`);
    console.log('====================================================\n');
    
    console.log('✅ Copy complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run fuzzy matching: node backend/match-kalameh-files.js');
    console.log('   2. Import to database: node backend/import-worship-songs.js');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// اجرا
main();
