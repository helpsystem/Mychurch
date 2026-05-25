const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT DISTINCT url FROM error_reports');
  console.log(res.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
