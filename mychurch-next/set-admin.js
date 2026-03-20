const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Setting user role to Admin in users table...");
        
        const res = await pool.query(`
            UPDATE users 
            SET role = 'Admin' 
            WHERE email = 'help.system@ymail.com'
            RETURNING *;
        `);
        console.log(`Updated users: ${res.rowCount}`);
        if(res.rowCount === 0) {
            console.log("User not found! Inserting a record into users table...");
            await pool.query(`
                INSERT INTO users (email, role, created_at, updated_at)
                VALUES ('help.system@ymail.com', 'Admin', NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET role = 'Admin';
            `);
            console.log("User inserted as Admin.");
        }
        
        console.log("Enabling Global Popup Widget...");
        const res2 = await pool.query(`
            UPDATE widgets
            SET is_active = true
            WHERE id = 'w_global_popup'
            RETURNING *;
        `);
        console.log(`Updated widgets: ${res2.rowCount}`);
        
    } catch (e) {
        console.error("Failed to update user:", e.message);
    } finally {
        await pool.end();
    }
}
run();
