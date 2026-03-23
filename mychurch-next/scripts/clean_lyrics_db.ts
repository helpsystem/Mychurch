import { Client } from 'pg';

function cleanPersianLyrics(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // 1. Remove anything in square brackets [C], [Chorus], [Am7], [column]
  cleaned = cleaned.replace(/\[.*?\]/g, ' ');
  
  // 2. Remove common section headers like Chorus, Verse, x2
  cleaned = cleaned.replace(/\b(?:Chorus|Verse|Bridge|Intro|Outro|Tag|Ending|Pre-Chorus|prechorus|V1|V2|V3|C1|C2|B1|B2|O1)\b/gi, ' ');
  
  // 3. Remove multipliers like (x2), x2, 2x
  cleaned = cleaned.replace(/\b(?:x\d+|\d+x)\b/gi, ' ');
  cleaned = cleaned.replace(/\(\s*(?:x\d+|\d+x)\s*\)/gi, ' ');
  
  // 4. Remove all remaining standalone english letters/words 
  // (We assume lyrics_fa should be 100% Persian script)
  cleaned = cleaned.replace(/[a-zA-Z]+/g, ' ');

  // 5. Remove long lines of dashes or equals
  cleaned = cleaned.replace(/[-=]{3,}/g, ' ');

  // 6. Clean up extra spaces and empty lines
  const lines = cleaned.split('\n');
  const finalLines = lines
    .map(l => l.trim())
    // Remove lines that consist only of punctuation and spaces
    .filter(l => l.length > 0 && !/^[\s\.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(l));
    
  return finalLines.join('\n');
}

async function runCleanup() {
  const client = new Client({
    connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
  });
  
  try {
    await client.connect();
    const { rows } = await client.query("SELECT id, title_fa, lyrics_fa FROM church_worship_songs WHERE lyrics_fa ~ '[a-zA-Z]'");
    
    console.log(`Found ${rows.length} songs to clean. Processing...`);
    
    let updatedCount = 0;
    for (const r of rows) {
      const cleaned = cleanPersianLyrics(r.lyrics_fa);
      if (cleaned !== r.lyrics_fa) {
        // Uncomment to actually update
        await client.query("UPDATE church_worship_songs SET lyrics_fa = $1 WHERE id = $2", [cleaned, r.id]);
        updatedCount++;
      }
    }
    
    console.log(`\nSuccessfully cleaned ${updatedCount} songs in the database.`);

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runCleanup();
