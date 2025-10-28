/**
 * اصلاح audioUrl برای آهنگ الشدای و سایر آهنگ‌ها
 */

const fs = require('fs');
const path = require('path');

const songsFile = 'public/worship/data/worship_songs.json';
const songs = JSON.parse(fs.readFileSync(songsFile, 'utf8'));

console.log('🔍 Searching for mismatched audio files...\n');

// لیست آهنگ‌هایی که نام فایل با عنوان Match نیست
const mismatches = [];

songs.forEach(song => {
  if (!song.audioUrl) return;
  
  const fileName = path.basename(song.audioUrl, '.mp3');
  const titleFA = song.title.fa || '';
  const titleEN = song.title.en || '';
  
  // بررسی اگر نام فایل هیچ شباهتی با عنوان ندارد
  const normalizeForCompare = (str) => str.toLowerCase()
    .replace(/[\s\-_]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ی');
  
  const fileNameNorm = normalizeForCompare(fileName);
  const titleFANorm = normalizeForCompare(titleFA);
  const titleENNorm = normalizeForCompare(titleEN);
  
  // چک کنیم آیا نام فایل شباهتی به عنوان دارد
  const hasMatch = fileNameNorm.includes(titleFANorm.substring(0, 4)) || 
                   fileNameNorm.includes(titleENNorm.substring(0, 4)) ||
                   titleFANorm.includes(fileNameNorm.substring(0, 4)) ||
                   titleENNorm.includes(fileNameNorm.substring(0, 4));
  
  if (!hasMatch && titleFA && titleEN) {
    mismatches.push({
      id: song.id,
      titleFA,
      titleEN,
      currentFile: fileName,
      audioUrl: song.audioUrl
    });
  }
});

console.log(`❌ Found ${mismatches.length} potential mismatches:\n`);
mismatches.slice(0, 10).forEach(m => {
  console.log(`ID ${m.id}: "${m.titleFA}" (${m.titleEN})`);
  console.log(`   File: ${m.currentFile}`);
  console.log('');
});

// اصلاح خاص برای الشدای
console.log('\n🔧 Fixing Elshaddai...');
const elshaddai = songs.find(s => s.id === 1);
if (elshaddai) {
  const oldUrl = elshaddai.audioUrl;
  elshaddai.audioUrl = '/worship/audio/kalameh/El Shaddai in Farsi.mp3';
  console.log(`✅ Changed from: ${oldUrl}`);
  console.log(`✅ Changed to: ${elshaddai.audioUrl}`);
}

// Backup
const backupFile = songsFile.replace('.json', `_backup_${Date.now()}.json`);
fs.writeFileSync(backupFile, JSON.stringify(songs, null, 2), 'utf8');
console.log(`\n📦 Backup: ${backupFile}`);

// Save
fs.writeFileSync(songsFile, JSON.stringify(songs, null, 2), 'utf8');
console.log('✅ Updated worship_songs.json');

console.log('\n💡 Now run: node backend/import-worship-songs.js');
