const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM support_ticket_messages ORDER BY created_at DESC LIMIT 1');
  if (res.rows.length > 0) {
    console.log(`Created At: ${res.rows[0].created_at}`);
    console.log(res.rows[0].message_body);
  } else {
    console.log("No tickets found.");
  }
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
