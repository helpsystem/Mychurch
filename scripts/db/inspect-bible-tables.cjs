require('dotenv').config();
const { pool } = require('../../backend/db-postgres');
(async function(){
  try{
    const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('bible','bible_books','bible_verses') ORDER BY table_name, ordinal_position;");
    console.log('Columns:');
    res.rows.forEach(r => console.log('-', r.table_name, r.column_name, r.data_type));
    await pool.end();
  }catch(e){
    console.error('Failed to inspect:', e.message || e);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
