const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'attached_assets', 'bible_fa_en_1758111193552.sql');
if (!fs.existsSync(file)) {
  console.error('Dump file not found:', file);
  process.exit(2);
}

const raw = fs.readFileSync(file, 'utf8');

// Very simple parser: look for INSERT INTO "bible_verses" VALUES (...),(...);
// or INSERT INTO bible_verses VALUES ...
const insertRegex = /INSERT\s+INTO\s+\"?bible_verses\"?\s+VALUES\s*(.+?);/gis;
let m;

const statsByBook = {}; // book_abbr -> { total, missing_en, missing_fa }

while ((m = insertRegex.exec(raw)) !== null) {
  const valuesBlock = m[1];
  // split on '),(' with some tolerance
  const entries = valuesBlock
    .replace(/\n/g, ' ')
    .split(/\),\s*\(/g)
    .map(s => s.replace(/^\(+|\)+$/g, '').trim())
    .filter(Boolean);

  for (const entry of entries) {
    // naive CSV split on commas that are not inside quotes
    const cols = entry.match(/(?:'[^']*'|[^,])+?/g).map(c => c.trim());
    // Expected schema in dump (best-effort): id,book_id,chapter,verse,text_en,text_fa,created_at
    // But some dumps might use different ordering; try to guess by length
    let bookId, chapter, verse, textEn, textFa;
    if (cols.length >= 6) {
      bookId = cols[1].replace(/['"]+/g, '');
      chapter = cols[2].replace(/['"]+/g, '');
      verse = cols[3].replace(/['"]+/g, '');
      textEn = cols[4].replace(/^'|'$/g, '').replace(/''/g, "'");
      textFa = cols[5].replace(/^'|'$/g, '').replace(/''/g, "'");
    } else {
      // skip if unexpected
      continue;
    }
    const bookKey = bookId || 'unknown';
    if (!statsByBook[bookKey]) statsByBook[bookKey] = { total: 0, missing_en: 0, missing_fa: 0 };
    statsByBook[bookKey].total += 1;
    if (!textEn || textEn.trim() === '') statsByBook[bookKey].missing_en += 1;
    if (!textFa || textFa.trim() === '') statsByBook[bookKey].missing_fa += 1;
  }
}

// Output simple CSV
console.log('book_id,total,missing_en,missing_fa');
for (const k of Object.keys(statsByBook).sort((a,b)=> +a - +b)) {
  const v = statsByBook[k];
  console.log(`${k},${v.total},${v.missing_en},${v.missing_fa}`);
}
