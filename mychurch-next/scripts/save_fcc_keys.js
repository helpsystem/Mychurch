import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = `
    UPDATE church_conference_settings
    SET 
        enabled = true,
        fcc_public_key = '008712fb6639bd7b',
        fcc_private_key = '28b048ac3af3684291de1791ec4336648748718efbe277a1',
        dial_in_number = '+1 (123) 456-7890', -- Placeholder, they can change it later
        access_code = '123456#', -- Placeholder
        updated_at = NOW()
    WHERE id = 'default';
    
    INSERT INTO church_conference_settings (id, enabled, fcc_public_key, fcc_private_key)
    SELECT 'default', true, '008712fb6639bd7b', '28b048ac3af3684291de1791ec4336648748718efbe277a1'
    WHERE NOT EXISTS (SELECT 1 FROM church_conference_settings WHERE id = 'default');
`;

async function run() {
    try {
        console.log("Saving FCC keys...");
        await pool.query(sql);
        console.log("Successfully saved FCC keys.");
        process.exit(0);
    } catch (e) {
        console.error("Failed to save keys:", e);
        process.exit(1);
    }
}

run();
