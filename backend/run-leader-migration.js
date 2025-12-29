// Migration Runner - Execute SQL migration via Node.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables!');
    console.log('Please make sure .env file exists in project root.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    const migrationFile = path.join(__dirname, 'migrations', 'add_leader_bio_whatsapp.sql');

    console.log('📂 Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('⚡ Executing migration...');
        const result = await client.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Results:', result);

        // Verify columns were added
        console.log('\n🔍 Verifying new columns...');
        const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leaders' 
      AND column_name IN('bio', 'whatsapp_number')
      ORDER BY column_name;
`);

        console.log('✅ Columns verified:');
        console.table(verifyResult.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
