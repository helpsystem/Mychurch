// get_reported_errors.js
const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();

  console.log("=== CHECKING FOR TABLES ===");
  const tableCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('error_reports', 'support_tickets', 'support_ticket_messages')
  `);
  console.log("Found tables:", tableCheck.rows.map(r => r.table_name));

  if (tableCheck.rows.some(r => r.table_name === 'error_reports')) {
    console.log("\n=== RECENT CLIENT ERROR REPORTS ===");
    const res = await client.query('SELECT * FROM error_reports ORDER BY timestamp DESC LIMIT 10');
    if (res.rows.length === 0) {
      console.log("No error reports found.");
    } else {
      res.rows.forEach((row, i) => {
        console.log(`\n--- ERROR ${i+1} ---`);
        console.log(`Timestamp: ${row.timestamp}`);
        console.log(`URL: ${row.url}`);
        console.log(`Code: ${row.code}`);
        console.log(`Message: ${row.message}`);
        console.log(`AI Summary: ${row.ai_summary}`);
        console.log(`AI Probable Cause: ${row.ai_probable_cause}`);
        console.log(`AI Suggested Fix: ${row.ai_suggested_fix}`);
      });
    }
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
