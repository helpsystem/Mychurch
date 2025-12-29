// Simple migration runner - executes migration SQL directly
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch',
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('⚡ Adding bio column...');
        await client.query(`
      ALTER TABLE leaders 
      ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{"fa": "", "en": ""}'::jsonb;
    `);

        console.log('⚡ Adding whatsapp_number column...');
        await client.query(`
      ALTER TABLE leaders 
      ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
    `);

        console.log('✅ Migration completed successfully!');

        // Verify columns
        console.log('\n🔍 Verifying columns...');
        const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leaders' 
      AND column_name IN ('bio', 'whatsapp_number')
      ORDER BY column_name;
    `);

        console.log('✅ Columns verified:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ All done! You can now restart the backend server.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    });
