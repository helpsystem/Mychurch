const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('users').upsert({ 
        email: 'help.system@ymail.com', 
        role: 'Admin',
        name: 'System Help'
    }, { onConflict: 'email' });
    console.log("Upsert result:", { data, error });
}

run();
