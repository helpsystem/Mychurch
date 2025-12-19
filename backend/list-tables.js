// List all tables
require('dotenv').config();
const { Pool } = require('pg');

// Use DATABASE_URL_DISABLED which might have the actual connection string
const connectionString = process.env.DATABASE_URL_DISABLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No DATABASE_URL found in .env');
  process.exit(1);
}

console.log('🔗 Connecting to:', connectionString.replace(/:([^:@]+)@/, ':***@'));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function listTables() {
  console.log('📋 Listing all tables in database...\n');

  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const bibleTables = result.rows.filter(r => r.table_name.includes('bible') || r.table_name.includes('verse'));
    const allTables = result.rows.map(r => r.table_name);

    console.log('Bible-related tables:');
    bibleTables.forEach(t => console.log('  - ' + t.table_name));

    console.log('\nAll tables (' + allTables.length + ' total):');
    allTables.forEach(t => console.log('  - ' + t));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listTables();
