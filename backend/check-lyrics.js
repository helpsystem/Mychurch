/**
 * بررسی متن آهنگ‌ها و تطبیق با فایل‌های timing
 */

const fs = require('fs');
const path = require('path');

const songsFile = path.join(__dirname, '../public/worship/data/worship_songs.json');
const timingDir = path.join(__dirname, '../public/worship/data/timings');

console.log('🔍 Checking lyrics and timing files...\n');

const songs = JSON.parse(fs.readFileSync(songsFile, 'utf8'));

// آهنگ‌هایی که فایل صوتی دارند
const songsWithAudio = songs.filter(s => s.audioUrl);
console.log(`📊 Songs with audio: ${songsWithAudio.length}`);

// آهنگ‌هایی که متن دارند
const songsWithLyrics = songs.filter(s => s.lyrics && s.lyrics.fa);
console.log(`📝 Songs with Persian lyrics: ${songsWithLyrics.length}`);

// آهنگ‌هایی که فایل timing دارند
let songsWithTiming = 0;
if (fs.existsSync(timingDir)) {
  const timingFiles = fs.readdirSync(timingDir).filter(f => f.endsWith('_timing.json'));
  songsWithTiming = timingFiles.length;
  console.log(`⏱️  Songs with timing files: ${songsWithTiming}`);
}

console.log('\n📋 Sample songs with audio:');
songsWithAudio.slice(0, 5).forEach((s, i) => {
  console.log(`\n${i + 1}. ${s.title.fa}`);
  console.log(`   ID: ${s.id}`);
  console.log(`   Audio: ${s.audioUrl ? '✅' : '❌'}`);
  console.log(`   YouTube: ${s.youtubeUrl ? '✅' : '❌'}`);
  console.log(`   Lyrics (FA): ${s.lyrics?.fa ? `✅ (${s.lyrics.fa.length} chars)` : '❌'}`);
  console.log(`   Lyrics (EN): ${s.lyrics?.en ? `✅ (${s.lyrics.en.length} chars)` : '❌'}`);
  
  // چک کردن فایل timing
  if (fs.existsSync(timingDir)) {
    const timingFile = path.join(timingDir, `song_${s.id}_timing.json`);
    if (fs.existsSync(timingFile)) {
      const timing = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
      console.log(`   Timing: ✅ (${timing.words?.length || 0} words)`);
    } else {
      console.log(`   Timing: ❌`);
    }
  }
});

// بررسی مشکلات
console.log('\n⚠️  Issues:');
const issuesWithAudioButNoLyrics = songsWithAudio.filter(s => !s.lyrics || !s.lyrics.fa);
console.log(`   Songs with audio but no lyrics: ${issuesWithAudioButNoLyrics.length}`);
if (issuesWithAudioButNoLyrics.length > 0) {
  console.log('   Examples:');
  issuesWithAudioButNoLyrics.slice(0, 3).forEach(s => {
    console.log(`     - ${s.title.fa} (ID: ${s.id})`);
  });
}
