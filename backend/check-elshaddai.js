const fs = require('fs');

const songs = JSON.parse(fs.readFileSync('public/worship/data/worship_songs.json', 'utf8'));

// آهنگ الشدای
const elshaddai = songs.find(s => s.id === 1);

console.log('🎵 آهنگ الشدای (ID=1):');
console.log('Title FA:', elshaddai.title.fa);
console.log('Title EN:', elshaddai.title.en);
console.log('Artist:', elshaddai.artist);
console.log('Audio URL:', elshaddai.audioUrl);
console.log('YouTube URL:', elshaddai.youtubeUrl);
console.log('YouTube ID:', elshaddai.youtubeId);

// بررسی فایل صوتی
const audioPath = 'public' + elshaddai.audioUrl;
console.log('\n📁 Audio file path:', audioPath);
console.log('File exists:', fs.existsSync(audioPath));

if (fs.existsSync(audioPath)) {
  const stats = fs.statSync(audioPath);
  console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
}

// بررسی فایل timing
const timingPath = `public/worship/data/timings/song_${elshaddai.id}_timing.json`;
console.log('\n⏱️  Timing file path:', timingPath);
console.log('File exists:', fs.existsSync(timingPath));

if (fs.existsSync(timingPath)) {
  const timing = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
  console.log('Timing metadata:');
  console.log('  Title:', timing.metadata.title);
  console.log('  Artist:', timing.metadata.artist);
  console.log('  Audio URL:', timing.metadata.audioUrl);
  console.log('  Duration:', timing.metadata.totalDuration, 'seconds');
}

// بررسی نام فایل در دیسک
console.log('\n📂 Checking actual MP3 files in kalameh folder:');
const mp3Dir = 'public/worship/audio/kalameh';
if (fs.existsSync(mp3Dir)) {
  const files = fs.readdirSync(mp3Dir)
    .filter(f => f.toLowerCase().includes('elshaddai') || f.toLowerCase().includes('shaddai'))
    .slice(0, 5);
  
  console.log('Files matching "elshaddai" or "shaddai":');
  files.forEach(f => console.log('  -', f));
}
