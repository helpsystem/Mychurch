require('dotenv').config({path:'backend/.env'});
const { Pool } = require('pg');

async function checkSupabaseTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking Supabase tables...');
    
    // Check for Bible tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_name LIKE 'bible_%' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('📋 Bible tables found:');
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
      
      // Check data in each table
      for (const table of tables.rows) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`📊 ${table.table_name}: ${count.rows[0].count} records`);
      }
    } else {
      console.log('⚠️  No bible tables found in Supabase');
      console.log('📋 All public tables:');
      const allTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' 
        ORDER BY table_name
      `);
      allTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSupabaseTables();