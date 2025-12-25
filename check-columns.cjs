require('dotenv').config();
const { pool } = require('./backend/db-postgres');

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'church_announcements' 
      ORDER BY ordinal_position
    `);
    console.log('Columns in church_announcements:');
    result.rows.forEach(r => console.log('  -', r.column_name, `(${r.data_type})`));
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkColumns();
