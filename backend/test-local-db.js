
require('dotenv').config();
const { pool } = require('./db-postgres');

async function test() {
    console.log('🧪 Testing Local DB Connection...');
    console.log('   URL:', process.env.DATABASE_URL);
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection Successful:', res.rows[0]);

        const userRes = await pool.query("SELECT email, role FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1");
        if (userRes.rows.length > 0) {
            console.log('👤 Found Super Admin:', userRes.rows[0]);
        } else {
            console.log('⚠️  No Super Admin found in DB');
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
        process.exit(1);
    }
}

test();
