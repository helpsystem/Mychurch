/**
 * استخراج لینک‌های یوتیوب از آرشیو HTML و اضافه کردن به worship_songs.json
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const KALAMEH_ROOT = path.join('D:', 'Windows.old', 'Users', 'Sami', 'Desktop', 'Iran Church DC', 'My Web Sites', 'Bible', 'www.kalameh.com');
const WORSHIP_JSON = path.join(__dirname, '../public/worship/data/worship_songs.json');

console.log('🎬 Extracting YouTube links from kalameh.com archive...\n');

// خواندن فایل worship_songs.json
const worshipSongs = JSON.parse(fs.readFileSync(WORSHIP_JSON, 'utf8'));
console.log(`📚 Loaded ${worshipSongs.length} songs from JSON\n`);

// آمار
let stats = {
  htmlFiles: 0,
  youtubeFound: 0,
  matched: 0,
  errors: 0
};

// نرمال‌سازی متن برای تطبیق
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// یافتن فایل‌های HTML
const htmlDir = KALAMEH_ROOT;
const htmlFiles = fs.readdirSync(htmlDir)
  .filter(f => f.startsWith('song-archive') && f.endsWith('.html'))
  .map(f => path.join(htmlDir, f))
  .filter(f => fs.statSync(f).size > 10000); // فقط فایل‌های بزرگتر از 10KB

console.log(`📂 Found ${htmlFiles.length} HTML files\n`);

// پردازش هر فایل HTML
htmlFiles.forEach(filePath => {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);
    
    // یافتن همه لینک‌های یوتیوب در صفحه
    const youtubeLinks = [];
    $('a[href*="youtube.com/embed"]').each((index, element) => {
      const href = $(element).attr('href');
      const match = href.match(/embed\/([a-zA-Z0-9_-]+)/);
      if (match && !youtubeLinks.includes(match[1])) {
        youtubeLinks.push(match[1]);
      }
    });
    
    // یافتن تمام سرودها
    const songs = [];
    $('.views-accordion-songs_and_video-page-header').each((index, element) => {
      const $header = $(element);
      const title = $header.find('.song_title').text().trim();
      if (title) {
        songs.push(title);
      }
    });
    
    // Match کردن یوتیوب با آهنگ‌ها (به ترتیب)
    const minLength = Math.min(songs.length, youtubeLinks.length);
    for (let i = 0; i < minLength; i++) {
      const title = songs[i];
      const youtubeId = youtubeLinks[i];
      const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
      
      stats.youtubeFound++;
      
      // تطبیق با آهنگ‌ها در JSON
      const normalizedTitle = normalizeText(title);
      const song = worshipSongs.find(s => {
        const songTitle = normalizeText(s.title?.fa || s.title?.en || '');
        return songTitle === normalizedTitle || 
               songTitle.includes(normalizedTitle) ||
               normalizedTitle.includes(songTitle);
      });
      
      if (song) {
        song.youtubeUrl = youtubeUrl;
        stats.matched++;
        console.log(`✅ ${title} -> ${youtubeUrl}`);
      } else {
        console.log(`⚠️  ${title} -> ${youtubeUrl} (not matched)`);
      }
    }
    
    stats.htmlFiles++;
    
  } catch (error) {
    console.error(`❌ Error reading ${path.basename(filePath)}: ${error.message}`);
    stats.errors++;
  }
});

// ذخیره نتایج
console.log('\n💾 Saving updated worship_songs.json...');

// Backup
const backupPath = WORSHIP_JSON.replace('.json', `_backup_${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(worshipSongs, null, 2), 'utf8');
console.log(`📦 Backup created: ${backupPath}`);

// Save
fs.writeFileSync(WORSHIP_JSON, JSON.stringify(worshipSongs, null, 2), 'utf8');
console.log(`✅ Updated worship_songs.json`);

// خلاصه
console.log('\n📊 ==================== SUMMARY ====================');
console.log(`   📂 HTML Files Processed: ${stats.htmlFiles}`);
console.log(`   🎬 YouTube Links Found: ${stats.youtubeFound}`);
console.log(`   ✅ Songs Matched: ${stats.matched}`);
console.log(`   ⚠️  Not Matched: ${stats.youtubeFound - stats.matched}`);
console.log(`   ❌ Errors: ${stats.errors}`);
console.log('=====================================================\n');

console.log('✅ Done! Now run: node backend/import-worship-songs.js');
