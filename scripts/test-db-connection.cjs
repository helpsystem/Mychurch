const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${color}${message}${COLORS.reset}`);
}

async function testConnection() {
    log(COLORS.cyan, '🔌 Testing Database Connection...');

    if (!process.env.DATABASE_URL) {
        log(COLORS.red, '❌ DATABASE_URL is missing in .env');
        return;
    }

    // Careful with logging secrets
    const dbUrl = process.env.DATABASE_URL;
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    log(COLORS.yellow, `   Target: ${maskedUrl}`);

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        log(COLORS.green, '   ✅ Successfully connected to the database!');

        const res = await client.query('SELECT NOW() as now, version()');
        log(COLORS.green, `   ✅ Database Time: ${res.rows[0].now}`);
        log(COLORS.green, `   ✅ Version: ${res.rows[0].version}`);

        // Check for a specific table to ensure schema access
        try {
            const countRes = await client.query('SELECT COUNT(*) FROM bible_books');
            log(COLORS.green, `   ✅ Table 'bible_books' access confirmed. Count: ${countRes.rows[0].count}`);
        } catch (tableErr) {
            log(COLORS.red, `   ❌ Could not access 'bible_books' table: ${tableErr.message}`);
        }

        client.release();
    } catch (err) {
        log(COLORS.red, '   ❌ Connection Failed!');
        log(COLORS.red, `   Error: ${err.message}`);
    } finally {
        await pool.end();
    }
}

testConnection();
