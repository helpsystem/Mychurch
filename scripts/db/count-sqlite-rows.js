import sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
dotenv.config();

const SQLITE_PATH = './attached_assets/bible_fa_en_1758111193552.sqlite';
const { verbose } = sqlite3;

const db = new (verbose()).Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message || err);
    process.exit(1);
  }
});

async function count(table) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as c FROM ${table};`, (err, row) => {
      if (err) return reject(err);
      resolve(row.c);
    });
  });
}

(async function(){
  try{
    const books = await count('books');
    const chapters = await count('chapters');
    const verses = await count('verses');
    console.log(`counts: books=${books}, chapters=${chapters}, verses=${verses}`);
    db.close();
    process.exit(0);
  }catch(e){
    console.error('Failed to count:', e.message || e);
    db.close();
    process.exit(1);
  }
})();
