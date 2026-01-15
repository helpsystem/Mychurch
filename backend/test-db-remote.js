
const { pool } = require('./db-postgres');

async function test() {
    console.log("🚀 Testing Database Connection...");
    try {
        const res = await pool.query('SELECT 1');
        console.log("✅ SELECT 1 success:", res);
    } catch (e) {
        console.error("❌ SELECT 1 failed:", e.message);
    }

    console.log("🚀 Testing Leaders Table...");
    try {
        const res = await pool.query('SELECT * FROM leaders LIMIT 1');
        console.log("✅ Leaders query success. Row count:", res.rowCount);
        if (res.rows.length > 0) console.log("Sample:", res.rows[0]);
    } catch (e) {
        console.error("❌ Leaders query failed:", e.message);
    }

    // Test the SAFE query
    console.log("🚀 Testing SAFE Query...");
    try {
        const res = await pool.query('SELECT id, name FROM leaders LIMIT 1');
        console.log("✅ Safe query success:", res.rowCount);
    } catch (e) {
        console.error("❌ Safe query failed:", e.message);
    }
}

test();
