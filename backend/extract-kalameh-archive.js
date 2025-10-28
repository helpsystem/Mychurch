/**
 * استخراج هوشمند فایل‌های kalameh.com از آرشیو HTML
 * با تحلیل فایل‌های HTML و یافتن لینک‌های دانلود
 * 
 * نحوه استفاده:
 * node backend/extract-kalameh-archive.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// مسیرهای اصلی
const KALAMEH_ROOT = path.join('D:', 'Windows.old', 'Users', 'Sami', 'Desktop', 'Iran Church DC', 'My Web Sites', 'Bible', 'www.kalameh.com');
const OUTPUT_DIR = path.join(__dirname, '../public/worship');

// آمار
let stats = {
  htmlFiles: 0,
  songsFound: 0,
  mp3Found: 0,
  pdfFound: 0,
  pptxFound: 0,
  youtubeFound: 0,
  errors: 0
};

// لیست سرودها
let songs = [];

/**
 * خواندن فایل HTML و استخراج اطلاعات
 */
function parseHTMLFile(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);
    
    // یافتن تمام سرودها در صفحه
    $('.views-accordion-songs_and_video-page-header').each((index, element) => {
      try {
        const $header = $(element);
        const $content = $header.next('.ui-accordion-content');
        
        // عنوان سرود
        const title = $header.find('.song_title').text().trim();
        const author = $header.find('.song_author').text().trim();
        const compositor = $header.find('.song_compositor').text().trim();
        
        if (!title) return;
        
        console.log(`\n🎵 Found: ${title}`);
        
        // استخراج لینک‌ها
        const song = {
          title: title,
          author: author,
          compositor: compositor,
          mp3: null,
          pdf: null,
          pptx: null,
          youtube: null,
          chordBase: null
        };
        
        // فایل MP3 - چندین روش جستجو
        let mp3Link = $content.find('.views-field-field-song-audio-1 a[href*=".mp3"]').attr('href');
        if (!mp3Link) {
          // جستجوی در source tag
          mp3Link = $content.find('audio source[src*=".mp3"]').attr('src');
        }
        if (!mp3Link) {
          // جستجوی در download link
          mp3Link = $content.find('a[download]:contains(".mp3")').attr('href') || 
                    $content.find('a:contains("Download")[href*=".mp3"]').attr('href');
        }
        
        if (mp3Link) {
          // استخراج نام فایل از URL (با decode)
          let mp3Match = mp3Link.match(/([^\/]+\.mp3)/);
          if (mp3Match) {
            song.mp3 = decodeURIComponent(mp3Match[1]);
            stats.mp3Found++;
            console.log(`   🎵 MP3: ${song.mp3}`);
          } else {
            // اگر فایل encode شده باشد
            mp3Match = mp3Link.match(/files\/songs\/mp3\/([^?]+)/);
            if (mp3Match) {
              song.mp3 = decodeURIComponent(mp3Match[1].replace(/%[0-9a-fA-F]{2}/g, (match) => {
                return String.fromCharCode(parseInt(match.substr(1), 16));
              }));
              stats.mp3Found++;
              console.log(`   🎵 MP3: ${song.mp3}`);
            }
          }
        }
        
        // فایل PDF - چندین روش جستجو
        let pdfLink = $content.find('.views-field-field-notation-1 a[href*=".pdf"]').attr('href');
        if (!pdfLink) {
          pdfLink = $content.find('a[target="_blank"][href*=".pdf"]').attr('href') ||
                    $content.find('a:contains("Download")[href*=".pdf"]').attr('href');
        }
        
        if (pdfLink) {
          let pdfMatch = pdfLink.match(/([^\/]+\.pdf)/);
          if (pdfMatch) {
            song.pdf = decodeURIComponent(pdfMatch[1]);
            stats.pdfFound++;
            console.log(`   📄 PDF: ${song.pdf}`);
          } else {
            // فایل encode شده
            pdfMatch = pdfLink.match(/files\/([^?]+\.pdf)/);
            if (pdfMatch) {
              song.pdf = decodeURIComponent(pdfMatch[1].split('/').pop());
              stats.pdfFound++;
              console.log(`   📄 PDF: ${song.pdf}`);
            }
          }
        }
        
        // فایل PowerPoint
        let pptxLink = $content.find('.views-field-field-powerpoint a[href*=".pptx"]').attr('href');
        if (!pptxLink) {
          pptxLink = $content.find('a[download][href*=".pptx"]').attr('href') ||
                     $content.find('a:contains("پاورپوینت")').attr('href');
        }
        
        if (pptxLink) {
          let pptxMatch = pptxLink.match(/([^\/]+\.pptx)/i);
          if (pptxMatch) {
            song.pptx = decodeURIComponent(pptxMatch[1]);
            stats.pptxFound++;
            console.log(`   📊 PPTX: ${song.pptx}`);
          } else {
            pptxMatch = pptxLink.match(/powerpoints\/([^?]+\.pptx)/i);
            if (pptxMatch) {
              song.pptx = decodeURIComponent(pptxMatch[1]);
              stats.pptxFound++;
              console.log(`   📊 PPTX: ${song.pptx}`);
            }
          }
        }
        
        // YouTube Video - چندین روش جستجو
        let youtubeLink = $content.find('a[href*="youtube.com/embed"]').first().attr('href');
        if (!youtubeLink) {
          youtubeLink = $content.find('.colorbox-load[href*="youtube"]').first().attr('href');
        }
        if (!youtubeLink) {
          youtubeLink = $content.find('.views-field-field-video a[href*="youtube"]').first().attr('href');
        }
        
        if (youtubeLink) {
          const youtubeMatch = youtubeLink.match(/embed\/([a-zA-Z0-9_-]+)/);
          if (youtubeMatch) {
            song.youtube = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
            stats.youtubeFound++;
            console.log(`   📺 YouTube: ${song.youtube}`);
          }
        }
        
        // Chord Base
        const chordSelect = $content.find('select.acordesSelect');
        if (chordSelect.length > 0) {
          song.chordBase = chordSelect.attr('chord_base');
          console.log(`   🎸 Chord: ${song.chordBase}`);
        }
        
        songs.push(song);
        stats.songsFound++;
        
      } catch (err) {
        console.error(`   ❌ Error parsing song: ${err.message}`);
        stats.errors++;
      }
    });
    
  } catch (error) {
    console.error(`❌ Error reading ${filePath}: ${error.message}`);
    stats.errors++;
  }
}

