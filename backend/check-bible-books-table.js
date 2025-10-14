const { pool } = require('./db-postgres');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking bible_books table structure...');
    
    // Check if table exists and its columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bible_books' 
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ bible_books table does not exist!');
    } else {
      console.log('✅ bible_books table columns:');
      result.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    // Also check if there are any rows in the table
    const countResult = await pool.query('SELECT COUNT(*) FROM bible_books;');
    console.log(`📊 Total rows in bible_books: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkTableStructure();