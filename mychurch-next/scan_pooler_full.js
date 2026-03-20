const { Pool } = require('pg');

const awsRegions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-east-1', 'ap-south-1', 'ap-northeast-3', 'ap-northeast-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'eu-north-1', 'eu-south-1', 'me-south-1', 'sa-east-1'
];
// Sometimes pooler is on IPv4 behind fly.io or just pooler-xyz
const password = 'OExGvmxE8SsoIUGH';
const project = 'xjliwbfdzmxncyebblxw';

async function testPool(region, port) {
  const url = `postgresql://postgres.${project}:${password}@aws-0-${region}.pooler.supabase.com:${port}/postgres`;
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 4000 });
  try {
    await pool.query('SELECT 1');
    console.log(`\n\n✅✅✅ SUCCESS: region = ${region}, port = ${port}`);
    console.log(`URL: ${url}\n\n`);
    process.exit(0);
  } catch(e) { }
}

async function run() {
  console.log("Exhaustive scan...");
  let promises = [];
  for (const r of awsRegions) {
    promises.push(testPool(r, 6543));
    promises.push(testPool(r, 5432));
  }
  await Promise.allSettled(promises);
  console.log("🔴 FAILED EXHAUSTIVE SCAN.");
  process.exit(1);
}

run();
