const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const { rows: songs } = await pool.query(`
            SELECT title_fa, artist 
            FROM church_worship_songs 
            WHERE audio_url IS NULL OR audio_url = ''
            LIMIT 30
        `);
        console.log("=== SAMPLE UNMATCHED SONGS ===");
        songs.forEach(s => console.log(`- Title: "${s.title_fa}" | Artist: "${s.artist}"`));

        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        const rawFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
        console.log("\n=== SAMPLE FILES ON DISK ===");
        rawFiles.slice(0, 30).forEach(f => console.log(`- File: "${f}"`));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
