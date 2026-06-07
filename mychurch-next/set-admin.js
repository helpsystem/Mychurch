const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const adminUsers = [
  { email: 'help.system@ymail.com', name: 'System Admin' },
  { email: 'helpsystem68@gmail.com', name: 'System Admin' },
  { email: 'appsamyar@gmail.com', name: 'SamYar Admin' }
];

async function run() {
    try {
        console.log("Setting user roles to Admin in users table...");
        
        for (const user of adminUsers) {
            console.log(`Processing ${user.email}...`);
            await pool.query(`
                INSERT INTO users (email, name, role, updated_at)
                VALUES ($1, $2, 'Admin', NOW())
                ON CONFLICT (email) DO UPDATE SET role = 'Admin', name = EXCLUDED.name, updated_at = NOW();
            `, [user.email, user.name]);
            console.log(`User ${user.email} is set/updated as Admin.`);
        }
        
        console.log("Roles sync complete!");
        
        // Print all public users for confirmation
        const res = await pool.query("SELECT id, email, role, phone, whatsapp_number FROM public.users;");
        console.log("Current public users:");
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error("Failed to update user:", e.message);
    } finally {
        await pool.end();
    }
}
run();
