const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT url, message, timestamp FROM error_reports ORDER BY timestamp DESC LIMIT 20');
  res.rows.forEach((row, i) => {
    console.log(`[${row.timestamp}] ${row.url}: ${row.message.slice(0, 150)}`);
  });
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
