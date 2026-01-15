
const fs = require('fs');
const path = require('path');
const { pool } = require('./db-postgres');

async function runMigration() {
    const migrationFile = path.join(__dirname, 'migrations', 'add_leader_bio_whatsapp.sql');

    if (!fs.existsSync(migrationFile)) {
        console.error(`❌ Migration file not found: ${migrationFile}`);
        process.exit(1);
    }

    console.log('🚀 Starting Database Migration...');
    console.log(`📂 Applying: ${path.basename(migrationFile)}`);

    const sql = fs.readFileSync(migrationFile, 'utf8');

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(sql);

            await client.query('COMMIT');
            console.log('✅ Migration Executed Successfully!');
            if (Array.isArray(result)) {
                result.forEach(r => {
                    if (r.command === 'SELECT') console.log('   📄 Query Result:', r.rows);
                });
            } else {
                if (result.command === 'SELECT') console.log('   📄 Query Result:', result.rows);
            }

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('❌ Migration Failed (Rolled Back):', e);
            process.exit(1);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Database Connection Error:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
