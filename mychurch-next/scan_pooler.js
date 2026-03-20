const { Pool } = require('pg');

const regions = [
  'eu-central-1', 'us-east-1', 'us-west-1', 'eu-west-1', 
  'ap-southeast-1', 'eu-west-2', 'ap-northeast-1', 
  'ap-southeast-2', 'sa-east-1', 'ca-central-1', 'ap-south-1'
];
const password = 'OExGvmxE8SsoIUGH';
const project = 'xjliwbfdzmxncyebblxw';

async function testPool(region) {
  const url = "postgresql://postgres." + project + ":" + password + "@aws-0-" + region + ".pooler.supabase.com:6543/postgres";
  const pool = new Pool({ 
    connectionString: url, 
    ssl: { rejectUnauthorized: false }, 
    connectionTimeoutMillis: 3000 
  });
  
  try {
    await pool.query('SELECT 1');
    console.log('🟢 SUCCESS REGION:', region);
    console.log('URL:', url);
    process.exit(0);
  } catch(e) {
    // Failed, do nothing
  }
}

async function run() {
  console.log("Scanning Supabase regions for pooler...");
  const promises = regions.map(r => testPool(r));
  await Promise.allSettled(promises);
  console.log("🔴 FAILED ALL REGIONS. Pooler might be disabled or password differs.");
  process.exit(1);
}

run();
