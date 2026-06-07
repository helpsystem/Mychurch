const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== AUTH USERS ===");
        const authRes = await pool.query("SELECT id, email, phone, created_at FROM auth.users;");
        console.log(JSON.stringify(authRes.rows, null, 2));

        console.log("=== PUBLIC USERS ===");
        const publicRes = await pool.query("SELECT id, email, role, phone, whatsapp_number FROM public.users;");
        console.log(JSON.stringify(publicRes.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
