const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch',
  ssl: false
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Samyar@1989', 10);
    await pool.query(
      'INSERT INTO users (email, password, role, permissions) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['help.system@ymail.com', hashedPassword, 'SUPER_ADMIN', JSON.stringify(['all'])]
    );
    console.log('✅ Admin user created!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

createAdmin();
