#!/usr/bin/env node
require('dotenv').config();
const { pool } = require('../../backend/db-postgres');

(async function(){
  const statements = [
    `ALTER TABLE IF EXISTS bible_books ADD COLUMN IF NOT EXISTS source_id INTEGER;`,
    `CREATE INDEX IF NOT EXISTS idx_bible_books_source_id ON bible_books(source_id);`,
    `ALTER TABLE IF EXISTS bible_chapters ADD COLUMN IF NOT EXISTS source_id INTEGER;`,
    `CREATE INDEX IF NOT EXISTS idx_bible_chapters_source_id ON bible_chapters(source_id);`,
    `ALTER TABLE IF EXISTS bible_verses ADD COLUMN IF NOT EXISTS source_id INTEGER;`,
    `CREATE INDEX IF NOT EXISTS idx_bible_verses_source_id ON bible_verses(source_id);`
  ];

  try {
    console.log('Applying ALTER TABLE to add source_id columns...');
    for (const s of statements) {
      console.log('Running:', s.replace(/\s+/g,' ').trim().slice(0,80));
      await pool.query(s);
    }
    console.log('ALTER TABLE applied successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply ALTER TABLE:', err.message || err);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
