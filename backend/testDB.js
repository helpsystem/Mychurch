const pool = require('./db');

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ اتصال موفق به دیتابیس MySQL');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس:', error.message);
    process.exit(1);
  }
})();
