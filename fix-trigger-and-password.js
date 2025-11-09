require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

const newHash = '$2b$10$p.iIsn9oTCKRbY9D1boSG.XYR/J2.F45rLcY4du9/4l7yXud6SVUW';

async function fixPassword() {
  try {
    // Step 1: Drop the problematic trigger
    console.log('⏳ Dropping trigger...');
    await pool.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    console.log('✅ Trigger dropped');
    
    // Step 2: Update password
    console.log('⏳ Updating password...');
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, role',
      [newHash, 'help.system@ymail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log('User:', result.rows[0]);
    } else {
      console.log('❌ No user found');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixPassword();
