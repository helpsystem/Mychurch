/*
  extract_fa_texts.cjs
  - Walks the workspace tree (from provided path or repo root)
  - Finds lines containing Persian characters (U+0600 - U+06FF)
  - Emits JSON and CSV in scripts/

  Usage:
    node scripts/extract_fa_texts.cjs [targetPath]
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const OUT_JSON = path.join(process.cwd(), 'scripts', 'extracted_fa_texts.json');
const OUT_CSV = path.join(process.cwd(), 'scripts', 'extracted_fa_texts.csv');

const PERSIAN_RE = /[\u0600-\u06FF]/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'coverage']);
const BINARY_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.zip', '.tar', '.gz', '.tgz', '.pdf',
  '.woff', '.woff2', '.ttf', '.otf', '.ico', '.svg', '.mp3', '.mp4', '.mov', '.mkv', '.db', '.sqlite', '.sqlite3', '.exe', '.dll', '.bin'
]);

let filesScanned = 0;
let filesWithFa = 0;
let totalMatches = 0;

function isBinaryExt(filename) {
  const ext = path.extname(filename).toLowerCase();
  return BINARY_EXTS.has(ext);
}

async function walk(dir, cb) {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err) {
    // ignore permission errors
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      await walk(full, cb);
    } else if (ent.isFile()) {
      await cb(full);
    }
  }
}

async function processFile(filePath) {
  filesScanned++;
  const rel = path.relative(process.cwd(), filePath);
  if (isBinaryExt(filePath)) return null;
  let contents;
  try {
    contents = await fs.promises.readFile(filePath, 'utf8');
  } catch (err) {
    // skip unreadable files
    return null;
  }
  if (!PERSIAN_RE.test(contents)) return null;

  const lines = contents.split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (PERSIAN_RE.test(line)) {
      const before = i > 0 ? lines[i - 1].trim() : '';
      const after = i + 1 < lines.length ? lines[i + 1].trim() : '';
      matches.push({ lineNumber: i + 1, text: line.trim(), before, after });
      totalMatches++;
    }
  }

  if (matches.length) {
    filesWithFa++;
    return { filePath: rel.replace(/\\/g, '/'), matches };
  }
  return null;
}

(async function main() {
  console.log('Scanning for Persian text (this may take a few seconds)...');
  const results = [];
  await walk(ROOT, async (file) => {
    const res = await processFile(file);
    if (res) results.push(res);
  });

  // Write JSON
  try {
    await fs.promises.writeFile(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), root: ROOT, filesScanned, filesWithFa, totalMatches, results }, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write JSON:', err.message);
  }

  // Write CSV (filePath,lineNumber,text)
  try {
    const header = 'filePath,lineNumber,text\n';
    const rows = [];
    for (const f of results) {
      for (const m of f.matches) {
        // escape quotes
        const q = '"';
        const text = String(m.text).replace(/"/g, '""');
        rows.push(`${f.filePath},${m.lineNumber},${q}${text}${q}`);
      }
    }
    await fs.promises.writeFile(OUT_CSV, header + rows.join('\n'), 'utf8');
  } catch (err) {
    console.error('Failed to write CSV:', err.message);
  }

  console.log(`Done. scanned=${filesScanned} files; filesWithPersian=${filesWithFa}; totalMatches=${totalMatches}`);
  console.log(`JSON -> ${OUT_JSON}`);
  console.log(`CSV  -> ${OUT_CSV}`);
})();
