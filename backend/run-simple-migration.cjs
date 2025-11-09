require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSimpleMigration() {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Reading simple migration file...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'simple_add_columns.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('⏳ Running simple migration...');
    
    const result = await client.query(sql);
    
    console.log('✅ Migration successful!');
    console.log('   - has_timing column added');
    console.log('   - timing_data column added');
    console.log('   - timing_updated_at column added');
    console.log('   - structure column added');
    
    // Show results
    if (result && result.rows) {
      console.log('\n📊 Current status:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSimpleMigration();
