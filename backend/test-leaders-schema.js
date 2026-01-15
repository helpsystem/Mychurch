
const { pool } = require('./db-postgres');

async function test() {
    console.log("🚀 Inspecting LEADERS Schema...");
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leaders' ORDER BY ordinal_position");
        console.table(res.rows);
    } catch (e) {
        console.error("❌ Schema Check Failed:", e.message);
    }
}

test();
