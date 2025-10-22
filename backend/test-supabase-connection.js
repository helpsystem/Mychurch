/**
 * Test Supabase Connection - Direct
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('\n📊 Supabase Connection Test\n');
console.log('Connection String:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'NOT FOUND');

if (!connectionString) {
  console.error('\n❌ DATABASE_URL not set in environment\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});

(async () => {
  try {
    console.log('\n🔗 Attempting connection...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!\n');
    
    const res = await client.query('SELECT NOW(), version()');
    console.log('🕐 Server Time:', res.rows[0].now);
    console.log('📌 PostgreSQL Version:', res.rows[0].version);
    
    const booksRes = await client.query('SELECT COUNT(*) FROM bible_books');
    console.log('📖 Bible Books Count:', booksRes.rows[0].count);
    
    client.release();
    await pool.end();
    console.log('\n✅ Test complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    await pool.end();
    process.exit(1);
  }
})();
