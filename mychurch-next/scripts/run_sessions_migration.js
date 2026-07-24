require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL not found in .env.local");
        process.exit(1);
    }
    
    console.log("Connecting to Database:", dbUrl.split('@')[1] || "Local?");
    
    const client = new Client({
        connectionString: dbUrl
    });

    try {
        await client.connect();
        const sql = fs.readFileSync('./supabase/church_sessions_migration.sql', 'utf8');
        await client.query(sql);
        console.log("Church sessions migration executed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

run();
