const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});
async function check() {
    try {
        const { rows } = await pool.query("SELECT id, title_fa, artist, audio_url, timing_data IS NOT NULL as has_timing FROM church_worship_songs WHERE audio_url IS NOT NULL LIMIT 15");
        console.log('Sample linked songs:');
        rows.forEach(r => {
            console.log(`[${r.id}] Title: "${r.title_fa}" | Artist: "${r.artist}" | Audio: "${r.audio_url}" | HasTiming: ${r.has_timing}`);
        });
        const unlinked = await pool.query("SELECT id, title_fa, artist FROM church_worship_songs WHERE audio_url IS NULL OR audio_url = '' LIMIT 15");
        console.log('\nSample unlinked songs:');
        unlinked.rows.forEach(r => {
            console.log(`[${r.id}] Title: "${r.title_fa}" | Artist: "${r.artist}"`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();
