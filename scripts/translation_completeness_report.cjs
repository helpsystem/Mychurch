const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'attached_assets');
const bookListPath = path.join(assetsDir, 'books_1758111193552.json');
let books = [];
if (fs.existsSync(bookListPath)) {
  try { books = JSON.parse(fs.readFileSync(bookListPath, 'utf8')); } catch (e) { books = []; }
}
const bookMap = new Map(); // bookNumber -> { id, name_en, name_fa }
for (const b of books) bookMap.set(String(b.id), b);

const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.sql'));
if (files.length === 0) {
  console.error('No .sql files found in attached_assets/');
  process.exit(1);
}

// Map key = `${book}:${chapter}:${verse}` -> {book, chapter, verse, hasEn, hasFa}
const verses = new Map();

const insertRegex = /INSERT\s+INTO\s+\"?(verses|bible_verses|verse)\"?\s+VALUES\s*(.+?);/gis;
const chaptersRegex = /INSERT\s+INTO\s+\"?(chapters|bible_chapters|chapter)\"?\s+VALUES\s*(.+?);/gis;
const strLiteralRegex = /'((?:[^']|'')*)'\s*$/s;

// First pass: parse chapters to map chapter_id -> book_number
const chaptersMap = new Map(); // chapterId -> { bookNumber, chapterNumber }
for (const file of files) {
  const p = path.join(assetsDir, file);
  const raw = fs.readFileSync(p, 'utf8');
  let cm;
  while ((cm = chaptersRegex.exec(raw)) !== null) {
    const valuesBlock = cm[2];
    const tuples = valuesBlock.split(/\),\s*\(/g).map(s => s.replace(/^\(+|\)+$/g,'').trim());
    for (const t of tuples) {
      const cols = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (ch === "'") {
          if (t[i+1] === "'") { cur += "'"; i++; continue; }
          inQ = !inQ; cur += ch; continue;
        }
        if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      if (cur.trim() !== '') cols.push(cur.trim());
      // Expect: (id, book_number, chapter_number, ...)
      if (cols.length >= 3) {
        const chapterId = cols[0].replace(/['"]/g,'');
        const bookNumber = cols[1].replace(/['"]/g,'');
        const chapterNumber = cols[2].replace(/['"]/g,'');
        chaptersMap.set(chapterId, { bookNumber, chapterNumber });
      }
    }
  }
}

// Second pass: parse verses and use chaptersMap to assign book numbers
for (const file of files) {
  const p = path.join(assetsDir, file);
  const raw = fs.readFileSync(p, 'utf8');
  let m;
  while ((m = insertRegex.exec(raw)) !== null) {
    const valuesBlock = m[2];
    const tuples = valuesBlock.split(/\),\s*\(/g).map(s => s.replace(/^\(+|\)+$/g,'').trim());
    for (const t of tuples) {
      const strMatch = t.match(/'((?:[^']|'')*)'\s*$/s);
      const text = strMatch ? strMatch[1].replace(/''/g, "'") : '';
      const cols = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (ch === "'") {
          if (t[i+1] === "'") { cur += "'"; i++; continue; }
          inQ = !inQ; cur += ch; continue;
        }
        if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      if (cur.trim() !== '') cols.push(cur.trim());

      // Heuristic: (id, chapter_id, verse_number, ... , text)
      const nums = cols.map((c,idx)=> ({idx, n: Number(c.replace(/['"]/g, ''))})).filter(x=>!isNaN(x.n));
      let chapterId = null, verseNum = null;
      if (nums.length >= 3) {
        chapterId = String(nums[1].n);
        verseNum = String(nums[2].n);
      } else if (cols.length >= 3) {
        chapterId = cols[1].replace(/['"]/g,'');
        verseNum = cols[2].replace(/['"]/g,'');
      }
      if (!chapterId || !verseNum) continue;
      const chapterInfo = chaptersMap.get(chapterId);
      const bookNumber = chapterInfo ? chapterInfo.bookNumber : 'unknown';
      const key = `${bookNumber}:${chapterInfo?chapterInfo.chapterNumber:chapterId}:${verseNum}`;
      const entry = verses.get(key) || { book: bookNumber, chapter: chapterInfo?chapterInfo.chapterNumber:chapterId, verse: verseNum, hasEn: false, hasFa: false };
      const hasPersian = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
      const hasLatin = /[A-Za-z]/.test(text);
      if (hasPersian) entry.hasFa = true;
      if (hasLatin || (!hasPersian && text.trim().length>0)) entry.hasEn = true;
      verses.set(key, entry);
    }
  }
}

// Aggregate per book
const perBook = new Map();
for (const [k, v] of verses.entries()) {
  const b = v.book || 'unknown';
  const stat = perBook.get(b) || { total:0, haveEn:0, haveFa:0 };
  stat.total += 1;
  if (v.hasEn) stat.haveEn += 1;
  if (v.hasFa) stat.haveFa += 1;
  perBook.set(b, stat);
}

// Write CSV
const out = [];
out.push('book_number,book_en,book_fa,total,have_en,have_fa,missing_en,missing_fa,percent_en_missing,percent_fa_missing');
const bookNumbers = Array.from(perBook.keys()).sort((a,b)=> Number(a)-Number(b));
for (const bn of bookNumbers) {
  const s = perBook.get(bn);
  const bookInfo = bookMap.get(String(bn)) || { name_en:'', name_fa:'' };
  const missingEn = s.total - s.haveEn;
  const missingFa = s.total - s.haveFa;
  const pe = s.total? ((missingEn/s.total)*100).toFixed(2) : '0.00';
  const pf = s.total? ((missingFa/s.total)*100).toFixed(2) : '0.00';
  out.push(`${bn},"${bookInfo.name_en}","${bookInfo.name_fa}",${s.total},${s.haveEn},${s.haveFa},${missingEn},${missingFa},${pe},${pf}`);
}

const outPath = path.join(__dirname, 'translation_completeness_report.csv');
fs.writeFileSync(outPath, out.join('\n'));
console.log('Wrote report to', outPath);
