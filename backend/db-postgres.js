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
  // Parse URL by finding the last @ (to handle @ in password)
  const protocolEnd = databaseUrl.indexOf('://') + 3;
  const afterProtocol = databaseUrl.substring(protocolEnd);
  const lastAtIndex = afterProtocol.lastIndexOf('@');
  
  if (lastAtIndex === -1) {
    throw new Error('Invalid URL format - no @ found');
  }
  
  const credentials = afterProtocol.substring(0, lastAtIndex);
  const hostAndPath = afterProtocol.substring(lastAtIndex + 1);
  
  const colonIndex = credentials.indexOf(':');
  const username = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);
  
  // Parse host, port, database, query
  const slashIndex = hostAndPath.indexOf('/');
  const hostPort = hostAndPath.substring(0, slashIndex);
  const pathAndQuery = hostAndPath.substring(slashIndex + 1);
  
  const questionIndex = pathAndQuery.indexOf('?');
  const database = questionIndex > -1 ? pathAndQuery.substring(0, questionIndex) : pathAndQuery;
  const queryString = questionIndex > -1 ? pathAndQuery.substring(questionIndex) : '';
  
  const portColonIndex = hostPort.lastIndexOf(':');
  const host = portColonIndex > -1 ? hostPort.substring(0, portColonIndex) : hostPort;
  const port = portColonIndex > -1 ? hostPort.substring(portColonIndex + 1) : '5432';
  
  const encodedPassword = encodeURIComponent(password);
  encodedUrl = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}${queryString}`;
  console.log('✅ DATABASE_URL پردازش شد (کاراکترهای خاص پسورد encode شدند)');
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
  // Parse URL by finding the last @ (to handle @ in password)
  const protocolEnd = databaseUrl.indexOf('://') + 3;
  const afterProtocol = databaseUrl.substring(protocolEnd);
  const lastAtIndex = afterProtocol.lastIndexOf('@');
  
  if (lastAtIndex === -1) {
    throw new Error('Invalid URL format - no @ found');
  }
  
  const credentials = afterProtocol.substring(0, lastAtIndex);
  const hostAndPath = afterProtocol.substring(lastAtIndex + 1);
  
  const colonIndex = credentials.indexOf(':');
  const username = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);
  
  // Parse host, port, database
  const slashIndex = hostAndPath.indexOf('/');
  const hostPort = hostAndPath.substring(0, slashIndex);
  const pathAndQuery = hostAndPath.substring(slashIndex + 1);
  
  const questionIndex = pathAndQuery.indexOf('?');
  const database = questionIndex > -1 ? pathAndQuery.substring(0, questionIndex) : pathAndQuery;
  
  const portColonIndex = hostPort.lastIndexOf(':');
  const host = portColonIndex > -1 ? hostPort.substring(0, portColonIndex) : hostPort;
  const port = portColonIndex > -1 ? hostPort.substring(portColonIndex + 1) : '5432';
  
  connectionConfig = {
    user: username,
    password: password,
    host: host,
    port: parseInt(port),
    database: database,
    ssl: { rejectUnauthorized: false }
  };
  console.log('✅ اتصال با پارامترهای جداگانه تنظیم شد');
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