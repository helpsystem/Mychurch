const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM users');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
