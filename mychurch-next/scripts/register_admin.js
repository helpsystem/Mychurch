require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerAdmin() {
    console.log("⚠️ WARNING: This script is deprecated. Use setup-admin.js instead.");
    console.log("Registering admin user...");
    const email = "help.system@ymail.com";
    
    // 🔒 Generate secure random password instead of hardcoding
    const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: randomPassword,
    });

    if (error) {
        console.error("Sign up error:", error.message);
    } else {
        console.log("Successfully created user:", data.user?.email);
        console.log(`🔑 Temporary Password: ${randomPassword}`);
        console.log("⚠️ User should change password on first login.");
    }
}

registerAdmin();
