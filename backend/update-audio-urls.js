/**
 * این اسکریپت لینک‌های یوتیوب را به مسیرهای محلی MP3 تبدیل می‌کند
 * 
 * فرض: فایل‌های MP3 در public/worship/audio/ با نام youtubeid.mp3 هستند
 * 
 * نحوه استفاده:
 * node backend/update-audio-urls.js
 */

const fs = require('fs');
const path = require('path');

// مسیرهای فایل‌ها
const JSON_FILE = path.join(__dirname, '../public/worship/data/worship_songs.json');
const AUDIO_DIR = path.join(__dirname, '../public/worship/audio');

console.log('📂 Reading worship songs JSON...');
const songs = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

console.log(`✅ Found ${songs.length} songs`);
console.log('🔍 Checking for local MP3 files...');

// بررسی وجود فایل‌های MP3
let updatedCount = 0;
let notFoundCount = 0;

songs.forEach((song, index) => {
  if (song.youtubeId) {
    // مسیر فایل MP3 محلی
    const mp3FileName = `${song.youtubeId}.mp3`;
    const mp3FilePath = path.join(AUDIO_DIR, mp3FileName);
    
    // بررسی وجود فایل
    if (fs.existsSync(mp3FilePath)) {
      // به‌روزرسانی audioUrl با مسیر محلی
      song.audioUrl = `/worship/audio/${mp3FileName}`;
      updatedCount++;
      console.log(`✅ ${index + 1}. ${song.title?.fa || song.title?.en} → ${mp3FileName}`);
    } else {
      notFoundCount++;
      console.log(`❌ ${index + 1}. ${song.title?.fa || song.title?.en} → MP3 not found`);
    }
  }
});

console.log('\n📊 Summary:');
console.log(`   ✅ Updated: ${updatedCount} songs`);
console.log(`   ❌ Not found: ${notFoundCount} songs`);

if (updatedCount > 0) {
  // ذخیره فایل به‌روز شده
  fs.writeFileSync(JSON_FILE, JSON.stringify(songs, null, 2), 'utf8');
  console.log(`\n💾 Saved updated JSON to: ${JSON_FILE}`);
} else {
  console.log('\n⚠️  No MP3 files found. Please add MP3 files to public/worship/audio/');
  console.log('   File naming: {youtubeId}.mp3');
}

console.log('\n📝 Next steps:');
console.log('   1. Add MP3 files to public/worship/audio/');
console.log('   2. Name them as: {youtubeId}.mp3');
console.log('   3. Run this script again');
console.log('   4. Or use the admin panel to upload files');
