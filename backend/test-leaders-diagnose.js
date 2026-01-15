
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Reconstruct client directly to verify connectivity and errors
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("❌ SUPABASE_URL missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("🚀 Diagnostics Starting...");
    console.log("URL:", supabaseUrl);

    // 1. Connectivity Check
    console.log("\n1. Connectivity (Users table info)...");
    const test = await supabase.from('leaders').select('*').limit(1);
    if (test.error) {
        console.error("❌ FAILED:", JSON.stringify(test.error, null, 2));
    } else {
        console.log("✅ Success:", test.data);
    }

    // 2. Sorting Check
    console.log("\n2. Sorting Check (created_at)...");
    const sortTest = await supabase.from('leaders').select('*').order('created_at', { ascending: false }).limit(1);
    if (sortTest.error) {
        console.error("❌ FAILED:", JSON.stringify(sortTest.error, null, 2));
    } else {
        console.log("✅ Success:", sortTest.data);
    }
}

test();
