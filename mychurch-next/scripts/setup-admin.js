require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
    console.log("Please ensure you have the service role key to perform administrative actions.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
    const email = "help.system@ymail.com";
    console.log(`🚀 Starting Admin Setup for: ${email}`);

    // 1. Ensure user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Failed to list users:", listError.message);
        return;
    }

    let user = users.find(u => u.email === email);
    
    if (!user) {
        console.log("📝 User not found in Auth. Creating account...");
        // 🔒 Generate a secure random password instead of hardcoding
        const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: { full_name: "System Admin" }
        });
        
        if (createError) {
            console.error("❌ Auth creation error:", createError.message);
            return;
        }
        user = newUser.user;
        console.log("✅ Auth user created successfully.");
        console.log("⚠️  CRITICAL: Please save this temporary password securely:");
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔑 Temporary Password: ${randomPassword}`);
        console.log("   User should change password on first login.\n");
    } else {
        console.log("ℹ️ User already exists in Auth.");
    }

    // 2. Insert/Update public.users table with Admin role
    console.log("🛡️ Granting Admin privileges in database...");
    const { error: dbError } = await supabase
        .from('users')
        .upsert({ 
            email: email, 
            role: 'Admin',
            full_name: 'System Admin',
            updated_at: new Date()
        }, { onConflict: 'email' });

    if (dbError) {
        console.error("❌ DB Update error:", dbError.message);
    } else {
        console.log("✅ ROLE: 'Admin' assigned in users table.");
        console.log("\n✨ SUCCESS: Admin setup complete.");
        console.log("🔐 Password Policy: Admin must change password on first login.");
    }
}

setupAdmin();
