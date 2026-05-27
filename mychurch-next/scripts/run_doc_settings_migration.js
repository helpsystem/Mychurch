const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:OExGvmxE8SsoIUGH@db.xjliwbfdzmxncyebblxw.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS church_document_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE church_document_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read (needed for document rendering)
DO $$ BEGIN
  CREATE POLICY "Allow authenticated read" ON church_document_settings
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow admin/leader to write
DO $$ BEGIN
  CREATE POLICY "Allow service role write" ON church_document_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert default row if not exists
INSERT INTO church_document_settings (id, settings)
SELECT 'default', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM church_document_settings WHERE id = 'default');

SELECT id, updated_at FROM church_document_settings;
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');
    const res = await client.query(sql);
    console.log('✅ church_document_settings table ready');
    const rows = res[res.length - 1]?.rows || [];
    console.log('   Row:', JSON.stringify(rows));
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  } finally {
    await client.end();
  }
}

run();
