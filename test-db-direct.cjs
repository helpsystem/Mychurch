// Test database connection directly
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test 1: Count songs
    const countResult = await pool.query('SELECT COUNT(*) FROM worship_songs');
    console.log(`✅ Total songs: ${countResult.rows[0].count}`);
    
    // Test 2: Check data size
    const sizeResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_total_relation_size('worship_songs')) as table_size,
        COUNT(*) as total_rows,
        COUNT(*) FILTER (WHERE lyrics IS NOT NULL) as with_lyrics,
        AVG(length(lyrics::text)) as avg_lyrics_length
      FROM worship_songs
    `);
    console.log('📊 Table info:', sizeResult.rows[0]);
    
    // Test 3: Get first 3 songs WITHOUT lyrics
    const songsResult = await pool.query(`
      SELECT id, title, artist, has_timing 
      FROM worship_songs 
      ORDER BY id 
      LIMIT 3
    `);
    console.log('\n🎵 First 3 songs (without lyrics):');
    songsResult.rows.forEach(s => {
      console.log(`  ID ${s.id}: ${s.title} - ${s.artist}`);
    });
    
    // Test 4: Check if any song has timing
    const timingResult = await pool.query(`
      SELECT COUNT(*) FILTER (WHERE timing_data IS NOT NULL) as with_timing
      FROM worship_songs
    `);
    console.log(`\n✨ Songs with timing: ${timingResult.rows[0].with_timing}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
