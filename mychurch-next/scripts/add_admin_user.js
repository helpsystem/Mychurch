require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminToUsersTable() {
    console.log("Inserting admin user into users table...");

    const { data, error } = await supabase
        .from('users')
        .upsert([
            { name: 'Saman Abyar', email: 'help.system@ymail.com', role: 'Admin' }
        ], { onConflict: 'email' });

    if (error) {
        console.error("Error inserting user:", error.message, error.details);
    } else {
        console.log("Successfully added admin user to users table!");
    }
}

addAdminToUsersTable();
