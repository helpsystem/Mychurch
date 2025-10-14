const { pool } = require('./db-postgres');

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bible_verses' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 ساختار جدول bible_verses:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // بررسی constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid 
      WHERE t.relname = 'bible_verses'
    `);
    
    console.log('\n🔗 Constraints:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.conname}: ${row.definition}`);
    });
    
  } finally {
    client.release();
    process.exit(0);
  }
})();