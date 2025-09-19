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

// بررسی فرمت URL و رفع مشکل کاراکترهای خاص
console.log('🔍 بررسی DATABASE_URL...');

// جایگزینی کاراکترهای خاص در پسورد برای URL parsing
let encodedUrl = databaseUrl;
try {
  // Parse the URL manually to handle special characters in password
  // Handle both formats: with port and without port (Supabase style)
  const urlWithPortPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/;
  const urlWithoutPortPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?$/;
  
  let match = databaseUrl.match(urlWithPortPattern);
  let hasPort = true;
  
  if (!match) {
    match = databaseUrl.match(urlWithoutPortPattern);
    hasPort = false;
  }
  
  if (match) {
    let username, password, host, port, database, queryString;
    
    if (hasPort) {
      [, username, password, host, port, database, queryString] = match;
    } else {
      [, username, password, host, database, queryString] = match;
      port = '5432'; // Default PostgreSQL port
    }
    
    const encodedPassword = encodeURIComponent(password);
    encodedUrl = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}${queryString || ''}`;
    console.log('✅ DATABASE_URL پردازش شد (کاراکترهای خاص پسورد encode شدند)');
  } else {
    throw new Error('فرمت URL قابل تشخیص نیست');
  }
} catch (e) {
  console.error('❌ خطا در پردازش DATABASE_URL:', e.message);
  console.log('💡 فرمت مورد انتظار: postgresql://username:password@host:port/database');
  process.exit(1);
}

// استفاده از URL اصلی (غیر encoded) برای اتصال PostgreSQL
databaseUrl = databaseUrl; // PostgreSQL client can handle raw passwords

// Parse URL manually and use individual parameters for better compatibility
let connectionConfig;
try {
  const urlWithPortPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/;
  const urlWithoutPortPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?$/;
  
  let match = databaseUrl.match(urlWithPortPattern);
  let hasPort = true;
  
  if (!match) {
    match = databaseUrl.match(urlWithoutPortPattern);
    hasPort = false;
  }
  
  if (match) {
    let username, password, host, port, database;
    
    if (hasPort) {
      [, username, password, host, port, database] = match;
    } else {
      [, username, password, host, database] = match;
      port = '5432'; // Default PostgreSQL port
    }
    
    connectionConfig = {
      user: username,
      password: password,
      host: host,
      port: parseInt(port),
      database: database,
      ssl: { rejectUnauthorized: false }
    };
    console.log('✅ اتصال با پارامترهای جداگانه تنظیم شد');
  } else {
    throw new Error('فرمت URL قابل پارس نیست');
  }
} catch (e) {
  console.error('❌ خطا در پارس کردن اطلاعات اتصال:', e.message);
  process.exit(1);
}

// Force SSL mode for Supabase connections
const pool = new Pool(connectionConfig);

// Log connection attempt (without credentials)
console.log(`🔗 PostgreSQL connecting to Supabase with SSL required`);

// اتصال با retry برای Neon scale-to-zero
const connectWithRetry = async (maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('✅ اتصال به PostgreSQL برقرار شد');
      client.release();
      return true;
    } catch (err) {
      const isEndpointDisabled = err.message && err.message.includes('endpoint has been disabled');
      
      if (isEndpointDisabled && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 2000; // Exponential backoff: 2s, 4s, 8s, 16s
        console.log(`🔄 Neon endpoint در حال بیدار شدن... تلاش ${attempt}/${maxRetries} - انتظار ${waitTime/1000}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (attempt === maxRetries) {
        console.error('❌ خطا در اتصال به PostgreSQL پس از', maxRetries, 'تلاش:', err.message);
        return false;
      }
    }
  }
};

// شروع اتصال با retry
connectWithRetry().then(success => {
  if (!success) {
    console.log('⚠️ اتصال دیتابیس ناموفق - ادامه بدون دیتابیس...');
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