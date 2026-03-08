// Run this script to create DEJ invoice tables in Supabase
// Usage: node scripts/run-dej-migration.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTEyMjcsImV4cCI6MjA4ODIyNzIyN30.XjVW8NwhAuMXHFtJn4g_ojyhnM1Y3N_fMwsym5dxgqo';

// Since anon key can't run DDL, we'll use the REST SQL endpoint with the service role
// But if service role is not available, we'll create the table via rpc workaround
// ALTERNATIVE: Use the Supabase Dashboard SQL Editor manually

// The SQL to run:
const SQL = `
-- Create DEJ invoice items sequence for auto-numbering
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS dej_invoice_seq START 1;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create the main invoices table if not exists
CREATE TABLE IF NOT EXISTS dej_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  to_company TEXT NOT NULL DEFAULT 'DEJ TV',
  freelancer_name TEXT NOT NULL,
  freelancer_address TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  wallet_tether TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_dej_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dej_invoices_updated_at ON dej_invoices;
CREATE TRIGGER dej_invoices_updated_at
BEFORE UPDATE ON dej_invoices
FOR EACH ROW EXECUTE FUNCTION update_dej_invoices_updated_at();

-- Invoice number generator function
CREATE OR REPLACE FUNCTION next_dej_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DEJ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('dej_invoice_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE dej_invoices ENABLE ROW LEVEL SECURITY;

-- Allow all access (app-level auth handles security)
DO $$ BEGIN
  CREATE POLICY "Allow all access to dej_invoices" ON dej_invoices FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
