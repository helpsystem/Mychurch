// backend/scripts/createAdminUser.js
const { pool } = require('../db-postgres');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    console.log('🔐 ایجاد کاربر ادمین...\n');

    const email = 'batch@admin.com';
    const password = 'BatchAdmin2024!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows && existing.rows.length > 0) {
      console.log('⚠️  کاربر قبلاً وجود دارد - حذف و ایجاد مجدد...\n');
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, password, role, permissions)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      [email, hashedPassword, 'SUPER_ADMIN', JSON.stringify([])]
    );

    console.log('✅ کاربر ادمین ایجاد شد:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: SUPER_ADMIN\n`);

    return result.rows[0];

  } catch (error) {
    console.error('❌ خطا:', error.message);
    throw error;
  }
}

createAdmin()
  .then(() => {
    console.log('✅ تمام');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ خطا:', err);
    process.exit(1);
  });
