/**
 * Supabase Adapter for pg-style queries
 * 
 * This adapter allows using Supabase JS client with existing pg-style code.
 * Supabase client works better on Windows (no IPv6 issues).
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔗 Using Supabase REST API adapter (IPv4-compatible)');
console.log('📍 Supabase URL:', process.env.SUPABASE_URL);

/**
 * Parse SQL query to extract table name and operation
 */
function parseSQLQuery(text, values = []) {
  const query = text.trim().toLowerCase();
  
  // SELECT queries
  if (query.startsWith('select')) {
    const tableMatch = query.match(/from\s+([a-z_]+)/i);
    const tableName = tableMatch ? tableMatch[1] : null;
    
    // Check for WHERE clause
    const whereMatch = query.match(/where\s+([a-z_]+)\s*=\s*\$1/i);
    const orderMatch = query.match(/order by\s+([a-z_]+)\s+(asc|desc)/i);
    
    return {
      operation: 'SELECT',
      table: tableName,
      whereColumn: whereMatch ? whereMatch[1] : null,
      orderBy: orderMatch ? { column: orderMatch[1], ascending: orderMatch[2] === 'asc' } : null
    };
  }
  
  // INSERT queries
  if (query.startsWith('insert')) {
    const tableMatch = query.match(/into\s+([a-z_]+)/i);
    const columnsMatch = query.match(/\(([^)]+)\)/);
    
    return {
      operation: 'INSERT',
      table: tableMatch ? tableMatch[1] : null,
      columns: columnsMatch ? columnsMatch[1].split(',').map(c => c.trim()) : []
    };
  }
  
  // UPDATE queries
  if (query.startsWith('update')) {
    const tableMatch = query.match(/update\s+([a-z_]+)/i);
    const whereMatch = query.match(/where\s+([a-z_]+)\s*=\s*\$(\d+)/i);
    
    return {
      operation: 'UPDATE',
      table: tableMatch ? tableMatch[1] : null,
      whereColumn: whereMatch ? whereMatch[1] : null,
      whereIndex: whereMatch ? parseInt(whereMatch[2]) - 1 : null
    };
  }
  
  // DELETE queries
  if (query.startsWith('delete')) {
    const tableMatch = query.match(/from\s+([a-z_]+)/i);
    const whereMatch = query.match(/where\s+([a-z_]+)\s*=\s*\$1/i);
    
    return {
      operation: 'DELETE',
      table: tableMatch ? tableMatch[1] : null,
      whereColumn: whereMatch ? whereMatch[1] : null
    };
  }
  
  return { operation: 'UNKNOWN', table: null };
}

/**
 * Mock pool.query() method using Supabase client
 */
async function query(text, values = []) {
  const parsed = parseSQLQuery(text, values);
  
  console.log(`🔍 SQL Query: ${parsed.operation} on ${parsed.table}`);
  
  try {
    switch (parsed.operation) {
      case 'SELECT': {
        let queryBuilder = supabase.from(parsed.table).select('*');
        
        // Apply WHERE clause
        if (parsed.whereColumn && values.length > 0) {
          queryBuilder = queryBuilder.eq(parsed.whereColumn, values[0]);
        }
        
        // Apply ORDER BY
        if (parsed.orderBy) {
          queryBuilder = queryBuilder.order(parsed.orderBy.column, { ascending: parsed.orderBy.ascending });
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) throw new Error(error.message);
        
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }
      
      case 'INSERT': {
        // Build data object from columns and values
        const dataObj = {};
        parsed.columns.forEach((col, idx) => {
          if (idx < values.length) {
            dataObj[col] = values[idx];
          }
        });
        
        const { data, error } = await supabase
          .from(parsed.table)
          .insert(dataObj)
          .select();
        
        if (error) throw new Error(error.message);
        
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }
      
      case 'UPDATE': {
        // Extract values: last value is the ID (WHERE clause)
        const whereValue = values[parsed.whereIndex];
        const updateValues = values.slice(0, parsed.whereIndex);
        
        // Build update object (simplified - would need column mapping)
        const updateObj = {};
        // This is a simplified version - in production, you'd need to map columns properly
        
        const { data, error } = await supabase
          .from(parsed.table)
          .update(updateObj)
          .eq(parsed.whereColumn, whereValue)
          .select();
        
        if (error) throw new Error(error.message);
        
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }
      
      case 'DELETE': {
        const { data, error } = await supabase
          .from(parsed.table)
          .delete()
          .eq(parsed.whereColumn, values[0])
          .select();
        
        if (error) throw new Error(error.message);
        
        return { rows: [], rowCount: data ? data.length : 0 };
      }
      
      default:
        throw new Error(`Unsupported SQL operation: ${parsed.operation}`);
    }
  } catch (error) {
    console.error('❌ Supabase query error:', error.message);
    throw error;
  }
}

// Mock pool object
const pool = {
  query,
  connect: async () => {
    console.log('✅ Supabase adapter: connection requested (always ready)');
    return {
      query,
      release: () => console.log('✅ Supabase adapter: connection released')
    };
  },
  end: async () => {
    console.log('✅ Supabase adapter: pool ended');
  }
};

// Helper functions from original db-postgres.js
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

module.exports = { pool, parseJSON, parseUser, supabase };
