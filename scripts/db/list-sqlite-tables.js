import sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
dotenv.config();

const SQLITE_PATH = './attached_assets/bible_fa_en_1758111193552.sqlite';
const { verbose } = sqlite3;

(async function listTables() {
  const db = new (verbose()).Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err.message || err);
      process.exit(1);
    }
  });

  db.all("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;", (err, rows) => {
    if (err) {
      console.error('❌ Failed to read sqlite_master:', err);
      db.close();
      process.exit(1);
    }
    console.log('🔎 SQLite schema objects:');
    (async () => {
      for (const r of rows) {
        console.log(`\n- ${r.type}: ${r.name}`);
        console.log('  SQL:', (r.sql || '').split('\n').map(s=>s.trim()).join(' '));

        // Print table columns
        try {
          await new Promise((res, rej) => {
            db.all(`PRAGMA table_info(${r.name});`, (err2, cols) => {
              if (err2) return rej(err2);
              console.log('  Columns:');
              cols.forEach(c => console.log(`    - ${c.name} (${c.type})${c.notnull ? ' NOT NULL' : ''}${c.pk ? ' PRIMARY KEY' : ''}`));
              res();
            });
          });
        } catch (e) {
          console.warn('  Could not read PRAGMA table_info:', e.message || e);
        }

        // Print sample rows
        try {
          await new Promise((res, rej) => {
            db.all(`SELECT * FROM ${r.name} LIMIT 5;`, (err3, sample) => {
              if (err3) return rej(err3);
              if (!sample || sample.length === 0) {
                console.log('  (no rows)');
                return res();
              }
              console.log('  Sample rows:');
              sample.forEach(row => console.log('   ', JSON.stringify(row)));
              res();
            });
          });
        } catch (e) {
          console.warn('  Could not read sample rows:', e.message || e);
        }
      }
      db.close();
      process.exit(0);
    })().catch(err => {
      console.error('Error inspecting tables:', err);
      db.close();
      process.exit(1);
    });
  });
})();
