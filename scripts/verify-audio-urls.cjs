/**
 * Verify audio URLs and report which ones are broken
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = 'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch';
const AUDIO_DIR = path.join(WORKSPACE, 'public/worship/audio/kalameh');
const JSON_PATH = path.join(WORKSPACE, 'public/worship/data/worship_songs.json');

// Read worship songs JSON
const jsonContent = fs.readFileSync(JSON_PATH, 'utf8');
const songs = JSON.parse(jsonContent);
console.log(`📋 Checking ${songs.length} songs...\n`);

let working = 0;
let broken = 0;
const brokenSongs = [];

for (const song of songs) {
  if (!song.audioUrl) {
    continue;
  }
  
  // Extract filename from URL
  const urlPath = song.audioUrl;
  let fileName;
  
  // Handle different URL formats
  if (urlPath.includes('/kalameh/')) {
    fileName = urlPath.split('/kalameh/').pop();
  } else if (urlPath.startsWith('/worship/audio/')) {
    fileName = path.basename(urlPath);
  } else {
    fileName = path.basename(urlPath);
  }
  
  // Try to find the file
  const fullPath = path.join(AUDIO_DIR, fileName);
  const decodedPath = path.join(AUDIO_DIR, decodeURIComponent(fileName));
  
  const exists = fs.existsSync(fullPath) || fs.existsSync(decodedPath);
  
  if (exists) {
    working++;
  } else {
    broken++;
    brokenSongs.push({
      id: song.id,
      title: song.title?.fa || song.title?.en || 'No title',
      audioUrl: song.audioUrl,
      fileName: fileName
    });
    console.log(`❌ BROKEN: ID ${song.id} - ${fileName}`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Working: ${working}`);
console.log(`   ❌ Broken: ${broken}`);

if (brokenSongs.length > 0) {
  console.log(`\n🔍 Broken songs details:`);
  brokenSongs.forEach(s => {
    console.log(`\n   ID: ${s.id}`);
    console.log(`   Title: ${s.title}`);
    console.log(`   URL: ${s.audioUrl}`);
  });
}
