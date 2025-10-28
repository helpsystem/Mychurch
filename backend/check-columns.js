const { pool } = require('./db-postgres');

async function checkColumns() {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'worship_songs'
    ORDER BY ordinal_position
  `);
  
  console.log('\n📋 Columns in worship_songs table:\n');
  result.rows.forEach(row => {
    console.log(`   - ${row.column_name} (${row.data_type})`);
  });
  console.log('');
  
  await pool.end();
}

checkColumns();
