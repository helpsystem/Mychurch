const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log("Starting migration...");
        const res = await pool.query(`
            INSERT INTO church_worship_songs (title_fa, title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en, timepoints)
            SELECT 
                COALESCE(title_fa, '(بدون نام)'), 
                title_en, artist, youtube_id, audio_url, lyrics_fa, lyrics_en, timepoints
            FROM worship_songs
            WHERE title_fa NOT IN (SELECT title_fa FROM church_worship_songs)
            AND title_fa IS NOT NULL;
        `);
        console.log(`Successfully migrated ${res.rowCount} stranded songs.`);
        
        // Count total now
        const count = await pool.query('SELECT COUNT(*) FROM church_worship_songs');
        console.log(`Total songs in active table: ${count.rows[0].count}`);

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

migrate();
