const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function applyFixes() {
    console.log('🔒 Applying Supabase Security Fixes...');

    // Check for DATABASE_URL
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL is not defined in .env');
        console.error('   Cannot connect to database to apply SQL fixes.');
        console.error('   Please ensure your .env file has a valid DATABASE_URL.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Supabase/Heroku usually
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const sqlPath = path.join(__dirname, '../../supabase_security_fixes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Reading SQL file...');

        // Split by semicolon to run statements individually if needed, 
        // but pg usually handles the whole script if it's just DDL.
        // However, the script has DO blocks ($$) which might confuse simple splitters.
        // We will try running it as a single block first.

        console.log('🚀 Executing SQL script...');
        await client.query(sql);

        console.log('✅ Security fixes applied successfully!');

    } catch (err) {
        console.error('❌ Error executing script:', err);
    } finally {
        await client.end();
    }
}

applyFixes();
