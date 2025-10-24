/**
 * Test Supabase Client Impact on Backend
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase JS client...');
console.log('Environment:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

console.log('\n📦 Creating Supabase client...');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('✅ Client created successfully');
console.log('Type:', typeof supabase);
console.log('Keys:', Object.keys(supabase).slice(0, 5));

console.log('\n🧪 Test complete. Process will exit now.');
setTimeout(() => {
  console.log('⏱️ Timeout complete, exiting...');
  process.exit(0);
}, 2000);
