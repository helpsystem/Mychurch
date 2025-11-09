require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

pool.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'users'")
  .then(r => {
    console.log('Triggers on users table:');
    r.rows.forEach(t => {
      console.log(`\n  Trigger: ${t.trigger_name}`);
      console.log(`  Action: ${t.action_statement}`);
    });
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
