const { Pool } = require('pg');
require('dotenv').config();

// استفاده از متغیرهای محیطی PostgreSQL که Replit تنظیم کرده
// Force SSL mode for Neon connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Log connection attempt (without credentials)
console.log(`🔗 PostgreSQL connecting with SSL required`);

// تست اتصال
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ خطا در اتصال به PostgreSQL:', err);
  } else {
    console.log('✅ اتصال به PostgreSQL برقرار شد');
    release();
  }
});

// برای پارس کردن JSON در فیلدهای permissions, profileData, invitations
const parseUser = (user) => {
  if (user) {
    try {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions || '[]') : (user.permissions || []);
      user.invitations = typeof user.invitations === 'string' ? JSON.parse(user.invitations || '[]') : (user.invitations || []);
      if (typeof user.profileData === 'string') {
        user.profileData = JSON.parse(user.profileData);
      }
    } catch (e) {
      console.error('Failed to parse user JSON fields:', e);
      user.permissions = [];
      user.invitations = [];
    }
  }
  return user;
};

module.exports = { pool, parseUser };