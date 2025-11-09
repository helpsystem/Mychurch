require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLeaders() {
  try {
    // First, check what columns exist
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leaders'
      ORDER BY ordinal_position
    `);
    console.log('Columns in leaders table:', columnsResult.rows.map(r => r.column_name).join(', '));
    
    const result = await pool.query('SELECT * FROM leaders ORDER BY id');
    
    console.log('\nLeaders:');
    result.rows.forEach(leader => {
      console.log(JSON.stringify(leader, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLeaders();
