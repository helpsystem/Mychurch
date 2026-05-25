const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT id, title_fa, lyrics_fa, timepoints, timing_data 
    FROM church_worship_songs 
    ORDER BY id DESC 
    LIMIT 5
  `);
  res.rows.forEach(row => {
    console.log(`--- SONG ID: ${row.id} | Title: ${row.title_fa} ---`);
    console.log(`Lyrics Length: ${row.lyrics_fa ? row.lyrics_fa.length : 0}`);
    console.log(`Lyrics Snippet: ${row.lyrics_fa ? JSON.stringify(row.lyrics_fa.slice(0, 150)) : 'null'}`);
    console.log(`Timepoints Length: ${row.timepoints ? row.timepoints.length : 0}`);
    console.log(`Timing Data Lines: ${row.timing_data?.lines ? row.timing_data.lines.length : 0}`);
    console.log();
  });
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
