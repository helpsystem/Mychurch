const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    // We can't list tables directly via Supabase JS select, but we can query information_schema if we had direct SQL
    // Or we can try common names.
    // Instead, I'll use the 'rpc' if they have a list_tables function, but likely not.
    // I'll try to select from information_schema.tables but that might be blocked by RLS.
    
    const tablesToTry = ['worship_songs', 'church_worship_songs', 'users', 'sync_jobs'];
    
    for (const table of tablesToTry) {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}': ${error.message}`);
        } else {
            console.log(`✅ Table '${table}': ${count} rows`);
        }
    }
}

listTables();
