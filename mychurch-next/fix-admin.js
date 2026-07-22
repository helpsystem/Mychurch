const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY1MTIyNywiZXhwIjoyMDg4MjI3MjI3fQ.M0clJXVWiqEQO1C5ttrqo1jl7nh8gri6nQ-qYhmk6Jo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
    console.log("Fetching users from database...");
    const { data: users, error } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
    
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    
    console.log("Recent users found:", users.map(u => ({ email: u.email, role: u.role })));
    
    // Find the user to upgrade (either help.system or the most recent one if no help.system)
    let targetUser = users.find(u => u.email.includes('help.system')) || users[0];
    
    if (targetUser) {
        console.log(`\nUpgrading ${targetUser.email} to Admin...`);
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'Admin' })
            .eq('id', targetUser.id);
            
        if (updateError) {
            console.error("Update failed:", updateError);
        } else {
            console.log("✅ Successfully upgraded user to Admin!");
        }
    } else {
        console.log("No users found in database to upgrade.");
    }
}

fixUser();
