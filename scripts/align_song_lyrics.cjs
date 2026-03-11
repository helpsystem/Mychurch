const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '..', 'data', 'worship_songs.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, 'aligned_songs_with_media.tsv');
  const ws = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  // Header
  // Columns: Song_ID, Title_FA, Title_EN, Line_Num, Persian_Lyric, English_Lyric, Audio_URL, Video_URL, Has_Timing
  ws.write('Song_ID\tTitle_FA\tTitle_EN\tLine_Num\tPersian_Lyric\tEnglish_Lyric\tAudio_URL\tVideo_URL\tHas_Timing\n');

  if (!fs.existsSync(SONGS_FILE)) {
    console.error('Songs data file not found:', SONGS_FILE);
    return;
  }

  const songsData = JSON.parse(fs.readFileSync(SONGS_FILE, 'utf8'));
  let lineCount = 0;

  for (const song of songsData) {
    const id = song.id || '';
    const titleFa = song.title?.fa?.replace(/[\n\t\r]/g, ' ') || '';
    const titleEn = song.title?.en?.replace(/[\n\t\r]/g, ' ') || '';
    const audioUrl = song.audioUrl || '';
    const videoUrl = song.videoUrl || '';
    const hasTimings = song.timepoints && song.timepoints.length > 0 ? 'Yes' : 'No';

    const lyricsFa = (song.lyrics?.fa || '').split('\n').map(l => l.trim());
    const lyricsEn = (song.lyrics?.en || '').split('\n').map(l => l.trim());

    const maxLines = Math.max(lyricsFa.length, lyricsEn.length);

    if (maxLines === 0 || (maxLines === 1 && lyricsFa[0] === '' && lyricsEn[0] === '')) {
      // No lyrics, just add one row with empty lyrics
      ws.write(`${id}\t${titleFa}\t${titleEn}\t1\t\t\t${audioUrl}\t${videoUrl}\t${hasTimings}\n`);
      lineCount++;
    } else {
      for (let i = 0; i < maxLines; i++) {
        const pLine = (lyricsFa[i] || '').replace(/[\n\t\r]/g, ' ');
        const eLine = (lyricsEn[i] || '').replace(/[\n\t\r]/g, ' ');

        ws.write(`${id}\t${titleFa}\t${titleEn}\t${i + 1}\t${pLine}\t${eLine}\t${audioUrl}\t${videoUrl}\t${hasTimings}\n`);
        lineCount++;
      }
    }
  }

  ws.end();
  console.log(`Successfully aligned ${lineCount} song lyric lines into ${outputFile}`);
}

main().catch(console.error);
