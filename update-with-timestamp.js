require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

const newHash = '$2b$10$p.iIsn9oTCKRbY9D1boSG.XYR/J2.F45rLcY4du9/4l7yXud6SVUW';

async function updateWithUpdatedAt() {
  try {
    // Update both password and updated_at
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role',
      [newHash, 'help.system@ymail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log('User:', result.rows[0]);
      
      // Test the new password
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare('Samyar@1989', newHash);
      console.log('Password test:', isValid ? '✅ WORKS' : '❌ FAILED');
    } else {
      console.log('❌ No user found with that email');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

updateWithUpdatedAt();
