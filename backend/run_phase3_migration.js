const { pool } = require('./db-postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const migrationPath = path.join(__dirname, 'migrations', 'phase3_worship_engagement.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running Phase 3 Migration...');
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✅ Migration succeeded!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
