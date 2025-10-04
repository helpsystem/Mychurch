require('dotenv').config();
const { pool } = require('../../backend/db-postgres');
(async function(){
  try{
    const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`);
    console.log('Public tables:');
    res.rows.forEach(r=>console.log('-', r.table_name));
    await pool.end();
  }catch(e){
    console.error('Failed to list tables:', e.message || e);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
