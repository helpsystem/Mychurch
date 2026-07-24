// One-time script to fix telegram_id for help.system@ymail.com
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xjliwbfdzmxncyebblxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY1MTIyNywiZXhwIjoyMDg4MjI3MjI3fQ.M0clJXVWiqEQO1C5ttrqo1jl7nh8gri6nQ-qYhmk6Jo'
);

async function fixTelegramId() {
  console.log('🔍 Fetching current user record...');
  
  const { data: before, error: fetchErr } = await supabase
    .from('users')
    .select('email, telegram_id, phone, whatsapp_number')
    .ilike('email', 'help.system@ymail.com')
    .maybeSingle();

  if (fetchErr) {
    console.error('❌ Fetch error:', fetchErr.message);
    return;
  }

  console.log('📋 Current record:', JSON.stringify(before, null, 2));
  console.log('📝 Current telegram_id:', before?.telegram_id, '(type:', typeof before?.telegram_id, ')');

  // Update telegram_id to the correct numeric Chat ID
  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({ telegram_id: '6884751491' })
    .ilike('email', 'help.system@ymail.com')
    .select('email, telegram_id');

  if (updateErr) {
    console.error('❌ Update error:', updateErr.message);
    return;
  }

  console.log('✅ Updated successfully:', JSON.stringify(updated, null, 2));
}

fixTelegramId().catch(console.error);
