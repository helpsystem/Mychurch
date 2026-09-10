const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});
async function check() {
    try {
        const { rows } = await pool.query("SELECT count(*) as kalameh_count FROM church_worship_songs WHERE audio_url LIKE '%kalameh.com%'");
        console.log('Kalameh.com URLs count:', rows[0]);
        const { rows: urlTypes } = await pool.query("SELECT SUBSTRING(audio_url FROM 1 FOR 35) as prefix, count(*) FROM church_worship_songs GROUP BY prefix ORDER BY count DESC");
        console.log('URL prefixes:', urlTypes);

        // Check if those kalameh.com files actually exist locally in public/worship/audio/kalameh/
        const fs = require('fs');
        const path = require('path');
        const localDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        const localFiles = fs.readdirSync(localDir);

        const { rows: kalamehSongs } = await pool.query("SELECT id, title_fa, audio_url FROM church_worship_songs WHERE audio_url LIKE '%kalameh.com%'");
        let matchedLocal = 0;
        for (const s of kalamehSongs) {
            const filename = decodeURIComponent(path.basename(s.audio_url));
            const found = localFiles.find(f => f.toLowerCase() === filename.toLowerCase());
            if (found) {
                matchedLocal++;
            }
        }
        console.log(`Kalameh songs matched with local files in public/worship/audio/kalameh: ${matchedLocal} / ${kalamehSongs.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();
