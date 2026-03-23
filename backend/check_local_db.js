const { pool } = require('./db-postgres');

async function checkLocal() {
    try {
        console.log("🔍 Checking local DB via pool...");
        const res = await pool.query("SELECT * FROM worship_songs LIMIT 1");
        if (res.rows.length > 0) {
            console.log("✅ Sample row columns:", Object.keys(res.rows[0]));
            console.log("📄 Sample row data:", res.rows[0]);
        } else {
            console.log("⚠️ Table 'worship_songs' is empty in local DB.");
        }
        
        const countRes = await pool.query("SELECT COUNT(*) FROM worship_songs");
        console.log("📊 Total rows in local worship_songs:", countRes.rows[0].count);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error checking local DB:", err.message);
        process.exit(1);
    }
}

checkLocal();
