const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      ALTER TABLE presentations ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ;
      ALTER TABLE presentations ADD COLUMN IF NOT EXISTS host_name VARCHAR(255);
      ALTER TABLE presentations ADD COLUMN IF NOT EXISTS slides_json JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE presentations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

      UPDATE presentations
      SET date = COALESCE(date, session_date::timestamptz, created_at, NOW())
      WHERE date IS NULL;

      UPDATE presentations
      SET slides_json = COALESCE(slides_json, slides, '[]'::jsonb)
      WHERE slides_json IS NULL OR slides_json = 'null'::jsonb;

      UPDATE presentations
      SET status = COALESCE(NULLIF(status, ''), 'draft');
    `);

    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'presentations'
      ORDER BY ordinal_position
    `);

    console.log('COLUMNS_OK');
    for (const row of columns.rows) {
      console.log(`${row.column_name} :: ${row.data_type}`);
    }
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error('MIGRATION_FAILED');
  console.error(error.message || error);
  process.exit(1);
});
