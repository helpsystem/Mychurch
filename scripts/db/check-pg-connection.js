// Quick connection tester for PostgreSQL using DATABASE_URL from .env
const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

(async () => {
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    const client = await pool.connect();
    console.log('Connection successful');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end().catch(()=>{});
  }
})();