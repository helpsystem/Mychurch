const { Pool } = require('pg');
require('dotenv').config({ path: '../mychurch-next/.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/mychurch' });
async function run() {
  try {
    const { rows } = await pool.query("SELECT id, title_fa, lyrics_fa, audio_url FROM church_worship_songs WHERE title_fa LIKE $1", ['%آرامی%']);
    console.log(JSON.stringify(rows, null, 2));
  } catch(e) { console.error(e); }
  pool.end();
}
run();
