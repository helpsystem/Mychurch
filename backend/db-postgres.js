const { Pool } = require('pg');
require('dotenv').config();

// بررسی و تنظیم DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;

// اگر DATABASE_URL وجود ندارد
if (!databaseUrl) {
  console.error('❌ DATABASE_URL وجود ندارد');
  console.log('💡 لطفاً DATABASE_URL صحیح Supabase را تنظیم کنید');
  process.exit(1);
}

// بررسی فرمت URL
try {
  new URL(databaseUrl);
  console.log('✅ DATABASE_URL فرمت صحیح دارد');
} catch (e) {
  console.error('❌ DATABASE_URL فرمت نامعتبر دارد:', e.message);
  console.log('💡 مثال صحیح: postgresql://postgres.abc:password@host:6543/postgres');
  process.exit(1);
}

// Force SSL mode for Supabase connections
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// Log connection attempt (without credentials)
console.log(`🔗 PostgreSQL connecting to Supabase with SSL required`);

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