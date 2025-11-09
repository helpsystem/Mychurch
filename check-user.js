// Check if admin user exists in database
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'exists' : 'missing');
  console.error('SUPABASE_KEY:', SUPABASE_KEY ? 'exists' : 'missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUser() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('email', 'help.system@ymail.com')
      .single();
    
    if (error) {
      console.log('❌ User not found:', error.message);
      return;
    }
    
    console.log('✅ User exists:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUser();
