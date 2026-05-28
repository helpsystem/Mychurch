const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:OExGvmxE8SsoIUGH@db.xjliwbfdzmxncyebblxw.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log("Tables in 'public' schema:");
        console.log(res.rows.map(r => r.table_name));
    } catch (e) {
        console.error("Failed:", e);
    } finally {
        await client.end();
    }
}

main();
