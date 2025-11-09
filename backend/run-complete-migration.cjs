require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runCompleteMigration() {
  try {
    console.log('⏳ Reading complete migration file...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'complete_audio_sync_schema.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('⏳ Running complete migration...');
    
    const result = await pool.query(sql);
    
    console.log('✅ Complete migration successful!');
    console.log('\n📊 Database updated with:');
    console.log('   - timing_data (JSONB)');
    console.log('   - timing_updated_at (TIMESTAMP)');
    console.log('   - has_timing (BOOLEAN)');
    console.log('   - structure (JSONB)');
    console.log('   - chords (JSONB)');
    console.log('   - bible_audio_timing table');
    console.log('   - Performance indexes');
    
    // Show verification results
    if (result && result.length > 1) {
      const lastResult = result[result.length - 1];
      if (lastResult.rows && lastResult.rows.length > 0) {
        console.log('\n📈 Current status:');
        lastResult.rows.forEach(row => {
          console.log(`   ${row.table_name}:`, row);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

runCompleteMigration();
