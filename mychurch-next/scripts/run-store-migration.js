const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Custom simple dotenv parser to load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const index = trimmed.indexOf('=');
            if (index !== -1) {
                const key = trimmed.slice(0, index).trim();
                let value = trimmed.slice(index + 1).trim();
                // Strip quotes if any
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        }
    });
    console.log('📋 Loaded environment from .env.local');
} else {
    console.error('❌ .env.local not found');
    process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
}

console.log('🔗 Connecting to DB...');
const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        const sqlPath = path.join(__dirname, '..', 'supabase', 'store_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        console.log('🔄 Running store_schema migration against database...');
        await pool.query(sql);
        console.log('✅ Migration executed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
