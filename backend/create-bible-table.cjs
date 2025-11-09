require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createBibleTable() {
  try {
    console.log('⏳ Reading migration...');
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_bible_timing_table.sql'), 'utf-8');
    
    console.log('⏳ Creating bible_audio_timing table...');
    await pool.query(sql);
    
    console.log('✅ Bible timing table created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createBibleTable();
