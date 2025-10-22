const { Pool } = require('pg');

const connectionString = "postgresql://postgres:SamyarBB1989@db.wxzhzsqicgwfxffxayhy.supabase.co:5432/postgres";

console.log('🔗 Testing Supabase connection...');
console.log('Connection string (masked):', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000 // 10 seconds
});

async function test() {
  try {
    console.log('\n⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('\n📊 PostgreSQL Version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection failed!');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.message.includes('password')) {
      console.error('\n🔑 PASSWORD ERROR - رمز عبور اشتباه است!');
      console.error('لطفاً از Supabase Dashboard رمز عبور درست را بگیرید:');
      console.error('1. به https://supabase.com/dashboard بروید');
      console.error('2. Project Settings → Database');
      console.error('3. در بخش Connection String رمز عبور را کپی کنید');
    } else if (err.message.includes('timeout')) {
      console.error('\n⏱️ TIMEOUT ERROR - اتصال قطع شد');
    } else if (err.message.includes('no pg_hba.conf')) {
      console.error('\n🚫 ACCESS DENIED - دسترسی رد شد');
    }
    
    await pool.end();
    process.exit(1);
  }
}

test();
