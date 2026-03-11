const fs = require('fs');
const path = require('path');

const BIBLE_DATA_DIR = path.join(__dirname, '..', 'bible_data', 'text');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const PERSIAN_TRANS = 'TPV'; // Could also use MOJDEH
const ENGLISH_TRANS = 'NET';

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, 'aligned_bible_with_audio.tsv');
  const ws = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  // Make header
  ws.write('Book\tChapter\tVerse\tPersian_Text\tEnglish_Text\tPersian_Audio_URL\tEnglish_Audio_URL\n');

  let verseCount = 0;

  // Assuming books exist in both translations
  const persianBooksDir = path.join(BIBLE_DATA_DIR, PERSIAN_TRANS);
  const englishBooksDir = path.join(BIBLE_DATA_DIR, ENGLISH_TRANS);

  if (!fs.existsSync(persianBooksDir) || !fs.existsSync(englishBooksDir)) {
    console.error('Bible data directories not found.');
    return;
  }

  const books = fs.readdirSync(persianBooksDir).filter(f => fs.statSync(path.join(persianBooksDir, f)).isDirectory());

  for (const book of books) {
    const persianChapDir = path.join(persianBooksDir, book);
    const englishChapDir = path.join(englishBooksDir, book);

    if (!fs.existsSync(englishChapDir)) continue;

    const chapters = fs.readdirSync(persianChapDir).filter(f => f.endsWith('.json')).sort((a,b) => parseInt(a) - parseInt(b));

    for (const chapterFile of chapters) {
      const pFile = path.join(persianChapDir, chapterFile);
      const eFile = path.join(englishChapDir, chapterFile);

      if (!fs.existsSync(eFile)) continue;

      let pData, eData;
      try {
        pData = JSON.parse(fs.readFileSync(pFile, 'utf8'));
        eData = JSON.parse(fs.readFileSync(eFile, 'utf8'));
      } catch (e) {
        console.error(`Error reading chapter file: ${pFile}`, e.message);
        continue;
      }

      const pAudio = pData.audio || '';
      const eAudio = eData.audio || '';

      // Match verses
      const pVerses = pData.verses || [];
      const eVerses = eData.verses || [];

      // Create mapping for English verses
      const eMap = new Map();
      eVerses.forEach(v => {
        eMap.set(v.verse, v.text);
      });

      for (const pV of pVerses) {
        const vNum = pV.verse;
        const pText = pV.text ? pV.text.replace(/[\n\t\r]/g, ' ') : '';
        const eText = eMap.get(vNum) ? eMap.get(vNum).replace(/[\n\t\r]/g, ' ') : '';

        ws.write(`${book}\t${pData.chapter}\t${vNum}\t${pText}\t${eText}\t${pAudio}\t${eAudio}\n`);
        verseCount++;
      }
    }
  }

  ws.end();
  console.log(`Successfully aligned ${verseCount} verses into ${outputFile}`);
}

main().catch(console.error);
