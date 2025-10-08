const { Pool } = require('pg');
require('dotenv').config();
// const fitz = require('pymupdf'); // حذف شده برای جلوگیری از خطا

// Prefer DATABASE_URL; optionally allow DIRECT_DATABASE_URL for heavy operations
let databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL (or DIRECT_DATABASE_URL) is required!');
}

// If password contains characters like '@', percent-encode it so the URL parses correctly
try {
  const protocolEnd = databaseUrl.indexOf('://') + 3;
  const afterProtocol = databaseUrl.substring(protocolEnd);
  const lastAtIndex = afterProtocol.lastIndexOf('@');
  if (lastAtIndex !== -1) {
    const credentials = afterProtocol.substring(0, lastAtIndex);
    const hostAndPath = afterProtocol.substring(lastAtIndex + 1);
    const colonIndex = credentials.indexOf(':');
    if (colonIndex !== -1) {
      const username = credentials.substring(0, colonIndex);
      const password = credentials.substring(colonIndex + 1);
      const encodedPassword = encodeURIComponent(password);
      const protocol = databaseUrl.substring(0, protocolEnd);
      const rebuilt = `${protocol}${username}:${encodedPassword}@${hostAndPath}`;
      databaseUrl = rebuilt;
      console.log('🔐 Encoded DATABASE_URL password for safe parsing');
    }
  }
} catch (e) {
  console.warn('⚠️ Could not encode DATABASE_URL, using raw value');
}

let pool;
try {
  pool = new Pool({
    connectionString: databaseUrl,
  ssl: false, // Always disable SSL for PostgreSQL (local & production)
    max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  // Test initial connectivity (non-blocking for entire app startup)
  pool.query('SELECT 1').then(()=>{
    console.log('✅ PostgreSQL connection OK');
  }).catch(err=>{
    console.warn('⚠️ Initial DB test query failed:', err.message);
  });
} catch (err) {
  console.error('⚠️ Failed to create pg Pool:', err && err.message ? err.message : err);
  // Provide a minimal fallback that fails fast but keeps the app running
  pool = {
    query: () => Promise.reject(new Error('Database pool not available')),
    connect: () => Promise.reject(new Error('Database pool not available')),
    end: () => Promise.resolve()
  };
}

module.exports = { pool };