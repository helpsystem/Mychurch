const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM support_ticket_messages ORDER BY created_at DESC LIMIT 5');
  res.rows.forEach((row, i) => {
    console.log(`--- TICKET MESSAGE ${i+1} ---`);
    console.log(row.message_body);
  });
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
