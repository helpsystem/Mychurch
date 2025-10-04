require('dotenv').config();
const { Pool } = require('pg');

(async function(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query(`SELECT column_name, table_name FROM information_schema.columns WHERE column_name LIKE '%source_id%';`);
    console.log('Found columns:', res.rows);
    await pool.end();
  } catch (err) {
    console.error('Query failed:', err.message || err);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
