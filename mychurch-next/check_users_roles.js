const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== CHECKING USER ROLES & EMAILS ===");
        
        // Query auth.users
        const authUsers = await pool.query(`
            SELECT id, email, raw_user_meta_data 
            FROM auth.users;
        `);
        console.log("\n--- auth.users table ---");
        authUsers.rows.forEach(r => {
            console.log(`ID: ${r.id} | Email: "${r.email}" | Meta:`, r.raw_user_meta_data);
        });

        // Query public.users
        const publicUsers = await pool.query(`
            SELECT id, email, role, permissions 
            FROM public.users;
        `);
        console.log("\n--- public.users table ---");
        publicUsers.rows.forEach(r => {
            console.log(`ID: ${r.id} | Email: "${r.email}" | Role: "${r.role}" | Permissions:`, r.permissions);
        });

    } catch (err) {
        console.error("Database process failed:", err);
    } finally {
        await pool.end();
    }
}

main();