/**
 * جستجوی فایل‌های HTML در دایرکتوری
 */
function findHTMLFiles(dir) {
  const files = [];
  
  function search(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          search(fullPath);
        } else if (item.endsWith('.html')) {
          files.push(fullPath);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }
  
  search(dir);
  return files;
}

/**
 * کپی فایل‌های یافت شده با جستجوی چند مسیری
 */
function copyFilesFromArchive() {
  console.log('\n📦 Copying files from archive...\n');
  
  let copied = { mp3: 0, pdf: 0, pptx: 0 };
  
  songs.forEach(song => {
    // کپی MP3 - جستجو در مسیرهای مختلف
    if (song.mp3) {
      const possiblePaths = [
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', 'songs', 'mp3', song.mp3),
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', song.mp3),
        path.join(KALAMEH_ROOT, 'file', song.mp3)
      ];
      
      let sourcePath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          sourcePath = p;
          break;
        }
      }
      
      if (sourcePath) {
        const destPath = path.join(OUTPUT_DIR, 'audio', 'kalameh', song.mp3);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
        copied.mp3++;
        console.log(`✅ Copied MP3: ${song.mp3}`);
      } else {
        console.log(`⚠️  MP3 not found: ${song.mp3}`);
      }
    }
    
    // کپی PDF - جستجو در مسیرهای مختلف
    if (song.pdf) {
      const possiblePaths = [
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', song.pdf),
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', 'songs', song.pdf),
        path.join(KALAMEH_ROOT, 'file', song.pdf)
      ];
      
      let sourcePath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          sourcePath = p;
          break;
        }
      }
      
      if (sourcePath) {
        const destPath = path.join(OUTPUT_DIR, 'pdf', 'kalameh', song.pdf);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
        copied.pdf++;
        console.log(`✅ Copied PDF: ${song.pdf}`);
      } else {
        console.log(`⚠️  PDF not found: ${song.pdf}`);
      }
    }
    
    // کپی PPTX - جستجو در مسیرهای مختلف
    if (song.pptx) {
      const possiblePaths = [
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', 'songs', 'powerpoints', song.pptx),
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', 'powerpoints', song.pptx),
        path.join(KALAMEH_ROOT, 'sites', 'default', 'files', song.pptx),
        path.join(KALAMEH_ROOT, 'file', song.pptx)
      ];
      
      let sourcePath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          sourcePath = p;
          break;
        }
      }
      
      if (sourcePath) {
        const destPath = path.join(OUTPUT_DIR, 'pptx', 'kalameh', song.pptx);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
        copied.pptx++;
        console.log(`✅ Copied PPTX: ${song.pptx}`);
      } else {
        console.log(`⚠️  PPTX not found: ${song.pptx}`);
      }
    }
  });
  
  return copied;
}

