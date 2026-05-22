import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS church_conference_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    enabled BOOLEAN DEFAULT true,
    fcc_public_key VARCHAR(255),
    fcc_private_key VARCHAR(255),
    dial_in_number VARCHAR(100),
    access_code VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS church_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
    fcc_join_url TEXT,
    fcc_dial_in VARCHAR(100),
    fcc_access_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS church_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
`;

async function run() {
    try {
        console.log("Creating new FCC tables...");
        await pool.query(sql);
        console.log("Successfully created FCC tables.");
        process.exit(0);
    } catch (e) {
        console.error("Failed to create tables:", e);
        process.exit(1);
    }
}

run();
