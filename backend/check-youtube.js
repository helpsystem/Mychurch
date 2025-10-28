const fs = require('fs');

const songs = JSON.parse(fs.readFileSync('public/worship/data/worship_songs.json', 'utf8'));
const withYT = songs.filter(s => s.youtubeUrl);

console.log('📊 YouTube Statistics:');
console.log(`   Total songs: ${songs.length}`);
console.log(`   With YouTube: ${withYT.length}`);
console.log(`   Without YouTube: ${songs.length - withYT.length}`);

console.log('\n📺 Sample YouTube links:');
withYT.slice(0, 10).forEach((s, i) => {
  console.log(`   ${i + 1}. ${s.title.fa} -> ${s.youtubeUrl}`);
});
