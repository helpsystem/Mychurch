const fs = require('fs');
const path = require('path');

const dumps = [
  'bible_fa_en_1758111193552.sql',
  'all_bibles_1758111193552.sql',
  'all_biblesX_1758111193551.sql',
  'verses_mojdeh_1757861410662.sql',
  'verses_qadim_1757861410663.sql',
  'verses_tafsiri_ot_1757861410663.sql'
].map(f => path.join(__dirname, '..', 'attached_assets', f)).filter(fs.existsSync);

if (dumps.length === 0) {
  console.error('No SQL dumps found in attached_assets');
  process.exit(2);
}

const statsByBook = {}; // book_key -> { total, missing_en, missing_fa }

for (const dump of dumps) {
  const raw = fs.readFileSync(dump, 'utf8');
  const insertRegex = /INSERT\s+INTO\s+\"?bible_verses\"?\s+VALUES\s*(.+?);/gis;
  let m;
  while ((m = insertRegex.exec(raw)) !== null) {
    const valuesBlock = m[1];
    const entries = valuesBlock
      .replace(/\\n/g, ' ')
      .split(/\),\s*\(/g)
      .map(s => s.replace(/^\(+|\)+$/g, '').trim())
      .filter(Boolean);

    for (const entry of entries) {
      // split respecting single quotes
      const cols = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < entry.length; i++) {
        const ch = entry[i];
        if (ch === "'") {
          // peek for escaped ''
          if (entry[i+1] === "'") {
            cur += "'"; i++; continue;
          }
          inQuotes = !inQuotes;
          cur += ch;
          continue;
        }
        if (ch === ',' && !inQuotes) {
          cols.push(cur.trim()); cur = ''; continue;
        }
        cur += ch;
      }
      if (cur.trim() !== '') cols.push(cur.trim());

      // heuristic: find columns that look like text (long, contain spaces or Persian chars)
      let bookCol = null, enCol = null, faCol = null;
      // try common positions first
      if (cols.length >= 6) {
        bookCol = 1; enCol = 4; faCol = 5;
      } else {
        // fallback: find the numeric columns for id/chapter/verse
        const numericIdx = cols.map((c,i)=> ({i, n: Number(c.replace(/['"]/g,''))})).filter(x=>!isNaN(x.n));
        const numericSet = new Set(numericIdx.map(x=>x.i));
        // choose first non-numeric as potential text
        for (let i=0;i<cols.length;i++) {
          if (!numericSet.has(i)) {
            if (!enCol) enCol = i; else if (!faCol) faCol = i;
          }
        }
        bookCol = 1;
      }

      const bookKey = (cols[bookCol] || 'unknown').replace(/['"]/g, '');
      const rawEn = (cols[enCol] || '').replace(/^'|'$/g,'').replace(/''/g,"'").trim();
      const rawFa = (cols[faCol] || '').replace(/^'|'$/g,'').replace(/''/g,"'").trim();
      if (!statsByBook[bookKey]) statsByBook[bookKey] = { total:0, missing_en:0, missing_fa:0 };
      statsByBook[bookKey].total += 1;
      if (!rawEn) statsByBook[bookKey].missing_en += 1;
      if (!rawFa) statsByBook[bookKey].missing_fa += 1;
    }
  }
}

// write CSV
const outPath = path.join(__dirname, 'missing_translations_robust.csv');
const rows = ['book_key,total,missing_en,missing_fa,percent_en_missing,percent_fa_missing'];
for (const k of Object.keys(statsByBook).sort((a,b)=> +a - +b)) {
  const v = statsByBook[k];
  const pe = v.total ? ((v.missing_en / v.total)*100).toFixed(2) : '0.00';
  const pf = v.total ? ((v.missing_fa / v.total)*100).toFixed(2) : '0.00';
  rows.push(`${k},${v.total},${v.missing_en},${v.missing_fa},${pe},${pf}`);
}
fs.writeFileSync(outPath, rows.join('\n'));
console.log('Wrote', outPath);
