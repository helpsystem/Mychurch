require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerAdmin() {
    console.log("Registering admin user...");
    const email = "help.system@ymail.com";
    const password = "adminpassword123";

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Sign up error:", error.message);
    } else {
        console.log("Successfully created user:", data.user?.email);
        console.log(`You can now log in with Email: ${email} and Password: ${password}`);
    }
}

registerAdmin();
