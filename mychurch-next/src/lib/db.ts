import { Pool } from 'pg';

/**
 * Local PostgreSQL connection pool.
 * Used for direct connection to the local database instead of cloud Supabase.
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export default pool;
