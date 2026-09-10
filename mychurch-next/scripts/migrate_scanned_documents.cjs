const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const pgClient = new Client({
    connectionString: "postgresql://postgres:OExGvmxE8SsoIUGH@db.xjliwbfdzmxncyebblxw.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await pgClient.connect();

    console.log("Creating scanned_documents table and indexes...");
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS scanned_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'archive',
        security_level VARCHAR(50) NOT NULL DEFAULT 'confidential',
        file_url TEXT NOT NULL,
        file_name VARCHAR(255),
        file_size BIGINT,
        mime_type VARCHAR(100),
        scanner_source VARCHAR(50) DEFAULT 'file_upload',
        ocr_text TEXT,
        ocr_summary TEXT,
        ocr_metadata JSONB DEFAULT '{}'::jsonb,
        ocr_status VARCHAR(50) DEFAULT 'none',
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        uploaded_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ,
        deleted_by VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_scanned_docs_category ON scanned_documents(category);
      CREATE INDEX IF NOT EXISTS idx_scanned_docs_security ON scanned_documents(security_level);
      CREATE INDEX IF NOT EXISTS idx_scanned_docs_created_at ON scanned_documents(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_scanned_docs_is_deleted ON scanned_documents(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_scanned_docs_ocr_status ON scanned_documents(ocr_status);
    `);

    // Also add ocr and file columns to document_history if not present
    await pgClient.query(`
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS ocr_text TEXT;
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS ocr_metadata JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS file_url TEXT;
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS scanner_source VARCHAR(50);
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS security_level VARCHAR(50) DEFAULT 'confidential';
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
      ALTER TABLE document_history ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);
    `);

    console.log("✅ Tables and columns created successfully!");
    await pgClient.end();
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

run();
