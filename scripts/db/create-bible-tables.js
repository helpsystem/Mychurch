// Re-implemented to use direct PostgreSQL connection (compatible with Supabase connection string)
// because previous version attempted to use a non-existent _sql table via supabase-js client.
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is required to create Bible tables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const statements = [
  `CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    book_number INTEGER UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(10) UNIQUE NOT NULL,
    testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
    chapters_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE INDEX IF NOT EXISTS idx_bible_books_abbreviation ON bible_books(abbreviation);`,
  `CREATE TABLE IF NOT EXISTS bible_chapters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES bible_books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    verses_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_number)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_bible_chapters_book ON bible_chapters(book_id);`,
  `CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES bible_chapters(id) ON DELETE CASCADE,
    verse_number INTEGER NOT NULL,
    text_en TEXT,
    text_fa TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, verse_number)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter_id);`,
  // Full-text index (English config) combining both languages
  `DO $$ BEGIN
     CREATE INDEX IF NOT EXISTS idx_bible_verses_text ON bible_verses USING GIN (to_tsvector('english', coalesce(text_en,'') || ' ' || coalesce(text_fa,'')));
   EXCEPTION WHEN OTHERS THEN
     RAISE NOTICE 'Skipping text index creation (maybe not supported): %', SQLERRM;
   END $$;`
];

async function createBibleTables() {
  const client = await pool.connect();
  try {
    console.log('🔄 Creating Bible tables (PostgreSQL)...');
    await client.query('BEGIN');
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query('COMMIT');
    console.log('✅ Bible tables and indexes created');
  } catch (error) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('❌ Error creating Bible tables:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(()=>{});
  }
}

createBibleTables();