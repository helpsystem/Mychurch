const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTEyMjcsImV4cCI6MjA4ODIyNzIyN30.XjVW8NwhAuMXHFtJn4g_ojyhnM1Y3N_fMwsym5dxgqo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function introspect() {
    const { data, error } = await supabase.from('users').select('*').limit(1); // Changed to 'users' table
    if (error) {
        console.error("❌ Error fetching from users:", error.message); // Updated error message
        return;
    }
    if (data && data.length > 0) { // Using 'data' and 'data.length' for Supabase client
        console.log("✅ Sample row columns:", Object.keys(data[0]));
        console.log("📄 Sample row data:", data[0]);
    } else {
        console.log("⚠️  Table 'users' is empty or not found."); // Updated table name in message
        
        // Try 'worship_songs' (original fallback, kept for context)
        const { data: data2, error: error2 } = await supabase.from('worship_songs').select('*').limit(1);
        if (!error2 && data2 && data2.length > 0) {
            console.log("✅ Sample row columns (worship_songs):", Object.keys(data2[0]));
        }
    }
}

introspect();
