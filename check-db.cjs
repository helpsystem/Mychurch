const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Check current columns
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'worship_songs'
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns in worship_songs:');
    result.rows.forEach(r => console.log('  -', r.column_name));
    
    // Check if notes, description, attachments exist
    const cols = result.rows.map(r => r.column_name);
    console.log('\n--- Status ---');
    console.log('notes:', cols.includes('notes') ? '✅ exists' : '❌ missing');
    console.log('description:', cols.includes('description') ? '✅ exists' : '❌ missing');
    console.log('attachments:', cols.includes('attachments') ? '✅ exists' : '❌ missing');
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
