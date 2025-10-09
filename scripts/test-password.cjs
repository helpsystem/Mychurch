require('dotenv').config({path:'backend/.env'});
const { Pool } = require('pg');

async function testWithCustomPassword() {
  console.log('🔍 Testing Supabase with custom password...');
  console.log('Please provide the correct database password from Supabase dashboard:');
  console.log('Go to: https://supabase.com/dashboard/project/wxzhzsqicgwfxffxayhy/settings/database');
  
  // Test with common passwords or patterns
  const passwords = [
    'Samyar1368',
    'Samyar@@1368', 
    'Samyar%40%401368',
    // Add your actual Supabase password here when you get it
  ];
  
  for (const password of passwords) {
    console.log(`\n📡 Testing with password format: ${password.replace(/./g, '*')}...`);
    
    const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.wxzhzsqicgwfxffxayhy.supabase.co:5432/postgres`;
    
    try {
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      
      console.log('✅ Connection successful!');
      console.log('Working password format:', password);
      console.log('Current time:', result.rows[0].current_time);
      
      client.release();
      await pool.end();
      return connectionString;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Go to Supabase Dashboard > Settings > Database');
  console.log('2. Copy the connection string or reset the database password');
  console.log('3. Update the DATABASE_URL in backend/.env file');
  
  return null;
}

testWithCustomPassword();