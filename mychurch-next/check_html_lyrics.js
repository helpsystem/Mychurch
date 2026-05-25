const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT id, title_fa, lyrics_fa 
    FROM church_worship_songs 
    WHERE lyrics_fa LIKE '%<%' AND lyrics_fa LIKE '%>%'
  `);
  console.log(`Songs with HTML in lyrics: ${res.rows.length}`);
  res.rows.forEach(row => {
    console.log(`- ${row.title_fa} (${row.id})`);
    console.log(row.lyrics_fa.slice(0, 150));
  });
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
