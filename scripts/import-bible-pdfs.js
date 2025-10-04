#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';
import pg from 'pg';
import { BIBLE_BOOKS } from './populate-bible.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfDir = path.resolve(__dirname, '..', 'public', 'documents', 'bible-pdfs');

function normalize(str) {
  return (str || '').replace(/[\u200E\u200F]/g, '').replace(/[-_\.\s]+/g, ' ').trim().toLowerCase();
}

function stripSuffixes(name) {
  // remove common suffixes like _2, -2, (2), copy, version
  return name.replace(/[_\-\s]*\(?\d+\)?$/,'').replace(/[_\-\s]*(copy|version|v\d+)$/i,'').trim();
}

function findBookForFilename(filename) {
  const nameRaw = filename.replace(/\.pdf$/i, '');
  const nameStripped = stripSuffixes(nameRaw);
  const n = normalize(nameStripped);

  // Tokens for matching
  const tokens = n.split(' ').filter(Boolean);

  // If file starts with a numeric/ordinal prefix like '1-', '2-', 'i-', 'ii-', 'first-', '2nd-' capture that
  let numericPrefix = null;
  const numMatch = nameRaw.match(/^\s*((?:\d+|[ivx]+|first|second|third)(?:st|nd|rd)?)[\-_. ]/i);
  if (numMatch) {
    const rawPref = numMatch[1];
    // helper to normalize various prefixes to a digit string e.g. 'ii' -> '2', 'second' -> '2', '1st' -> '1'
    function parseNumericPrefix(pref) {
      if (!pref) return null;
      const p = pref.toString().toLowerCase().replace(/(?:st|nd|rd|th)$/,'');
      // roman numerals (basic)
      const romans = { i:1, ii:2, iii:3, iv:4, v:5, vi:6, vii:7, viii:8, ix:9, x:10 };
      if (romans[p]) return romans[p].toString();
      if (p === 'first') return '1';
      if (p === 'second') return '2';
      if (p === 'third') return '3';
      if (/^\d+$/.test(p)) return p;
      return null;
    }
    numericPrefix = parseNumericPrefix(rawPref);
  }

  // First try strong matches: full name or abbreviation
  for (const book of BIBLE_BOOKS) {
    const en = normalize(book.name_en || '');
    const abbr = normalize(book.abbreviation || '');
    const fa = normalize(book.name_fa || '');

    if (n === en || n === abbr || n === fa) return book;
    if (en.includes(n) || n.includes(en)) return book;
    if (abbr && n.includes(abbr)) return book;
    if (fa && n.includes(fa)) return book;
  }

  // Next try token-based matching scoring
  const scores = new Map();
  for (const book of BIBLE_BOOKS) {
    const en = normalize(book.name_en || '');
    const abbr = normalize(book.abbreviation || '');
    let score = 0;
    for (const token of tokens) {
      if (en.split(' ').includes(token)) score += 10;
      if (abbr && abbr === token) score += 8;
      if (en.startsWith(token)) score += 5;
      if (en.includes(token)) score += 3;
    }
    // boost strongly when numeric prefix matches book starting number (e.g., '1 corinthians' or '2 Chronicles')
    if (numericPrefix && /^\d/.test(book.name_en)) {
      if (book.name_en.startsWith(numericPrefix + ' ')) score += 100;
    }
    scores.set(book, score);
  }

  // Pick the best scoring book if score is significant
  const best = Array.from(scores.entries()).sort((a,b)=>b[1]-a[1])[0];
  if (best && best[1] >= 8) return best[0];

  return null;
}

async function main() {
  if (!fs.existsSync(pdfDir)) {
    console.error('PDF directory not found:', pdfDir);
    process.exit(1);
  }

  const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.log('No PDF files found in', pdfDir);
    return;
  }

  const mapping = [];

  for (const file of files) {
    const book = findBookForFilename(file);
    mapping.push({ file, bookKey: book ? book.book_number : null, bookName: book ? book.name_en : null });
  }

  console.log('\nDry-run mapping of PDFs to Bible books:');
  console.table(mapping);

  // Write mapping to a file for review
  const outPath = path.join(__dirname, 'pdf-to-book-mapping.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log('\nMapping written to', outPath);

  console.log('\nNext step: review the generated pdf-to-book-mapping.json. If you approve, run this script with --apply to update the database.');

  // If --apply flag provided, attempt a safe preview+apply against the database
  const args = process.argv.slice(2);
  if (!args.includes('--apply')) {
    return;
  }

  // Load env
  dotenv.config();

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('\n--apply requested but DATABASE_URL not found in environment. Aborting.');
    return;
  }

  // Helper: prompt yes/no
  const askYesNo = (question) => new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' ', (ans) => { rl.close(); resolve(/^(y|yes)$/i.test(ans)); });
  });

  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

  try {
    console.log('\nPreparing DB preview...');

    // Ensure column exists
    await pool.query(`ALTER TABLE bible_books ADD COLUMN IF NOT EXISTS pdf_url TEXT`);

    // Build preview updates
    const updates = mapping.filter(m => m.bookKey).map(m => ({
      bookKey: m.bookKey,
      file: m.file,
      pdf_url: path.posix.join('/documents/bible-pdfs', m.file)
    }));

    if (updates.length === 0) {
      console.log('No mappings with bookKey found — nothing to apply.');
      await pool.end();
      return;
    }

    console.log('\nPreview of updates to be applied:');
    for (const u of updates) {
      console.log(`  book_number=${u.bookKey} -> pdf_url='${u.pdf_url}' (file: ${u.file})`);
    }

    const ok = await askYesNo('\nApply these updates to the database? Type yes to confirm:');
    if (!ok) {
      console.log('Aborted by user. No changes applied.');
      await pool.end();
      return;
    }

    console.log('\nApplying updates in a single transaction...');
    await pool.query('BEGIN');
    try {
      for (const u of updates) {
        await pool.query('UPDATE bible_books SET pdf_url = $1 WHERE book_number = $2', [u.pdf_url, u.bookKey]);
      }
      await pool.query('COMMIT');
      console.log('✅ Updates applied successfully.');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error during apply:', err.message || err);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
