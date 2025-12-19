// Check verses table structure
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkVersesTable() {
  console.log('🔍 Checking verses tables...\n');

  try {
    // Check verses_qadim structure
    console.log('📖 verses_qadim (Persian - TPV/Qadim):');
    const qadimResult = await pool.query(`
      SELECT * FROM verses_qadim 
      WHERE book_code = 'GEN' AND chapter = 1 
      LIMIT 2
    `);
    
    if (qadimResult.rows.length > 0) {
      console.log('  Columns:', Object.keys(qadimResult.rows[0]).join(', '));
      console.log('  Sample verse:', JSON.stringify(qadimResult.rows[0], null, 2));
    } else {
      console.log('  No data found');
    }

    // Check verses_eng structure
    console.log('\n📖 verses_eng (English):');
    const engResult = await pool.query(`
      SELECT * FROM verses_eng 
      WHERE book_code = 'GEN' AND chapter = 1 
      LIMIT 2
    `);
    
    if (engResult.rows.length > 0) {
      console.log('  Columns:', Object.keys(engResult.rows[0]).join(', '));
      console.log('  Sample verse:', JSON.stringify(engResult.rows[0], null, 2));
    } else {
      console.log('  No data found');
    }

    // Count total verses
    const countResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM verses_qadim) as qadim_count,
        (SELECT COUNT(*) FROM verses_eng) as eng_count
    `);
    console.log('\n📊 Total verses:');
    console.log(`  Persian (qadim): ${countResult.rows[0].qadim_count}`);
    console.log(`  English: ${countResult.rows[0].eng_count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVersesTable();
