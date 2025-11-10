require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLeaders() {
  try {
    const result = await pool.query('SELECT id, name_fa, name_en, imageurl FROM leaders ORDER BY id');
    
    console.log('\n📋 Leaders in database:\n');
    result.rows.forEach(leader => {
      console.log(`✓ ID ${leader.id}: ${leader.name_fa} (${leader.name_en})`);
      console.log(`  imageUrl: ${leader.imageurl || '❌ NULL/MISSING'}\n`);
    });
    
    const missing = result.rows.filter(l => !l.imageurl);
    if (missing.length > 0) {
      console.log(`\n⚠️  Warning: ${missing.length} leader(s) without imageUrl!`);
      console.log('This will cause "Cannot read properties of undefined" error\n');
    } else {
      console.log('\n✅ All leaders have imageUrl!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

checkLeaders();
