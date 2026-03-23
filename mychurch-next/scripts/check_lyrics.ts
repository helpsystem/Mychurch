import { Client } from 'pg';

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
  });
  
  try {
    await client.connect();
    // find lines that have more than 5 english chars in a row (to skip single chords mostly)
    const { rows } = await client.query("SELECT id, title_fa, lyrics_fa FROM church_worship_songs WHERE lyrics_fa ~ '[a-zA-Z]{5,}'");
    console.log(`\nFound ${rows.length} songs with long English strings in lyrics_fa.`);
    
    if (rows.length > 0) {
        console.log("\n--- Samples ---");
        rows.slice(0, 5).forEach(r => {
            console.log(`\n======================================`);
            console.log(`Title: ${r.title_fa}`);
            const lines = r.lyrics_fa.split('\n');
            const badLines = lines.filter((l: string) => /[a-zA-Z]{5,}/.test(l));
            console.log(`Bad Lines:\n${badLines.join('\n')}`);
        });
    }
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
