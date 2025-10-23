/**
 * Kalameh Song Extractor - Node.js Version
 * Quick extraction without Python dependency
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const BASE_DIR = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.kalameh.com';
const SONG_FOLDER = path.join(BASE_DIR, 'song');
const EXPORT_DIR = path.join(__dirname, 'export');

const PERSIAN_LETTERS = [
  'آ', 'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط',
  'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن',
  'و', 'ه', 'ی'
];

function getLetterFromTitle(title) {
  if (!title) return 'Other';
  const firstChar = title.trim()[0];
  
  if (['أ', 'إ', 'آ'].includes(firstChar)) return 'آ';
  if (firstChar === 'ا') return 'ا';
  if (PERSIAN_LETTERS.includes(firstChar)) return firstChar;
  
  return 'Other';
}

function cleanFilename(filename) {
  return filename
    .replace(/\.(html|htm|z)$/gi, '')
    .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));
}

function parseSongFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    
    const song = {
      title_fa: '',
      title_en: '',
      artist: '',
      lyrics: '',
      audio: '',
      video: '',
      ppt: '',
      chord: ''
    };
    
    // Extract title
    const titleTag = doc.querySelector('title');
    if (titleTag) {
      song.title_fa = titleTag.textContent.replace('| کلمه', '').trim();
    }
    
    const h1 = doc.querySelector('h1');
    if (h1 && !song.title_fa) {
      song.title_fa = h1.textContent.trim();
    }
    
    // Extract lyrics
    const contentDiv = doc.querySelector('.node-content, .field-items, .content');
    if (contentDiv) {
      song.lyrics = contentDiv.textContent.trim().substring(0, 1000); // Limit length
    }
    
    // Extract links
    const links = doc.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href').toLowerCase();
      
      if (href.includes('.mp3') || href.includes('.m4a')) {
        song.audio = link.getAttribute('href');
      } else if (href.includes('.mp4') || href.includes('.webm')) {
        song.video = link.getAttribute('href');
      } else if (href.includes('.ppt') || href.includes('.pptx')) {
        song.ppt = link.getAttribute('href');
      } else if (href.includes('chord') || href.includes('akord')) {
        song.chord = link.getAttribute('href');
      }
    });
    
    return song;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

function scanSongFiles() {
  console.log('\n🔍 Scanning song folder...');
  
  if (!fs.existsSync(SONG_FOLDER)) {
    console.error(`❌ Song folder not found: ${SONG_FOLDER}`);
    return [];
  }
  
  const files = fs.readdirSync(SONG_FOLDER)
    .filter(f => f.endsWith('.html') && !f.endsWith('.z'))
    .map(f => path.join(SONG_FOLDER, f));
  
  console.log(`📄 Found ${files.length} song files`);
  
  const songs = [];
  let processed = 0;
  
  files.forEach((filePath, idx) => {
    if ((idx + 1) % 50 === 0) {
      console.log(`   Processing: ${idx + 1}/${files.length}...`);
    }
    
    const songData = parseSongFile(filePath);
    
    if (songData && songData.title_fa) {
      const slug = cleanFilename(path.basename(filePath));
      const letter = getLetterFromTitle(songData.title_fa);
      
      songs.push({
        id: idx + 1,
        slug,
        letter,
        ...songData,
        file_path: filePath.replace(BASE_DIR, '').replace(/\\/g, '/')
      });
      processed++;
    }
  });
  
  console.log(`✅ Extracted ${processed} songs with metadata`);
  return songs;
}

function exportToJSON(songs) {
  const outputPath = path.join(EXPORT_DIR, 'songs_index.json');
  
  const songsByLetter = {};
  songs.forEach(song => {
    if (!songsByLetter[song.letter]) {
      songsByLetter[song.letter] = [];
    }
    songsByLetter[song.letter].push(song);
  });
  
  // Sort songs within each letter
  Object.keys(songsByLetter).forEach(letter => {
    songsByLetter[letter].sort((a, b) => a.title_fa.localeCompare(b.title_fa, 'fa'));
  });
  
  const output = {
    total_songs: songs.length,
    letters: Object.keys(songsByLetter).length,
    data: songsByLetter
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ Exported JSON: ${outputPath}`);
  return outputPath;
}

function generateSummary(songs) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(80));
  
  const stats = {
    total: songs.length,
    withAudio: songs.filter(s => s.audio).length,
    withVideo: songs.filter(s => s.video).length,
    withPPT: songs.filter(s => s.ppt).length,
    withLyrics: songs.filter(s => s.lyrics).length,
    withChords: songs.filter(s => s.chord).length
  };
  
  console.log(`\n📈 Total Songs: ${stats.total}`);
  console.log(`   🎧 With Audio: ${stats.withAudio} (${(stats.withAudio/stats.total*100).toFixed(1)}%)`);
  console.log(`   📽️  With Video: ${stats.withVideo} (${(stats.withVideo/stats.total*100).toFixed(1)}%)`);
  console.log(`   🖥️  With PowerPoint: ${stats.withPPT} (${(stats.withPPT/stats.total*100).toFixed(1)}%)`);
  console.log(`   📝 With Lyrics: ${stats.withLyrics} (${(stats.withLyrics/stats.total*100).toFixed(1)}%)`);
  console.log(`   🎵 With Chords: ${stats.withChords} (${(stats.withChords/stats.total*100).toFixed(1)}%)`);
  
  const byLetter = {};
  songs.forEach(s => {
    byLetter[s.letter] = (byLetter[s.letter] || 0) + 1;
  });
  
  console.log('\n📚 Songs by Letter:');
  PERSIAN_LETTERS.forEach(letter => {
    if (byLetter[letter]) {
      console.log(`   ${letter}: ${byLetter[letter]} songs`);
    }
  });
  
  if (byLetter['Other']) {
    console.log(`   Other: ${byLetter['Other']} songs`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('\n🎵 Kalameh Song Archive Extractor (Node.js)');
  console.log('='.repeat(80));
  console.log(`📂 Source: ${BASE_DIR}`);
  console.log(`📂 Export: ${EXPORT_DIR}`);
  console.log('='.repeat(80));
  
  // Ensure export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
  
  // Scan and extract
  const songs = scanSongFiles();
  
  if (songs.length === 0) {
    console.error('\n❌ No songs found. Check the BASE_DIR path.');
    return;
  }
  
  // Generate summary
  generateSummary(songs);
  
  // Export
  console.log('📦 Exporting data...');
  exportToJSON(songs);
  
  console.log('\n✅ Extraction complete!');
  console.log(`📂 Check exports in: ${EXPORT_DIR}\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scanSongFiles, exportToJSON };
