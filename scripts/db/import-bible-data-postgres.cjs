const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// --- Configuration & Environment ---
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  password: 'SamyarBB1989',
  host: 'localhost',
  port: 5433,
  database: 'mychurch',
  ssl: false, // For local development
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Modes: 'sqlite' | 'directory'
const MODE = (process.env.BIBLE_SOURCE_MODE || (process.env.SQLITE_PATH ? 'sqlite' : (process.env.BIBLE_DIR_PATH ? 'directory' : 'sqlite'))).toLowerCase();
const SQLITE_PATH = process.env.SQLITE_PATH || './attached_assets/bible_fa_en_1758111193552.sqlite';
const DIR_PATH = process.env.BIBLE_DIR_PATH; // e.g. C:\\Users\\Sami\\Desktop\\En Fr Bible
const SECOND_LANG_CODE = (process.env.SECOND_LANG_CODE || 'fa').toLowerCase(); // 'fa' or 'fr'...

// Utility to pause (avoid rate limit)
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Generic chunking helper for PostgreSQL
async function upsertInChunks(table, rows, chunkSize, conflictKeys) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    
    if (table === 'bible_books') {
      for (const row of chunk) {
        const query = `
          INSERT INTO bible_books (book_number, name_en, name_fa, testament, abbreviation, chapters_count)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (book_number) DO UPDATE SET
          name_en = EXCLUDED.name_en,
          name_fa = EXCLUDED.name_fa,
          testament = EXCLUDED.testament,
          abbreviation = EXCLUDED.abbreviation,
          chapters_count = EXCLUDED.chapters_count
        `;
        await pool.query(query, [row.book_number, row.name_en, row.name_fa, row.testament, row.abbreviation, row.chapters_count]);
      }
    } else if (table === 'bible_verses') {
      for (const row of chunk) {
        const query = `
          INSERT INTO bible_verses (book_id, chapter, verse, text_en, text_fa)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (book_id, chapter, verse) DO UPDATE SET
          text_en = EXCLUDED.text_en,
          text_fa = EXCLUDED.text_fa
        `;
        await pool.query(query, [row.book_id, row.chapter, row.verse, row.text_en, row.text_fa]);
      }
    }
    
    // Small delay to be kind to the DB
    await delay(50);
  }
}

async function buildBookIdMap() {
  const result = await pool.query('SELECT id, book_number FROM bible_books');
  const map = new Map();
  result.rows.forEach(row => map.set(row.book_number, row.id));
  return map;
}

// Add unique constraints to the tables if they don't exist
async function ensureUniqueConstraints() {
  try {
    // Add unique constraint on book_number if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bible_books_book_number_key') THEN
          ALTER TABLE bible_books ADD CONSTRAINT bible_books_book_number_key UNIQUE (book_number);
        END IF;
      END $$;
    `);
    
    // Add unique constraint on book_id, chapter, verse if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bible_verses_book_chapter_verse_key') THEN
          ALTER TABLE bible_verses ADD CONSTRAINT bible_verses_book_chapter_verse_key UNIQUE (book_id, chapter, verse);
        END IF;
      END $$;
    `);
    
    console.log('✅ Unique constraints ensured');
  } catch (error) {
    console.warn('⚠️ Could not add unique constraints:', error.message);
  }
}

// --- Import from SQLite ---
async function importFromSQLite() {
  console.log(`🔄 Mode: sqlite (file: ${SQLITE_PATH})`);
  const sqlite = sqlite3.verbose();
  const db = new sqlite.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);

  const all = (sql, params = []) => new Promise((res, rej) => {
    db.all(sql, params, (e, rows) => e ? rej(e) : res(rows));
  });

  console.log('📚 Loading books...');
  const bookRows = await all(`SELECT id, code, name_en, name_fa, testament FROM books ORDER BY id`);
  
  const books = bookRows.map(r => ({
    book_number: Number(r.code),
    name_en: r.name_en,
    name_fa: r.name_fa,
    testament: (r.testament || '').toUpperCase() === 'OT' ? 'old' : 'new',
    abbreviation: (r.name_en || '').substring(0, 10).replace(/\s+/g, '').toUpperCase() || String(r.code),
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
        process.stdout.write('.');
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
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.filter(l => l.trim()).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i]);
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
    abbreviation: (b.abbreviation || b.abbr || (b.name_en || '').split(' ').map(w => w[0]).join('').substring(0, 10).toUpperCase()),
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
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection OK');
    
    // Ensure unique constraints exist
    await ensureUniqueConstraints();
    
    if (MODE === 'directory') {
      await importFromDirectory();
    } else {
      await importFromSQLite();
    }
    console.log('🎉 Import completed successfully');
  } catch (err) {
    console.error('❌ Import failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();