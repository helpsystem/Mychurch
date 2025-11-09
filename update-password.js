// Update password using raw SQL to bypass triggers
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const newHash = '$2b$10$p.iIsn9oTCKRbY9D1boSG.XYR/J2.F45rLcY4du9/4l7yXud6SVUW';

async function updatePassword() {
  try {
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, role',
      [newHash, 'help.system@ymail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log('User:', result.rows[0]);
    } else {
      console.log('❌ No user found with that email');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

updatePassword();
