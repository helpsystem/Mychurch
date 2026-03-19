const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'worship_songs';");
        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'church_worship_songs';");
        
        fs.writeFileSync('schema.json', JSON.stringify({
            worship_songs: res1.rows.map(r => r.column_name),
            church_worship_songs: res2.rows.map(r => r.column_name)
        }, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
