// Run this script to create DEJ invoice tables in Supabase
// Usage: node scripts/run-dej-migration.mjs
// Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 🔒 Load from environment instead of hardcoding tokens
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   Please configure these environment variables before running this migration.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test connection by trying a simple select first
const { error: testError } = await supabase.from('dej_invoices').select('id').limit(0);

if (testError && testError.code === '42P01') {
    console.log('Table does not exist. Please run the migration manually in Supabase SQL Editor.');
    console.log('SQL file is ready at: supabase/dej_invoices_migration.sql');
} else if (testError) {
    console.log('Connection test error:', testError.message);
} else {
    console.log('✅ Table dej_invoices already exists and is accessible!');
}

console.log('\n---');
console.log('If you need to create the table, go to:');
console.log('https://supabase.com/dashboard/project/xjliwbfdzmxncyebblxw/sql/new');
console.log('And paste the contents of: supabase/dej_invoices_migration.sql');
