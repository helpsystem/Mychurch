const { Pool } = require('pg');
require('dotenv').config();

// Check if we have DATABASE_URL (Supabase)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL not found in environment variables');
  console.warn('💡 Please set DATABASE_URL to your Supabase connection string');
  console.warn('⚠️  Database operations will fail until DATABASE_URL is configured');
  
  // Export a placeholder pool that will fail gracefully
  module.exports = {
    pool: null,
    query: () => Promise.reject(new Error('Database not configured: DATABASE_URL is missing')),
    connectWithRetry: () => Promise.resolve(false)
  };
  return;
}

console.log('🔗 Connecting to Supabase PostgreSQL...');

// Create connection pool with Supabase configuration
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings for Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection with retry logic for scale-to-zero databases (TIMEOUT REDUCED)
const connectWithRetry = async (maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('✅ Successfully connected to Supabase PostgreSQL');
      client.release();
      return true;
    } catch (err) {
      const isEndpointDisabled = err.message && err.message.includes('endpoint has been disabled');
      
      if (isEndpointDisabled && attempt < maxRetries) {
        const waitTime = 1000; // 1s quick retry
        console.log(`🔄 Database endpoint waking up... Attempt ${attempt}/${maxRetries} - Waiting ${waitTime/1000}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (attempt === maxRetries) {
        console.error('⚠️  Failed to connect to PostgreSQL after', maxRetries, 'attempts:', err.message);
        return false;
      }
    }
  }
};

// Initialize connection with retry
connectWithRetry().then(success => {
  if (!success) {
    console.log('⚠️  Database connection failed - continuing without database (Supabase timeout)...');
  }
});

// Export flag for skipping DB checks
let dbReady = false;
connectWithRetry().then(ok => { dbReady = ok; });

// Helper function to parse user JSON fields
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

// Helper function to safely parse JSON fields
const parseJSON = (value, defaultValue = {}) => {
  if (!value) return defaultValue;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return defaultValue;
  }
};

module.exports = { pool, parseUser, parseJSON };