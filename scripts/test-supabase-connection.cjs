require('dotenv').config({path:'backend/.env'});
const { Pool } = require('pg');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Different connection formats to try
  const connectionStrings = [
    // Direct connection
    'postgresql://postgres:Samyar%40%401368@db.wxzhzsqicgwfxffxayhy.supabase.co:5432/postgres',
    // Pooled connection  
    'postgresql://postgres.wxzhzsqicgwfxffxayhy:Samyar%40%401368@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    // With encoded password
    'postgresql://postgres:Samyar@@1368@db.wxzhzsqicgwfxffxayhy.supabase.co:5432/postgres'
  ];
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const connectionString = connectionStrings[i];
    console.log(`\n📡 Testing connection ${i + 1}...`);
    
    try {
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      
      console.log('✅ Connection successful!');
      console.log('Current time:', result.rows[0].current_time);
      
      client.release();
      await pool.end();
      
      // If successful, update .env file
      console.log('\n🎉 Found working connection! Updating .env file...');
      return connectionString;
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
    }
  }
  
  console.log('\n⚠️  All connection attempts failed.');
  console.log('Please check:');
  console.log('1. Your Supabase project is active');
  console.log('2. Database password is correct');
  console.log('3. Your IP is allowed in Supabase settings');
  
  return null;
}

testSupabaseConnection();