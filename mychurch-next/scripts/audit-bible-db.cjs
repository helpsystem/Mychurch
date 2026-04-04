const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'Bible', 'bible_output', 'bible_complete.db');
const outDir = path.join(process.cwd(), 'tmp');
const outJson = path.join(outDir, 'bible_audit_report.json');
const outTxt = path.join(outDir, 'bible_audit_report.txt');

if (!fs.existsSync(dbPath)) {
  console.error('DB not found:', dbPath);
  process.exit(1);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const db = new Database(dbPath, { readonly: true });

function all(sql, params = []) {
  return db.prepare(sql).all(params);
}

function one(sql, params = []) {
  return db.prepare(sql).get(params);
}

function nowIso() {
  return new Date().toISOString();
}

const versions = all(`
  SELECT version_id, abbr, name, COALESCE(language, 'unknown') AS language
  FROM versions
  ORDER BY language, abbr
`);

const globalCounts = {
  generatedAt: nowIso(),
  dbPath,
  versionCount: versions.length,
  totalVerses: one('SELECT COUNT(*) AS c FROM verses').c,
  totalBooks: one('SELECT COUNT(*) AS c FROM books').c,
  totalChapters: one('SELECT COUNT(*) AS c FROM chapters').c,
};

const blankRows = all(`
  SELECT v.version_id, ver.abbr, v.book_id, v.chapter_num, v.verse_num, v.text
  FROM verses v
  JOIN versions ver ON ver.version_id = v.version_id
  WHERE v.text IS NULL OR TRIM(v.text) = ''
  ORDER BY ver.abbr, v.book_id, v.chapter_num, v.verse_num
`);

const whitespaceOnlyRows = all(`
  SELECT v.version_id, ver.abbr, v.book_id, v.chapter_num, v.verse_num
  FROM verses v
  JOIN versions ver ON ver.version_id = v.version_id
  WHERE v.text IS NOT NULL AND TRIM(v.text) != '' AND LENGTH(REPLACE(REPLACE(REPLACE(v.text, ' ', ''), char(10), ''), char(13), '')) = 0
  ORDER BY ver.abbr, v.book_id, v.chapter_num, v.verse_num
`);

const duplicateRows = all(`
  SELECT version_id, book_id, chapter_num, verse_num, COUNT(*) AS cnt
  FROM verses
  GROUP BY version_id, book_id, chapter_num, verse_num
  HAVING COUNT(*) > 1
`);

const chapterIntegrity = all(`
  SELECT
    c.version_id,
    ver.abbr,
    c.book_id,
    c.chapter_num,
    COALESCE(c.verse_count, 0) AS declared_verse_count,
    COUNT(v.id) AS actual_verse_rows,
    COALESCE(MIN(v.verse_num), 0) AS min_verse_num,
    COALESCE(MAX(v.verse_num), 0) AS max_verse_num
  FROM chapters c
  JOIN versions ver ON ver.version_id = c.version_id
  LEFT JOIN verses v
    ON v.version_id = c.version_id
   AND v.book_id = c.book_id
   AND v.chapter_num = c.chapter_num
  GROUP BY c.version_id, ver.abbr, c.book_id, c.chapter_num, c.verse_count
  ORDER BY ver.abbr, c.book_id, c.chapter_num
`);

const chapterIssues = [];
for (const row of chapterIntegrity) {
  const declared = Number(row.declared_verse_count || 0);
  const actual = Number(row.actual_verse_rows || 0);
  const maxV = Number(row.max_verse_num || 0);
  const minV = Number(row.min_verse_num || 0);

  const issues = [];
  if (actual === 0) issues.push('NO_VERSE_ROWS');
  if (minV > 1 && actual > 0) issues.push('STARTS_AFTER_1');
  if (declared > 0 && declared !== actual) issues.push('DECLARED_COUNT_MISMATCH_ACTUAL_ROWS');
  if (actual > 0 && maxV !== actual) issues.push('NON_CONTIGUOUS_OR_GAPS');
  if (declared > 0 && maxV > 0 && declared !== maxV) issues.push('DECLARED_COUNT_MISMATCH_MAX_VERSE_NUM');

  if (issues.length > 0) {
    chapterIssues.push({
      version_id: row.version_id,
      abbr: row.abbr,
      book_id: row.book_id,
      chapter_num: row.chapter_num,
      declared_verse_count: declared,
      actual_verse_rows: actual,
      min_verse_num: minV,
      max_verse_num: maxV,
      issues,
    });
  }
}

// Explicit missing verse numbers per chapter/version
const missingNumberSamples = [];
const missingNumberCountByVersion = {};
for (const row of chapterIntegrity) {
  if (!row.max_verse_num || row.max_verse_num <= 0) continue;
  const nums = all(
    `SELECT verse_num FROM verses WHERE version_id = ? AND book_id = ? AND chapter_num = ? ORDER BY verse_num`,
    [row.version_id, row.book_id, row.chapter_num]
  ).map((r) => r.verse_num);

  const set = new Set(nums);
  const missing = [];
  for (let i = 1; i <= row.max_verse_num; i += 1) {
    if (!set.has(i)) missing.push(i);
  }

  if (missing.length > 0) {
    missingNumberCountByVersion[row.abbr] = (missingNumberCountByVersion[row.abbr] || 0) + missing.length;
    if (missingNumberSamples.length < 300) {
      missingNumberSamples.push({
        abbr: row.abbr,
        version_id: row.version_id,
        book_id: row.book_id,
        chapter_num: row.chapter_num,
        max_verse_num: row.max_verse_num,
        missing,
      });
    }
  }
}

// Coverage baseline: every unique reference that exists in at least one version
const baselineRefCount = one(`
  SELECT COUNT(*) AS c
  FROM (
    SELECT DISTINCT book_id, chapter_num, verse_num
    FROM verses
  ) t
`).c;

const missingCoverageByVersion = all(`
  WITH baseline AS (
    SELECT DISTINCT book_id, chapter_num, verse_num
    FROM verses
  ),
  present AS (
    SELECT DISTINCT version_id, book_id, chapter_num, verse_num
    FROM verses
  )
  SELECT
    ver.version_id,
    ver.abbr,
    ver.language,
    COUNT(*) AS missing_refs
  FROM versions ver
  CROSS JOIN baseline b
  LEFT JOIN present p
    ON p.version_id = ver.version_id
   AND p.book_id = b.book_id
   AND p.chapter_num = b.chapter_num
   AND p.verse_num = b.verse_num
  WHERE p.version_id IS NULL
  GROUP BY ver.version_id, ver.abbr, ver.language
  ORDER BY missing_refs DESC, ver.abbr
`);

const versionStats = versions.map((v) => {
  const s = one(
    `SELECT
       COUNT(*) AS verses,
       COUNT(DISTINCT book_id || ':' || chapter_num) AS chapters,
       COUNT(DISTINCT book_id) AS books,
       SUM(CASE WHEN text IS NULL OR TRIM(text) = '' THEN 1 ELSE 0 END) AS blank
     FROM verses
     WHERE version_id = ?`,
    [v.version_id]
  );
  const chaptersDeclared = one(
    `SELECT COUNT(*) AS c FROM chapters WHERE version_id = ?`,
    [v.version_id]
  ).c;

  return {
    version_id: v.version_id,
    abbr: v.abbr,
    name: v.name,
    language: v.language,
    books_with_verses: s.books,
    chapters_with_verses: s.chapters,
    chapters_declared: chaptersDeclared,
    verses: s.verses,
    blank_verses: s.blank,
  };
});

const report = {
  globalCounts,
  summary: {
    baselineUniqueReferences: baselineRefCount,
    blankVerseRows: blankRows.length,
    whitespaceOnlyRows: whitespaceOnlyRows.length,
    duplicateReferenceRows: duplicateRows.length,
    chapterIssues: chapterIssues.length,
    missingNumberChapterSamples: missingNumberSamples.length,
  },
  byVersion: versionStats,
  missingCoverageByVersion,
  chapterIssueSamples: chapterIssues.slice(0, 500),
  missingNumberSamples,
  blankVerseSamples: blankRows.slice(0, 500),
  whitespaceOnlySamples: whitespaceOnlyRows.slice(0, 200),
  duplicateReferenceSamples: duplicateRows.slice(0, 200),
};

const lines = [];
lines.push('=== Bible DB Full Audit ===');
lines.push(`GeneratedAt: ${report.globalCounts.generatedAt}`);
lines.push(`DB: ${report.globalCounts.dbPath}`);
lines.push(`Versions: ${report.globalCounts.versionCount}`);
lines.push(`Total verses: ${report.globalCounts.totalVerses}`);
lines.push(`Baseline unique references (book/chapter/verse): ${report.summary.baselineUniqueReferences}`);
lines.push('');
lines.push('--- Global Issues ---');
lines.push(`Blank verses: ${report.summary.blankVerseRows}`);
lines.push(`Whitespace-only verses: ${report.summary.whitespaceOnlyRows}`);
lines.push(`Duplicate references: ${report.summary.duplicateReferenceRows}`);
lines.push(`Chapter-level integrity issues: ${report.summary.chapterIssues}`);
lines.push('');
lines.push('--- Coverage Missing by Version (top 20) ---');
for (const row of report.missingCoverageByVersion.slice(0, 20)) {
  lines.push(`${row.abbr} (${row.language}) -> missing refs: ${row.missing_refs}`);
}
lines.push('');
lines.push('--- Version Stats ---');
for (const row of report.byVersion) {
  lines.push(`${row.abbr} [${row.language}] verses=${row.verses}, blank=${row.blank_verses}, books=${row.books_with_verses}, chapters=${row.chapters_with_verses}/${row.chapters_declared}`);
}
lines.push('');
lines.push('--- Sample Blank Verses (first 40) ---');
for (const row of report.blankVerseSamples.slice(0, 40)) {
  lines.push(`${row.abbr} ${row.book_id} ${row.chapter_num}:${row.verse_num}`);
}
lines.push('');
lines.push('--- Sample Missing Number Gaps (first 40 chapters) ---');
for (const row of report.missingNumberSamples.slice(0, 40)) {
  lines.push(`${row.abbr} ${row.book_id} ${row.chapter_num} missing=[${row.missing.join(',')}] max=${row.max_verse_num}`);
}

fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(outTxt, lines.join('\n'), 'utf8');

console.log('Audit complete.');
console.log('JSON report:', outJson);
console.log('Text report:', outTxt);
console.log('Summary:', JSON.stringify(report.summary, null, 2));
