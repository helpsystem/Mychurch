const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== DB QUERY START ===");

        const res = await pool.query("SELECT id, title_fa, audio_url FROM church_worship_songs WHERE audio_url LIKE '%آمد مسیح اندر جهان%'");
        console.log("Matched records:", res.rows);

    } catch (err) {
        console.error("Database query failed:", err);
    } finally {
        await pool.end();
    }
}

main();




