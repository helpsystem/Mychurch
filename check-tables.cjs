require('dotenv').config();
const { pool } = require('./backend/db-postgres');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables in database:');
    result.rows.forEach(r => console.log('  -', r.table_name));
    
    // Check church_announcements specifically
    const announcements = await pool.query('SELECT COUNT(*) FROM church_announcements');
    console.log('\nChurch announcements count:', announcements.rows[0].count);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkTables();