/**
 * ذخیره JSON با اطلاعات کامل
 */
function saveJSON() {
  const jsonPath = path.join(__dirname, '../logs/kalameh-extracted-songs.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`\n💾 Saved song data: ${jsonPath}`);
}

/**
 * اجرای اصلی
 */
async function main() {
  console.log('🔍 Searching for HTML files in kalameh.com archive...\n');
  
  // جستجوی فایل‌های song-archive*.html
  const htmlFiles = findHTMLFiles(KALAMEH_ROOT).filter(f => 
    path.basename(f).startsWith('song-archive') && 
    path.basename(f).endsWith('.html') &&
    fs.statSync(f).size > 10000 // فقط فایل‌های بزرگ‌تر از 10KB
  );
  
  console.log(`📂 Found ${htmlFiles.length} song archive HTML files\n`);
  
  if (htmlFiles.length === 0) {
    console.error('❌ No song archive files found');
    process.exit(1);
  }
  
  // پردازش هر فایل
  htmlFiles.forEach(file => {
    console.log(`📄 Processing: ${path.basename(file)}`);
    parseHTMLFile(file);
    stats.htmlFiles++;
  });
  
  // ذخیره JSON
  saveJSON();
  
  // کپی فایل‌ها
  const copied = copyFilesFromArchive();
  
  // خلاصه نهایی
  console.log('\n\n📊 ==================== EXTRACTION SUMMARY ====================');
  console.log(`   📄 HTML Files Processed: ${stats.htmlFiles}`);
  console.log(`   🎵 Songs Found: ${stats.songsFound}`);
  console.log(`\n   📁 Files Found:`);
  console.log(`      🎵 MP3: ${stats.mp3Found}`);
  console.log(`      📄 PDF: ${stats.pdfFound}`);
  console.log(`      📊 PPTX: ${stats.pptxFound}`);
  console.log(`      📺 YouTube: ${stats.youtubeFound}`);
  console.log(`\n   📦 Files Copied:`);
  console.log(`      🎵 MP3: ${copied.mp3}`);
  console.log(`      📄 PDF: ${copied.pdf}`);
  console.log(`      📊 PPTX: ${copied.pptx}`);
  console.log(`\n   ❌ Errors: ${stats.errors}`);
  console.log('=============================================================\n');
  
  console.log('✅ Extraction complete!');
  console.log('📝 Next steps:');
  console.log('   1. Review extracted data: logs/kalameh-extracted-songs.json');
  console.log('   2. Run matching script: node backend/match-kalameh-files.js');
  console.log('   3. Import to database: node backend/import-worship-songs.js\n');
}

// اجرا
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
