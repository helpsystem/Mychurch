const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM presentations WHERE id = $1', ['b460ceb6-cf78-40cb-9328-eebd9f5c8ec1']);
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
