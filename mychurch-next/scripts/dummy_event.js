import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            INSERT INTO church_events 
            (title, start_time, duration_minutes, fcc_join_url, fcc_dial_in, fcc_access_code, status, notified) 
            VALUES 
            ('جلسه آموزش کلام', NOW() + INTERVAL '2 hours', 60, 'https://join.freeconferencecall.com/test', '123456789', '0000', 'scheduled', false)
        `);
        console.log('Dummy event created!');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
