const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const BIBLE_DATA_DIR = path.join(__dirname, '..', 'bible_data', 'text');
const PUBLIC_BIBLE_DIR = path.join(__dirname, '..', 'public', 'text', 'bible');

const BOOKS_MAP = [
  { id: '01', code: 'GEN' }, { id: '02', code: 'EXO' }, { id: '03', code: 'LEV' },
  { id: '04', code: 'NUM' }, { id: '05', code: 'DEU' }, { id: '06', code: 'JOS' },
  { id: '07', code: 'JDG' }, { id: '08', code: 'RUT' }, { id: '09', code: '1SA' },
  { id: '10', code: '2SA' }, { id: '11', code: '1KI' }, { id: '12', code: '2KI' },
  { id: '13', code: '1CH' }, { id: '14', code: '2CH' }, { id: '15', code: 'EZR' },
  { id: '16', code: 'NEH' }, { id: '17', code: 'EST' }, { id: '18', code: 'JOB' },
  { id: '19', code: 'PSA' }, { id: '20', code: 'PRO' }, { id: '21', code: 'ECC' },
  { id: '22', code: 'SNG' }, { id: '23', code: 'ISA' }, { id: '24', code: 'JER' },
  { id: '25', code: 'LAM' }, { id: '26', code: 'EZK' }, { id: '27', code: 'DAN' },
  { id: '28', code: 'HOS' }, { id: '29', code: 'JOL' }, { id: '30', code: 'AMO' },
  { id: '31', code: 'OBA' }, { id: '32', code: 'JON' }, { id: '33', code: 'MIC' },
  { id: '34', code: 'NAM' }, { id: '35', code: 'HAB' }, { id: '36', code: 'ZEP' },
  { id: '37', code: 'HAG' }, { id: '38', code: 'ZEC' }, { id: '39', code: 'MAL' },
  { id: '40', code: 'MAT' }, { id: '41', code: 'MRK' }, { id: '42', code: 'LUK' },
  { id: '43', code: 'JHN' }, { id: '44', code: 'ACT' }, { id: '45', code: 'ROM' },
  { id: '46', code: '1CO' }, { id: '47', code: '2CO' }, { id: '48', code: 'GAL' },
  { id: '49', code: 'EPH' }, { id: '50', code: 'PHP' }, { id: '51', code: 'COL' },
  { id: '52', code: '1TH' }, { id: '53', code: '2TH' }, { id: '54', code: '1TI' },
  { id: '55', code: '2TI' }, { id: '56', code: 'TIT' }, { id: '57', code: 'PHM' },
  { id: '58', code: 'HEB' }, { id: '59', code: 'JAS' }, { id: '60', code: '1PE' },
  { id: '61', code: '2PE' }, { id: '62', code: '1JN' }, { id: '63', code: '2JN' },
  { id: '64', code: '3JN' }, { id: '65', code: 'JUD' }, { id: '66', code: 'REV' }
];

