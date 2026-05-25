/**
 * Migration: Add audio health monitoring columns to church_worship_songs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE church_worship_songs 
        ADD COLUMN IF NOT EXISTS audio_health_status VARCHAR(20) DEFAULT 'unknown',
        ADD COLUMN IF NOT EXISTS audio_health_checked_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS audio_health_error TEXT;
    `);
    console.log('✅ Migration done: audio_health_status, audio_health_checked_at, audio_health_error added');

    const r = await pool.query('SELECT audio_health_status, audio_health_checked_at FROM church_worship_songs LIMIT 1');
    console.log('✅ Columns verified:', r.fields.map(f => f.name).join(', '));

    // Count songs by audio status
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE audio_url IS NOT NULL) as with_audio,
        COUNT(*) FILTER (WHERE audio_url IS NULL AND youtube_id IS NULL) as no_media,
        COUNT(*) as total
      FROM church_worship_songs
    `);
    console.log('\n📊 DB Stats:', stats.rows[0]);
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
