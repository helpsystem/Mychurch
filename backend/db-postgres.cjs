const { Pool } = require('pg');
require('dotenv').config();

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL for Supabase is required!');
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
    ssl: { rejectUnauthorized: false }
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
