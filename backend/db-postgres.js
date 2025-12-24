const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables are loaded by server-wrapper.js


// Check if we have DATABASE_URL (Supabase)
const databaseUrl = process.env.DATABASE_URL;
let useSupabaseClient = false;

// If explicitly disabled, use Supabase Client
if (process.env.DATABASE_URL_DISABLED === 'true') {
  console.warn('⚠️  DATABASE_URL explicitly disabled, using Supabase JS Client');
  useSupabaseClient = true;
} else if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL not found, using Supabase JS Client');
  useSupabaseClient = true;
}

if (!useSupabaseClient) {
  // Real Postgres Pool
  try {
    console.log('🔗 Connecting to PostgreSQL directly...');
    const realPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    realPool.query('SELECT 1', (err) => {
      if (err) console.error('❌ Postgres connection error:', err.message);
      else console.log('✅ Connected to PostgreSQL successfully');
    });

    // Helper function to safely parse JSON fields
    const parseJSONReal = (value, defaultValue = {}) => {
      if (!value) return defaultValue;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return defaultValue;
      }
    };

    module.exports = { pool: realPool, parseJSON: parseJSONReal, parseUser: (u) => u };
    return;
  } catch (e) {
    console.error('Failed to init Postgres pool:', e);
    useSupabaseClient = true;
  }
}

// Fallback to old Supabase Client implementation if real pool failed
console.log('⚠️  Falling back to Supabase REST API Mock...');
const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔗 Using Supabase REST API (IPv4-compatible)');
console.log('📍 Supabase URL:', process.env.SUPABASE_URL);

// Create wrapper pool that uses Supabase client (no IPv6 issues)
const pool = {
  query: async (text, values) => {
    // Parse table name from SQL
    const tableMatch = text.match(/FROM\s+([a-z_]+)|INTO\s+([a-z_]+)|UPDATE\s+([a-z_]+)/i);
    const tableName = (tableMatch && (tableMatch[1] || tableMatch[2] || tableMatch[3])) || null;

    if (!tableName) {
      console.error('Could not parse table name from query:', text);
      return { rows: [], rowCount: 0 };
    }

    try {
      // SELECT queries
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        let query = supabaseClient.from(tableName).select('*');

        // Handle ORDER BY
        if (text.includes('ORDER BY')) {
          const orderMatch = text.match(/ORDER BY\s+([a-z_]+)\s+(ASC|DESC)?/i);
          if (orderMatch) {
            const column = orderMatch[1];
            const ascending = !orderMatch[2] || orderMatch[2].toUpperCase() === 'ASC';
            query = query.order(column, { ascending });
          }
        }

        // Handle WHERE with single parameter
        if (text.includes('WHERE') && values && values.length > 0) {
          const whereMatch = text.match(/WHERE\s+([a-z_]+)\s*=\s*\$1/i);
          if (whereMatch) {
            query = query.eq(whereMatch[1], values[0]);
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // For other operations, return empty for now
      console.warn(`⚠️  Unsupported operation for table ${tableName}`);
      return { rows: [], rowCount: 0 };

    } catch (error) {
      console.error(`❌ Supabase query error on ${tableName}:`, error.message);
      throw error;
    }
  },

  connect: async () => {
    return {
      query: pool.query,
      release: () => { }
    };
  },

  end: async () => {
    console.log('✅ Supabase client: pool ended');
  }
};

// Connection is always ready with Supabase client
const connectWithRetry = async (maxRetries = 1) => {
  try {
    const { data, error } = await supabaseClient.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table empty, which is OK
      throw error;
    }
    console.log('✅ Successfully connected to Supabase via REST API');
    return true;
  } catch (err) {
    console.error('⚠️  Failed to connect to Supabase:', err.message);
    return false;
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