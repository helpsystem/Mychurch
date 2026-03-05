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

        console.log("Reading setup SQL...");
        const sql = fs.readFileSync(path.join(__dirname, 'supabase_setup.sql'), 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);

        console.log("✅ Migration executed successfully on Supabase!");
    } catch (e) {
        console.error("❌ Migration failed:", e);
    } finally {
        await client.end();
    }
}

run();
