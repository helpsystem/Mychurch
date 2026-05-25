const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT id, title_fa, timing_data 
    FROM church_worship_songs 
    WHERE timing_data IS NOT NULL
  `);
  console.log(`Songs with timing_data: ${res.rows.length}`);
  res.rows.forEach(row => {
    const td = row.timing_data;
    const hasLines = td && Array.isArray(td.lines);
    const firstLineHasWords = hasLines && td.lines[0] && Array.isArray(td.lines[0].words);
    console.log(`- ${row.title_fa} (${row.id}): hasLines=${hasLines}, firstLineHasWords=${firstLineHasWords}`);
    if (hasLines && td.lines.length > 0) {
      console.log(`  Lines count: ${td.lines.length}`);
      if (!firstLineHasWords) {
        console.log(`  First line raw:`, JSON.stringify(td.lines[0]));
      }
    }
  });
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
