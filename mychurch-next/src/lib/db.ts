import { Pool } from 'pg';
import dns from 'dns';

// Ensure Node.js DNS prefers IPv4 over unreachable IPv6 routes on production servers
try {
    dns.setDefaultResultOrder('ipv4first');
} catch {
    // Unsupported in older Node versions
}

/**
 * PostgreSQL connection pool.
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export default pool;
