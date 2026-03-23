const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function count() {
    const { count, error } = await supabase.from('church_worship_songs').select('*', { count: 'exact', head: true });
    if (error) console.error("❌ Error:", error.message);
    else console.log(`📊 Total rows in church_worship_songs: ${count}`);
}

count();
