const bcrypt = require('bcrypt');
const pool = require('./db');

const createAdmin = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 شروع ساخت کاربر سوپر ادمین...');

    const email = 'help.system@ymail.com';
    const plainPassword = 'Samyar@1989'; // پسوردی که میخوای استفاده کنی
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await connection.query(`
      INSERT INTO users (email, password, role, permissions, profileData, invitations)
      VALUES (?, ?, 'SUPER_ADMIN', '[]',
      '{"name": "Saman Abyar", "imageUrl": "https://i.imgur.com/K1j18s7.png"}', '[]')
      ON DUPLICATE KEY UPDATE role='SUPER_ADMIN'
    `, [email, hashedPassword]);

    console.log('✅ کاربر سوپر ادمین با موفقیت ایجاد شد');
  } catch (err) {
    console.error('❌ خطا در ساخت سوپر ادمین:', err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
};

createAdmin();
