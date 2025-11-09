require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('⏳ Reading migration file...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_worship_structure_and_chords.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('⏳ Running migration...');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added structure column (JSONB)');
    console.log('   - Converted chords to JSONB');
    console.log('   - Created performance indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
