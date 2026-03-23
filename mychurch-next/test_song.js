const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const { rows } = await pool.query("SELECT id, title_fa, substring(lyrics_fa from 1 for 50) as lyrics, audio_url FROM church_worship_songs WHERE title_fa LIKE $1", ['%آرامی%']);
    const fs = require('fs');
    fs.writeFileSync('song_debug.json', JSON.stringify(rows, null, 2));
    console.log("Saved to song_debug.json");
  } catch(e) { console.error(e); }
  pool.end();
}
run();
