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
  connectionTimeoutMillis: 10000, // Increased from 2000 to 10000ms
});

// Add pool event listeners for debugging
pool.on('connect', (client) => {
  console.log('🔵 New client connected to pool');
});

pool.on('acquire', (client) => {
  console.log('🟢 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🔴 Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected pool error:', err);
  console.error('Stack:', err.stack);
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
// DISABLED: Moved to lazy initialization on first query
let dbReady = false;
/*
connectWithRetry()
  .then(success => {
    dbReady = success;
    if (!success) {
      console.log('⚠️  Database connection failed - continuing without database (Supabase timeout)...');
    }
  })
  .catch(error => {
    console.error('❌ Database connection error:', error);
    dbReady = false;
  });
*/
console.log('📊 Database pool created, connection will be established on first query');

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

module.exports = { pool, parseUser };