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
    ssl: { rejectUnauthorized: false } // Required for Supabase external connections
});

async function runMigration() {
    try {
        await client.connect();
        console.log("Connected to Supabase Postgres.");

        const query = `
            CREATE TABLE IF NOT EXISTS presentations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                session_date DATE DEFAULT CURRENT_DATE,
                slides JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
            );

            ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
            
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policy WHERE polname = 'Enable read access for all users' AND polrelid = 'presentations'::regclass
                ) THEN
                    CREATE POLICY "Enable read access for all users" ON presentations FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_policy WHERE polname = 'Enable all access for authenticated users' AND polrelid = 'presentations'::regclass
                ) THEN
                    CREATE POLICY "Enable all access for authenticated users" ON presentations FOR ALL USING (true);
                END IF;
            END
            $$;
        `;

        await client.query(query);
        console.log("Migration executed successfully. The 'presentations' table is ready.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
