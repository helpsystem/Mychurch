// backend/runMigration.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', 'add_audio_timing_support.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('🔄 Running migration: add_audio_timing_support.sql');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added timing_data column to worship_songs');
    console.log('   - Added timing_updated_at column to worship_songs');
    console.log('   - Created bible_audio_timing table');
    console.log('   - Created indexes for performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
