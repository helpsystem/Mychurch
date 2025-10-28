// Clean up worship songs - Remove songs with only external links (kalameh.com)
require('dotenv').config();
const { pool } = require('./db-postgres');

async function cleanupWorshipSongs() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning up worship songs...\n');
    
    // حذف سرودهایی که فقط لینک‌های خارجی دارند
    const result = await client.query(`
      DELETE FROM worship_songs
      WHERE 
        (audiourl IS NULL OR audiourl NOT LIKE '/%') AND
        (videourl IS NULL OR videourl NOT LIKE '/%') AND
        presentation_file_url IS NULL AND
        pdf_file_url IS NULL AND
        sheet_music_url IS NULL
      RETURNING title
    `);
    
    console.log(`🗑️  Removed ${result.rows.length} songs with only external links\n`);
    
    // شمارش سرودهای باقی‌مانده
    const countResult = await client.query('SELECT COUNT(*) FROM worship_songs');
    console.log(`✅ Remaining songs: ${countResult.rows[0].count}\n`);
    
    // نمایش نمونه سرودهای باقی‌مانده
    const sampleResult = await client.query(`
      SELECT id, title, audiourl, presentation_file_url 
      FROM worship_songs 
      LIMIT 5
    `);
    
    console.log('📝 Sample remaining songs:');
    sampleResult.rows.forEach((song, i) => {
      const title = typeof song.title === 'string' ? JSON.parse(song.title) : song.title;
      console.log(`${i + 1}. ${title.fa || title.en}`);
      console.log(`   Audio: ${song.audiourl || 'None'}`);
      console.log(`   PPT: ${song.presentation_file_url || 'None'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// اجرا
if (require.main === module) {
  cleanupWorshipSongs()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupWorshipSongs };
