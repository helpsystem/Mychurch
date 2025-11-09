// Check password hash for admin user
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPassword() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password, role')
      .eq('email', 'help.system@ymail.com')
      .single();
    
    if (error) {
      console.log('❌ User not found:', error.message);
      return;
    }
    
    console.log('✅ User found:', data.email, '- Role:', data.role);
    console.log('Password hash exists:', data.password ? 'YES' : 'NO');
    
    if (data.password) {
      console.log('Hash starts with:', data.password.substring(0, 10));
      
      // Test password
      const testPassword = 'Samyar@1989';
      const isValid = await bcrypt.compare(testPassword, data.password);
      console.log(`Password "${testPassword}" is:`, isValid ? '✅ CORRECT' : '❌ WRONG');
      
      if (!isValid) {
        console.log('\n🔧 Creating new hash for:', testPassword);
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash:', newHash);
        
        // Update database (without updated_at trigger)
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: newHash })
          .eq('email', 'help.system@ymail.com')
          .select();
        
        if (updateError) {
          console.log('❌ Failed to update password:', updateError.message);
        } else {
          console.log('✅ Password updated successfully!');
        }
      }
    } else {
      console.log('❌ No password hash in database - creating one...');
      const newHash = await bcrypt.hash('Samyar@1989', 10);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newHash })
        .eq('email', 'help.system@ymail.com')
        .select();
      
      if (updateError) {
        console.log('❌ Failed to set password:', updateError.message);
      } else {
        console.log('✅ Password set successfully!');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPassword();
