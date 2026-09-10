import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("No DATABASE_URL found in .env.local!");
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log("Connected to Supabase PostgreSQL.");

        // 1. Create audit_logs table
        console.log("Creating audit_logs table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255),
                user_email VARCHAR(255),
                user_name VARCHAR(255),
                user_role VARCHAR(50),
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(100) NOT NULL,
                resource_id VARCHAR(255),
                details JSONB DEFAULT '{}'::jsonb,
                ip_address VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
        `);
        console.log("✓ audit_logs table ready.");

        // 2. Add Soft Delete columns to media_library
        console.log("Adding soft delete columns to media_library...");
        await client.query(`
            ALTER TABLE media_library ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
            ALTER TABLE media_library ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE media_library ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);
            ALTER TABLE media_library ADD COLUMN IF NOT EXISTS delete_approved BOOLEAN DEFAULT false;
            CREATE INDEX IF NOT EXISTS idx_media_library_is_deleted ON media_library(is_deleted);
        `);
        console.log("✓ media_library columns ready.");

        // 3. Add Soft Delete columns to presentations
        console.log("Adding soft delete columns to presentations...");
        await client.query(`
            ALTER TABLE presentations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
            ALTER TABLE presentations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE presentations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);
            CREATE INDEX IF NOT EXISTS idx_presentations_is_deleted ON presentations(is_deleted);
        `);
        console.log("✓ presentations columns ready.");

        // 4. Add Soft Delete columns to prayer_requests
        console.log("Adding soft delete columns to prayer_requests...");
        await client.query(`
            ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
            ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);
            CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_deleted ON prayer_requests(is_deleted);
        `);
        console.log("✓ prayer_requests columns ready.");

        // 5. Insert initial system audit log
        await client.query(`
            INSERT INTO audit_logs (user_name, user_email, user_role, action, resource_type, resource_id, details)
            VALUES (
                'System Migration', 
                'system@iranianchurchdc.com', 
                'Admin', 
                'MIGRATION_AUDIT_SYSTEM_INIT', 
                'system', 
                'database', 
                '{"version": "2026.1", "description": "Audit logging and soft delete system initialized"}'::jsonb
            );
        `);
        console.log("✓ Initial system log inserted.");

        console.log("MIGRATION COMPLETED SUCCESSFULLY!");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
