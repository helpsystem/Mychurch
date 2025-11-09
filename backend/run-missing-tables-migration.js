// Run migration to create missing tables
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('⏳ Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_missing_tables.sql'),
      'utf8'
    );
    
    console.log('⏳ Running migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('  - Created settings table');
    console.log('  - Created files table');
    console.log('  - Inserted default settings');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