function readJsonQuietly(fp) {
  try {
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function cleanText(t) {
  return t ? String(t).replace(/[\n\t\r]/g, ' ') : '';
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputFile = path.join(OUTPUT_DIR, 'aligned_bible_all.tsv');
  const ws = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  ws.write('Book_Code\tChapter\tVerse\tEN_KJV\tFA_TPV\tFA_MOJDEH\tFA_QADIM\tFA_WP\tTPV_Audio\tMOJDEH_Audio\tQADIM_Audio\n');

  let rowCount = 0;

  for (const book of BOOKS_MAP) {
    const numId = book.id;
    const txtCode = book.code;

    // WordProject Chapters
    const wpEnDir = path.join(PUBLIC_BIBLE_DIR, 'en', numId);
    let chapters = [];
    if (fs.existsSync(wpEnDir)) {
      chapters = fs.readdirSync(wpEnDir).filter(f => f.endsWith('.json')).map(f => parseInt(f)).sort((a,b)=>a-b);
    }
    
    // In case WP EN is missing, check TPV
    const tpvDir = path.join(BIBLE_DATA_DIR, 'TPV', txtCode);
    if (chapters.length === 0 && fs.existsSync(tpvDir)) {
      chapters = fs.readdirSync(tpvDir).filter(f => f.endsWith('.json')).map(f => parseInt(f)).sort((a,b)=>a-b);
    }

    for (const ch of chapters) {
      // Load files
      const wpEnData = readJsonQuietly(path.join(PUBLIC_BIBLE_DIR, 'en', numId, `${ch}.json`));
      const wpFaData = readJsonQuietly(path.join(PUBLIC_BIBLE_DIR, 'fa', numId, `${ch}.json`));
      
      const tpvData = readJsonQuietly(path.join(BIBLE_DATA_DIR, 'TPV', txtCode, `${ch}.json`));
      const mojdehData = readJsonQuietly(path.join(BIBLE_DATA_DIR, 'MOJDEH', txtCode, `${ch}.json`));
      const qadimData = readJsonQuietly(path.join(BIBLE_DATA_DIR, 'QADIM', txtCode, `${ch}.json`));

      // Audio URLs
      const tpvAudio = tpvData?.audio || '';
      const mojdehAudio = mojdehData?.audio || '';
      const qadimAudio = qadimData?.audio || '';

      // Collect all verse numbers in this chapter
      const verseNumbers = new Set();
      
      const addFromList = (vlist) => {
        if (vlist) vlist.forEach(v => verseNumbers.add(parseInt(v.verse)));
      };
      
      const addFromDict = (dict) => {
        if (dict) Object.keys(dict).forEach(k => verseNumbers.add(parseInt(k)));
      };

      if (wpEnData?.verses) addFromDict(wpEnData.verses);
      if (wpFaData?.verses) addFromDict(wpFaData.verses);
      if (tpvData?.verses) addFromList(tpvData.verses);
      if (mojdehData?.verses) addFromList(mojdehData.verses);
      if (qadimData?.verses) addFromList(qadimData.verses);

      const sortedVerses = Array.from(verseNumbers).sort((a,b)=>a-b);

      // Track the last seen Farsi verse text to fill in gaps (merged verses)
      let lastFaTpv = '';
      let lastFaMojdeh = '';
      let lastFaQadim = '';

      for (const vNum of sortedVerses) {
        let vEnKjv = wpEnData?.verses?.[vNum] || '';
        let vFaWp = wpFaData?.verses?.[vNum] || '';
        
        // Find exact matches for Farsi versions
        let exactTpv = tpvData?.verses?.find(v => parseInt(v.verse) === vNum)?.text;
        let exactMojdeh = mojdehData?.verses?.find(v => parseInt(v.verse) === vNum)?.text;
        let exactQadim = qadimData?.verses?.find(v => parseInt(v.verse) === vNum)?.text;

        // If exact match exists, update our "last seen" cache. 
        // If not, it means this verse is likely part of a merged block from the previous verse.
        // We carry over the last seen text (or a marker) so the English translation (which DOES exist) 
        // has something to pair with, keeping the rows aligned.
        if (exactTpv) lastFaTpv = exactTpv;
        if (exactMojdeh) lastFaMojdeh = exactMojdeh;
        if (exactQadim) lastFaQadim = exactQadim;

        let vFaTpv = exactTpv ? exactTpv : (lastFaTpv ? `[ادامه آیه قبلی] ${lastFaTpv.substring(0, 30)}...` : '');
        let vFaMojdeh = exactMojdeh ? exactMojdeh : (lastFaMojdeh ? `[ادامه آیه قبلی] ${lastFaMojdeh.substring(0, 30)}...` : '');
        let vFaQadim = exactQadim ? exactQadim : (lastFaQadim ? `[ادامه آیه قبلی] ${lastFaQadim.substring(0, 30)}...` : '');

        ws.write(`${txtCode}\t${ch}\t${vNum}\t${cleanText(vEnKjv)}\t${cleanText(vFaTpv)}\t${cleanText(vFaMojdeh)}\t${cleanText(vFaQadim)}\t${cleanText(vFaWp)}\t${tpvAudio}\t${mojdehAudio}\t${qadimAudio}\n`);
        rowCount++;
      }
    }
  }

  ws.end();
  console.log(`Successfully aligned ${rowCount} verses across all translations into ${outputFile}`);
}

main().catch(console.error);
