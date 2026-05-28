const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: "postgresql://postgres:OExGvmxE8SsoIUGH@db.xjliwbfdzmxncyebblxw.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Connecting to Supabase Postgres...");
        await client.connect();

        console.log("Reading setup SQL from document_history_migration.sql...");
        const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'document_history_migration.sql'), 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);

        console.log("Verifying tables creation...");
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('document_history', 'document_audit_log')
        `);
        console.log("Verified tables in database:", res.rows.map(r => r.table_name));

        if (res.rows.length === 2) {
            console.log("✅ Both document_history and document_audit_log tables successfully verified!");
        } else {
            console.error("❌ Verification failed. One or more tables are missing.");
        }
    } catch (e) {
        console.error("❌ Migration failed:", e);
    } finally {
        await client.end();
    }
}

run();
