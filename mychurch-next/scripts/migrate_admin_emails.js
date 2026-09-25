const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Connecting to PostgreSQL database...');
    const sql = `
      CREATE TABLE IF NOT EXISTS admin_emails (
        id SERIAL PRIMARY KEY,
        direction VARCHAR(20) NOT NULL DEFAULT 'inbound', -- 'inbound' | 'outbound'
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255),
        to_email TEXT NOT NULL,
        reply_to VARCHAR(255),
        subject TEXT NOT NULL,
        body_text TEXT,
        body_html TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied' | 'sent' | 'spam' | 'archived'
        is_spam BOOLEAN NOT NULL DEFAULT FALSE,
        spam_score NUMERIC(5,2) DEFAULT 0,
        spam_reasons JSONB DEFAULT '[]'::jsonb,
        is_bot_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        bot_reason TEXT,
        resend_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_emails_direction ON admin_emails(direction);
      CREATE INDEX IF NOT EXISTS idx_admin_emails_status ON admin_emails(status);
      CREATE INDEX IF NOT EXISTS idx_admin_emails_created_at ON admin_emails(created_at DESC);
    `;

    await pool.query(sql);
    console.log('✅ Table admin_emails and indexes created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
