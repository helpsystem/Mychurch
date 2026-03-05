import { Pool } from 'pg';

/**
 * Local PostgreSQL connection pool.
 * Used for direct connection to the local database instead of cloud Supabase.
 */
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mychurch',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
