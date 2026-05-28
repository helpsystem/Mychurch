const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:OExGvmxE8SsoIUGH@db.xjliwbfdzmxncyebblxw.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS public.intake_requests (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token                 VARCHAR(64) UNIQUE NOT NULL,
  created_by            VARCHAR(255) NOT NULL,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at            TIMESTAMP WITH TIME ZONE,
  status                VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'submitted', 'used', 'expired')),

  template_type         VARCHAR(50) NOT NULL
                        CHECK (template_type IN ('letter', 'receipt', 'invoice')),
  template_name         VARCHAR(255),
  template_letter_id    VARCHAR(50),

  required_fields       JSONB DEFAULT '[]',

  message_to_user       TEXT DEFAULT '',

  submitted_at          TIMESTAMP WITH TIME ZONE,
  submitted_data        JSONB DEFAULT '{}',
  submitter_ip          VARCHAR(50),

  folder_name           VARCHAR(100) DEFAULT 'Inbox',

  used_in_document_id   UUID REFERENCES public.document_history(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_requests_token       ON public.intake_requests(token);
CREATE INDEX IF NOT EXISTS idx_intake_requests_created_by  ON public.intake_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_intake_requests_status      ON public.intake_requests(status);

ALTER TABLE public.intake_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage intake requests" ON public.intake_requests;
CREATE POLICY "Authenticated users manage intake requests"
  ON public.intake_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read intake by token" ON public.intake_requests;
CREATE POLICY "Public can read intake by token"
  ON public.intake_requests
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public can submit intake by token" ON public.intake_requests;
CREATE POLICY "Public can submit intake by token"
  ON public.intake_requests
  FOR UPDATE
  TO anon
  USING (status = 'pending');
`;

async function run() {
    try {
        console.log("Connecting to Supabase Postgres...");
        await client.connect();

        console.log("Executing SQL...");
        await client.query(sql);

        console.log("Verifying table creation...");
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'intake_requests'
        `);
        if (res.rows.length > 0) {
            console.log("✅ intake_requests table successfully verified in database!");
        } else {
            console.error("❌ intake_requests table is not found in database metadata.");
        }
    } catch (e) {
        console.error("❌ Migration failed:", e);
    } finally {
        await client.end();
    }
}

run();
