import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// --- Configuration & Environment ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Modes: 'sqlite' | 'directory'
const MODE = (process.env.BIBLE_SOURCE_MODE || (process.env.SQLITE_PATH ? 'sqlite' : (process.env.BIBLE_DIR_PATH ? 'directory' : 'sqlite'))).toLowerCase();
const SQLITE_PATH = process.env.SQLITE_PATH || './attached_assets/bible_fa_en_1758111193552.sqlite';
const DIR_PATH = process.env.BIBLE_DIR_PATH; // e.g. C:\\Users\\Sami\\Desktop\\En Fr Bible
const SECOND_LANG_CODE = (process.env.SECOND_LANG_CODE || 'fa').toLowerCase(); // 'fa' or 'fr'...

// Utility to pause (avoid rate limit)
const delay = (ms)=> new Promise(r=>setTimeout(r,ms));

// Generic chunking helper
async function upsertInChunks(table, rows, chunkSize, onConflict) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
    // Small delay to be kind to the API
    await delay(50);
  }
}

async function buildBookIdMap() {
  const { data, error } = await supabase.from('bible_books').select('id, book_number');
  if (error) throw error;
  const map = new Map();
  (data || []).forEach(row => map.set(row.book_number, row.id));
  return map;
}

// --- Import from SQLite ---
async function importFromSQLite() {
  console.log(`🔄 Mode: sqlite (file: ${SQLITE_PATH})`);
  const sqlite = sqlite3.verbose();
  const db = new sqlite.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);

  const all = (sql, params=[]) => new Promise((res,rej)=>{
    db.all(sql, params, (e,rows)=> e?rej(e):res(rows));
  });
  const get = (sql, params=[]) => new Promise((res,rej)=>{
    db.get(sql, params, (e,row)=> e?rej(e):res(row));
  });

  console.log('📚 Loading books...');
  const bookRows = await all(`SELECT id, code, name_en, name_fa, testament FROM books ORDER BY id`);
  const books = bookRows.map(r => ({
    book_number: Number(r.code),
    name_en: r.name_en,
    name_fa: r.name_fa,
    testament: (r.testament || '').toUpperCase() === 'OT' ? 'old' : 'new',
    abbreviation: (r.name_en || '').substring(0,10).replace(/\s+/g,'').toUpperCase() || String(r.code),
    chapters_count: 0
  }));
  await upsertInChunks('bible_books', books, 50, 'book_number');
  console.log(`✅ Upserted ${books.length} books`);

  const bookIdMap = await buildBookIdMap();

  console.log('📝 Streaming verses... (this may take a while)');
  // We iterate chapters then verses to reduce random lookups
  const chapters = await all(`SELECT id, book_id, chapter_number FROM chapters ORDER BY book_id, chapter_number`);
  const verseBatch = [];
  for (const chap of chapters) {
    const verses = await all(`SELECT verse_number, text_en, text_fa FROM verses WHERE chapter_id = ? ORDER BY verse_number`, [chap.id]);
    const bookId = bookIdMap.get(chap.book_id);
    if (!bookId) continue;
    for (const v of verses) {
      verseBatch.push({
        book_id: bookId,
        chapter: chap.chapter_number,
        verse: v.verse_number,
        text_en: v.text_en,
        text_fa: v.text_fa
      });
      if (verseBatch.length >= 500) {
        await upsertInChunks('bible_verses', verseBatch.splice(0), 500, 'book_id,chapter,verse');
        process.stdout.write('.')
      }
    }
  }
  if (verseBatch.length) {
    await upsertInChunks('bible_verses', verseBatch, 500, 'book_id,chapter,verse');
  }
  console.log('\n✅ Verses imported (SQLite mode)');
  db.close();
}

// --- Import from Directory ---
// Expected files inside DIR_PATH:
//  - books.json  (array of { book_number, name_en, name_fa/name_fr, testament, abbreviation? })
//  - verses.json (array of { book_number, chapter, verse, text_en, text_fa|text_fr })
// If CSV is provided instead (books.csv / verses.csv) simple comma-separated parser is attempted.
function readJSONIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}
function parseCSVIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const [headerLine, ...lines] = raw.split(/\r?\n/);
  const headers = headerLine.split(',').map(h=>h.trim());
  return lines.filter(l=>l.trim()).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h,i)=> obj[h] = cols[i]);
    return obj;
  });
}

async function importFromDirectory() {
  if (!DIR_PATH) {
    console.error('❌ BIBLE_DIR_PATH not set');
    process.exit(1);
  }
  console.log(`🔄 Mode: directory (path: ${DIR_PATH})`);
  if (!fs.existsSync(DIR_PATH)) {
    console.error('❌ Directory not found:', DIR_PATH);
    process.exit(1);
  }
  const booksFileJSON = path.join(DIR_PATH, 'books.json');
  const versesFileJSON = path.join(DIR_PATH, 'verses.json');
  const booksFileCSV = path.join(DIR_PATH, 'books.csv');
  const versesFileCSV = path.join(DIR_PATH, 'verses.csv');

  let books = readJSONIfExists(booksFileJSON) || parseCSVIfExists(booksFileCSV);
  if (!books) {
    console.error('❌ No books.json or books.csv found');
    process.exit(1);
  }
  // Normalize
  books = books.map(b => ({
    book_number: Number(b.book_number || b.code),
    name_en: b.name_en || b.en || b.title_en,
    name_fa: b.name_fa || b.fa || b[`name_${SECOND_LANG_CODE}`] || b.title_fa || b.title_fr || '',
    testament: (b.testament || '').toLowerCase().startsWith('o') ? 'old' : 'new',
    abbreviation: (b.abbreviation || b.abbr || (b.name_en||'').split(' ').map(w=>w[0]).join('').substring(0,10).toUpperCase()),
    chapters_count: Number(b.chapters_count || b.chapters || 0)
  }));
  await upsertInChunks('bible_books', books, 50, 'book_number');
  console.log(`✅ Upserted ${books.length} books (directory mode)`);
  const bookIdMap = await buildBookIdMap();

  let verses = readJSONIfExists(versesFileJSON) || parseCSVIfExists(versesFileCSV);
  if (!verses) {
    console.error('❌ No verses.json or verses.csv found');
    process.exit(1);
  }
  const mapped = [];
  for (const v of verses) {
    const bn = Number(v.book_number || v.book || v.book_num);
    const bid = bookIdMap.get(bn);
    if (!bid) continue;
    mapped.push({
      book_id: bid,
      chapter: Number(v.chapter),
      verse: Number(v.verse),
      text_en: v.text_en || v.en || '',
      text_fa: v.text_fa || v.fa || v.fr || v[SECOND_LANG_CODE] || ''
    });
    if (mapped.length && mapped.length % 1000 === 0) {
      await upsertInChunks('bible_verses', mapped.splice(0), 500, 'book_id,chapter,verse');
      process.stdout.write('.');
    }
  }
  if (mapped.length) {
    await upsertInChunks('bible_verses', mapped, 500, 'book_id,chapter,verse');
  }
  console.log('\n✅ Verses imported (directory mode)');
}

// --- Main Dispatcher ---
async function main() {
  console.log(`🚀 Starting Bible import (mode=${MODE})`);
  try {
    if (MODE === 'directory') {
      await importFromDirectory();
    } else {
      await importFromSQLite();
    }
    console.log('🎉 Import completed successfully');
  } catch (err) {
    console.error('❌ Import failed:', err.message || err);
    process.exitCode = 1;
  }
}

main();